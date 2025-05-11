// Initial file structure with HTML template
export const initialFiles = [
  {
    name: "index.html",
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Jake Ryan — Resume</title>
  <style>
    /* Page setup for PDF export */
    @page { size: 8.5in 11in; margin: 0; }
    body { margin: 0; padding: 0; }

    /* Resume container */
    .resume {
      box-sizing: border-box;
      width: 8.5in;
      height: 11in;
      padding: 0.5in;
      font-family: Arial, sans-serif;
      font-size: 10pt; /* Reduced font size for the resume */
      line-height: 1.1; /* Reduced line height to decrease space */
      color: #000;
    }

    /* Headings */
    h1 {
      font-size: 20pt; /* Reduced font size for the name */
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0;
      text-align: center;
    }
    .contact {
      text-align: center;
      margin-bottom: 8px; /* Reduced margin between name and contact */
      font-size: 10pt;
    }
    h2 {
      font-size: 14pt;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      margin: 16px 0 4px;
      padding-bottom: 2px;
    }

    /* Utility */
    .flex {
      display: flex;
      justify-content: space-between;
    }
    .subheading {
      font-weight: bold;
    }
    .subtitle {
      font-style: italic;
      font-size: 10pt;
    }
    ul {
      margin: 4px 0 0 0;
      padding-left: 16px;
    }
    li {
      margin-bottom: 4px;
    }
    .section-list > li {
      margin-bottom: 8px;
    }
    .skills p {
      margin: 2px 0;
    }
  </style>
</head>
<body>
  <div class="resume">
    <!-- Header -->
    <h1>Jake Ryan</h1>
    <p class="contact">
      123-456-7890 | 
      <a href="mailto:jake@su.edu">jake@su.edu</a> | 
      <a href="https://linkedin.com/in/jake">linkedin.com/in/jake</a> | 
      <a href="https://github.com/jake">github.com/jake</a>
    </p>

    <!-- Education -->
    <h2>Education</h2>
    <ul class="section-list">
      <li>
        <div class="flex">
          <span class="subheading">Southwestern University</span>
          <span>Aug. 2018 – May 2021</span>
        </div>
        <div class="flex">
          <span class="subtitle">Bachelor of Arts in Computer Science, Minor in Business</span>
          <span class="subtitle">Georgetown, TX</span>
        </div>
      </li>
      <li>
        <div class="flex">
          <span class="subheading">Blinn College</span>
          <span>Aug. 2014 – May 2018</span>
        </div>
        <div class="flex">
          <span class="subtitle">Associate's in Liberal Arts</span>
          <span class="subtitle">Bryan, TX</span>
        </div>
      </li>
    </ul>

    <!-- Experience -->
    <h2>Experience</h2>
    <ul class="section-list">
      <li>
        <div class="flex">
          <span class="subheading">Undergraduate Research Assistant</span>
          <span>June 2020 – Present</span>
        </div>
        <div class="flex">
          <span class="subtitle">Texas A&amp;M University</span>
          <span class="subtitle">College Station, TX</span>
        </div>
        <ul>
          <li>Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems</li>
          <li>Built a full-stack web app with Flask, React, PostgreSQL and Docker to analyze GitHub data</li>
          <li>Explored methods to visualize GitHub collaboration in a classroom setting</li>
        </ul>
      </li>
      <li>
        <div class="flex">
          <span class="subheading">Information Technology Support Specialist</span>
          <span>Sep. 2018 – Present</span>
        </div>
        <div class="flex">
          <span class="subtitle">Southwestern University</span>
          <span class="subtitle">Georgetown, TX</span>
        </div>
        <ul>
          <li>Communicate with managers to set up campus computers used across facilities</li>
          <li>Assess and troubleshoot hardware/software issues for students, faculty, and staff</li>
          <li>Maintain upkeep of computers, classroom AV equipment, and 200 printers campus-wide</li>
        </ul>
      </li>
      <li>
        <div class="flex">
          <span class="subheading">Artificial Intelligence Research Assistant</span>
          <span>May 2019 – July 2019</span>
        </div>
        <div class="flex">
          <span class="subtitle">Southwestern University</span>
          <span class="subtitle">Georgetown, TX</span>
        </div>
        <ul>
          <li>Explored methods to generate video-game dungeons inspired by <em>The Legend of Zelda</em></li>
          <li>Developed a Java game to test procedural dungeon generation techniques</li>
          <li>Contributed 50K+ lines of code to an existing codebase via Git</li>
          <li>Conducted a human-subject study on dungeon enjoyment metrics</li>
          <li>Authored an 8-page paper and presented findings on-campus and at the World Conference on Computational Intelligence</li>
        </ul>
      </li>
    </ul>

    <!-- Projects -->
    <h2>Projects</h2>
    <ul class="section-list">
      <li>
        <div class="flex">
          <span class="subheading">Gitlytics | Python, Flask, React, PostgreSQL, Docker</span>
          <span>June 2020 – Present</span>
        </div>
        <ul>
          <li>Developed a full-stack app: Flask REST API backend and React frontend</li>
          <li>Implemented GitHub OAuth to fetch user repo data</li>
          <li>Visualized collaboration metrics using interactive charts</li>
          <li>Used Celery & Redis for asynchronous data processing</li>
        </ul>
      </li>
      <li>
        <div class="flex">
          <span class="subheading">Simple Paintball | Spigot API, Java, Maven, TravisCI, Git</span>
          <span>May 2018 – May 2020</span>
        </div>
        <ul>
          <li>Built a Minecraft server plugin to entertain kids during free time</li>
          <li>Published plugin to community sites, earning 2K+ downloads (4.5/5 ★)</li>
          <li>Set up TravisCI for continuous delivery on each release</li>
          <li>Collaborated with server admins for feature requests and feedback</li>
        </ul>
      </li>
    </ul>

    <!-- Technical Skills -->
    <h2>Technical Skills</h2>
    <div class="skills">
      <p><strong>Languages:</strong> Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R</p>
      <p><strong>Frameworks:</strong> React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI</p>
      <p><strong>Developer Tools:</strong> Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse</p>
      <p><strong>Libraries:</strong> pandas, NumPy, Matplotlib</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "styles.css",
    path: "styles.css",
    content: `/* Basic styles for resume */
body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color:rgb(27, 24, 24);
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
}`,
  },
];
