# LAZY RESUME EDITOR

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

A modern web application that helps you create, edit, and customize professional resumes using LaTeX and ChatGPT integration, all in one place.

## 🚀 Features

- **LaTeX Resume Editing**: Edit LaTeX documents with real-time syntax highlighting
- **Instant PDF Preview**: See changes instantly with built-in PDF preview
- **AI Integration**: Utilize ChatGPT (via OpenAI API) to help improve your resume content
- **File Management**: Create, edit, rename, and organize your resume components
- **Modern UI**: Clean, intuitive interface built with React and Tailwind CSS

## 🛠️ Tech Stack

**Frontend:**
- React with Vite
- Monaco Editor for code editing
- PDF.js for PDF preview
- Tailwind CSS for styling

**Backend:**
- Flask server with Python
- LaTeX compilation engine
- OpenAI API integration
- Docker containerization

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js and npm (for development)
- LaTeX installation (automated in Docker)
- OpenAI API key (for AI features)

## 🔧 Installation (Docker yet needs to be configured.)

1. Clone the repository:
   ```bash
   git clone https://github.com/Dynocoder/lazy-resume-editor.git
   cd lazy-resume-editor
   ```

2. Start the application using Docker Compose: (Comming SOon)
   ```bash
   docker-compose up -d 
   ```

3. Open your browser and navigate to:
   ```
   http://localhost
   ```

## 🔍 Usage

1. **Edit your resume**: Use the LaTeX editor to write or modify your resume
2. **Compile and preview**: Click the "Compile & Preview" button to see changes
3. **AI assistance**: Add your OpenAI API key to get AI-powered suggestions for your resume
4. **Organize files**: Use the file explorer to manage multiple resume components

## 🧩 Project Structure

```
lazy-resume-editor/
├── frontend/              # React frontend application
│   ├── src/               # Source code
│   ├── public/            # Public assets
│   └── Dockerfile         # Frontend container configuration
├── backend/               # Flask backend server
│   ├── app.py             # Main application server
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Backend container configuration
└── docker-compose.yml     # Docker Compose configuration
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Dynocoder/lazy-resume-editor/issues).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- LaTeX community for providing the foundation for beautiful document creation
- OpenAI for their powerful API
- All contributors who have helped shape this project

---

Made with ❤️ (and some AI) by Saurav Prashar & Jas Jassar
