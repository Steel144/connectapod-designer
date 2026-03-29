import React, { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

const LOGO_URL = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/201470147_ConnectapodArchLogo-01.png";

export default function PrintSiteMapModal({ onClose, siteAddress, screenshot, printDetails = {} }) {
  const [generating, setGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!screenshot) return;
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // ── Header ──────────────────────────────────────────────────────────
      // Load logo
      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = LOGO_URL;
      await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

      const logoH = 14;
      const logoW = logoImg.naturalWidth ? (logoImg.naturalWidth / logoImg.naturalHeight) * logoH : 40;
      pdf.addImage(logoImg, 'PNG', 7, 3, logoW, logoH);

      // Centre — website & email
      pdf.setFontSize(9);
      pdf.setTextColor(241, 90, 34);
      pdf.setFont(undefined, 'bold');
      pdf.text('www.connectapod.co.nz', pageWidth / 2, 8, { align: 'center' });
      pdf.setFontSize(7);
      pdf.setTextColor(136, 136, 136);
      pdf.setFont(undefined, 'normal');
      pdf.text('hello@connectapod.co.nz · 022 396 2657', pageWidth / 2, 13, { align: 'center' });

      // Right — sheet title
      pdf.setFontSize(16);
      pdf.setTextColor(136, 136, 136);
      pdf.setFont(undefined, 'bold');
      pdf.text('Site Plan', pageWidth - 7, 13, { align: 'right' });

      // Orange divider under header
      pdf.setDrawColor(241, 90, 34);
      pdf.setLineWidth(0.6);
      pdf.line(7, 20, pageWidth - 7, 20);

      // ── Map image ───────────────────────────────────────────────────────
      const screenshotImg = new window.Image();
      screenshotImg.src = screenshot;
      await new Promise(r => { screenshotImg.onload = r; screenshotImg.onerror = r; });

      const footerH = 20;
      const imgAreaTop = 22;
      const imgAreaBottom = pageHeight - footerH - 2;
      const imgAreaW = pageWidth - 14;
      const imgAreaH = imgAreaBottom - imgAreaTop;

      const scale = Math.min(imgAreaW / (screenshotImg.naturalWidth || 800), imgAreaH / (screenshotImg.naturalHeight || 600));
      const drawW = (screenshotImg.naturalWidth || 800) * scale;
      const drawH = (screenshotImg.naturalHeight || 600) * scale;
      const imgX = (pageWidth - drawW) / 2;
      pdf.addImage(screenshot, 'PNG', imgX, imgAreaTop, drawW, drawH);

      // ── Footer title block ───────────────────────────────────────────────
      const ftY = pageHeight - footerH;
      pdf.setDrawColor(241, 90, 34);
      pdf.setLineWidth(1.2);
      pdf.line(7, ftY, pageWidth - 7, ftY);

      const cols = [
        { label: 'Project', value: printDetails.projectName || '—', x: 7, w: 70 },
        { label: 'Client', value: printDetails.clientName || '—', x: 77, w: 70 },
        { label: 'Site Address', value: siteAddress || printDetails.address || '—', x: 147, w: 80 },
        { label: 'Date', value: new Date().toLocaleDateString('en-NZ'), x: 227, w: 35 },
        { label: 'Page', value: '1 / 1', x: 262, w: 28 },
      ];

      cols.forEach((col, i) => {
        // Vertical divider (skip first)
        if (i > 0) {
          pdf.setDrawColor(241, 90, 34);
          pdf.setLineWidth(0.3);
          pdf.line(col.x - 1, ftY, col.x - 1, pageHeight - 2);
        }
        // Label
        pdf.setFontSize(6);
        pdf.setTextColor(241, 90, 34);
        pdf.setFont(undefined, 'bold');
        pdf.text(col.label.toUpperCase(), col.x + 2, ftY + 5);
        // Value
        pdf.setFontSize(8);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'normal');
        pdf.text(String(col.value), col.x + 2, ftY + 11, { maxWidth: col.w - 4 });
      });

      // Copyright
      pdf.setFontSize(6);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(`© ${new Date().getFullYear()} Connectapod Ltd.`, pageWidth - 9, pageHeight - 3, { align: 'right' });

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
            {screenshot ? "PDF will include title block matching your elevations sheets." : "Visit the Site Map tab first to capture the view."}
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