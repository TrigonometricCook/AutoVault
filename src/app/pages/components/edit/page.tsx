'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, PlusCircle, XCircle, Download } from 'lucide-react';
import EditableVersionCard from '@/components/NewVersion';

function getPublicUrl(file_path: string) {
  return supabase.storage.from('drawings').getPublicUrl(file_path).data.publicUrl;
}

type Version = {
  version_number: number;
  file_path: string;
  created_at: string;
  created_by: string;
  cost: number | null;
  components?: {
    description?: string;
    status?: string;
  };
};

export default function EditComponentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const partNumber = searchParams.get('part_number');

  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!partNumber) {
      setError('Missing part number');
      setLoading(false);
      return;
    }

    const fetchVersions = async () => {
      const { data, error } = await supabase
        .from('component_versions')
        .select(`
          *,
          components (description, status)
        `)
        .eq('part_number', partNumber)
        .order('version_number', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log('Fetched data:', data);
      setVersions(data || []);
      setLoading(false);
    };

    fetchVersions();
  }, [partNumber]);

  const handleCancel = () => router.back();
  const latest = versions[0];

  if (loading) {
    return <div className="p-8 text-lg">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600 font-semibold">Error: {error}</div>;
  }

  return (
    <div className="h-screen overflow-y-auto p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-[#003366]">Component Versions</h2>
          <div className="flex gap-3">
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700"
              >
                <PlusCircle className="w-5 h-5" /> Add
              </button>
            )}
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded shadow hover:bg-gray-400"
            >
              <XCircle className="w-5 h-5" /> Cancel
            </button>
          </div>
        </div>

        {adding && latest && partNumber && (
          <EditableVersionCard
            part_number={partNumber}
            version={latest}
            isNew
            onCancel={() => setAdding(false)}
          />
        )}

        <div className="flex flex-col items-center gap-6">
          {versions.map((version) => (
            <VersionCard key={version.version_number} version={version} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VersionCard({ version }: { version: Version }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    renderPDF(version.file_path, canvasRef);
  }, [version]);

  const handleDownload = () => {
    const url = getPublicUrl(version.file_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = version.file_path.split('/').pop() || 'file.pdf';
    link.click();
  };

  return (
    <div className="w-full max-w-lg-lg flex flex-col md:flex-row border rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex-shrink-0 w-full md:w-48 h-48 bg-gray-200">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-[#003366] mb-1">
            Version {version.version_number}
          </h3>
          <p className="text-sm text-gray-800 break-words">
            {version.components?.description ?? 'No description available.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
            {new Date(version.created_at).toLocaleDateString()} -{' '}
            {new Date(version.created_at).toLocaleTimeString()}
          </span>
          <span className="px-2 py-1 bg-blue-200 text-blue-700 rounded-full">
            {version.created_by}
          </span>
          {version.cost !== null && (
            <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full">
              ${version.cost.toFixed(2)}
            </span>
          )}
          {version.components?.status && (
            <span className="px-2 py-1 bg-purple-200 text-purple-700 rounded-full">
              {version.components.status}
            </span>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded shadow hover:bg-green-700"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>
    </div>
  );
}

async function renderPDF(filePath: string, canvasRef: React.RefObject<HTMLCanvasElement>) {
  try {
    const pdfjsLib = await import('pdfjs-dist/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const loadingTask = pdfjsLib.getDocument(getPublicUrl(filePath));
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1 });
    const maxWidth = 180;
    const maxHeight = 250;
    const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
  } catch (err) {
    console.error('PDF render error:', err);
  }
}
