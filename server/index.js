const http = require('http')
const express = require('express')
const fs = require('fs/promises')
const { Server: SocketServer } = require('socket.io')
const path = require('path')
const cors = require('cors')
const chokidar = require('chokidar');
const archiver = require('archiver');

// Clear the user directory on startup to ensure a clean slate
async function clearUserDirectory() {
    const userDirPath = './user';
    try {
        // Attempt to remove the directory and all its contents
        await fs.rm(userDirPath, { recursive: true, force: true });
        console.log('Removed user directory and its contents.');
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore if directory doesn't exist
            console.error('Error removing user directory:', error);
        }
    }
    try {
        // Ensure the directory exists (recreate if it was removed or didn't exist)
        await fs.mkdir(userDirPath, { recursive: true });
        console.log('Ensured user directory exists.');
    } catch (error) {
        console.error('Error recreating user directory:', error);
    }
}
clearUserDirectory();


let ptyProcess;
try {
    const pty = require('@homebridge/node-pty-prebuilt-multiarch')

    ptyProcess = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: (process.env.INIT_CWD || process.cwd()) + '/user',
        env: process.env
    });
    console.log('PTY process started')
} catch (err) {
    console.warn('Could not start pty process. Terminal features will be disabled. Error:', err.message || err)
    // provide a stub that is safe to call from the rest of the code
    ptyProcess = {
        write: () => {},
        onData: () => {},
        // allow registering onData callbacks but don't call them
        on: () => {}
    }
}

const app = express()
app.use(express.json({ limit: '50mb' }))
const server = http.createServer(app);
const io = new SocketServer({
    cors: '*'
})

app.use(cors())

io.attach(server);

chokidar.watch('./user').on('all', (event, filePath) => {
    console.log(`Chokidar event: ${event}, filePath: ${filePath}`);
    // Only emit refresh for file add, change, unlink, unlinkDir, addDir
    if ([
        'add', 'addDir', 'change', 'unlink', 'unlinkDir'
    ].includes(event)) {
        io.emit('file:refresh', filePath);
    }
});

ptyProcess.onData(data => {
    io.emit('terminal:data', data)
})

io.on('connection', (socket) => {
    console.log(`Socket connected`, socket.id)

    socket.emit('file:refresh')

    socket.on('file:change', async ({ path, content }) => {
        await fs.writeFile(`./user${path}`, content)
    })

    socket.on('terminal:write', (data) => {
        console.log('Term', data)
        ptyProcess.write(data);
    })

    socket.on('run:file', async ({ path: relPath }) => {
        try {
            const clean = (relPath || '').replace(/^\/+/, '');
            const ext = clean.split('.').pop();
            const esc = (s) => s.replace(/"/g, '"');
            const abs = `/app/user/${esc(clean)}`;
            let cmd = '';
            switch (ext) {
                case 'py':
                    cmd = `python3 "${abs}"\r`;
                    break;
                case 'js':
                    cmd = `node "${abs}"\r`;
                    break;
                case 'ts':
                    cmd = `node --loader ts-node/esm "${abs}"\r`;
                    break;
                case 'c': {
                    const out = `/app/user/${esc(clean.replace(/\.c$/, ''))}`;
                    cmd = `gcc "${abs}" -O2 -o "${out}" && "${out}"\r`;
                    break;
                }
                case 'cpp': {
                    const out = `/app/user/${esc(clean.replace(/\.cpp$/, ''))}`;
                    cmd = `g++ "${abs}" -O2 -o "${out}" && "${out}"\r`;
                    break;
                }
                case 'java': {
                    // compile and run main class based on file name
                    const base = clean.replace(/\.java$/, '');
                    const className = base.split('/').pop();
                    const dir = base.includes('/') ? `/app/user/${base.substring(0, base.lastIndexOf('/'))}` : '/app/user';
                    cmd = `javac "${abs}" && cd "${dir}" && java ${className}\r`;
                    break;
                }
                case 'sh':
                    cmd = `bash "${abs}"\r`;
                    break;
                default:
                    cmd = `echo "No runner configured for *.${ext}"\r`;
            }
            ptyProcess.write(cmd);
        } catch (e) {
            ptyProcess.write(`echo "Run error: ${e?.message || e}"\r`)
        }
    })
})

app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./user');
    // We want to return the *contents* of the user directory, not the directory itself.
    const directoryName = Object.keys(fileTree)[0];
    if (directoryName && fileTree[directoryName]) {
        return res.json({ tree: fileTree[directoryName] })
    }
    // If the directory is empty or something went wrong, return an empty tree.
    return res.json({ tree: {} })
})

