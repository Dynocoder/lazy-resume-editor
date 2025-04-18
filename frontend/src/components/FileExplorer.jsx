import { useState } from 'react';
import './FileExplorer.css';

function FileExplorer({
  files,
  currentFile,
  mainFile,
  onFileSelect,
  onCreateFile,
  onCreateFileInDirectory,
  onDeleteFile,
  onRenameFile,
  onSetMainFile
}) {
  const [newFileName, setNewFileName] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingDirectory, setCreatingDirectory] = useState(false);
  const [creatingIn, setCreatingIn] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [expanded, setExpanded] = useState({});

  // Get root level files and directories
  const rootItems = files.filter(file => !file.parent);

  const handleCreateFile = () => {
    if (newFileName.trim() === '') return;

    if (creatingIn) {
      onCreateFileInDirectory(newFileName, creatingIn, creatingDirectory);
    } else {
      onCreateFile(newFileName, creatingDirectory);
    }

    // Reset state
    setNewFileName('');
    setCreatingFile(false);
    setCreatingDirectory(false);
    setCreatingIn(null);
  };

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startCreatingFile = (parentId = null, isDirectory = false) => {
    setCreatingFile(true);
    setCreatingDirectory(isDirectory);
    setCreatingIn(parentId);
    setNewFileName('');
  };

  const startRenaming = (id, name) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleRename = () => {
    if (editName.trim() === '') return;
    onRenameFile(editingId, editName);
    setEditingId(null);
  };

  // Recursive function to render file tree
  const renderFileTree = (items) => {
    return items.map(item => {
      const file = files.find(f => f.id === item);

      if (!file) return null;

      if (file.isDirectory) {
        const children = file.children || [];
        const isExpanded = expanded[file.id];

        return (
          <li key={file.id} className="directory">
            <div className="file-item directory-item">
              <button
                className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleExpanded(file.id)}
              >
                {isExpanded ? '▼' : '▶'}
              </button>

              {editingId === file.id ? (
                <div className="rename-input">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                  />
                  <button onClick={handleRename}>Save</button>
                </div>
              ) : (
                <>
                  <span className="directory-name">{file.name}</span>
                  <div className="file-actions">
                    <button onClick={() => startCreatingFile(file.id, false)}>Add File</button>
                    <button onClick={() => startCreatingFile(file.id, true)}>Add Folder</button>
                    <button onClick={() => startRenaming(file.id, file.name)}>Rename</button>
                    <button onClick={() => onDeleteFile(file.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>

            {isExpanded && (
              <ul className="file-list nested">
                {renderFileTree(children)}
                {creatingFile && creatingIn === file.id && (
                  <li className="file-creation">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder={creatingDirectory ? "Folder name" : "File name"}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                      autoFocus
                    />
                    <button onClick={handleCreateFile}>Create</button>
                    <button onClick={() => setCreatingFile(false)}>Cancel</button>
                  </li>
                )}
              </ul>
            )}
          </li>
        );
      } else {
        // Regular file
        const isMain = file.id === mainFile;
        const isActive = file.id === currentFile;

        return (
          <li
            key={file.id}
            className={`file ${isActive ? 'active' : ''} ${isMain ? 'main-file' : ''}`}
          >
            {editingId === file.id ? (
              <div className="rename-input">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
                <button onClick={handleRename}>Save</button>
              </div>
            ) : (
              <div className="file-item" onClick={() => onFileSelect(file.id)}>
                <span className="file-name">{file.name}</span>
                <div className="file-actions">
                  {!isMain && (
                    <button onClick={(e) => { e.stopPropagation(); onSetMainFile(file.id); }}>
                      Set as Main
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); startRenaming(file.id, file.name); }}>
                    Rename
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      }
    });
  };

  return (
    <div className="file-explorer-container">
      <div className="file-explorer-header">
        <h2>Files</h2>
        <div className="file-explorer-actions">
          <button onClick={() => startCreatingFile(null, false)}>New File</button>
          <button onClick={() => startCreatingFile(null, true)}>New Folder</button>
        </div>
      </div>

      <ul className="file-list">
        {renderFileTree(rootItems.map(item => item.id))}
        {creatingFile && !creatingIn && (
          <li className="file-creation">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={creatingDirectory ? "Folder name" : "File name"}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              autoFocus
            />
            <button onClick={handleCreateFile}>Create</button>
            <button onClick={() => setCreatingFile(false)}>Cancel</button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default FileExplorer;
