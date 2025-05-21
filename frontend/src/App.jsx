import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import FileExplorer from './components/FileExplorer';
import AIEdit from './components/AIEdit';
import './App.css';
import APIKeyModal from './components/APIKeyModal';
import ResumeUploader from './components/ResumeUploader';
import { generateDirectEditScript, handleContentUpdate } from './components/DirectTextEditor';
import { initialFiles, initialJobDesc, newCssContent, newHtmlContent } from './data/initialFiles';
import Toolbar from './components/Toolbar';

// Backend URL configuration
const BACKEND_URL = 'http://localhost:5001';

function App() {
  const [files, setFiles] = useState(initialFiles);
  const [currentFile, setCurrentFile] = useState(initialFiles[0]);
  const [htmlContent, setHtmlContent] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || "");
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('openai_model') || "gpt-3.5-turbo-0125");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [fileToRename, setFileToRename] = useState(null);
  const renderTimeoutRef = useRef(null);
  const iframeRef = useRef(null);
  const editorRef = useRef(null);

  // AI Edit state
  const [selectedElement, setSelectedElement] = useState(null);
  const [aiEditPosition, setAiEditPosition] = useState({ x: 0, y: 0 });
  const [showAiEdit, setShowAiEdit] = useState(false);

  // Resume Uploader state
  const [isResumeUploaderOpen, setIsResumeUploaderOpen] = useState(false);
  // Toggle for HTML editor pane visibility
  const [showEditor, setShowEditor] = useState(true);

  const handleFileSelect = (file) => {
    setCurrentFile(file);
  };

  const handleFileAdd = (type) => {
    let newFileName, newContent = '';

    if (type === 'file') {
      const extension = currentFile.path.endsWith('.css') ? '.css' : '.html';
      newFileName = `untitled_${files.length}${extension}`;

      if (extension === '.html') {
        newContent = newHtmlContent;
      } else if (extension === '.css') {
        newContent = newCssContent;
      }
    } else if (type === 'job-description') {
      newFileName = `job_description.txt`;
      newContent = initialJobDesc;
    } else {
      newFileName = 'new_folder';
    }

    const newFile = {
      name: newFileName,
      path: newFileName,
      content: newContent,
      type: type === 'folder' ? 'folder' : 'file',
      fileType: type === 'job-description' ? 'job-description' : 'regular',
      children: type === 'folder' ? [] : undefined,
    };

    setFiles(prev => [...prev, newFile]);
    if (type === 'file' || type === 'job-description') {
      setCurrentFile(newFile);
      setFileToRename(newFileName);
    }
  };

  const handleFileDelete = (file) => {
    setFiles(files.filter(f => f.path !== file.path));
    if (currentFile.path === file.path) {
      setCurrentFile(files[0]);
    }
  };

  const handleFileRename = (file, newName) => {
    const updatedFiles = files.map(f => {
      if (f.path === file.path) {
        return { ...f, name: newName, path: newName };
      }
      return f;
    });
    setFiles(updatedFiles);
    if (currentFile.path === file.path) {
      setCurrentFile({ ...currentFile, name: newName, path: newName });
    }
  };

  const handleEditorChange = (value) => {
    const updatedFiles = files.map(f => {
      if (f.path === currentFile.path) {
        return { ...f, content: value };
      }
      return f;
    });
    setFiles(updatedFiles);
    setCurrentFile({ ...currentFile, content: value });

    // Auto-render on content change (with debounce)
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    renderTimeoutRef.current = setTimeout(() => {
      renderHtml();
    }, 1000);
  };

  const renderHtml = async () => {
    setIsRendering(true);
    setError(null);

    try {
      // Filter out job description files for rendering
      const renderableFiles = files.filter(f => f.fileType !== 'job-description');

      const response = await axios.post(`${BACKEND_URL}/render`, {
        files: renderableFiles,
        mainFile: 'index.html'
      });

      // Use the direct edit script from the imported component
      const selectionScript = `
      <script>
        ${generateDirectEditScript()}
      </script>`;

      // Process CSS files
      const cssFiles = response.data.css_files || {};
      const inlineStyles = Object.entries(cssFiles)
        .map(([path, content]) => `<style data-source="${path}">${content}</style>`)
        .join('');

      // Add CSS and script to HTML
      let html = response.data.html;
      if (inlineStyles) {
        html = html.replace('</head>', `${inlineStyles}</head>`);
      }
      html = html.replace('</body>', `${selectionScript}</body>`);

      setHtmlContent(html);
    } catch (err) {
      console.error('Render error:', err);
      setError('Failed to render HTML. Check your code for errors.');
    } finally {
      setIsRendering(false);
    }
  };


  // Render on first load and when files change
  useEffect(() => {
    renderHtml();

    // Cleanup function to clear any pending timeouts
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Auto-render when switching files
  useEffect(() => {
    renderHtml();
  }, [currentFile.path]);

  // Auto-render preview when any file content changes (e.g. after an AI/Edit update)
  useEffect(() => {
    renderHtml();
  }, [files]);

  // Handle AI edits
  const handleAiEditUpdate = (updatedFiles) => {
    // Preserve job description files and merge with updated files
    const jobDescriptionFiles = files.filter(f => f.fileType === 'job-description');
    const nonJobDescFiles = updatedFiles.filter(f => f.fileType !== 'job-description');

    // Combine both sets of files
    const combinedFiles = [...nonJobDescFiles, ...jobDescriptionFiles];

    setFiles(combinedFiles);

    // Find and update the current file if it was changed
    const updatedCurrentFile = combinedFiles.find(f => f.path === currentFile.path);
    if (updatedCurrentFile) {
      setCurrentFile(updatedCurrentFile);
    }
  };

  // Handle messages from the iframe
  useEffect(() => {
    // Create a combined message handler
    const handleMessage = (event) => {
      if (event.data?.type === 'elementSelected' && event.data.element) {
        setSelectedElement(event.data.element);

        // Calculate position for AI edit popup
        const iframeRect = iframeRef.current.getBoundingClientRect();
        setAiEditPosition({
          x: iframeRect.left + event.data.position.x,
          y: iframeRect.top + event.data.position.y
        });

        setShowAiEdit(true);
      }

      // Use the imported handler for content updates
      const contentUpdateHandler = handleContentUpdate(files, currentFile, setFiles, setCurrentFile, renderHtml);
      contentUpdateHandler(event);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files, currentFile.path]);

  // Modified to handle job description files
  const getEditorLanguage = () => {
    if (currentFile.path.endsWith('.html')) return 'html';
    if (currentFile.path.endsWith('.css')) return 'css';
    if (currentFile.path.endsWith('.js')) return 'javascript';
    if (currentFile.fileType === 'job-description') return 'markdown';
    return 'plaintext';
  };

  // Warn user before leaving or refreshing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <>
      <div className="app">
        <Toolbar
          editorRef={editorRef}
          showEditor={showEditor}
          setShowEditor={setShowEditor}
          setShowModal={setShowModal}
          setIsResumeUploaderOpen={setIsResumeUploaderOpen}
          files={files}
          isRendering={isRendering}
          setIsRendering={setIsRendering}
          setError={setError}
          apiKey={apiKey}
          renderHtml={renderHtml}
          BACKEND_URL={BACKEND_URL}
        />


        <main>
          {showEditor && (
            <>
              <FileExplorer
                files={files}
                currentFile={currentFile}
                onFileSelect={handleFileSelect}
                onCreateFile={handleFileAdd}
                onDeleteFile={handleFileDelete}
                onRenameFile={handleFileRename}
              />

              <div className="editor-pane">
                {currentFile.fileType === 'job-description' && (
                  <div className="job-description-indicator">
                    Job Description: add your job description for AI reference.
                  </div>
                )}
                <Editor
                  height="90vh"
                  defaultLanguage={getEditorLanguage()}
                  language={getEditorLanguage()}
                  value={currentFile.content}
                  onChange={handleEditorChange}
                  onMount={(editor) => { editorRef.current = editor; }}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                  }}
                />
              </div>
            </>
          )}

          <div className="preview-pane">
            {error && <div className="error-message">{error}</div>}

            {htmlContent && (
              <>
                <div className="ai-edit-instructions">
                  <div className="ai-edit-tooltip">
                    <span className="ai-edit-tooltip-icon">ℹ️</span>
                    <div className="ai-edit-tooltip-text">
                      Select text to invoke AI edit.
                    </div>
                  </div>
                  <div className="ai-edit-tooltip" style={{ marginLeft: '10px' }}>
                    <span className="ai-edit-tooltip-icon">✏️</span>
                    <div className="ai-edit-tooltip-text">
                      Click to edit; press Enter to save.
                    </div>
                  </div>
                </div>
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  title="Resume Preview"
                  width="100%"
                  height="100%"
                  sandbox="allow-same-origin allow-scripts"
                />
              </>
            )}

            {isRendering && <div className="loading">Rendering your HTML...</div>}

            {showAiEdit && (
              <AIEdit
                position={aiEditPosition}
                selectedElement={selectedElement}
                onClose={() => setShowAiEdit(false)}
                apiKey={apiKey}
                aiModel={aiModel}
                targetPath={currentFile.path}
                files={files}
                onUpdate={handleAiEditUpdate}
              />
            )}
          </div>
        </main>
      </div>

      <APIKeyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={(key, model) => {
          setApiKey(key);
          setAiModel(model);
          localStorage.setItem('openai_api_key', key);
          setShowModal(false);
        }}
        initialValue={apiKey}
      />

      {isResumeUploaderOpen && (
        <ResumeUploader
          files={files}
          apiKey={apiKey}
          aiModel={aiModel}
          onUpdate={handleAiEditUpdate}
          onClose={() => setIsResumeUploaderOpen(false)}
        />
      )}
    </>
  );
}

export default App;
