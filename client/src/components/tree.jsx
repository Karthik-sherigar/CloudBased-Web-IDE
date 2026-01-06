import { useState, useMemo, useRef, useEffect } from 'react'
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence

const Chevron = ({ open }) => (
  <span style={{ display:'inline-block', width:12, color:'#00e676', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform .2s ease-in-out' }}>▶</span>
)

const IconFile = () => (<span style={{ width:12, display:'inline-block', color:'#1de9b6' }}></span>)
const IconFolder = ({ open }) => (<span style={{ width:12, display:'inline-block', color:'#00e676' }}>{open ? '' : ''}</span>)

const ContextMenu = ({ isDir, onAction }) => {
  const handleAction = async (action) => {
    await onAction(action);
  };
  return (
    <div className="context-menu-icons">
      {isDir ? (
        <>
          <span className="context-menu-icon" onClick={() => handleAction('createFile')}>+ File | </span>
          <span className="context-menu-icon" onClick={() => handleAction('createFolder')}>+ Folder | </span>
          <span className="context-menu-icon" onClick={() => handleAction('openFolder')}>Open Folder | </span>
          <span className="context-menu-icon" onClick={() => handleAction('downloadFolder')}>⬇</span>
        </>
      ) : (
        <>
          <span className="context-menu-icon" onClick={() => handleAction('openFile')}>📄</span>
          <span className="context-menu-icon" onClick={() => handleAction('downloadFile')}>⬇️📄</span>
          <span className="context-menu-icon" onClick={() => handleAction('renameFile')}>✏️</span>
          <span className="context-menu-icon" onClick={() => handleAction('deleteFile')}>🗑️</span>
        </>
      )}
    </div>
  );
};


const FileTree = ({ files, onSelect, onSelectFolder, onFileAction, selectedFile, selectedFolder, onRefresh, onDownloadFolder, onOpenFile, onOpenFolder }) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  const handleFileAction = async (action, path, fileName) => {
    console.log(`Action: ${action}, Path: ${path}, FileName: ${fileName}`);
    // Implement the logic for each action here
    switch (action) {
      case 'createFile':
        { 
          const newFileName = prompt('Enter new file name:');
          if (newFileName) {
            try {
              await axios.post('http://localhost:9000/files/create-file', {
                path: `${path}/${newFileName}`
              });
              onRefresh();
            } catch (error) {
              console.error('Error creating file:', error);
            }
          }
        }
        break;
      case 'createFolder':
        {
          const newFolderName = prompt('Enter new folder name:');
          if (newFolderName) {
            try {
              await axios.post('http://localhost:9000/files/create-folder', {
                path: `${path}/${newFolderName}`
              });
              onRefresh();
            } catch (error) {
              console.error('Error creating folder:', error);
            }
          }
        }
        break;
      case 'openFolder':
        onOpenFolder(); // Call the onOpenFolder prop from App.jsx
        break;
      case 'downloadFolder':
        try {
          const response = await axios.get(`http://localhost:9000/files/download-folder?path=${path}`, {
            responseType: 'arraybuffer'
          });
          const zip = new JSZip();
          const folderName = path.split('/').pop();
          zip.loadAsync(response.data).then(function (zipContent) {
            zipContent.generateAsync({ type: "blob" }).then(function (blob) {
              saveAs(blob, `${folderName}.zip`);
            });
          });
        } catch (error) {
          console.error('Error downloading folder:', error);
        }
        break;
      case 'openFile':
        try {
          const response = await axios.get(`http://localhost:9000/files/content?path=${path}`);
          // Here you would typically open a new tab or a modal in your IDE
          // to display the file content (response.data)
          console.log(`File content for ${fileName}:`, response.data);
          alert(`Opened file ${fileName}. Content logged to console.`);
        } catch (error) {
          console.error('Error opening file:', error);
          alert(`Error opening file ${fileName}. Check console for details.`);
        }
        break;
      case 'downloadFile':
        try {
          const response = await axios.get(`http://localhost:9000/files/content?path=${path}`, {
            responseType: 'blob'
          });
          saveAs(response.data, fileName);
        } catch (error) {
          console.error('Error downloading file:', error);
        }
        break;
      case 'renameFile':
        { 
          const newName = prompt(`Rename ${fileName} to:`, fileName);
          if (newName && newName !== fileName) {
            try {
              await axios.post('http://localhost:9000/files/rename', {
                oldPath: path,
                newPath: `${path.substring(0, path.lastIndexOf('/'))}/${newName}`
              });
              onRefresh();
            } catch (error) {
              console.error('Error renaming file:', error);
            }
          }
        }
        break;
      case 'deleteFile':
        {
          if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            try {
              await axios.post('http://localhost:9000/files/delete', {
                path: path
              });
              onRefresh();
            } catch (error) {
              console.error('Error deleting file:', error);
            }
          }
        }
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <FileTreeNode
        node={{ name: "/", path: "/", nodes: files }}
        level={0}
        onSelect={onSelect}
        onSelectFolder={onSelectFolder}
        selectedFolder={selectedFolder}
        onFileAction={handleFileAction}
        hoveredNode={hoveredNode}
        setHoveredNode={setHoveredNode}
        selectedFile={selectedFile}
        onDownloadFolder={onDownloadFolder}
        onOpenFile={onOpenFile}
        onOpenFolder={onOpenFolder}
      />
    </div>
  );
};

export default FileTree;

const FileTreeNode = ({ node, level, onSelect, onSelectFolder, selectedFolder, onFileAction, onDownloadFolder, onOpenFile, onOpenFolder, selectedFile, hoveredNode, setHoveredNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const nodeRef = useRef(null);

  const isFolder = !!node.nodes;
  const isSelected = selectedFile === node.path;
  const isSelectedFolder = selectedFolder === node.path;
  const [isHovered, setIsHovered] = useState(false);

  const handleNodeClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
      onSelectFolder(node.path);
    } else {
      onSelect(node.path);
      onOpenFile(node.path);
    }
  };

  const handleAction = (action) => {
    onFileAction(action, node.path, node.name);
  };

  const nodeVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      ref={nodeRef}
      className={`file-node ${isFolder ? 'folder-node' : ''} ${isSelected ? 'selected' : ''} ${isSelectedFolder ? 'selected-folder' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={nodeVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <div className="node-content" onClick={handleNodeClick}>
        {isFolder && (
          <motion.div
            className="chevron"
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Chevron />
          </motion.div>
        )}
        {isFolder ? <IconFolder open={isOpen} /> : <IconFile />}
        <span className="node-name">{node.name}</span>
        {isHovered && isFolder && <ContextMenu isDir={isFolder} onAction={handleAction} />}
      </div>

      <AnimatePresence>
        {isFolder && isOpen && node.nodes && (
          <motion.div
            className="node-children"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { opacity: 1, height: 'auto', transition: { staggerChildren: 0.05 } },
              hidden: { opacity: 0, height: 0 }
            }}
          >
            {Object.entries(node.nodes).map(([key, childValue]) => {
              const childPath = `${node.path === '/' ? '' : node.path}/${key}`;
              const childNode = childValue === null
                ? { name: key, path: childPath } // It's a file
                : { name: key, path: childPath, nodes: childValue }; // It's a folder

              return (
                <FileTreeNode
                  key={key}
                  node={childNode}
                  level={level + 1}
                  onSelect={onSelect}
                  onSelectFolder={onSelectFolder}
                  selectedFolder={selectedFolder}
                  onFileAction={onFileAction}
                  onDownloadFolder={onDownloadFolder}
                  onOpenFile={onOpenFile}
                  onOpenFolder={onOpenFolder}
                  selectedFile={selectedFile}
                  hoveredNode={hoveredNode}
                  setHoveredNode={setHoveredNode}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
