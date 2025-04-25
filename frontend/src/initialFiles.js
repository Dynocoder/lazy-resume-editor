export const initialFiles = [
  {
    name: "index.html",
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Resume</title>
    <style>
        /* Copy your CSS content here */
        body {
            font-family: 'Arial', sans-serif;
            /* etc. */
        }
        /* More styles... */
    </style>
</head>
<body>
    <div class="resume">
        <header>
            <h1>JOHN DOE</h1>
            <p>Frontend Developer | email@example.com | (123) 456-7890 | City, State</p>
        </header>
        
        <section class="summary">
            <h2>Professional Summary</h2>
            <p>Frontend Developer with 3+ years experience building responsive web apps using modern JavaScript frameworks with focus on clean code and optimized user experiences.</p>
        </section>
        
        <section class="experience">
            <h2>Professional Experience</h2>
            <div class="job">
                <h3>Frontend Developer</h3>
                <p class="company">Example Company</p>
                <p class="period">Jan 2021 - Present</p>
                <ul>
                    <li>Developed responsive web apps using React, increasing user engagement by 27%</li>
                    <li>Collaborated with UX designers, reducing development time by 30%</li>
                    <li>Optimized app performance, improving load times by 40%</li>
                </ul>
            </div>
            
            <div class="job">
                <h3>Junior Web Developer</h3>
                <p class="company">Previous Company</p>
                <p class="period">June 2019 - Dec 2020</p>
                <ul>
                    <li>Built and maintained client websites using HTML, CSS, and JavaScript</li>
                    <li>Assisted senior developers with code reviews and bug fixes</li>
                    <li>Implemented responsive design principles across all projects</li>
                </ul>
            </div>
        </section>
        
        <div class="education-skills-container">
            <section class="education">
                <h2>Education</h2>
                <div class="degree">
                    <h3>BS Computer Science</h3>
                    <p class="school">University Name</p>
                    <p class="period">2015 - 2019</p>
                    <p>GPA: 3.8/4.0</p>
                </div>
            </section>
            
            <section class="skills">
                <h2>Technical Skills</h2>
                <ul class="skill-list">
                    <li>JavaScript</li>
                    <li>React</li>
                    <li>HTML5</li>
                    <li>CSS3</li>
                    <li>Node.js</li>
                    <li>Git</li>
                    <li>TypeScript</li>
                    <li>Redux</li>
                    <li>REST APIs</li>
                    <li>Webpack</li>
                </ul>
            </section>
        </div>
        
        <section class="projects">
            <h2>Projects</h2>
            <div class="project">
                <h3>E-commerce Platform</h3>
                <p>Built online store with React frontend and Node.js backend. Implemented authentication, product catalog, and payment processing.</p>
            </div>
        </section>
    </div>
</body>
</html>`
  },
  {
    name: "styles.css",
    path: "styles.css",
    content: `/* Resume styles optimized for letter size (8.5" x 11") */
@page {
    size: letter;
    margin: 0;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.2;
    color: #333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
    font-size: 10px;
}

.resume {
    width: 8.5in;
    height: 11in;
    margin: 0 auto;
    padding: 0.5in;
    background-color: white;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

/* Print-specific styles */
@media print {
    @page {
        size: letter;
        margin: 0;
    }
    
    html, body {
        width: 8.5in;
        height: 11in;
        font-size: 10px;
        line-height: 1.2;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .resume {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0.5in;
        box-shadow: none;
        border: none;
    }
    
    /* Prevent unwanted page breaks */
    header, section, .job {
        page-break-inside: avoid;
    }
}

/* Extra tight header */
header {
    margin-bottom: 0.2in;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

header h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    letter-spacing: 1px;
}

header p {
    margin: 2px 0;
    font-size: 10px;
}

/* Even more compact sections */
section {
    margin-bottom: 10px;
}

h2 {
    color: #2c3e50;
    border-bottom: 1px solid #eee;
    padding-bottom: 2px;
    margin: 0 0 4px 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

h3 {
    margin: 0;
    font-size: 11px;
}

p {
    margin: 0 0 3px 0;
}

.company, .school {
    font-weight: bold;
    font-size: 10px;
}

.period {
    font-style: italic;
    color: #777;
    margin-bottom: 2px;
    font-size: 9px;
}

/* Minimal lists */
ul {
    margin: 2px 0;
    padding-left: 15px;
}

li {
    margin-bottom: 2px;
    font-size: 10px;
}

.job {
    margin-bottom: 8px;
}

.skill-list {
    display: flex;
    flex-wrap: wrap;
    list-style-type: none;
    padding: 0;
    margin: 2px 0;
}

.skill-list li {
    background-color: #f8f8f8;
    border-radius: 3px;
    padding: 2px 5px;
    margin: 0 3px 3px 0;
    font-size: 9px;
}

/* Two-column layout for education and skills */
.education-skills-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.education {
    flex: 1;
    padding-right: 10px;
}

.skills {
    flex: 1;
    padding-left: 10px;
}

.project {
    margin-bottom: 5px;
}

}`  // end of CSS content
  }  // close styles.css object
]; // close initialFiles array