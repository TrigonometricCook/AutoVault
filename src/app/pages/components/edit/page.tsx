'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, PlusCircle, XCircle, Upload, CheckCircle } from 'lucide-react';

function getPublicUrl(file_path: string) {
  return supabase.storage.from('drawings').getPublicUrl(file_path).data.publicUrl;
}

type Version = {
  version_number: number;
  file_path: string;
  created_at: string;
  created_by: string;
  cost: number | null;
  description?: string;
  status?: string;
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
        .select('*')
        .eq('part_number', partNumber)
        .order('version_number', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setVersions(data || []);
      setLoading(false);
    };

    fetchVersions();
  }, [partNumber]);

  const handleCancel = () => router.back();

  const latest = versions[0];

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

        {adding && latest && (
          <EditableVersionCard
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
    <div className="flex flex-col p-4 border rounded-xl bg-white shadow space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-[#003366]">Version {version.version_number}</h3>
        <div className="flex gap-2">
          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button className="text-red-600 hover:text-red-800 flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
      <div className="flex gap-6">
        <canvas ref={canvasRef} className="w-[150px] border rounded" />
        <div className="space-y-1 text-sm text-gray-700">
          <p><strong>File Path:</strong> {version.file_path}</p>
          <p><strong>Created At:</strong> {new Date(version.created_at).toLocaleString()}</p>
          <p><strong>Created By:</strong> {version.created_by}</p>
          <p><strong>Cost:</strong> {version.cost !== null ? `$${version.cost.toFixed(2)}` : 'N/A'}</p>
          <p><strong>Status:</strong> {version.status ?? 'N/A'}</p>
          <p><strong>Description:</strong> {version.description ?? 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function EditableVersionCard({
  version,
  isNew,
  onCancel,
}: {
  version: Version;
  isNew?: boolean;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    version_number: '',
    file: null as File | null,
    cost: version.cost ?? '',
    created_by: version.created_by ?? '',
    status: version.status ?? '',
    description: version.description ?? '',
  });

  useEffect(() => {
    renderPDF(version.file_path, canvasRef);
  }, [version]);

  return (
    <div className="flex flex-col p-4 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 shadow space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-blue-800">Add New Version</h3>
        <button
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <XCircle className="w-4 h-4" /> Cancel
        </button>
      </div>

      <div className="flex gap-6">
        <canvas ref={canvasRef} className="w-[150px] border rounded bg-white" />
        <div className="space-y-2 text-sm text-gray-700 flex-1">
          <div>
            <label className="font-semibold block">Version Number</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.version_number}
              onChange={(e) => setFormData({ ...formData, version_number: e.target.value })}
              placeholder="Enter new version number"
            />
          </div>

          <div>
            <label className="font-semibold block">Upload New File (Optional)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] ?? null })}
            />
          </div>

          <div>
            <label className="font-semibold block">Cost</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label className="font-semibold block">Created By</label>
            <input
              className="w-full p-2 border rounded"
              value={formData.created_by}
              onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold block">Status</label>
            <input
              className="w-full p-2 border rounded"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold block">Description</label>
            <textarea
              className="w-full p-2 border rounded"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Submit (Mock)
          </button>
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
