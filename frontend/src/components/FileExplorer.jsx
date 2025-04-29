import React, { useState } from 'react';
import { FaEdit, FaFile, FaFolder, FaFolderOpen, FaPlus, FaTrash, FaFileAlt } from 'react-icons/fa';
import './FileExplorer.css';

const FileExplorer = ({
  files,
  currentFile,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleRename = (file) => {
    if (newFileName.trim() && newFileName !== file.name) {
      onRenameFile(file, newFileName);
    }
    setRenamingFile(null);
    setNewFileName('');
  };

  const renderFile = (file, level = 0) => {
    const isFolder = file.type === 'folder';
    const isJobDescription = file.fileType === 'job-description';
    const isExpanded = expandedFolders.has(file.path);
    const paddingLeft = `${level * 20}px`;

    if (isFolder) {
      return (
        <div key={file.path} style={{ paddingLeft }}
          className={`p-2 cursor-pointer `}>
          <div
            className="file-item folder text-3xl bg-green-900"
            onClick={() => toggleFolder(file.path)}
          >
            {isExpanded ? <FaFolderOpen /> : <FaFolder />}
            <span>{file.name}</span>
          </div>
          {isExpanded && file.children.map(child => renderFile(child, level + 1))}
        </div>
      );
    }

    return (
      <div key={file.path} style={{ paddingLeft }} className={`file-item ${currentFile.path === file.path ? 'bg-gray-700' : ''} ${isJobDescription ? 'job-description' : ''}`}>
        <div className="file-content">
          {isJobDescription ? <FaFileAlt className="job-file-icon" /> : <FaFile />}
          {renamingFile === file.path ? (
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => handleRename(file)}
              onKeyPress={(e) => e.key === 'Enter' && handleRename(file)}
              autoFocus
            />
          ) : (
            <span onClick={() => onFileSelect(file)}>{file.name}</span>
          )}
        </div>
        <div className="file-actions">
          <button onClick={() => onDeleteFile(file)}>
            <FaTrash />
          </button>
          <button onClick={() => {
            setRenamingFile(file.path);
            setNewFileName(file.name);
          }}><FaEdit /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Files</h3>
        <button onClick={() => onCreateFile('file')} title="Add File">
          <FaPlus />
        </button>
        <button onClick={() => onCreateFile('job-description')} title="Add Job Description">
          <FaFileAlt />
        </button>
        <button onClick={() => onCreateFile('folder')} title="Add Folder">
          <FaFolder />
        </button>
      </div>
      <div className="file-list">
        {files.map(file => renderFile(file))}
      </div>
    </div>
  );
};

export default FileExplorer;
