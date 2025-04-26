import React from 'react';

// Generate simplified CSS selector for an element
const getElementPath = (el) => {
  if (!el || el === document.body) return '';
  
  let path = el.tagName.toLowerCase();
  if (el.id) return path + '#' + el.id;
  
  if (el.className) {
    const classes = el.className.split(/\s+/).filter(c => c);
    if (classes.length) path += '.' + classes.join('.');
  }
  
  // Add position for siblings
  const siblings = el.parentNode.children;
  if (siblings.length > 1) {
    const sameTagSiblings = Array.from(siblings).filter(s => s.tagName === el.tagName);
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(el) + 1;
      path += `:nth-of-type(${index})`;
    }
  }
  
  return el.parentNode !== document.body
    ? getElementPath(el.parentNode) + ' > ' + path
    : path;
};

// Generate script for direct text editing
export const generateDirectEditScript = () => `
  // Add basic styles
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: \`
      [contenteditable="true"] {
        outline: 2px solid #007bff;
        padding: 2px;
        min-height: 1em;
        cursor: text !important;
      }
      [contenteditable="true"] * { cursor: text !important; }
      [contenteditable="true"] strong { background-color: rgba(0, 123, 255, 0.05); }
    \`
  }));

  // Global variables
  let activeElement = null, originalHTML = null;

  // Handle clicks for editing or selection
  document.addEventListener('click', e => {
    if (e.target === document.body || e.target === document.documentElement) return;
    
    const selection = window.getSelection();
    
    // Handle text selection for AI edit
    if (!selection.isCollapsed) {
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      if (!range) return;
      
      // Get proper element from selection
      let el = range.commonAncestorContainer;
      if (el.nodeType === 3) el = el.parentElement;
      if (!el || el.tagName === 'BODY') {
        el = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
      }
      if (!el || !el.tagName) return;
      
      // Send selection to parent
      const rect = el.getBoundingClientRect();
      window.parent.postMessage({
        type: 'elementSelected',
        element: {
          tagName: el.tagName,
          id: el.id || '',
          className: el.className || '',
          textContent: el.textContent ? 
            (el.textContent.length > 50 ? el.textContent.substring(0, 50) + '...' : el.textContent) : '',
          html: el.outerHTML || ''
        },
        position: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY
        }
      }, '*');
      return;
    }
    
    // Direct editing on click
    let element = e.target;
    
    // If clicking on formatting tag, use parent
    if (['strong', 'em', 'b', 'i'].includes(element.tagName.toLowerCase()) && element.parentElement) {
      element = element.parentElement;
    }
    
    // Clean up previous editable elements
    if (activeElement && activeElement !== element) {
      activeElement.contentEditable = false;
    }
    
    // Save original HTML for restoration
    originalHTML = element.innerHTML;
    element.contentEditable = true;
    activeElement = element;
    
    // Focus element
    setTimeout(() => element.focus(), 0);
    e.stopPropagation();
  });
  
  // Save changes on blur
  document.addEventListener('blur', e => {
    if (e.target.contentEditable !== 'true') return;
    
    const element = e.target;
    
    // Try to restore formatting if removed
    if (originalHTML && 
        (originalHTML.includes('<strong') || originalHTML.includes('<em') || 
         originalHTML.includes('<b') || originalHTML.includes('<i')) &&
        !(element.innerHTML.includes('<strong') || element.innerHTML.includes('<em') || 
          element.innerHTML.includes('<b') || element.innerHTML.includes('<i'))) {
      
      // Find labels like "Languages:" and restore formatting
      const labelRegex = /([A-Za-z ]+):/g;
      const originalLabels = originalHTML.match(labelRegex);
      
      if (originalLabels) {
        let newHTML = element.innerHTML;
        originalLabels.forEach(label => {
          const plainLabel = label.trim();
          if (newHTML.includes(plainLabel) && !newHTML.includes('<strong>' + plainLabel + '</strong>')) {
            newHTML = newHTML.replace(plainLabel, '<strong>' + plainLabel + '</strong>');
          }
        });
        element.innerHTML = newHTML;
      }
    }
    
    // Send updated content to parent
    window.parent.postMessage({
      type: 'contentUpdated',
      element: {
        tagName: element.tagName,
        id: element.id || '',
        className: element.className || '',
        textContent: element.textContent,
        html: element.innerHTML,
        parentSelector: getElementPath(element)
      }
    }, '*');
    
    element.contentEditable = false;
    if (activeElement === element) activeElement = null;
  }, true);
  
  // Handle Enter to save
  document.addEventListener('keydown', e => {
    if (e.target.contentEditable === 'true' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
  });
  
  // Helper to get element path
  function getElementPath(element) {
    if (!element || element === document.body) return '';
    
    let path = element.tagName.toLowerCase();
    if (element.id) return path + '#' + element.id;
    
    if (element.className) {
      const classes = element.className.split(/\\s+/).filter(c => c);
      if (classes.length) path += '.' + classes.join('.');
    }
    
    const siblings = element.parentNode.children;
    if (siblings.length > 1) {
      const sameTagSiblings = Array.from(siblings).filter(s => s.tagName === element.tagName);
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(element) + 1;
        path += \`:nth-of-type(\${index})\`;
      }
    }
    
    return element.parentNode !== document.body
      ? getElementPath(element.parentNode) + ' > ' + path 
      : path;
  }
`;

// Handle content updates from preview
export const handleContentUpdate = (files, currentFile, setFiles, setCurrentFile, renderHtml) => event => {
  if (event.data?.type !== 'contentUpdated' || !event.data.element) return;
  
  try {
    // Find HTML file and parse it
    const htmlFile = files.find(file => file.path.endsWith('.html'));
    if (!htmlFile) return;
    
    const doc = new DOMParser().parseFromString(htmlFile.content, 'text/html');
    const selector = event.data.element.parentSelector;
    
    // Find the target element
    let targetElement = selector ? doc.querySelector(selector) : null;
    if (!targetElement && event.data.element.id) {
      targetElement = doc.getElementById(event.data.element.id);
    }
    
    if (targetElement) {
      // Update HTML content preserving formatting
      targetElement.innerHTML = event.data.element.html.replace(/<[^>]*>/g, match => match.toLowerCase());
      
      // Update files with new content
      const updatedContent = doc.documentElement.outerHTML;
      const updatedFiles = files.map(file => 
        file.path === htmlFile.path ? {...file, content: updatedContent} : file
      );
      
      setFiles(updatedFiles);
      if (currentFile.path === htmlFile.path) {
        setCurrentFile({...currentFile, content: updatedContent});
      }
      
      renderHtml();
    }
  } catch (err) {
    console.error('Error updating content:', err);
  }
};

export default { generateDirectEditScript, handleContentUpdate }; 