from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import subprocess
import tempfile
import shutil
import uuid
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def create_file_structure(temp_dir, files):
    """Create the file structure in the temporary directory."""
    for file in files:
        file_path = os.path.join(temp_dir, file['path'])
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            f.write(file['content'])

def create_pdf(temp_dir, main_file):
    # Get the main file path
    main_file_path = os.path.join(temp_dir, main_file)
    pdf_filename = os.path.join(temp_dir, f"{os.path.splitext(main_file)[0]}.pdf")

    # Compile LaTeX to PDF using pdflatex
    # Run twice to resolve references if needed
    process = subprocess.run(
        ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, main_file_path],
        capture_output=True,
        text=True
    )

    # Run a second time to resolve references
    process = subprocess.run(
        ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, main_file_path],
        capture_output=True,
        text=True
    )
    
    # Check if PDF was generated
    if not os.path.exists(pdf_filename):
        error_log = process.stdout + process.stderr
        return jsonify({'error': 'PDF compilation failed', 'log': error_log}), 500

    return pdf_filename



@app.route('/compile', methods=['POST'])
def compile_latex():
    if not request.json or 'files' not in request.json:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.json['files']
    main_file = request.json.get('mainFile', 'main.tex')
    
    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create the file structure
        create_file_structure(temp_dir, files)

        pdf_file = create_pdf(temp_dir, main_file)

        return send_file(
            pdf_file,
            mimetype='application/pdf',
            as_attachment=False,
            download_name='resume.pdf'
        )


    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)



@app.route('/get-text', methods=['POST'])
def get_text():
    if not request.json or 'files' not in request.json:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.json['files']
    main_file = request.json.get('mainFile', 'main.tex')
    
    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create the file structure
        create_file_structure(temp_dir, files)

        pdf_file = create_pdf(temp_dir, main_file)

        #TODO: create the pdf-to-text workflow
        return send_file(
            pdf_file,
            mimetype='application/pdf',
            as_attachment=False,
            download_name='resume.pdf'
        )


    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
