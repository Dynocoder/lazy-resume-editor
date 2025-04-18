from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import subprocess
import tempfile
import shutil
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/compile', methods=['POST'])
def compile_latex():
    print(request.data)
    if not request.json or 'latex' not in request.json:
        return jsonify({'error': 'No LaTeX code provided'}), 400
    
    latex_code = request.json['latex']
    
    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Generate a unique filename
        file_id = str(uuid.uuid4())
        tex_filename = os.path.join(temp_dir, f"{file_id}.tex")
        pdf_filename = os.path.join(temp_dir, f"{file_id}.pdf")
        
        # Write LaTeX code to temporary file
        with open(tex_filename, 'w') as f:
            f.write(latex_code)
        
        # Compile LaTeX to PDF using pdflatex
        # Run twice to resolve references if needed
        process = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, tex_filename],
            capture_output=True,
            text=True
        )
        
        # Run a second time to resolve references
        process = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, tex_filename],
            capture_output=True,
            text=True
        )
        
        # Check if PDF was generated
        if not os.path.exists(pdf_filename):
            error_log = process.stdout + process.stderr
            print("file doesn't exist***********************************")
            return jsonify({'error': 'PDF compilation failed', 'log': error_log}), 500
        
        # Return the PDF file
        # return send_file(pdf_filename, mimetype='application/pdf')
        print("sending ", pdf_filename)
        return send_file(
            pdf_filename,
            mimetype='application/pdf',
            as_attachment=False,
            download_name='resume.pdf'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)
        # pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
