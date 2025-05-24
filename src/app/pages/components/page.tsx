'use client';

import { useEffect, useState, useRef } from 'react';
import { RefreshCcw, Plus, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchLatestComponents, ComponentWithLatestVersion } from '@/lib/fetchcomponents';
import { supabase } from '@/lib/supabase';

function getPublicUrl(file_path: string) {
  return supabase.storage.from('drawings').getPublicUrl(file_path).data.publicUrl;
}

function PdfCard({
  fileUrl,
  component,
}: {
  fileUrl: string;
  component: ComponentWithLatestVersion;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderPDF = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const maxWidth = 300;
        const maxHeight = 350;

        const scaleX = maxWidth / viewport.width;
        const scaleY = maxHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY); // maintain full top-left view

        const croppedViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = croppedViewport.width;
        canvas.height = croppedViewport.height;

        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: croppedViewport,
        });

        await renderTaskRef.current.promise;
        setLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Failed to render PDF:', err);
        }
      }
    };

    renderPDF();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, [fileUrl]);

  return (
    <div
      className="flex flex-col p-4 border border-gray-200 rounded-2xl shadow-md bg-white text-black hover:shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02] cursor-pointer"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{component.part_name || component.part_number}</h2>
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit', component);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="text-red-600 hover:text-red-800"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete', component);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70 rounded">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto" />
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p><strong>Part Number:</strong> {component.part_number}</p>
        <p><strong>Version:</strong> {component.version_number}</p>
        <p><strong>Status:</strong> {component.status || 'N/A'}</p>
        <p><strong>Description:</strong> {component.description || 'No description provided.'}</p>
      </div>
    </div>
  );
}

export default function PdfPreview() {
  const [components, setComponents] = useState<ComponentWithLatestVersion[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<ComponentWithLatestVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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
      part_number.toLowerCase().includes(term) || part_name?.toLowerCase().includes(term)
    );
    setFilteredComponents(filtered);
  }, [searchTerm, components]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-8 px-4">
      {/* Header: Title, Search, Refresh, Add */}
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
            onClick={() => router.push('/pages/components/add')}
            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <p className="col-span-full text-center text-gray-600">Loading PDFs...</p>}
        {error && <p className="col-span-full text-center text-red-500">{error}</p>}
        {!loading && filteredComponents.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No components found.</p>
        )}
        {filteredComponents.map((component) => {
          const fileUrl = getPublicUrl(component.file_path);
          return (
            <PdfCard
              key={`${component.part_number}-${component.version_number}`}
              fileUrl={fileUrl}
              component={component}
            />
          );
        })}
      </div>
    </div>
  );
}
