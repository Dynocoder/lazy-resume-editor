"""
Resume matcher core functionality
"""
import os
import tempfile
import json
import re
import shutil
from typing import Dict, List, Any

import PyPDF2
import io
from weasyprint import HTML

# Use only built-in keyword extraction; remove spaCy/textacy dependencies
import re
from typing import Dict, List, Any
import PyPDF2

class ResumeScorer:
    """
    A class to score how well a resume matches a job description
    """
    def __init__(self):
        self.top_n_values = 20
    
    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text from a PDF file or HTML via WeasyPrint"""
        text = ""
        temp_file_path = None
        pdf_temp_path = None
        
        try:
            # Create a temporary directory to work in
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, "input_file")
            pdf_temp_path = os.path.join(temp_dir, "converted.pdf")
            
            # Check if pdf_file is a file-like object with the read method
            if hasattr(pdf_file, 'read') and callable(pdf_file.read):
                # Check if we need to rewind the file
                if hasattr(pdf_file, 'tell') and callable(pdf_file.tell):
                    pdf_file.seek(0)
                
                # Read content directly
                pdf_content = pdf_file.read()
                
                # Write content to temporary file
                with open(temp_file_path, 'wb') as f:
                    f.write(pdf_content)
            else:
                # Save uploaded file to temp path using save method
                pdf_file.save(temp_file_path)
            
            # Get the filename 
            filename = getattr(pdf_file, 'filename', '').lower()
            
            # If HTML, convert to PDF using a file on disk
            if filename.endswith('.html') or filename.endswith('.htm'):
                print(f"Processing HTML file: {filename}")
                html_str = open(temp_file_path, 'r', encoding='utf-8', errors='ignore').read()
                
                # Save PDF to disk instead of keeping in memory
                HTML(string=html_str).write_pdf(pdf_temp_path)
                print(f"Converted HTML to PDF, saved at: {pdf_temp_path}")
                
                # Verify the PDF was created
                if not os.path.exists(pdf_temp_path) or os.path.getsize(pdf_temp_path) == 0:
                    raise Exception("PDF conversion failed - output file is empty or missing")
                
                # Use the saved PDF file
                reader = PyPDF2.PdfReader(pdf_temp_path)
            else:
                # Assume PDF, use the temp file directly
                reader = PyPDF2.PdfReader(temp_file_path)
                
            # Extract text from pages
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            print(f"Successfully extracted {len(text)} characters of text")
            return text
            
        except Exception as e:
            print(f"Error extracting text from file: {str(e)}")
            # If PDF extraction fails, try to extract text directly from HTML
            if filename.endswith('.html') or filename.endswith('.htm'):
                try:
                    with open(temp_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        html_content = f.read()
                    # Simple HTML tag stripping as fallback
                    text = re.sub(r'<[^>]+>', ' ', html_content)
                    text = re.sub(r'\s+', ' ', text).strip()
                    print(f"Used fallback HTML text extraction: {len(text)} characters")
                    return text
                except Exception as html_err:
                    print(f"Fallback HTML extraction also failed: {str(html_err)}")
            raise Exception(f"Failed to extract text: {str(e)}")
            
        finally:
            # Clean up temporary files
            try:
                if temp_file_path and os.path.exists(os.path.dirname(temp_file_path)):
                    shutil.rmtree(os.path.dirname(temp_file_path), ignore_errors=True)
            except Exception as cleanup_err:
                print(f"Error cleaning up temp files: {str(cleanup_err)}")
    
    def extract_keyterms(self, text: str) -> List[str]:
        """Extract key terms using simple frequency-based extraction"""
        return self._extract_keywords_fallback(text)
    
    def _extract_keywords_fallback(self, text: str) -> List[str]:
        """Extract keywords using simple frequency-based method as fallback"""
        # Normalize text: lowercase and remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        
        # Split into words
        words = text.split()
        
        # Remove common stop words
        stop_words = {
            'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
            'when', 'where', 'how', 'which', 'who', 'whom', 'this', 'that', 'these',
            'those', 'then', 'just', 'so', 'than', 'such', 'both', 'through', 'about',
            'for', 'is', 'of', 'while', 'during', 'to', 'from', 'in', 'on', 'at', 'by',
            'with', 'about', 'against', 'between', 'into', 'through', 'without', 'after',
            'before', 'above', 'below', 'under', 'over', 'again', 'further', 'then', 'once',
            'here', 'there', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'only', 'own', 'same', 'too', 'very', 'can',
            'will', 'should', 'now', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
            'has', 'had', 'having', 'do', 'does', 'did', 'doing'
        }
        filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Count word frequencies
        word_counts = {}
        for word in filtered_words:
            if word in word_counts:
                word_counts[word] += 1
            else:
                word_counts[word] = 1
        
        # Get the top N words by frequency
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        top_words = [word for word, count in sorted_words[:self.top_n_values * 2]]
        
        # Add multi-word terms (bigrams)
        bigrams = self._extract_bigrams(filtered_words, stop_words)
        
        # Combine words and bigrams, up to top_n_values
        combined_terms = (top_words + bigrams)[:self.top_n_values]
        
        return combined_terms
    
    def _extract_bigrams(self, words: List[str], stop_words: set) -> List[str]:
        """Extract bigrams (two-word phrases) from a list of words"""
        bigrams = []
        for i in range(len(words) - 1):
            if words[i] not in stop_words and words[i+1] not in stop_words:
                bigram = f"{words[i]} {words[i+1]}"
                bigrams.append(bigram)
        
        # Count frequencies
        bigram_counts = {}
        for bigram in bigrams:
            if bigram in bigram_counts:
                bigram_counts[bigram] += 1
            else:
                bigram_counts[bigram] = 1
        
        # Get top bigrams
        sorted_bigrams = sorted(bigram_counts.items(), key=lambda x: x[1], reverse=True)
        top_bigrams = [bigram for bigram, count in sorted_bigrams[:self.top_n_values]]
        
        return top_bigrams
    
    def score_match(self, resume_keywords: List[str], job_keywords: List[str]) -> float:
        """Calculate a simple matching score based on keyword overlap"""
        resume_set = set(resume_keywords)
        job_set = set(job_keywords)
        
        # Calculate overlap
        common_keywords = resume_set.intersection(job_set)
        
        if not resume_set or not job_set:
            return 0.0
            
        # Calculate Jaccard similarity
        similarity = len(common_keywords) / (len(resume_set) + len(job_set) - len(common_keywords))
        
        return similarity * 100  # Return as percentage
    
    def process(self, resume_pdf, job_description_text: str) -> Dict[str, Any]:
        """Process resume PDF and job description text, return match results"""
        # Extract text from PDF
        resume_text = self.extract_text_from_pdf(resume_pdf)
        
        # Extract keywords
        resume_keywords = self.extract_keyterms(resume_text)
        job_keywords = self.extract_keyterms(job_description_text)
        
        # Calculate score
        score = self.score_match(resume_keywords, job_keywords)
        
        # Find matched and missing keywords
        matched_keywords = list(set(resume_keywords).intersection(set(job_keywords)))
        missing_keywords = list(set(job_keywords).difference(set(resume_keywords)))
        
        return {
            "score": round(score, 2),
            "resume_keywords": resume_keywords,
            "job_keywords": job_keywords,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords
        } 