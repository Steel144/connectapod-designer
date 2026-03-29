import React, { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

export default function PrintSiteMapModal({ onClose, siteAddress, screenshot }) {
  const [generating, setGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!screenshot) return;
    setGenerating(true);
    try {
      // Load image to get natural dimensions and determine orientation
      const img = new window.Image();
      img.src = screenshot;
      await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });

      const imgW = img.naturalWidth || 800;
      const imgH = img.naturalHeight || 600;
      const orientation = imgW >= imgH ? 'landscape' : 'portrait';

      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Scale image to fill the entire page
      const scale = Math.min(pageWidth / imgW, pageHeight / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const x = (pageWidth - drawW) / 2;
      const y = (pageHeight - drawH) / 2;

      pdf.addImage(screenshot, 'PNG', x, y, drawW, drawH);
      pdf.save('site-plan.pdf');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: '90vw', height: '90vh', maxWidth: '1400px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Site Plan Print Preview</h2>
            {siteAddress && <p className="text-xs text-gray-500 mt-0.5">{siteAddress}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center">
          {screenshot ? (
            <img
              src={screenshot}
              alt="Site Plan"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-center text-gray-400 p-8">
              <p className="text-lg mb-2">No site map captured</p>
              <p className="text-sm">Go to the Site Map tab first, then click Print → Site Plan.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-400">
            {screenshot ? "This is a screenshot of your Site Map view." : "Visit the Site Map tab first to capture the view."}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generating || !screenshot}
              className="px-4 py-2 text-sm bg-[#F15A22] text-white rounded hover:bg-[#d94e1a] disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}