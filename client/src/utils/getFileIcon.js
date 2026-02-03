// Get file icon based on file extension (VS Code-like)
export const getFileIcon = (fileName) => {
  if (!fileName) return '📄';
  
  const ext = fileName.split('.').pop().toLowerCase();
  const name = fileName.toLowerCase();
  
  // Folders
  if (name === 'node_modules' || name === '.git') return '📦';
  
  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) return '🖼️';
  
  // Code files
  if (ext === 'js' || ext === 'jsx') return '📘';
  if (ext === 'ts' || ext === 'tsx') return '📗';
  if (ext === 'py') return '🐍';
  if (ext === 'java') return '☕';
  if (ext === 'cpp' || ext === 'cxx' || ext === 'cc') return '⚙️';
  if (ext === 'c') return '⚙️';
  if (ext === 'cs') return '💎';
  if (ext === 'php') return '🐘';
  if (ext === 'rb') return '💎';
  if (ext === 'go') return '🐹';
  if (ext === 'rs') return '🦀';
  if (ext === 'swift') return '🐦';
  if (ext === 'kt') return '⚡';
  if (ext === 'scala') return '🔷';
  if (ext === 'dart') return '🎯';
  
  // Web files
  if (ext === 'html' || ext === 'htm') return '🌐';
  if (ext === 'css') return '🎨';
  if (ext === 'scss' || ext === 'sass') return '🎨';
  if (ext === 'less') return '🎨';
  if (ext === 'json') return '📋';
  if (ext === 'xml') return '📄';
  if (ext === 'yaml' || ext === 'yml') return '📝';
  
  // Config files
  if (name === 'package.json' || name === 'package-lock.json') return '📦';
  if (name === 'tsconfig.json' || name === 'jsconfig.json') return '⚙️';
  if (name === '.gitignore' || name === '.gitattributes') return '🔒';
  if (name === 'dockerfile' || name === '.dockerignore') return '🐳';
  if (name === 'docker-compose.yml' || name === 'docker-compose.yaml') return '🐳';
  if (ext === 'env' || name.startsWith('.env')) return '🔐';
  if (name === 'readme.md' || name === 'readme') return '📖';
  
  // Documents
  if (ext === 'md' || ext === 'markdown') return '📝';
  if (ext === 'txt') return '📄';
  if (['pdf', 'doc', 'docx'].includes(ext)) return '📕';
  
  // Data files
  if (ext === 'csv') return '📊';
  if (ext === 'xlsx' || ext === 'xls') return '📊';
  if (ext === 'db' || ext === 'sqlite' || ext === 'sql') return '🗄️';
  
  // Archive
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return '📦';
  
  // Media
  if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
  if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return '🎬';
  
  // Shell scripts
  if (ext === 'sh' || ext === 'bash') return '💻';
  if (ext === 'bat' || ext === 'cmd') return '💻';
  if (ext === 'ps1') return '💻';
  
  // Default
  return '📄';
};
