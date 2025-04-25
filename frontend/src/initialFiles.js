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