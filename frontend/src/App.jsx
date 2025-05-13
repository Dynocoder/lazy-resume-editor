import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import FileExplorer from './components/FileExplorer';
import AIEdit from './components/AIEdit';
import './App.css';
import APIKeyModal from './components/APIKeyModal';
import ResumeUploader from './components/ResumeUploader';
import ResumeMatcherModal from './components/ResumeMatcherModal';
import { generateDirectEditScript, handleContentUpdate } from './components/DirectTextEditor';
import { initialFiles } from './data/initialFiles';

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

  // Add state for Resume Matcher modal
  const [isResumeMatcherOpen, setIsResumeMatcherOpen] = useState(false);

  const handleFileSelect = (file) => {
    setCurrentFile(file);
  };

  const handleFileAdd = (type) => {
    let newFileName, newContent = '';

    if (type === 'file') {
      const extension = currentFile.path.endsWith('.css') ? '.css' : '.html';
      newFileName = `untitled_${files.length}${extension}`;

      if (extension === '.html') {
        newContent = `<!DOCTYPE html>
<html>
<head>
    <title>New Page</title>
</head>
<body>
    <h1>New Page</h1>
</body>
</html>`;
      } else if (extension === '.css') {
        newContent = `/* Styles for the new file */
body {
    font-family: Arial, sans-serif;
}`;
      }
    } else if (type === 'job-description') {
      newFileName = `job_description.txt`;
      newContent = `# Job Description

Position Title: 
Company: 
Location: 

## Job Summary
[Enter job summary here]

## Responsibilities
- 
- 
- 

## Requirements
- 
- 
- 

## Preferred Qualifications
- 
- 
- 

## Notes
[Add any additional notes here]
`;
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

  const exportPdf = async () => {
    try {
      setIsRendering(true);
      setError(null);

      // Filter out job description files for PDF export
      const renderableFiles = files.filter(f => f.fileType !== 'job-description');

      // Generate PDF
      const response = await axios.post(
        `${BACKEND_URL}/export-pdf`,
        { files: renderableFiles, mainFile: 'index.html' },
        { responseType: 'blob', validateStatus: status => status < 600 }
      );

      // Handle non-PDF responses (errors)
      if (response.headers['content-type'] === 'application/json') {
        const text = await response.data.text();
        const errorJson = JSON.parse(text);
        setError(`PDF export failed: ${errorJson.error || 'Server error'}`);
        return;
      }

      if (response.status !== 200) {
        setError(`PDF export failed: Server returned status ${response.status}`);
        return;
      }

      // Download the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resume.pdf');
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      console.error('PDF export error:', err);
      setError(`PDF export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRendering(false);
    }
  };

  const storeAPIKey = () => {
    setShowModal(true);
  };

  const testWeasyPrint = async () => {
    try {
      setIsRendering(true);
      setError(null);

      const response = await axios.get(`${BACKEND_URL}/test-weasyprint`);

      if (response.data.status === 'success') {
        alert(`WeasyPrint is working correctly! PDF size: ${response.data.pdf_size} bytes`);
      } else {
        setError(`WeasyPrint test failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(`WeasyPrint test failed: ${err.response.data.error || err.response.data.details || 'Server error'}`);
      } else {
        setError('WeasyPrint test failed. Check the console for details.');
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
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

  // Handle resume upload
  const handleResumeUpload = () => {
    if (!apiKey) {
      setShowModal(true);
    } else {
      setIsResumeUploaderOpen(true);
    }
  };

  // Handle resume matcher
  const handleResumeMatch = () => {
    setIsResumeMatcherOpen(true);
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
        <header>
          <h1>Lazy Resume Editor</h1>
          <button
            onClick={handleUndo}
            className="toolbar-button"
            title="Undo last edit"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            className="toolbar-button"
            title="Redo last edit"
          >
            Redo
          </button>
          <button
            onClick={() => setShowEditor(prev => !prev)}
            className="toolbar-button"
            title="Toggle HTML Editor"
          >
            {showEditor ? 'Hide HTML' : 'Show HTML'}
          </button>
          <button
            onClick={handleResumeUpload}
            className="toolbar-button"
            title="Upload Resume"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2zm2.354 5.146-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 .708.708L7.5 6.707V10.5a.5.5 0 0 0 1 0V6.707l1.146 1.147a.5.5 0 0 0 .708-.708z" />
            </svg>
            Upload Resume
          </button>
          <button
            onClick={storeAPIKey}
            className={`toolbar-button api-key-button ${apiKey ? 'api-key-set' : ''}`}
          >
            {apiKey ? "✓ API Key Set" : "Add API Key"}
          </button>
          <button
            onClick={renderHtml}
            disabled={isRendering}
            className="toolbar-button render-button"
          >
            {isRendering ? 'Rendering...' : 'Preview'}
          </button>
          <button
            onClick={exportPdf}
            className="toolbar-button export-button"
          >
            Export to PDF
          </button>
          <button
            onClick={handleResumeMatch}
            className="toolbar-button match-resume-button"
            title="Match resume against job description"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
              <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>
            Match Resume
          </button>
        </header>

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

      {isResumeMatcherOpen && (
        <ResumeMatcherModal
          isOpen={isResumeMatcherOpen}
          onClose={() => setIsResumeMatcherOpen(false)}
          files={files}
        />
      )}
    </>
  );
}

export default App;
