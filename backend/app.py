from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from io import BytesIO
import argparse
from PyPDF2 import PdfReader
import io
import json
import tempfile
import shutil
from bs4 import BeautifulSoup

from app import create_app

app = create_app()



# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes


@app.route('/upload-resume', methods=['POST'])
def upload_resume():
    """Process uploaded resume and return customized content"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    # Get API key and model
    api_key = request.form.get('apiKey')
    if not api_key:
        return jsonify({'error': 'API key is required'}), 400
    
    model = request.form.get('model', 'gpt-3.5-turbo-0125')
    
    # Get files JSON data
    files_json = request.form.get('files')
    if not files_json:
        return jsonify({'error': 'Files data is required'}), 400
    
    try:
        files = json.loads(files_json)
    except Exception as e:
        return jsonify({'error': f'Invalid files data: {str(e)}'}), 400
    
    # Find the resume HTML file (assumes it's index.html)
    resume_file = next((f for f in files if f['path'] == 'index.html'), None)
    if not resume_file:
        return jsonify({'error': 'Resume template file not found'}), 404
    
    uploaded_file = request.files['file']
    resume_text = ""
    
    # Extract text based on file type
    try:
        if uploaded_file.filename.lower().endswith('.pdf'):
            # Process PDF file
            pdf_bytes = uploaded_file.read()
            pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    resume_text += page_text + "\n"
        elif uploaded_file.filename.lower().endswith(('.txt', '.doc', '.docx')):
            # For plain text files
            resume_text = uploaded_file.read().decode('utf-8', errors='ignore')
        else:
            return jsonify({'error': 'Unsupported file format. Please upload a PDF or text file.'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to extract text: {str(e)}'}), 500
    
    if not resume_text.strip():
        return jsonify({'error': 'No text could be extracted from the file'}), 400
    
    # Configure OpenAI API
    import openai
    openai.api_key = api_key
    for var in ('HTTP_PROXY','http_proxy','HTTPS_PROXY','https_proxy'):
        os.environ.pop(var, None)
    
    # Prepare prompt for OpenAI
    prompt = f"""
    I have a resume template in HTML:
    ```html
    {resume_file['content']}
    ```
    
    And I have extracted text from a user's resume:
    ```
    {resume_text}
    ```
    
    Please customize the HTML resume template with the user's resume information. 
    Keep the same structure, styling, and formatting of the original HTML template, 
    but replace the content with relevant information from the user's resume.
    
    Only return the complete HTML document, with no additional text or explanations.
    """
    
    # Call OpenAI API with the latest syntax
    try:
        print("Calling OpenAI API for resume customization...")
        
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
                response = openai.ChatCompletion.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an expert resume formatter that helps customize resume templates with user data."},
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
        if f['path'] == 'index.html':
            updated_files.append({**f, 'content': result})
        else:
            updated_files.append(f)
    
    return jsonify({
        'success': True,
        'updatedFiles': updated_files
    })

@app.route('/match-resume', methods=['POST'])
def match_resume():
    """Process uploaded resume and job description for ATS matching"""
    if 'file' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400
    
    job_description = request.form.get('jobDescription')
    if not job_description:
        return jsonify({'error': 'Job description is required'}), 400
    
    try:
        # Import here to prevent loading these dependencies for other routes
        from bs4 import BeautifulSoup
        from resume_matcher.matcher import match_resume_to_job
        
        resume_file = request.files['file']
        print(f"Received file: {resume_file.filename}, size: {resume_file.content_length} bytes")
        
        # Extract text from the file
        resume_text = ""
        if resume_file.filename.lower().endswith(('.html', '.htm')):
            print(f"Processing HTML file: {resume_file.filename}")
            html_content = resume_file.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html_content, 'html.parser')
            resume_text = soup.get_text(separator=' ', strip=True)
            print(f"Extracted {len(resume_text)} characters from HTML")
        else:
            # For PDF files, use PyPDF2 directly
            from PyPDF2 import PdfReader
            pdf_reader = PdfReader(resume_file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    resume_text += page_text + "\n"
            print(f"Extracted {len(resume_text)} characters from PDF")
        
        if not resume_text.strip():
            return jsonify({'error': 'No text could be extracted from the file'}), 400
        
        # Use the new text-based matching function
        match_results = match_resume_to_job(resume_text, job_description)
        
        return jsonify({
            'match_results': match_results
        })
        
    except Exception as e:
        print(f"Error processing resume: {str(e)}")
        return jsonify({'error': f'Failed to process resume: {str(e)}'}), 500

if __name__ == '__main__':
    # Parse command line arguments to allow changing port
    parser = argparse.ArgumentParser(description='HTML Resume Editor Backend')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    args = parser.parse_args()


    app.run(host=args.host, port=args.port, debug=True)
