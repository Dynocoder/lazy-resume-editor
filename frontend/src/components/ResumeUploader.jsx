import React, { useState } from 'react';
import axios from 'axios';
import './ResumeUploader.css';

const ResumeUploader = ({ files, apiKey, aiModel, onUpdate, onClose }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!apiKey) {
      setError('API key is required. Please add your OpenAI API key.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setProgress(10);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', apiKey);
    formData.append('model', aiModel);
    formData.append('files', JSON.stringify(files));
    
    try {
      setProgress(30);
      const response = await axios.post('http://localhost:5001/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 40) / progressEvent.total) + 30;
          setProgress(percentCompleted < 70 ? percentCompleted : 70);
        }
      });
      
      setProgress(100);
      
      if (response.data.success && response.data.updatedFiles) {
        onUpdate(response.data.updatedFiles);
        onClose();
      } else {
        setError('Failed to update content: ' + (response.data.error || 'Unknown error'));
        setProgress(0);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || 
               err.request ? 'Server connection error' : `Error: ${err.message}`);
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="resume-uploader-container">
      <div className="resume-uploader-header">
        <h3>Upload Resume</h3>
        <button className="resume-uploader-close" onClick={onClose}>×</button>
      </div>
      
      <div className="resume-uploader-content">
        {error && <p className="resume-uploader-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="resume-uploader-file-input">
            <label>
              {file ? file.name : 'Choose file'}
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt"
                disabled={isUploading}
              />
            </label>
            <p className="resume-uploader-hint">
              Supported formats: PDF, TXT
            </p>
          </div>
          
          {isUploading && (
            <div className="resume-uploader-progress">
              <div 
                className="resume-uploader-progress-bar" 
                style={{ width: `${progress}%` }}
              />
              <span>{progress}%</span>
            </div>
          )}
          
          <button 
            type="submit" 
            className="resume-uploader-button"
            disabled={isUploading || !file}
          >
            {isUploading ? 'Processing...' : 'Upload & Customize Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResumeUploader;