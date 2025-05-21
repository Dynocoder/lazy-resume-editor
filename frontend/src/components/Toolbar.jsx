import { exportPdf } from "../services/util";

export default function Toolbar({ editorRef, showEditor, setShowEditor, setShowModal, setIsResumeUploaderOpen, files, isRendering, setIsRendering, setError, apiKey, renderHtml, BACKEND_URL }) {

  // Handle resume upload
  const handleResumeUpload = () => {
    if (!apiKey) {
      setShowModal(true);
    } else {
      setIsResumeUploaderOpen(true);
    }
  };

  const storeAPIKey = () => {
    setShowModal(true);
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


  return (
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
        onClick={() => exportPdf(files, setIsRendering, setError, BACKEND_URL)}
        className="toolbar-button export-button"
      >
        Export to PDF
      </button>
    </header>
  )
}

