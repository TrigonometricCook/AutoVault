'use client';

import { useEffect, useRef, useState } from 'react';

export default function AddComponentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    part_number: '',
    part_name: '',
    description: '',
    status: '',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    const renderPDF = async () => {
      if (!file) return;

      const url = URL.createObjectURL(file);

      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const scale = 1.2;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        renderTaskRef.current = page.render({ canvasContext: context, viewport });
        await renderTaskRef.current.promise;
      } catch (err) {
        console.error('PDF render error:', err);
      }
    };

    renderPDF();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [file]);

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 max-w-5xl mx-auto">
      {/* LEFT - File Upload + Canvas */}
      <div className="flex-1 border border-gray-300 rounded-lg p-6 shadow bg-white">
        <h2 className="text-xl font-semibold mb-4">Upload Drawing (PDF)</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full mb-4"
        />
        <canvas ref={canvasRef} className="w-full border rounded-md" />
      </div>

      {/* RIGHT - Form Fields */}
      <div className="flex-1 border border-gray-300 rounded-lg p-6 shadow bg-white">
        <h2 className="text-xl font-semibold mb-4">Component Details</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Part Number *</label>
            <input
              name="part_number"
              value={form.part_number}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Component Name</label>
            <input
              name="part_name"
              value={form.part_name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <input
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
