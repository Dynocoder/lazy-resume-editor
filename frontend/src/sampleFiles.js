export const sampleFiles = [
  {
    name: "main.tex",
    path: "/main.tex",
    content: `\\documentclass{article}

\\usepackage[utf8]{inputenc}

\\title{Multi-File Test}
\\author{ChatGPT}
\\date{\\today}

\\begin{document}

\\maketitle

\\input{intro.tex}

\\input{summary.tex}

\\end{document}
      `,
  },
  {
    name: "intro.tex",
    path: "/intro.tex",
    content: `\\section{Introduction}
Welcome to this LaTeX document. This section is brought to you by \\texttt{intro.tex}.`,
  },
  {
    name: "summary.tex",
    path: "/summary.tex",
    content: `\\section{Summary}
This is the end of the document. This part lives in \\texttt{summary.tex}.`,
  },
];
