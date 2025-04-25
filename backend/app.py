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

@app.route('/ai-edit', methods=['POST'])
def ai_edit():
    """Process AI edits on HTML content"""
    if not request.json:
        return jsonify({'error': 'Invalid request data'}), 400
    
    api_key = request.json.get('apiKey')
    if not api_key:
        return jsonify({'error': 'API key is required'}), 400
    
    # Get the model parameter, defaulting to gpt-3.5-turbo-0125 if not provided
    model = request.json.get('model', 'gpt-3.5-turbo-0125')
    
    target_path = request.json.get('targetPath')
    element_selector = request.json.get('selector')
    instruction = request.json.get('instruction')
    files = request.json.get('files', [])
    
    # Validate required fields
    if not all([target_path, instruction, files]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Ensure we have a valid selector
    if not element_selector:
        element_selector = 'body'
    
    print(f"Processing AI edit: selector={element_selector}, instruction={instruction}, model={model}")
    
    try:
        # Find the target file
        target_file = next((f for f in files if f['path'] == target_path), None)
        if not target_file:
            return jsonify({'error': f'Target file {target_path} not found'}), 404
        
        # Import OpenAI (only when needed)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
        except ImportError as e:
            print(f"OpenAI import error: {str(e)}")
            return jsonify({'error': 'OpenAI package not installed. Run: pip install openai'}), 503
        
        # Handle special case selectors
        if ':contains(' in element_selector:
            # Extract the text from the contains selector for better context
            import re
            match = re.search(r':contains\(["\'](.*?)["\']\)', element_selector)
            if match:
                text_content = match.group(1)
                # Extract the tag from the selector
                tag = element_selector.split(':')[0]
                element_description = f"{tag} containing '{text_content}'"
            else:
                element_description = element_selector
        else:
            element_description = element_selector
        
        # Prepare prompt for OpenAI
        prompt = f"""
        I have this HTML document:
        ```html
        {target_file['content']}
        ```
        
        I want to modify the element that matches this description: "{element_description}"
        
        My instruction is: "{instruction}"
        
        Please provide the complete updated HTML document with the changes applied.
        Only return the full updated HTML document, with no additional text.
        """
        
        # Call OpenAI API with the latest syntax
        try:
            print("Calling OpenAI API...")
            
            # Try with different models in order of preference
            models_to_try = [
                model,  # First try the model specified by the user
                "gpt-3.5-turbo-0125",  # Fall back to other models if the specified one fails
                "gpt-4o-mini",
                "gpt-4",
                "gpt-3.5-turbo"
            ]
            
            # Remove duplicates while preserving order
            seen = set()
            models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]
            
            api_error = None
            result = None
            
            for model in models_to_try:
                try:
                    print(f"Trying model: {model}")
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": "You are an expert HTML editor that helps modify HTML documents precisely."},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    
                    # If we got here, the model worked
                    result = response.choices[0].message.content.strip()
                    print(f"Successfully used model: {model}")
                    break
                    
                except Exception as e:
                    api_error = e
                    print(f"Failed with model {model}: {str(e)}")
                    continue
            
            # If we tried all models and none worked
            if not result:
                if api_error:
                    raise api_error
                else:
                    raise Exception("All model attempts failed, but no specific error was captured")
                    
        except Exception as api_error:
            print(f"OpenAI API error: {str(api_error)}")
            # Add more details about the error
            error_details = str(api_error)
            if "API key" in error_details.lower():
                error_details = "Invalid or expired API key. Please check your OpenAI API key."
            elif "rate limit" in error_details.lower():
                error_details = "OpenAI API rate limit exceeded. Please try again later."
            
            return jsonify({
                'error': 'Failed to call OpenAI API',
                'details': error_details
            }), 500
        
        # Clean up any markdown code blocks if present
        if result.startswith("```html"):
            result = result[7:]
        if result.endswith("```"):
            result = result[:-3]
        result = result.strip()
        
        # Check if the result actually contains HTML
        if not result.strip().startswith('<'):
            return jsonify({
                'error': 'Invalid response from AI',
                'details': 'The AI did not return valid HTML content'
            }), 500
        
        # Update the file in our collection
        updated_files = []
        for f in files:
            if f['path'] == target_path:
                updated_files.append({**f, 'content': result})
            else:
                updated_files.append(f)
        
        return jsonify({
            'success': True,
            'updatedFiles': updated_files
        })
        
    except Exception as e:
        traceback_str = traceback.format_exc()
        print(f"AI edit error: {str(e)}\n{traceback_str}")
        return jsonify({
            'error': 'AI edit failed',
            'details': str(e),
            'traceback': traceback_str
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
