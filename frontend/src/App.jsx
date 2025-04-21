import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import FileExplorer from './components/FileExplorer';
import { sampleFiles } from './sampleFiles';
import './App.css';
import APIKeyModal from './components/APIKeyModal';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Initial file structure
const initialFiles = [
  {
    name: "main.tex",
    path: "main.tex",
    content: `\\documentclass{fancycv}
\\usepackage[utf8]{inputenc}

\\begin{document}

\\section*{Main Document}
Hello from the main file.

\\input{sections/intro.tex}

\\end{document}`
  },
  {
    name: "fancycv.cls",
    path: "fancycv.cls",
    content: `%% Simple custom class
\\NeedsTeXFormat{LaTeX2e}
\\ProvidesClass{fancycv}[2025/04/18 Custom CV class]
\\LoadClass{article}
\\RequirePackage{geometry}
\\geometry{margin=1in}`
  },
  {
    name: "intro.tex",
    path: "sections/intro.tex",
    content: `\\section*{Intro Section}
This is the intro file included from another directory.`
  }
];

function App() {
  const [files, setFiles] = useState(initialFiles);
  const [currentFile, setCurrentFile] = useState(initialFiles[0]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [fileToRename, setFileToRename] = useState(null);

  const handleFileSelect = (file) => {
    setCurrentFile(file);
  };


  const handleFileAdd = (type) => {
    const newFileName = type === 'file' ? `untitled_${files.length}.tex` : 'new_folder';
    const newFile = {
      name: newFileName,
      path: newFileName,
      content: '',
      type: type === 'file' ? 'file' : 'folder',
      children: type === 'folder' ? [] : undefined,
    };

    setFiles(prev => [...prev, newFile]);
    if (type === 'file') {
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
  };

  const compilePdf = async () => {
    setIsCompiling(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/compile',
        {
          files: files,
          mainFile: 'main.tex'
        },
        { responseType: 'blob' }
      );

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Compilation error:', err);
      setError('Failed to compile LaTeX. Check your code for errors.');
    } finally {
      setIsCompiling(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const storeAPIKey = () => {
    setShowModal(true);
  };


  const getAISuggestion = () => {
    setShowModal(true);
  };

  // Compile on first load
  useEffect(() => {
    compilePdf();
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  return (
    <>
      <div className="app">
        <header>
          <h1>LaTeX Resume Editor</h1>
          <button
            onClick={storeAPIKey}
            disabled={apiKey}
            className="api-key-button"
          >
            Manage API Key
          </button>
          <button
            onClick={compilePdf}
            disabled={isCompiling}
            className="compile-button"
          >
            {isCompiling ? 'Compiling...' : 'Compile & Preview'}
          </button>
        </header>

        <main>
          <FileExplorer
            files={files}
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
            onCreateFile={handleFileAdd}
            onDeleteFile={handleFileDelete} // Fix name
            onRenameFile={handleFileRename} // Fix name
          />

          <div className="editor-pane">
            <Editor
              height="90vh"
              defaultLanguage="latex"
              value={currentFile.content}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on',
              }}
            />
          </div>

          <div className="preview-pane">
            {error && <div className="error-message">{error}</div>}

            {pdfUrl && (
              <iframe src={pdfUrl} width="100%" height="100%" />
            )}

            {isCompiling && <div className="loading">Compiling your LaTeX...</div>}
          </div>
        </main>


      </div>

      <APIKeyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={(key) => setApiKey(key)}
      />
    </>
  );
}

export default App;
