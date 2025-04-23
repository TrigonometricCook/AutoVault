'use client';

import { useEffect, useRef, useState } from 'react';

export default function PdfPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileUrl, setFileUrl] = useState<string>(''); // Set initial file URL state
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Set the file URL directly for this demo
  const filePath = 'https://hrxtagipuasjfofmhnkt.supabase.co/storage/v1/object/public/drawings/Python_Datascience.pdf';

  useEffect(() => {
    setLoading(true);

    // Directly assign the file URL as it's already known
    setFileUrl(filePath); // Set the file URL directly
    setLoading(false);
  }, []);

  useEffect(() => {
    const renderPDF = async () => {
      if (!fileUrl) {
        setError('No PDF URL available.');
        return;
      }

      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        const workerPath = '/pdf.worker.min.mjs'; // Path to the worker
        console.log(`Setting workerSrc to: ${workerPath}`);
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

        console.log(`Loading PDF from URL: ${fileUrl}`);

        // Fetch and load the document
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);

        // Fetch the first page
        const page = await pdf.getPage(1);
        const scale = 1.2;
        const viewport = page.getViewport({ scale });

        // Log the viewport dimensions
        console.log(`Viewport dimensions: width = ${viewport.width}, height = ${viewport.height}`);

        const canvas = canvasRef.current;
        if (!canvas) {
          setError('Canvas element not found');
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          setError('Failed to get canvas context');
          return;
        }

        // Set canvas size
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        console.log('Rendering page to canvas...');
        await page.render(renderContext).promise;

        console.log('PDF rendered successfully');
      } catch (err: any) {
        setError('Error during PDF rendering: ' + err.message);
        console.error('Rendering error:', err);
      }
    };

    if (fileUrl) {
      renderPDF(); // Only render when fileUrl is set
    }
  }, [fileUrl]);

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">PDF Preview</h1>

      {loading && <p className="text-center">Loading PDF...</p>}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '300px',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  );
}
