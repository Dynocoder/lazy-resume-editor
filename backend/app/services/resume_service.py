from codecs import ignore_errors
from weasyprint import HTML, CSS
from io import BytesIO
import os
import shutil
import tempfile


# Try to import WeasyPrint, but don't fail if it's not available
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class ResumeService:

    def create_file_structure(self, temp_dir: str, files: list[dict[str, str]]) -> None:
        """Create the file structure in the temporary directory."""
        for file in files:
            file_path = os.path.join(temp_dir, file['path'])
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                f.write(file['content'])

    def export_pdf(self, files, main_file='index.html'):
        """ Export HTML to PDF using Weasyprint (if available) """
        if not WEASYPRINT_AVAILABLE:
            raise Exception('Weasyprint is not available')

        temp_dir = tempfile.mkdtemp()
        try:
            self.create_file_structure(temp_dir, files)
            main_file_path = os.path.join(temp_dir, main_file)

            if not os.path.exists(main_file_path):
                raise FileNotFoundError(f'File {main_file} not found')


            base_url = f"file://{os.path.dirname(main_file_path)}/"
            html = HTML(filename=main_file_path, base_url=base_url)
            pdf_buffer = BytesIO()

            try:
                html.write_pdf(pdf_buffer, stylesheets=[CSS(string='@page { size: letter; margin: 0; }')])
            except Exception as e:
                print(f"Error with default parameters: {str(e)}")
                # Retry with different parameters if the default fails
                pdf_buffer = BytesIO()
                html.write_pdf(pdf_buffer, stylesheets=[CSS(string='@page { size: letter; margin: 0; }')])

            pdf_buffer.seek(0)
            return pdf_buffer
        except Exception as e:
            raise Exception(f"PDF generation failed: {str(e)}")

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


    def get_weasyprint_status(self):
        """Return WeasyPrint availability and version."""
        return {
            'available': WEASYPRINT_AVAILABLE,
        }