app.get('/files/content', async (req, res) => {
    const path = req.query.path;
    const fullPath = `./user${path}`;

    try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'Cannot read content of a directory.' });
        }
        const content = await fs.readFile(fullPath, 'utf-8');
        return res.json({ content });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'File not found.' });
        }
        console.error('Error reading file content:', error);
        return res.status(500).json({ error: 'Failed to read file content.' });
    }
});

// Endpoint to upload a full project structure
app.post('/files/upload-project', async (req, res) => {
    try {
        const { fileTree } = req.body;
        const userDir = './user';

        // Clear the directory first
        let retries = 5;
        while (retries > 0) {
            try {
                await fs.rm(userDir, { recursive: true, force: true });
                break;
            } catch (err) {
                if (err.code === 'EBUSY') {
                    console.warn(`Error clearing user directory: ${err.message}. Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
                    retries--;
                } else {
                    throw err;
                }
            }
        }
        if (retries === 0) {
            throw new Error('Failed to clear user directory after multiple retries.');
        }
        await fs.mkdir(userDir, { recursive: true });

        // Recreate the structure
        for (const [relPath, content] of Object.entries(fileTree)) {
            const fullPath = path.join(userDir, relPath);
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content);
        }

        io.emit('file:refresh');
        res.json({ ok: true, message: 'Project uploaded successfully' });
    } catch (err) {
        console.error('Project upload error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// create a file (and parent folders if needed)
app.post('/files/create-file', async (req, res) => {
    try {
        const relPath = req.body.path
        const content = req.body.content || ''
        const dir = require('path').dirname(`./user${relPath}`)
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(`./user${relPath}`, content)
        io.emit('file:refresh')
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
    }
})

// create a folder (recursive)
app.post('/files/create-folder', async (req, res) => {
    try {
        const relPath = req.body.path
        await fs.mkdir(`./user${relPath}`, { recursive: true })
        io.emit('file:refresh')
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
    }
})

// write/overwrite a file (used for uploads or saves)
app.post('/files/write', async (req, res) => {
    try {
        const relPath = req.body.path
        const content = req.body.content || ''
        const dir = require('path').dirname(`./user${relPath}`)
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(`./user${relPath}`, content)
        io.emit('file:refresh')
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message })
    }
})

// rename a file or folder
app.post('/files/rename', async (req, res) => {
    try {
        const { oldPath, newPath } = req.body
        console.log('Rename request:', { oldPath, newPath })
        const oldFullPath = `./user${oldPath}`
        const newFullPath = `./user${newPath}`
        console.log('Full paths:', { oldFullPath, newFullPath })
        await fs.rename(oldFullPath, newFullPath)
        io.emit('file:refresh')
        return res.json({ ok: true })
    } catch (err) {
        console.error('Rename error:', err)
        return res.status(500).json({ ok: false, error: err.message })
    }
})

// delete a file or folder
app.post('/files/delete', async (req, res) => {
    try {
        const relPath = req.body.path
        console.log('Delete request:', { relPath })
        const fullPath = `./user${relPath}`
        console.log('Full delete path:', fullPath)
        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) {
            await fs.rmdir(fullPath, { recursive: true })
        } else {
            await fs.unlink(fullPath)
        }
        io.emit('file:refresh')
        return res.json({ ok: true })
    } catch (err) {
        console.error('Delete error:', err)
        return res.status(500).json({ ok: false, error: err.message })
    }
})

app.get('/files/download-folder', async (req, res) => {
    try {
        const relPath = req.query.path;
        const fullPath = `./user${relPath}`;
        const stat = await fs.stat(fullPath);

        if (!stat.isDirectory()) {
            return res.status(400).json({ ok: false, error: 'Path is not a directory' });
        }

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        res.attachment(`${path.basename(relPath)}.zip`);
        archive.pipe(res);

        archive.directory(fullPath, false);
        archive.finalize();

    } catch (err) {
        console.error('Download folder error:', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

server.listen(9000, () => console.log(`/docker server running on port 9000`))


async function generateFileTree(directory) {
    const tree = {}
    const rootName = path.basename(directory);
    tree[rootName] = {};

    async function buildTree(currentDir, currentTree) {
        const files = await fs.readdir(currentDir)

        for (const file of files) {
            const filePath = path.join(currentDir, file)
            const stat = await fs.stat(filePath)

            if (stat.isDirectory()) {
                currentTree[file] = {}
                await buildTree(filePath, currentTree[file])
            } else {
                currentTree[file] = null
            }
        }
    }

    await buildTree(directory, tree[rootName]);
    return tree
}