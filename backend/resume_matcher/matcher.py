"""
Resume matcher core functionality
"""
import re
from typing import Dict, List, Any

class ResumeScorer:
    """
    A class to score how well a resume matches a job description
    """
    def __init__(self):
        self.top_n_values = 20
    
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

def match_resume_to_job(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Match a resume text against a job description and return matching results.
    
    Args:
        resume_text (str): The plain text content of the resume
        job_description (str): The plain text content of the job description
        
    Returns:
        Dict[str, Any]: A dictionary containing:
            - score: float - The match score as a percentage
            - resume_keywords: List[str] - Keywords extracted from the resume
            - job_keywords: List[str] - Keywords extracted from the job description
            - matched_keywords: List[str] - Keywords that appear in both
            - missing_keywords: List[str] - Keywords from job description not in resume
    """
    scorer = ResumeScorer()
    
    # Extract keywords
    resume_keywords = scorer.extract_keyterms(resume_text)
    job_keywords = scorer.extract_keyterms(job_description)
    
    # Calculate score
    score = scorer.score_match(resume_keywords, job_keywords)
    
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