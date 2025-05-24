'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleComponentSubmit } from '@/lib/addcomponent';

export default function AddComponentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    part_number: '',
    part_name: '',
    description: '',
    status: '',
    version_number: '',
    cost: '',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    await handleComponentSubmit({ ...form, file });
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

        const desiredWidth = 500;
        const desiredHeight = 400;

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = desiredWidth;
        canvas.height = desiredHeight;

        const context = canvas.getContext('2d');
        if (!context) return;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform: [1, 0, 0, 1, -viewport.viewBox[0], -viewport.viewBox[1]],
        };

        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        renderTaskRef.current = page.render(renderContext);
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
    <div className="flex flex-col lg:flex-row gap-10 p-8 max-w-7xl mx-auto">
      {/* LEFT - PDF Viewer */}
      <div className="flex-1 border border-gray-300 rounded-lg p-6 shadow bg-white">
        <h2 className="text-xl font-semibold mb-4">Drawing Preview</h2>
        <canvas
          ref={canvasRef}
          className="border rounded-md mb-4"
          style={{ width: '500px', height: '400px' }}
        />
        <div>
          <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">
            {file ? 'Change File' : 'Choose PDF'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="flex-1 border border-gray-300 rounded-lg p-6 shadow bg-white">
        <h2 className="text-xl font-semibold mb-4">Component Details</h2>
        <form className="space-y-4">
          {/* Part Number + Version */}
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700">Version Number *</label>
              <input
                name="version_number"
                value={form.version_number}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Component Name</label>
            <input
              name="part_name"
              value={form.part_name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          {/* Description */}
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

          {/* Status + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <input
                name="status"
                value={form.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                value={form.cost}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
