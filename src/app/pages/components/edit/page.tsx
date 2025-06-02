'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, PlusCircle, XCircle } from 'lucide-react';
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

      console.log('Fetched data:', data); // 🔥 LOG: check all data!
      setVersions(data || []);
      setLoading(false);
    };

    fetchVersions();
  }, [partNumber]);

  const handleCancel = () => router.back();
  const latest = versions[0];

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="h-screen overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#003366]">Component Versions</h2>
          <div className="flex gap-3">
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" /> Add New Version
              </button>
            )}
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 text-gray-800 text-sm rounded hover:bg-gray-400"
            >
              <XCircle className="w-4 h-4" /> Cancel
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

        {versions.map((version) => (
          <VersionCard key={version.version_number} version={version} />
        ))}
      </div>
    </div>
  );
}

function VersionCard({ version }: { version: Version }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    renderPDF(version.file_path, canvasRef);
  }, [version]);

  return (
    <div className="flex flex-col md:flex-row border rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full md:w-[200px] h-[150px] md:h-auto object-cover"
      />
      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <h3 className="text-lg font-semibold text-[#003366] mb-2">Version {version.version_number}</h3>
          <p className="text-sm text-gray-700 mb-2 break-all">
            {version.components?.description ?? 'No description available.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {new Date(version.created_at).toLocaleDateString()} -{' '}
            {new Date(version.created_at).toLocaleTimeString()}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
            {version.created_by}
          </span>
          {version.cost !== null && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
              ${version.cost.toFixed(2)}
            </span>
          )}
          {version.components?.status && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              {version.components.status}
            </span>
          )}
        </div>
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
    const maxWidth = 150;
    const maxHeight = 200;
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
