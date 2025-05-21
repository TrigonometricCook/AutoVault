'use client';

import { useEffect, useState, useRef } from 'react';
import { RefreshCcw, Plus } from 'lucide-react';
import { fetchLatestComponents, ComponentWithLatestVersion } from '@/lib/fetchcomponents';
import { supabase } from '@/lib/supabase';

function getPublicUrl(file_path: string) {
  return supabase.storage.from('drawings').getPublicUrl(file_path).data.publicUrl;
}

export default function PdfPreview() {
  const [components, setComponents] = useState<ComponentWithLatestVersion[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<ComponentWithLatestVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const fetchComponents = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await fetchLatestComponents();

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    setComponents(data || []);
    setFilteredComponents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = components.filter(({ part_number, part_name }) =>
      part_number.toLowerCase().includes(term) ||
      part_name?.toLowerCase().includes(term)
    );
    setFilteredComponents(filtered);
  }, [searchTerm, components]);

  useEffect(() => {
    const renderPDF = async (fileUrl: string, canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;

      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const scale = 1.2;
        const viewport = page.getViewport({ scale });

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Failed to render PDF:', err);
        }
      }
    };

    filteredComponents.forEach(({ file_path, part_number, version_number }) => {
      const fileUrl = getPublicUrl(file_path);
      const key = `${part_number}-${version_number}`;
      renderPDF(fileUrl, canvasRefs.current[key]);
    });
  }, [filteredComponents]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-8 px-4">

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Component</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Component Name</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Part Number</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-[#003366]">Components</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or number..."
            className="p-2 border border-gray-300 rounded-lg w-full sm:w-64"
          />
          <button
            onClick={fetchComponents}
            className="p-2 rounded-lg bg-[#003366] text-white hover:bg-[#002244] transition"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <p className="col-span-full text-center text-gray-600">Loading PDFs...</p>}
        {error && <p className="col-span-full text-center text-red-500">{error}</p>}
        {!loading && filteredComponents.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No components found.</p>
        )}
        {filteredComponents.map(({ part_number, part_name, version_number, file_path, description, status }) => {
          const fileUrl = getPublicUrl(file_path);
          const key = `${part_number}-${version_number}`;

          return (
            <div
              key={key}
              className="flex flex-col p-4 border border-gray-200 rounded-2xl shadow-md bg-white text-gray-800 hover:shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              <h2 className="text-lg font-semibold mb-2">{part_name || part_number}</h2>
              <p className="text-sm mb-1 text-gray-600">Version: {version_number}</p>
              {description && <p className="text-sm mb-1 text-gray-600">Desc: {description}</p>}
              {status && <p className="text-sm mb-2 text-gray-600">Status: {status}</p>}
              <canvas
                ref={(el) => (canvasRefs.current[key] = el)}
                style={{ width: '100%', height: 'auto' }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
