from codecs import ignore_errors
from weasyprint import HTML, CSS
from io import BytesIO
import os
import shutil
import tempfile
from datetime import datetime
import re


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

    def extract_resume_metadata(self, html_content: str) -> dict:
        """Extract relevant metadata from the HTML content."""
        metadata = {}
        
        # Extract name
        name_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content)
        metadata['name'] = name_match.group(1).strip() if name_match else "Resume"
        
        # Extract skills
        skills_match = re.search(r'<strong>Languages:</strong>(.*?)</p>', html_content, re.DOTALL)
        if skills_match:
            skills = skills_match.group(1).strip()
            # Clean up skills and remove any special characters
            skills = re.sub(r'[^\w\s,]', '', skills)
            metadata['skills'] = [skill.strip() for skill in skills.split(',')]
        
        # Extract education
        education_match = re.search(r'<h2>Education</h2>(.*?)<h2>', html_content, re.DOTALL)
        if education_match:
            education_text = education_match.group(1)
            degree_match = re.search(r'<span class="subtitle">(.*?)</span>', education_text)
            if degree_match:
                metadata['education'] = degree_match.group(1).strip()
        
        # Extract current role
        experience_match = re.search(r'<h2>Experience</h2>(.*?)<h2>', html_content, re.DOTALL)
        if experience_match:
            experience_text = experience_match.group(1)
            current_role_match = re.search(r'<span class="subheading">(.*?)</span>', experience_text)
            if current_role_match:
                metadata['current_role'] = current_role_match.group(1).strip()
        
        # Extract location if available
        location_match = re.search(r'<span class="subtitle">(.*?), [A-Z]{2}</span>', html_content)
        if location_match:
            metadata['location'] = location_match.group(1).strip()
        
        return metadata

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

            # Read the HTML content to extract metadata
            with open(main_file_path, 'r') as f:
                html_content = f.read()

            # Extract detailed metadata
            resume_metadata = self.extract_resume_metadata(html_content)
            current_date = datetime.now().strftime("%Y-%m-%d")

            # Build keywords from resume content
            keywords = ['resume', 'professional']
            if 'skills' in resume_metadata:
                keywords.extend(resume_metadata['skills'])
            if 'current_role' in resume_metadata:
                keywords.append(resume_metadata['current_role'].lower())
            if 'education' in resume_metadata:
                keywords.append(resume_metadata['education'].lower())
            if 'location' in resume_metadata:
                keywords.append(resume_metadata['location'].lower())

            # Clean up keywords
            keywords = [k.strip().lower() for k in keywords if k.strip()]
            keywords = list(dict.fromkeys(keywords))  # Remove duplicates
            keywords = keywords[:10]  # Limit to 10 most relevant keywords

            base_url = f"file://{os.path.dirname(main_file_path)}/"
            html = HTML(filename=main_file_path, base_url=base_url)
            pdf_buffer = BytesIO()

            # Configure PDF metadata with extracted information
            metadata = {
                'title': f"{resume_metadata['name']}'s Resume",
                'author': resume_metadata['name'],
                'subject': f"Professional Resume - {resume_metadata.get('current_role', 'Professional')}",
                'keywords': ', '.join(keywords),
                'creator': 'Microsoft Word',
                'producer': 'Adobe PDF Library 15.0',
                'creationDate': current_date,
                'modDate': current_date
            }

            try:
                html.write_pdf(
                    pdf_buffer,
                    stylesheets=[CSS(string='@page { size: letter; margin: 0; }')]
                )
            except Exception as e:
                print(f"Error with default parameters: {str(e)}")
                # Retry with different parameters if the default fails
                pdf_buffer = BytesIO()
                html.write_pdf(
                    pdf_buffer,
                    stylesheets=[CSS(string='@page { size: letter; margin: 0; }')]
                )

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
