"""
Resume matcher core functionality
"""
import os
import tempfile
import json
import re
from typing import Dict, List, Any

import PyPDF2

# Use only built-in keyword extraction; remove spaCy/textacy dependencies

class ResumeScorer:
    """
    A class to score how well a resume matches a job description
    """
    def __init__(self):
        self.top_n_values = 20
    
    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text from a PDF file"""
        text = ""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            pdf_file.save(temp_file.name)
            with open(temp_file.name, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page in pdf_reader.pages:
                    text += page.extract_text()
        return text
    
    def extract_keyterms(self, text: str) -> List[str]:
        """Extract key terms using simple frequency-based extraction"""
        return self._extract_keywords_fallback(text)
    
    def score_match(self, resume_keywords: List[str], job_keywords: List[str]) -> float:
        """Calculate a simple matching score based on keyword overlap"""
        resume_set = set(resume_keywords)
        job_set = set(job_keywords)
        
        # Calculate overlap
        common_keywords = resume_set.intersection(job_set)
        
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
            "missing_keywords": missing_keywords,
            "resume_text": resume_text
        } 