'use client';

import { useEffect, useState, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';
import { fetchLatestComponents, ComponentWithLatestVersion } from '@/lib/fetchcomponents';
import { supabase } from '@/lib/supabase';

function getPublicUrl(file_path: string) {
  return supabase.storage.from('drawings').getPublicUrl(file_path).data.publicUrl;
}

function PdfCard({ fileUrl, title }: { fileUrl: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let renderTask: any = null;

    const renderPDF = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument(fileUrl);
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

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Failed to render PDF:', err);
        }
      }
    };

    renderPDF();

    return () => {
      if (renderTask) {
        renderTask.cancel();
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
    <div className="flex flex-col p-4 border border-gray-200 rounded-2xl shadow-md bg-white hover:shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02]">
      <h2 className="text-lg font-semibold text-center mb-3 text-gray-800">{title}</h2>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

export default function PdfPreview() {
  const [components, setComponents] = useState<ComponentWithLatestVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    setLoading(false);
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-8">
      <div className="bg-[#003366] text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-bold">PDF Components</h1>
        <button
          onClick={fetchComponents}
          className="p-3 w-12 h-12 rounded-lg bg-white text-[#003366]"
        >
          <RefreshCcw className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {loading && <p className="col-span-full text-center text-gray-600">Loading PDFs...</p>}
        {error && <p className="col-span-full text-center text-red-500">{error}</p>}
        {components.map(({ part_number, part_name, version_number, file_path }) => {
          const fileUrl = getPublicUrl(file_path);
          const title = `${part_name || part_number} v${version_number}`;
          return <PdfCard key={`${part_number}-${version_number}`} fileUrl={fileUrl} title={title} />;
        })}
      </div>
    </div>
  );
}
