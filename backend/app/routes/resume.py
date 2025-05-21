from io import BytesIO
from flask import Blueprint, request, jsonify, send_file
from app.services.resume_service import ResumeService
import tempfile
import shutil
import os

# TODO: update prefix to api/resume
bp = Blueprint("resume", __name__, url_prefix="")
resume_service = ResumeService()

# Try to import WeasyPrint, but don't fail if it's not available
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


@bp.route('/render', methods=['POST'])
def render_html():
    """Render HTML with associated CSS files"""
    if not request.json or 'files' not in request.json:
        return jsonify({'error': 'No files provided'}), 400

    files = request.json['files']
    main_file = request.json.get('mainFile', 'index.html')
    temp_dir = tempfile.mkdtemp()

    try:
        # Create file structure and get HTML content
        resume_service.create_file_structure(temp_dir, files)
        main_file_path = os.path.join(temp_dir, main_file)

        if not os.path.exists(main_file_path):
            return jsonify({'error': f'Main file {main_file} not found'}), 400

        with open(main_file_path, 'r') as f:
            html_content = f.read()

        # Collect all CSS files
        css_files = {f['path']: f['content'] for f in files if f['path'].endswith('.css')}

        return jsonify({
            'html': html_content,
            'css_files': css_files
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@bp.route('/export-pdf', methods=['POST'])
def export_pdf():
    """Export HTML to PDF using WeasyPrint"""
    if not request.json or 'files' not in request.json:
        return jsonify({'error': 'No files provided'}), 400
    files = request.json['files']
    main_file = request.json.get('mainFile', 'index.html')

    try:
        pdf_buffer = resume_service.export_pdf(files, main_file)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='resume.pdf'
        )
    except Exception as e:
        return jsonify({
            'error': 'PDF generation failed',
            'details': str(e)
        }), 500
