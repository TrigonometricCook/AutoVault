// "use client";

import React, { useState, useEffect, useRef } from "react";
import { useSelectedItemStore } from "@/stores/AsmBuild";
import { X, Save, FilePlus, FileX } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SelectedItemsList = () => {
  const {
    selectedItems,
    removeSelectedItem,
    clearSelectedItems,
  } = useSelectedItemStore();

  const [assemblyName, setAssemblyName] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderPDF = async () => {
      if (!pdfFile || !canvasRef.current) return;

      try {
        const pdfjsLib = await import("pdfjs-dist/build/pdf");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const fileURL = URL.createObjectURL(pdfFile);
        const loadingTask = pdfjsLib.getDocument(fileURL);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const maxWidth = 180;
        const maxHeight = 250;
        const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      } catch (error) {
        console.error("PDF render error:", error);
      }
    };

    renderPDF();
  }, [pdfFile]);

  const handleSave = async () => {
    if (!assemblyName.trim()) {
      alert("Assembly Name is required!");
      return;
    }

    try {
      const { data: newAssembly, error: assemblyError } = await supabase
        .from("assemblies")
        .insert({
          assembly_name: assemblyName,
          description: description,
          status: "draft",
        })
        .select("assembly_id")
        .single();

      if (assemblyError) throw assemblyError;

      const assemblyId = newAssembly.assembly_id;

      let uploadedFilePath = null;
      if (pdfFile) {
        const fileExt = pdfFile.name.split(".").pop();
        const newFileName = `${assemblyId}.${fileExt}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from("assembly-drawings")
          .upload(newFileName, pdfFile, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (fileError) throw fileError;

        uploadedFilePath = fileData.path;

        const { error: updateError } = await supabase
          .from("assemblies")
          .update({ file_path: uploadedFilePath })
          .eq("assembly_id", assemblyId);

        if (updateError) throw updateError;
      }

      const nodesToInsert = selectedItems.map((item) => {
        if (item.type === "component") {
          return {
            assembly_id: assemblyId,
            component_part_number: item.id,
            sub_assembly_id: null,
            listing_id: null,
            quantity: 1,
          };
        } else if (item.type === "assembly") {
          return {
            assembly_id: assemblyId,
            component_part_number: null,
            sub_assembly_id: parseInt(item.id, 10),
            listing_id: null,
            quantity: 1,
          };
        } else if (item.type === "product") {
          return {
            assembly_id: assemblyId,
            component_part_number: null,
            sub_assembly_id: null,
            listing_id: parseInt(item.id, 10),
            quantity: 1,
          };
        }
        throw new Error("Unsupported item type");
      });

      const { error: nodeError } = await supabase
        .from("assembly_nodes")
        .insert(nodesToInsert);

      if (nodeError) throw nodeError;

      alert("Assembly saved successfully!");
      setAssemblyName("");
      setDescription("");
      setPdfFile(null);
      clearSelectedItems();
    } catch (error: any) {
      console.error("Error saving assembly:", error);
      alert("Error saving assembly: " + error.message);
    }
  };

  const handleClear = () => {
    setAssemblyName("");
    setDescription("");
    setPdfFile(null);
    clearSelectedItems();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <h4 className="text-lg font-semibold text-gray-800 mb-1">Add Assembly</h4>

      <input
        type="text"
        placeholder="Assembly Name"
        value={assemblyName}
        onChange={(e) => setAssemblyName(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex items-center gap-2 mt-2">
        <label
          htmlFor="pdf-upload"
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 transition"
        >
          <FilePlus className="w-4 h-4" /> Choose File
        </label>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {pdfFile && (
          <button
            onClick={() => setPdfFile(null)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition"
          >
            <FileX className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* PDF First Page Preview */}
      {pdfFile && (
        <div className="mt-2 border border-gray-300 rounded-lg overflow-hidden shadow-sm flex justify-center">
          <canvas ref={canvasRef} className="max-h-48" />
        </div>
      )}

      {/* Selected Items */}
      <div className="flex flex-col gap-1 text-sm mt-2 max-h-40 overflow-y-auto">
        {selectedItems.length === 0 ? (
          <p className="italic text-gray-400 text-center py-2">
            No selected items.
          </p>
        ) : (
          selectedItems.map((item) => (
            <div
              key={
                item.type === "component"
                  ? `${item.id}-${item.versionId}`
                  : `${item.id}-${item.type}`
              }
              className="flex justify-between items-center bg-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-200 transition"
            >
              <span className="truncate text-gray-800">
                <span className="font-medium">{item.id}</span>
                {item.type === "component" && item.versionId
                  ? ` — v${item.versionId}`
                  : ""}
                {" "}
                ({item.type})
              </span>
              <button
                onClick={() => removeSelectedItem(item.id, item.type)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={handleClear}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          <X className="w-4 h-4" /> Clear All
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition bg-blue-500 text-white hover:bg-blue-600 font-medium"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  );
};

export default SelectedItemsList;
