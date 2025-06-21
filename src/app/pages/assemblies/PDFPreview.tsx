"use client";
import React, { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface PDFPreviewProps {
  filePath: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ filePath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderPDF = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("assembly-drawings")
          .download(filePath);

        if (error || !data) {
          console.error("Download error", error);
          return;
        }

        const blobURL = URL.createObjectURL(data);

        const pdfjsLib = await import("pdfjs-dist/build/pdf");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument(blobURL).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const maxWidth = 180;
        const maxHeight = 250;
        const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
      } catch (err) {
        console.error("Error rendering PDF preview:", err);
      }
    };

    renderPDF();
  }, [filePath]);

  return (
    <div className="flex justify-center border border-gray-200 rounded mb-3 p-1">
      <canvas ref={canvasRef} className="max-h-48" />
    </div>
  );
};

export default PDFPreview;
