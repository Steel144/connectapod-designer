import React, { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

const CANVAS_PX_PER_CELL = 20;
const CELL_M = 0.6;

export default function PrintSiteMapModal({ onClose, siteAddress, floorPlanImage, coordinates, mapZoom, overlayRotation, planScaleMultiplier, positionOffset }) {
  const [generating, setGenerating] = useState(false);

  const lat = coordinates ? coordinates[0] + (positionOffset?.lat || 0) : null;
  const lng = coordinates ? coordinates[1] + (positionOffset?.lng || 0) : null;

  const mapEmbedUrl = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.002},${lat - 0.001},${lng + 0.002},${lat + 0.001}&layer=mapnik&marker=${lat},${lng}`
    : null;

  // Compute pixel scale to match the live site map view
  const getFloorPlanScale = () => {
    if (!coordinates || !mapZoom) return 1;
    const METRES_PER_PX_AT_ZOOM0 = 78271.52;
    const latRad = coordinates[0] * Math.PI / 180;
    const metresToPx = Math.pow(2, mapZoom) / (METRES_PER_PX_AT_ZOOM0 * Math.cos(latRad));
    const canvasPxPerMetre = CANVAS_PX_PER_CELL / CELL_M;
    return (metresToPx / canvasPxPerMetre) * (planScaleMultiplier || 1);
  };

  const handleDownloadPDF = async () => {
    if (!floorPlanImage) return;
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.setFillColor(241, 90, 34);
      pdf.rect(0, 0, pageWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('SITE PLAN', 14, 12);
      if (siteAddress) {
        pdf.setFontSize(9);
        pdf.text(siteAddress, pageWidth - 14, 12, { align: 'right' });
      }

      // Load the floor plan image to get its natural dimensions
      const img = new window.Image();
      img.src = floorPlanImage;
      await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });

      const imgMaxW = pageWidth - 28;
      const imgMaxH = pageHeight - 30;
      const scale = Math.min(imgMaxW / (img.naturalWidth || 400), imgMaxH / (img.naturalHeight || 400));
      const imgW = (img.naturalWidth || 400) * scale;
      const imgH = (img.naturalHeight || 400) * scale;
      pdf.addImage(floorPlanImage, 'PNG', (pageWidth - imgW) / 2, 22, imgW, imgH);

      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${new Date().toLocaleString('en-NZ')}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
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

        {/* Preview — satellite map + floor plan overlay, exactly like the site map tab */}
        <div className="flex-1 relative overflow-hidden bg-gray-800">
          {coordinates && mapEmbedUrl ? (
            <>
              {/* Map layer — scaled and rotated exactly like the live view */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(2) rotate(${overlayRotation || 0}deg)`,
                  transformOrigin: 'center',
                }}
              >
                <iframe
                  src={mapEmbedUrl}
                  title="Site Map"
                  className="w-full h-full border-none"
                  loading="eager"
                />
              </div>

              {/* Floor plan overlay — the exact canvas from the site map tab */}
              {floorPlanImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                  <img
                    src={floorPlanImage}
                    alt="Floor Plan"
                    style={{
                      transform: `scale(${getFloorPlanScale()})`,
                      transformOrigin: 'center',
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>
              )}
            </>
          ) : floorPlanImage ? (
            /* No map location set — just show the floor plan */
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <img src={floorPlanImage} alt="Floor Plan" style={{ maxWidth: '90%', maxHeight: '90%', imageRendering: 'pixelated' }} />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>Go to the Site Map tab first to generate the floor plan overlay</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-400">Preview mirrors the Site Map tab. Visit Site Map tab first to position your floor plan.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generating || !floorPlanImage}
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