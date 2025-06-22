'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Version = {
  version_number: number;
  file_path: string;
  created_at: string;
  created_by: string;
  cost: number | null;
  description?: string;
  status?: string;
};

type Props = {
  part_number: string;
  version: Version;
  isNew?: boolean;
  onCancel: () => void;
};

export default function EditableVersionCard({ part_number, version, isNew, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    version_number: '',
    description: version.description ?? '',
    cost: version.cost?.toString() ?? '',
    status: version.status ?? '',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const { version_number, description, cost, status } = form;

      if (!version_number) throw new Error('Version number is required.');

      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user?.email) {
        throw new Error('Could not get current session.');
      }

      const actorEmail = sessionData.session.user.email;

      // Get username of the current user
      const { data: actorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('email', actorEmail)
        .single();

      if (profileError || !actorProfile?.username) {
        throw new Error('Could not fetch actor username.');
      }

      const actorUsername = actorProfile.username;

      // Upload PDF file if selected
      let filePath = version.file_path;
      if (file) {
        const ext = file.name.split('.').pop();
        const newFilename = `${part_number}_v${version_number}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('drawings') // your storage bucket
          .upload(`versions/${newFilename}`, file, { upsert: true });

        if (uploadError) {
          throw new Error('File upload failed: ' + uploadError.message);
        }

        filePath = uploadData?.path || '';
      }

      // Insert into component_versions
      const { error: insertError } = await supabase.from('component_versions').insert([
        {
          part_number,
          version_number: parseInt(version_number),
          description,
          cost: cost ? parseFloat(cost) : null,
          status,
          file_path: filePath,
          created_by: actorUsername,
        },
      ]);

      if (insertError) {
        throw new Error('Failed to save version: ' + insertError.message);
      }

      // Insert into audit_log
      const record_id = `${part_number}_v${version_number}`;

      const { error: auditError } = await supabase.from('audit_log').insert([
        {
          table_name: 'component_versions',
          record_id,
          action_type: 'new component version',
          username: actorUsername,
        },
      ]);

      if (auditError) {
        throw new Error('Audit log failed: ' + auditError.message);
      }

      alert('Component version saved and logged successfully.');
    } catch (err: any) {
      console.error('Error:', err.message);
      alert(err.message);
    }
  };

  useEffect(() => {
    const renderPDF = async (src: string | File) => {
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const url = typeof src === 'string' ? src : URL.createObjectURL(src);
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scale = Math.min(300 / viewport.width, 400 / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const context = canvas.getContext('2d');
        if (!context) return;

        if (renderTaskRef.current) await renderTaskRef.current.cancel();

        renderTaskRef.current = page.render({ canvasContext: context, viewport: scaledViewport });
        await renderTaskRef.current.promise;
      } catch (err) {
        console.error('PDF render error:', err);
      }
    };

    if (file) renderPDF(file);
    else if (version.file_path) renderPDF(version.file_path);

    return () => {
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };
  }, [file, version.file_path]);

  return (
    <div className="flex flex-col border border-gray-300 rounded-xl p-6 shadow bg-white space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Drawing Preview</label>
            <canvas ref={canvasRef} className="border rounded w-full h-auto mt-1" />
          </div>
          <div>
            <input
              id="version-pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="version-pdf-upload"
              className="cursor-pointer bg-blue-600 text-white text-center px-4 py-2 rounded hover:bg-blue-700 inline-block w-full"
            >
              {file ? 'Change PDF' : 'Upload PDF'}
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-1/2 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Part Number: {part_number}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700">Version Number</label>
            <input
              name="version_number"
              value={form.version_number}
              onChange={handleInputChange}
              placeholder="Enter new version number"
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
              rows={2}
            />
          </div>

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
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
