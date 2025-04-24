from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
import shutil
from io import BytesIO
import traceback
import argparse

# Try to import WeasyPrint, but don't fail if it's not available
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def create_file_structure(temp_dir, files):
    """Create the file structure in the temporary directory."""
    for file in files:
        file_path = os.path.join(temp_dir, file['path'])
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            f.write(file['content'])

@app.route('/render', methods=['POST'])
def render_html():
    if not request.json or 'files' not in request.json:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.json['files']
    main_file = request.json.get('mainFile', 'index.html')
    
    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create the file structure
        create_file_structure(temp_dir, files)
        
        # Read the main HTML file
        main_file_path = os.path.join(temp_dir, main_file)
        
        if not os.path.exists(main_file_path):
            return jsonify({'error': f'Main file {main_file} not found'}), 400
            
        with open(main_file_path, 'r') as f:
            html_content = f.read()
            
        return jsonify({'html': html_content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route('/weasyprint-status', methods=['GET'])
def weasyprint_status():
    """Check if WeasyPrint is available"""
    return jsonify({
        'available': WEASYPRINT_AVAILABLE,
        'version': getattr(HTML, '__version__', 'unknown') if WEASYPRINT_AVAILABLE else None
    })

@app.route('/export-pdf', methods=['POST'])
def export_pdf():
    """Export HTML to PDF using WeasyPrint"""
    # Check if WeasyPrint is available
    if not WEASYPRINT_AVAILABLE:
        return jsonify({
            'error': 'WeasyPrint is not installed or not working properly',
            'details': 'Please install with: pip install WeasyPrint==52.5 pydyf==0.1.0'
        }), 503  # Service Unavailable
    
    if not request.json or 'files' not in request.json:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.json['files']
    main_file = request.json.get('mainFile', 'index.html')
    
    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create the file structure
        create_file_structure(temp_dir, files)
        
        # Get the main HTML file path
        main_file_path = os.path.join(temp_dir, main_file)
        
        if not os.path.exists(main_file_path):
            return jsonify({'error': f'Main file {main_file} not found'}), 400
        
        # Get the directory of the main HTML file to set the base URL
        base_url = f"file://{os.path.dirname(main_file_path)}/"
        
        try:
            # Create the PDF with WeasyPrint
            html = HTML(filename=main_file_path, base_url=base_url)
            
            # Generate PDF in memory
            pdf_buffer = BytesIO()
            html.write_pdf(pdf_buffer)
            pdf_buffer.seek(0)
            
            # Return the PDF as a file
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='resume.pdf'
            )
        except Exception as e:
            # Specific WeasyPrint error handling
            error_details = str(e)
            if "cairo" in error_details.lower():
                error_details += ". Missing Cairo library. Install system dependencies."
            elif "pango" in error_details.lower():
                error_details += ". Missing Pango library. Install system dependencies."
            elif "takes 1 positional argument but" in error_details:
                error_details = "There's a version conflict with WeasyPrint dependencies. Run ./fix_weasyprint.sh to fix it."
            
            return jsonify({
                'error': 'WeasyPrint PDF generation failed',
                'details': error_details
            }), 500
    except Exception as e:
        return jsonify({
            'error': 'Failed to generate PDF',
            'details': str(e)
        }), 500
    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route('/test-weasyprint', methods=['GET'])
def test_weasyprint():
    """Test if WeasyPrint is working with a simple HTML document"""
    if not WEASYPRINT_AVAILABLE:
        return jsonify({
            'error': 'WeasyPrint is not installed or not working properly',
            'details': 'Please install with: pip install WeasyPrint==52.5 pydyf==0.1.0'
        }), 503  # Service Unavailable
    
    try:
        # Create a simple HTML document
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>WeasyPrint Test</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { color: blue; }
            </style>
        </head>
        <body>
            <h1>WeasyPrint Test</h1>
            <p>This is a test document to check if WeasyPrint is working properly.</p>
        </body>
        </html>
        """
        
        # Create temporary file
        temp_dir = tempfile.mkdtemp()
        test_file = os.path.join(temp_dir, 'test.html')
        
        with open(test_file, 'w') as f:
            f.write(html_content)
        
        # Generate PDF
        html = HTML(filename=test_file)
        pdf_buffer = BytesIO()
        html.write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        pdf_size = len(pdf_buffer.getvalue())
        
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return jsonify({
            'status': 'success',
            'message': 'WeasyPrint is working correctly',
            'pdf_size': pdf_size
        })
    except Exception as e:
        error_details = str(e)
        if "cairo" in error_details.lower():
            error_details += ". Missing Cairo library. Install system dependencies."
        elif "pango" in error_details.lower():
            error_details += ". Missing Pango library. Install system dependencies."
        elif "takes 1 positional argument but" in error_details:
            error_details = "There's a version conflict with WeasyPrint dependencies. Run ./fix_weasyprint.sh to fix it."
        
        return jsonify({
            'status': 'error',
            'error': 'WeasyPrint test failed',
            'details': error_details
        }), 500

if __name__ == '__main__':
    # Parse command line arguments to allow changing port
    parser = argparse.ArgumentParser(description='HTML Resume Editor Backend')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    args = parser.parse_args()
    
    if not WEASYPRINT_AVAILABLE:
        print("WARNING: WeasyPrint is not installed. PDF export will not be available.")
        print("To install WeasyPrint, run: pip install WeasyPrint==52.5 pydyf==0.1.0")
    
    app.run(host=args.host, port=args.port, debug=True)
