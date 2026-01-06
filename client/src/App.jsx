import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Terminal from "./components/terminal";
import FileTree from "./components/tree";
import socket from "./socket";
import AceEditor from "react-ace";
import { motion } from "framer-motion"; // Import Framer Motion

import { getFileMode } from "./utils/getFileMode";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-beautify";

function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [code, setCode] = useState("");
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("/");

  const onSaveNow = () => {
    if (!selectedFile || isSaved) return;
    socket.emit("file:change", { path: selectedFile, content: code });
    setSelectedFileContent(code);
  };

  const onRunNow = () => {
    if (!selectedFile) return;
    if (!isSaved) {
      socket.emit("file:change", { path: selectedFile, content: code });
      setSelectedFileContent(code);
    }
    socket.emit('run:file', { path: selectedFile });
  }

  const handleFileAction = async (action, path, fileName) => {
    console.log('handleFileAction called:', { action, path, fileName });
    
    try {
      // path is the parent directory, fileName is the file/folder name
      const parentPath = path || '/';
      const fullPath = parentPath === '/' ? '' : parentPath;
      
      console.log('Path construction:', { parentPath, fullPath, fileName });
      
      switch (action) {
        case 'createFile': {
          const name = prompt(`New file name (folder: ${parentPath}):`);
          if (!name) return;
          const newPath = fullPath ? fullPath + '/' + name : '/' + name;
          const response = await fetch('http://localhost:9000/files/create-file', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ path: newPath, content: '' }) 
          });
          if (!response.ok) throw new Error('Failed to create file');
          getFileTree();
          break;
        }
        case 'createFolder': {
          const name = prompt(`New folder name (parent: ${parentPath}):`);
          if (!name) return;
          const newPath = fullPath ? fullPath + '/' + name : '/' + name;
          const response = await fetch('http://localhost:9000/files/create-folder', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ path: newPath }) 
          });
          if (!response.ok) throw new Error('Failed to create folder');
          getFileTree();
          break;
        }
        case 'openFolder': {
          document.getElementById('hidden-open-folder').click();
          break;
        }
        case 'downloadFolder': {
          await downloadFolder(fullPath ? fullPath + '/' + fileName : '/' + fileName);
          break;
        }
        case 'rename': {
          const newName = prompt(`Rename ${fileName} to:`, fileName);
          if (!newName || newName === fileName) return;
          // Avoid double slashes for root
          let oldPath, newPath;
          if (path === '/' || path === '') {
            oldPath = '/' + fileName;
            newPath = '/' + newName;
          } else {
            oldPath = (path.endsWith('/') ? path : path + '/') + fileName;
            newPath = (path.endsWith('/') ? path : path + '/') + newName;
          }
          // Remove accidental double slashes
          oldPath = oldPath.replace(/\/+/g, '/').replace(/\/\//g, '/');
          newPath = newPath.replace(/\/+/g, '/').replace(/\/\//g, '/');
          console.log('Renaming:', { path, fileName, oldPath, newPath });
          const response = await fetch('http://localhost:9000/files/rename', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ oldPath, newPath }) 
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Rename error response:', errorText);
            throw new Error('Failed to rename');
          }
          getFileTree();
          break;
        }
        case 'delete': {
          if (!confirm(`Delete ${fileName}?`)) return;
          let deletePath;
          if (path === '/' || path === '') {
            deletePath = '/' + fileName;
          } else {
            deletePath = (path.endsWith('/') ? path : path + '/') + fileName;
          }
          // Remove accidental double slashes
          deletePath = deletePath.replace(/\/+/g, '/').replace(/\/\//g, '/');
          console.log('Deleting:', { path, fileName, deletePath });
          const response = await fetch('http://localhost:9000/files/delete', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ path: deletePath }) 
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete error response:', errorText);
            throw new Error('Failed to delete');
          }
          getFileTree();
          break;
        }
      }
    } catch (error) {
      console.error('Error in handleFileAction:', error);
      alert(`Error: ${error.message}`);
    }
  }

  const isSaved = selectedFileContent === code;

  useEffect(() => {
    if (!isSaved && code) {
      const timer = setTimeout(() => {
        socket.emit("file:change", {
          path: selectedFile,
          content: code,
        });
      }, 5 * 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [code, selectedFile, isSaved]);

  useEffect(() => {
    setCode("");
  }, [selectedFile]);

  useEffect(() => {
    setCode(selectedFileContent);
  }, [selectedFileContent]);

  const getFileTree = async () => {
    console.log('getFileTree called');
    const response = await fetch("http://localhost:9000/files");
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContents = useCallback(async () => {
    if (!selectedFile) {
      setSelectedFileContent('');
      return;
    }

    // Check if selectedFile is a directory
    const isDirectory = (path, tree) => {
      if (!path || path === '/') return true; // Root is a directory
      let current = tree;
      const parts = path.split('/').filter(Boolean);
      for (const part of parts) {
        if (!current[part]) return false;
        current = current[part].nodes;
        if (!current) return false;
      }
      return !!current;
    };

    if (isDirectory(selectedFile, fileTree)) {
      setSelectedFileContent('');
      return;
    }

    const response = await fetch(
      `http://localhost:9000/files/content?path=${selectedFile}`
    );
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile, fileTree]);

  const openFile = (path) => {
    setSelectedFileContent("");
    setSelectedFile(path);
  };

  const openFolder = () => {
    document.getElementById('hidden-open-folder').click();
  };

  useEffect(() => {
    if (selectedFile) getFileContents();
  }, [getFileContents, selectedFile]);

  useEffect(() => {
    socket.on("file:refresh", () => {
      console.log("file:refresh event received");
      getFileTree();
    });
    return () => {
      socket.off("file:refresh", getFileTree);
    };
  }, []);

  // initial load
  useEffect(() => {
    getFileTree();
  }, []);

  const downloadFolder = async (folderPath) => {
    try {
      const response = await fetch(`http://localhost:9000/files/download-folder?path=${folderPath}`);
      if (!response.ok) {
        throw new Error(`Failed to download folder: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderPath.split('/').pop()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading folder:', error);
      alert(`Error downloading folder: ${error.message}`);
    }
  };

  return (
    <motion.div
      className="vp-root"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header
        className="vp-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="vp-header-left">CLOUD IDE</div>
        <div className="vp-header-center">Project: /user</div>
        <div className="vp-header-right">STATUS: 🟢</div>
      </motion.header>

      <div className="playground-container">
        <motion.aside
          className="files-pane"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="files-pane-header">EXPLORER</div>
          <div className="files">
            <FileTree
              onSelect={(path) => {
                setSelectedFileContent("");
                setSelectedFile(path);
              }}
              onSelectFolder={(folderPath) => setSelectedFolder(folderPath || '/')}
              selectedFolder={selectedFolder}
              onFileAction={handleFileAction}
              onDownloadFolder={downloadFolder}
              onOpenFile={openFile}
              onOpenFolder={openFolder}
              onRefresh={getFileTree}
              files={fileTree}
              selectedFile={selectedFile}
            />
          </div>
        </motion.aside>

        <main className="editor-area">
          <motion.div
            className="editor-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <div className="tabs-bar">
              <div className={`tab ${selectedFile ? 'active' : ''}`}>
                {selectedFile ? selectedFile.split('/').pop() : 'No file open'}
                <span style={{marginLeft:8,opacity:0.7,fontSize:12}}>{isSaved?'' : '●'}</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {!isSaved && selectedFile && (
                <motion.button
                  className="save-btn"
                  title="Save (Ctrl+S)"
                  onClick={onSaveNow}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 3h12l2 2v16H5z" stroke="currentColor" strokeWidth="1.4"/><path d="M7 3v6h10V3" stroke="currentColor" strokeWidth="1.4"/><path d="M7 21v-7h10v7" stroke="currentColor" strokeWidth="1.4"/></svg>
                  <span style={{marginLeft:6}}>Save</span>
                </motion.button>
              )}
              {selectedFile && (
                <motion.button
                  className="run-btn"
                  title="Run"
                  onClick={onRunNow}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  <span style={{marginLeft:6}}>Run</span>
                </motion.button>
              )}
              <div className="editor-path">{selectedFile || '/'}</div>
            </div>
          </motion.div>

          <div className="editor-body">
            <AceEditor
              width="100%"
              height="100%"
              mode={getFileMode({ selectedFile })}
              theme="monokai"
              value={code}
              onChange={(e) => setCode(e)}
              setOptions={{ 
                useWorker: false, 
                showLineNumbers: true,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showPrintMargin: false,
                wrap: true,
                autoCloseBrackets: true,
                autoCloseQuotes: true,
                highlightActiveLine: true,
                fontSize: 14,
                behavioursEnabled: true
              }}
            />
          </div>

          <motion.div
            className="terminal-tabs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <div className="term-tabs-inner">
              <div className="term-tab active">TERMINAL</div>
            </div>
          </motion.div>
          <div className="terminal-container">
            <Terminal />
          </div>
        </main>
      </div>

      {/* Hidden file/folder inputs */}
      <input id="hidden-open-file" type="file" style={{display:'none'}} onChange={async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const arrayBuffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        const uploadPath = '/' + file.name; // root; user can move later
        await fetch('http://localhost:9000/files/write', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ path: uploadPath, content: text }) })
        getFileTree();
        setSelectedFile(uploadPath);
      }} />
      <input id="hidden-open-folder" type="file" webkitdirectory="" directory="" style={{display:'none'}} onChange={async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        for (const f of files) {
          const arrayBuffer = await f.arrayBuffer();
          const text = new TextDecoder().decode(arrayBuffer);
          const rel = '/' + f.webkitRelativePath.replace(/\\/g, '/');
          await fetch('http://localhost:9000/files/write', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ path: rel, content: text }) })
        }
        getFileTree();
      }} />

      <motion.footer
        className="status-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <div className="status-left">Ln 1, Col 1</div>
        <div className="status-center">UTF-8  |  LF  |  {getFileMode({ selectedFile }) || 'text'}</div>
        <div className="status-right">Cloud IDE Ready</div>
      </motion.footer>
    </motion.div>
  );
}

export default App;
