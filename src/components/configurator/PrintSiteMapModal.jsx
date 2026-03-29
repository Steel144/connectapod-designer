import React, { useRef, useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const CANVAS_PX_PER_CELL = 20;
const CELL_M = 0.6;

export default function PrintSiteMapModal({ onClose, placedModules, walls, siteAddress, coordinates, mapZoom, overlayRotation, planScaleMultiplier, positionOffset }) {
  const previewRef = useRef(null);
  const [floorPlanOverlay, setFloorPlanOverlay] = useState(null);
  const [generating, setGenerating] = useState(false);

  const lat = coordinates ? coordinates[0] + (positionOffset?.lat || 0) : null;
  const lng = coordinates ? coordinates[1] + (positionOffset?.lng || 0) : null;
  const zoom = coordinates ? Math.min(mapZoom || 19, 19) : null;

  // OSM embed — shows satellite-style via standard mapnik
  const mapEmbedUrl = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.002},${lat - 0.001},${lng + 0.002},${lat + 0.001}&layer=mapnik&marker=${lat},${lng}`
    : null;

  // Compute floor plan overlay from modules + walls
  useEffect(() => {
    if (!placedModules || placedModules.length === 0) return;

    let minX = Math.min(...placedModules.map(m => m.x));
    let maxX = Math.max(...placedModules.map(m => m.x + m.w));
    let minY = Math.min(...placedModules.map(m => m.y));
    let maxY = Math.max(...placedModules.map(m => m.y + m.h));

    if (walls && walls.length > 0) {
      walls.forEach(wall => {
        if (wall.x !== undefined && wall.y !== undefined) {
          minX = Math.min(minX, wall.x);
          minY = Math.min(minY, wall.y);
          if (wall.orientation === 'horizontal') {
            maxX = Math.max(maxX, wall.x + (wall.length || wall.width / 1000 || 1));
            maxY = Math.max(maxY, wall.y + (wall.thickness || 0.15));
          } else {
            maxX = Math.max(maxX, wall.x + (wall.thickness || 0.15));
            maxY = Math.max(maxY, wall.y + (wall.length || wall.height / 1000 || 1));
          }
        }
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = (maxX - minX) * CANVAS_PX_PER_CELL;
    canvas.height = (maxY - minY) * CANVAS_PX_PER_CELL;
    const ctx = canvas.getContext('2d');

    const loadImg = (src) => new Promise((resolve) => {
      if (!src) { resolve(null); return; }
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    Promise.all(placedModules.map(m => loadImg(m.floorPlanImage).then(img => ({ mod: m, img })))).then((results) => {
      results.forEach(({ mod, img }) => {
        const x = (mod.x - minX) * CANVAS_PX_PER_CELL;
        const y = (mod.y - minY) * CANVAS_PX_PER_CELL;
        const w = mod.w * CANVAS_PX_PER_CELL;
        const h = mod.h * CANVAS_PX_PER_CELL;

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        if (mod.rotation) ctx.rotate((mod.rotation * Math.PI) / 180);
        if (mod.flipped) ctx.scale(-1, 1);
        ctx.translate(-w / 2, -h / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        if (img) ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
      });

      // Draw walls
      if (walls && walls.length > 0) {
        walls.forEach(wall => {
          if (wall.x !== undefined && wall.y !== undefined) {
            const wx = (wall.x - minX) * CANVAS_PX_PER_CELL;
            const wy = (wall.y - minY) * CANVAS_PX_PER_CELL;
            let ww, wh;
            if (wall.orientation === 'horizontal') {
              ww = (wall.length || wall.width / 1000 || 1) * CANVAS_PX_PER_CELL;
              wh = (wall.thickness || 0.15) * CANVAS_PX_PER_CELL;
            } else {
              ww = (wall.thickness || 0.15) * CANVAS_PX_PER_CELL;
              wh = (wall.length || wall.height / 1000 || 1) * CANVAS_PX_PER_CELL;
            }
            ctx.fillStyle = '#A0A0A0';
            ctx.fillRect(wx, wy, ww, wh);
          }
        });
      }

      setFloorPlanOverlay(canvas.toDataURL());
    });
  }, [placedModules, walls]);

  // Compute the CSS scale for the floor plan overlay to match map zoom
  const getFloorPlanScale = () => {
    if (!coordinates || !mapZoom) return 1;
    const METRES_PER_PX_AT_ZOOM0 = 78271.52;
    const latRad = coordinates[0] * Math.PI / 180;
    const metresToPx = Math.pow(2, mapZoom) / (METRES_PER_PX_AT_ZOOM0 * Math.cos(latRad));
    const canvasPxPerMetre = CANVAS_PX_PER_CELL / CELL_M;
    return (metresToPx / canvasPxPerMetre) * (planScaleMultiplier || 1);
  };

  const floorPlanDims = (() => {
    if (!placedModules || placedModules.length === 0) return null;
    let minX = Math.min(...placedModules.map(m => m.x));
    let maxX = Math.max(...placedModules.map(m => m.x + m.w));
    let minY = Math.min(...placedModules.map(m => m.y));
    let maxY = Math.max(...placedModules.map(m => m.y + m.h));
    return { w: (maxX - minX) * CANVAS_PX_PER_CELL, h: (maxY - minY) * CANVAS_PX_PER_CELL };
  })();

  const handleDownloadPDF = async () => {
    if (!floorPlanOverlay) return;
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(241, 90, 34);
      pdf.rect(0, 0, pageWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('SITE PLAN', 14, 12);
      if (siteAddress) {
        pdf.setFontSize(9);
        pdf.text(siteAddress, pageWidth - 14, 12, { align: 'right' });
      }

      // Floor plan image centred below header
      const imgMaxW = pageWidth - 28;
      const imgMaxH = pageHeight - 30;
      const scale = Math.min(imgMaxW / floorPlanDims.w, imgMaxH / floorPlanDims.h);
      const imgW = floorPlanDims.w * scale;
      const imgH = floorPlanDims.h * scale;
      const imgX = (pageWidth - imgW) / 2;
      pdf.addImage(floorPlanOverlay, 'PNG', imgX, 22, imgW, imgH);

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Preview area — mirrors the SiteMap tab */}
        <div className="flex-1 relative overflow-hidden bg-gray-800" ref={previewRef}>
          {coordinates ? (
            <>
              {/* Satellite map rotated just like the live view */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(2) rotate(${overlayRotation || 0}deg)`,
                  transformOrigin: 'center',
                }}
              >
                {mapEmbedUrl && (
                  <iframe
                    src={mapEmbedUrl}
                    title="Site Map"
                    className="w-full h-full border-none"
                    loading="eager"
                  />
                )}
              </div>

              {/* Floor plan overlay centred, scaled to match zoom */}
              {floorPlanOverlay && floorPlanDims && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                  <img
                    src={floorPlanOverlay}
                    alt="Floor Plan"
                    style={{
                      width: `${floorPlanDims.w}px`,
                      height: `${floorPlanDims.h}px`,
                      transform: `scale(${getFloorPlanScale()})`,
                      transformOrigin: 'center',
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>No site address set — go to the Site Map tab to set a location</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-400">The preview mirrors the current Site Map tab view</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generating || !floorPlanOverlay}
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