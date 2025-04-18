const sampleFiles = [
  {
    id: "main",
    name: "resume.tex",
    isDirectory: false,
    parent: null,
    content: `\\documentclass[11pt,a4paper]{article}
\\usepackage{enumitem}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{fontspec}
\\usepackage{styles/custom}
\\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}

\\pagestyle{empty}

\\begin{document}

\\input{sections/header}

\\section*{Education}
\\input{sections/education}

\\section*{Experience}
\\input{sections/experience}

\\section*{Skills}
\\input{sections/skills}

\\section*{Projects}
\\input{sections/projects}

\\end{document}`,
  },
  {
    id: "styles_dir",
    name: "styles",
    isDirectory: true,
    parent: null,
    children: ["custom_style"],
  },
  {
    id: "custom_style",
    name: "custom.sty",
    isDirectory: false,
    parent: "styles_dir",
    content: `% Custom style file
\\ProvidesPackage{styles/custom}

% Define custom colors
\\usepackage{xcolor}
\\definecolor{primary}{RGB}{0, 112, 192}
\\definecolor{secondary}{RGB}{83, 83, 83}

% Custom section formatting
\\usepackage{titlesec}
\\titleformat{\\section}{\\Large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

% Custom bullet points
\\renewcommand{\\labelitemi}{\\textcolor{primary}{\\small\\filledsquare}}

% Other customizations
\\usepackage[explicit]{titlesec}
\\newcommand{\\datedsection}[2]{%
  \\section*{#1\\hfill#2}%
}

\\usepackage{fontspec}
\\setmainfont{Calibri}

\\endinput`,
  },
  {
    id: "sections_dir",
    name: "sections",
    isDirectory: true,
    parent: null,
    children: [
      "header_file",
      "education_file",
      "experience_file",
      "skills_file",
      "projects_file",
    ],
  },
  {
    id: "header_file",
    name: "header.tex",
    isDirectory: false,
    parent: "sections_dir",
    content: `\\begin{center}
    {\\Large \\textbf{John Doe}}\\\\
    123 Main Street, City, State 12345\\\\
    (123) 456-7890 | john.doe@email.com | \\href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe}
\\end{center}`,
  },
  {
    id: "education_file",
    name: "education.tex",
    isDirectory: false,
    parent: "sections_dir",
    content: `\\textbf{University of Example} \\hfill City, State\\\\
Bachelor of Science in Computer Science \\hfill Expected May 2023\\\\
GPA: 3.8/4.0`,
  },
  {
    id: "experience_file",
    name: "experience.tex",
    isDirectory: false,
    parent: "sections_dir",
    content: `\\textbf{Software Engineering Intern} \\hfill Jun 2022 - Aug 2022\\\\
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
\\end{itemize}`,
  },
];
