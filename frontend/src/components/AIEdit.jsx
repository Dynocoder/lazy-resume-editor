import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AIEdit.css';

const AIEdit = ({ 
  position, 
  selectedElement, 
  onClose, 
  apiKey, 
  aiModel,
  targetPath, 
  files,
  onUpdate 
}) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => { 
    inputRef.current?.focus(); 
  
    // Adjust position if it would go off-screen
    if (containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = position.x;
      let adjustedY = position.y;
      
      // Check if too far right
      if (position.x + rect.width > viewportWidth - 20) {
        adjustedX = Math.max(20, viewportWidth - rect.width - 20);
      }
      
      // Check if too far down
      if (position.y + rect.height > viewportHeight - 20) {
        adjustedY = Math.max(20, viewportHeight - rect.height - 20);
      }
      
      container.style.left = `${adjustedX}px`;
      container.style.top = `${adjustedY}px`;
    }
  }, [position]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!instruction.trim()) return;
    if (!apiKey) {
      setError('API key is required. Please add your OpenAI API key.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const selector = generateSelector(selectedElement);
      const response = await axios.post('http://localhost:5001/ai-edit', {
        apiKey, model: aiModel, targetPath, selector, instruction, files
      });
      
      if (response.data.success && response.data.updatedFiles) {
        onUpdate(response.data.updatedFiles);
        onClose();
      } else {
        setError('Failed to update content: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || 
               err.request ? 'Server connection error' : `Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSelector = (element) => {
    if (!element) return 'body';
    
    if (element.id) return `#${element.id}`;
    
    if (element.className && typeof element.className === 'string') {
      const firstClass = element.className.split(' ').filter(c => c)[0];
      if (firstClass) return `.${firstClass}`;
    }
    
    const tag = element.tagName?.toLowerCase() || 'p';
    
    if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(tag)) {
      const textSnippet = element.textContent?.substring(0, 20).trim();
      if (textSnippet) return `${tag}:contains("${textSnippet}")`;
    }
    
    return tag;
  };

  return (
    <div 
      ref={containerRef}
      className="ai-edit-container" 
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px` 
      }}
    >
      <div className="ai-edit-header">
        <h3>AI Edit</h3>
        <button className="ai-edit-close" onClick={onClose}>×</button>
      </div>
      
      <div className="ai-edit-content">
        <p className="ai-edit-element-info">
          Selected: <code>{selectedElement?.tagName.toLowerCase()}</code>
        </p>
        
        {error && <p className="ai-edit-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Type your edit instruction..."
            disabled={isProcessing}
            className="ai-edit-input"
          />
          <button 
            type="submit" 
            className="ai-edit-button"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Apply'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIEdit; 