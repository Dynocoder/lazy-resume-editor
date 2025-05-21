import axios from "axios";

export const exportPdf = async (files: any, setIsRendering: any, setError: any, BACKEND_URL: string) => {
  try {
    setIsRendering(true);
    setError(null);

    // Filter out job description files for PDF export
    const renderableFiles = files.filter((f: any) => f.fileType !== 'job-description');

    // Generate PDF
    const response = await axios.post(
      `${BACKEND_URL}/export-pdf`,
      { files: renderableFiles, mainFile: 'index.html' },
      { responseType: 'blob', validateStatus: status => status < 600 }
    );

    // Handle non-PDF responses (errors)
    if (response.headers['content-type'] === 'application/json') {
      const text = await response.data.text();
      const errorJson = JSON.parse(text);
      setError(`PDF export failed: ${errorJson.error || 'Server error'}`);
      return;
    }

    if (response.status !== 200) {
      setError(`PDF export failed: Server returned status ${response.status}`);
      return;
    }

    // Download the PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resume.pdf');
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  } catch (err: any) {
    console.error('PDF export error:', err);
    setError(`PDF export failed: ${err.message || 'Unknown error'}`);
  } finally {
    setIsRendering(false);
  }
};
