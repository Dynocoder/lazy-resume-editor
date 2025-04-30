import React, { useState } from 'react';
import axios from 'axios';
import './ResumeMatcherModal.css';

const ResumeMatcherModal = ({ isOpen, onClose, files }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [matchResults, setMatchResults] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescFile, setJobDescFile] = useState(null);
  
  // Find job description file if it exists
  const jobDescriptionFile = files.find(file => file.fileType === 'job-description');

  const handleModalClick = (e) => {
    // Prevent closing when clicking inside the modal content
    e.stopPropagation();
  };

  const handleClose = () => {
    onClose();
    setMatchResults(null);
    setError(null);
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleJobDescFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setJobDescFile(file);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setJobDescription(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleMatchResume = async () => {
    if (!jobDescription) {
      setError('Please enter a job description or upload a job description file.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Get the HTML content from the preview pane
      const htmlContent = document.querySelector('.preview-pane iframe')?.contentDocument?.documentElement?.outerHTML;
      
      if (!htmlContent) {
        setError('Could not retrieve resume content. Please make sure your resume is displayed in the preview.');
        setIsUploading(false);
        return;
      }

      // Convert HTML to PDF (this would ideally be done server-side)
      // For now, use a simple approach by sending the HTML to the backend
      const formData = new FormData();
      
      // Create a Blob from the HTML content
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      
      // Add the HTML as a file
      formData.append('file', htmlBlob, 'resume.html');
      
      // Add the job description
      formData.append('jobDescription', jobDescription);

      // Send to backend
      const response = await axios.post('http://localhost:5001/match-resume', formData);
      
      setMatchResults(response.data.match_results);
    } catch (err) {
      console.error('Resume match error:', err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to match resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="resume-matcher-modal" onClick={handleModalClick}>
        <div className="resume-matcher-header">
          <h2>Match Resume to Job Description</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="resume-matcher-content">
          {!matchResults ? (
            <>
              <div className="job-description-section">
                <h3>Enter Job Description</h3>
                <p className="description-note">
                  Paste the job description text or upload a job description file below.
                </p>
                
                {jobDescriptionFile && (
                  <div className="existing-job-desc">
                    <p>Using existing job description file: <strong>{jobDescriptionFile.name}</strong></p>
                    <textarea
                      defaultValue={jobDescriptionFile.content}
                      onChange={handleJobDescriptionChange}
                      rows={10}
                      className="job-description-textarea"
                    />
                  </div>
                )}
                
                {!jobDescriptionFile && (
                  <>
                    <textarea
                      value={jobDescription}
                      onChange={handleJobDescriptionChange}
                      placeholder="Paste the job description here..."
                      rows={10}
                      className="job-description-textarea"
                    />
                    
                    <div className="file-upload-section">
                      <label className="file-upload-label">
                        <span>Or upload a job description file</span>
                        <input
                          type="file"
                          accept=".txt,.pdf,.docx"
                          onChange={handleJobDescFileChange}
                          className="file-upload-input"
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="resume-matcher-actions">
                <button
                  onClick={handleMatchResume}
                  disabled={isUploading || !jobDescription}
                  className="match-button"
                >
                  {isUploading ? 'Processing...' : 'Match Resume'}
                </button>
                <button onClick={handleClose} className="cancel-button">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="match-results">
              <div className="match-score">
                <h3>Match Score</h3>
                <div className="score-display">
                  <div 
                    className="score-meter" 
                    style={{
                      width: `${matchResults.score}%`,
                      backgroundColor: 
                        matchResults.score > 75 ? '#4caf50' : 
                        matchResults.score > 50 ? '#ff9800' : '#f44336'
                    }}
                  />
                  <span className="score-value">{matchResults.score}%</span>
                </div>
              </div>
              
              <div className="keywords-section">
                <div className="matched-keywords">
                  <h3>Matched Keywords</h3>
                  <div className="keyword-tags">
                    {matchResults.matched_keywords.map((keyword, index) => (
                      <span key={`matched-${index}`} className="keyword-tag matched">
                        {keyword}
                      </span>
                    ))}
                    {matchResults.matched_keywords.length === 0 && (
                      <p className="no-keywords">No matching keywords found.</p>
                    )}
                  </div>
                </div>
                
                <div className="missing-keywords">
                  <h3>Missing Keywords</h3>
                  <div className="keyword-tags">
                    {matchResults.missing_keywords.map((keyword, index) => (
                      <span key={`missing-${index}`} className="keyword-tag missing">
                        {keyword}
                      </span>
                    ))}
                    {matchResults.missing_keywords.length === 0 && (
                      <p className="no-keywords">Great job! Your resume contains all important keywords.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="resume-matcher-actions">
                <button onClick={() => setMatchResults(null)} className="back-button">
                  Back to Job Description
                </button>
                <button onClick={handleClose} className="close-match-button">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeMatcherModal; 