import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import FileExplorer from './components/FileExplorer';
import './App.css';
import APIKeyModal from './components/APIKeyModal';

// Backend URL configuration
const BACKEND_URL = 'http://localhost:5001';

// Initial file structure with HTML template
const initialFiles = [
  {
    name: "index.html",
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Resume</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="resume">
        <header>
            <h1>Your Name</h1>
            <p>Frontend Developer</p>
            <p>email@example.com | (123) 456-7890 | City, State</p>
        </header>
        
        <section class="summary">
            <h2>Professional Summary</h2>
            <p>Experienced frontend developer with a passion for creating clean, user-friendly web applications.</p>
        </section>
        
        <section class="experience">
            <h2>Experience</h2>
            <div class="job">
                <h3>Frontend Developer</h3>
                <p class="company">Example Company</p>
                <p class="period">Jan 2021 - Present</p>
                <ul>
                    <li>Developed responsive web applications using modern JavaScript frameworks</li>
                    <li>Collaborated with design and backend teams to implement new features</li>
                    <li>Optimized application performance through code refactoring</li>
                </ul>
            </div>
        </section>
        
        <section class="education">
            <h2>Education</h2>
            <div class="degree">
                <h3>Bachelor of Science in Computer Science</h3>
                <p class="school">University Name</p>
                <p class="period">2016 - 2020</p>
            </div>
        </section>
        
        <section class="skills">
            <h2>Skills</h2>
            <ul class="skill-list">
                <li>JavaScript</li>
                <li>React</li>
                <li>HTML</li>
                <li>CSS</li>
                <li>Node.js</li>
                <li>Git</li>
            </ul>
        </section>
    </div>
</body>
</html>`
  },
  {
    name: "styles.css",
    path: "styles.css",
    content: `/* Basic styles for resume */
body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
}

.resume {
    max-width: 800px;
    margin: 30px auto;
    padding: 40px;
    background-color: white;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

header {
    margin-bottom: 30px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 20px;
}

header h1 {
    margin: 0;
    color: #2c3e50;
}

section {
    margin-bottom: 25px;
}

h2 {
    color: #2c3e50;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

h3 {
    margin-bottom: 5px;
}

.company, .school {
    font-weight: bold;
}

.period {
    font-style: italic;
    color: #777;
    margin-bottom: 10px;
}

.skill-list {
    display: flex;
    flex-wrap: wrap;
    list-style-type: none;
    padding: 0;
}

.skill-list li {
    background-color: #f0f0f0;
    border-radius: 3px;
    padding: 5px 10px;
    margin: 0 10px 10px 0;
}`
  }
];

function App() {
  const [files, setFiles] = useState(initialFiles);
  const [currentFile, setCurrentFile] = useState(initialFiles[0]);
  const [htmlContent, setHtmlContent] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [fileToRename, setFileToRename] = useState(null);
  const renderTimeoutRef = useRef(null);

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
    } else {
      newFileName = 'new_folder';
    }
    
    const newFile = {
      name: newFileName,
      path: newFileName,
      content: newContent,
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
      const response = await axios.post(`${BACKEND_URL}/render`, {
        files: files,
        mainFile: 'index.html'
      });

      setHtmlContent(response.data.html);
    } catch (err) {
      setError('Failed to render HTML. Check your code for errors.');
    } finally {
      setIsRendering(false);
    }
  };

  const exportPdf = async () => {
    try {
      setIsRendering(true);
      setError(null);
      
      // Check if WeasyPrint is available
      const statusResponse = await axios.get(`${BACKEND_URL}/weasyprint-status`);
      
      if (!statusResponse.data.available) {
        setError('PDF export not available: WeasyPrint is not properly installed on the server.');
        alert('WeasyPrint is not installed on the server. Please install it to enable PDF export functionality.');
        return;
      }
      
      // Export PDF
      const response = await axios.post(`${BACKEND_URL}/export-pdf`, {
        files: files,
        mainFile: 'index.html'
      }, { 
        responseType: 'blob',
        validateStatus: function(status) {
          return status < 600; // Accept all status codes
        }
      });
      
      // If we got an error response (not a PDF)
      if (response.headers['content-type'] === 'application/json') {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        setError(`PDF export failed: ${errorJson.error || errorJson.details || 'Server error'}`);
        return;
      }
      
      if (response.status !== 200) {
        setError(`PDF export failed: Server returned status ${response.status}`);
        return;
      }
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link to download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resume.pdf');
      
      // Download the PDF
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            try {
              const errorData = JSON.parse(text);
              setError(`PDF export failed: ${errorData.error || errorData.details || 'Server error'}`);
            } catch (e) {
              setError(`PDF export failed: ${text.substring(0, 100)}`);
            }
          } catch (e) {
            setError(`PDF export failed: Response could not be parsed`);
          }
        } else {
          setError(`PDF export failed: ${err.response.data.error || err.response.data.details || 'Server error'}`);
        }
      } else if (err.request) {
        setError('PDF export failed: No response from server. Check if the backend is running.');
      } else {
        setError(`PDF export failed: ${err.message || 'Unknown error'}`);
      }
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

  // Determine the language for the Monaco editor based on file extension
  const getEditorLanguage = () => {
    if (currentFile.path.endsWith('.html')) return 'html';
    if (currentFile.path.endsWith('.css')) return 'css';
    if (currentFile.path.endsWith('.js')) return 'javascript';
    return 'plaintext';
  };

  return (
    <>
      <div className="app">
        <header>
          <h1>HTML Resume Editor</h1>
          <button
            onClick={storeAPIKey}
            disabled={apiKey}
            className="api-key-button"
          >
            Manage API Key
          </button>
          <button
            onClick={renderHtml}
            disabled={isRendering}
            className="render-button"
          >
            {isRendering ? 'Rendering...' : 'Preview'}
          </button>
          <button
            onClick={exportPdf}
            className="export-button"
          >
            Export to PDF
          </button>
          <button
            onClick={testWeasyPrint}
            className="test-button"
          >
            Test WeasyPrint
          </button>
        </header>

        <main>
          <FileExplorer
            files={files}
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
            onCreateFile={handleFileAdd}
            onDeleteFile={handleFileDelete}
            onRenameFile={handleFileRename}
          />

          <div className="editor-pane">
            <Editor
              height="90vh"
              defaultLanguage={getEditorLanguage()}
              language={getEditorLanguage()}
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

            {htmlContent && (
              <iframe 
                srcDoc={htmlContent}
                title="Resume Preview"
                width="100%"
                height="100%"
                sandbox="allow-same-origin"
              />
            )}

            {isRendering && <div className="loading">Rendering your HTML...</div>}
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
