import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import './App.css';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Sample LaTeX template for a resume
const sampleLaTeX = `
\\documentclass[11pt,a4paper]{article}
\\usepackage{enumitem}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\Large \\textbf{John Doe}}\\\\
    123 Main Street, City, State 12345\\\\
    (123) 456-7890 | john.doe@email.com | \\href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe}
\\end{center}

\\section*{Education}
\\textbf{University of Example} \\hfill City, State\\\\
Bachelor of Science in Computer Science \\hfill Expected May 2023\\\\
GPA: 3.8/4.0

\\section*{Experience}
\\textbf{Software Engineering Intern} \\hfill Jun 2022 - Aug 2022\\\\
Tech Company Inc. \\hfill City, State
\\begin{itemize}[leftmargin=*]
  \\item Developed and maintained features for the company's web application using React and Node.js
  \\item Collaborated with a team of 5 engineers to implement new user interface components
  \\item Reduced page load time by 30\\% through code optimization
\\end{itemize}

\\textbf{Research Assistant} \\hfill Jan 2022 - May 2022\\\\
University Laboratory \\hfill City, State
\\begin{itemize}[leftmargin=*]
  \\item Assisted in data collection and analysis for machine learning research project
  \\item Implemented algorithms in Python to process and visualize experimental results
\\end{itemize}

\\section*{Skills}
\\textbf{Programming Languages:} Java, Python, JavaScript, C++, SQL\\\\
\\textbf{Technologies:} React, Node.js, Git, Docker, AWS, MongoDB\\\\
\\textbf{Other:} Agile Development, Technical Writing, Problem Solving

\\section*{Projects}
\\textbf{Personal Website} \\hfill \\href{https://github.com/johndoe/personal-website}{github.com/johndoe/personal-website}
\\begin{itemize}[leftmargin=*]
  \\item Designed and developed a responsive personal portfolio website using React and CSS
  \\item Implemented dark mode and accessibility features
\\end{itemize}

\\textbf{Inventory Management System} \\hfill \\href{https://github.com/johndoe/inventory-system}{github.com/johndoe/inventory-system}
\\begin{itemize}[leftmargin=*]
  \\item Created a full-stack web application for tracking inventory using MERN stack
  \\item Implemented authentication, data visualization, and report generation features
\\end{itemize}

\\end{document}
`;

function App() {
  const [latexCode, setLatexCode] = useState(sampleLaTeX);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const handleEditorChange = (value) => {
    setLatexCode(value);
  };

  const compilePdf = async () => {
    setIsCompiling(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/compile',
        { latex: latexCode },
        { responseType: 'blob' }
      );

      // Create a URL for the PDF blob
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      console.log(pdfBlob ? "hega" : "nope");
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

  // Compile on first load
  useEffect(() => {
    compilePdf();
    // Clean up object URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  return (
    <div className="app">
      <header>
        <h1>LaTeX Resume Editor</h1>
        <button
          onClick={compilePdf}
          disabled={isCompiling}
          className="compile-button"
        >
          {isCompiling ? 'Compiling...' : 'Compile & Preview'}
        </button>
      </header>

      <main>
        <div className="editor-pane">
          <Editor
            height="90vh"
            defaultLanguage="latex"
            value={latexCode}
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
  );
}

export default App;
