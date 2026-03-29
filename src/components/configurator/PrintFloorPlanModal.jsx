import React, { useRef, useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const LOGO_URL = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/201470147_ConnectapodArchLogo-01.png";
const CELL_M = 0.6;
const PX_PER_M = 100;

export default function PrintFloorPlanModal({ placedModules = [], furniture = [], walls = [], onClose, printDetails = {}, showFurniture = true, showPhotoImages = true }) {
  const svgRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const scale = 1.2;
  const CELL_SIZE = scale * CELL_M * PX_PER_M;

  // Calculate bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  placedModules.forEach(m => {
    minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x + m.w);
    minY = Math.min(minY, m.y); maxY = Math.max(maxY, m.y + m.h);
  });
  furniture.forEach(f => {
    const fw = (f.width || 1.4) / CELL_M; const fd = (f.depth || 2.0) / CELL_M;
    minX = Math.min(minX, f.x - fw / 2); maxX = Math.max(maxX, f.x + fw / 2);
    minY = Math.min(minY, f.y - fd / 2); maxY = Math.max(maxY, f.y + fd / 2);
  });
  walls.forEach(w => {
    minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x + (w.orientation === "horizontal" ? w.length : w.thickness));
    minY = Math.min(minY, w.y); maxY = Math.max(maxY, w.y + (w.orientation === "vertical" ? w.length : w.thickness));
  });
  if (placedModules.length === 0 && furniture.length === 0) { minX = 0; maxX = 10; minY = 0; maxY = 10; }

  const gridWidth = Math.max(maxX - minX, 0) + 2;
  const gridHeight = Math.max(maxY - minY, 0) + 2;
  const canvasWidth = gridWidth * CELL_SIZE;
  const canvasHeight = gridHeight * CELL_SIZE;

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const svg = svgRef.current;
      if (!svg) throw new Error('SVG not found');
      
      const canvas = await html2canvas(svg, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const floorPlanData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const headerH = 18;
      const footerH = 18;
      const imgAreaTop = headerH;
      const imgAreaBottom = pageHeight - footerH;
      const imgAreaH = imgAreaBottom - imgAreaTop;
      const imgAreaW = pageWidth - 14;

      // Scale and position floor plan image
      const scale = Math.min(imgAreaW / canvasWidth, imgAreaH / canvasHeight);
      const imgW = canvasWidth * scale;
      const imgH = canvasHeight * scale;
      const imgX = (pageWidth - imgW) / 2;
      const imgY = imgAreaTop + (imgAreaH - imgH) / 2;

      pdf.addImage(floorPlanData, 'PNG', imgX, imgY, imgW, imgH);

      // Footer
      const ftY = pageHeight - footerH;
      pdf.setDrawColor(241, 90, 34); pdf.setLineWidth(1.2);
      pdf.line(7, ftY, pageWidth - 7, ftY);

      const clientInfo = [printDetails.clientName, printDetails.email, printDetails.phone].filter(Boolean).join(' · ');
      const cols = [
        { label: 'Project', value: printDetails.projectName || '—', x: 7, w: 70 },
        { label: 'Client', value: clientInfo || '—', x: 77, w: 70 },
        { label: 'Address', value: printDetails.address || '—', x: 147, w: 80 },
        { label: 'Date', value: new Date().toLocaleDateString('en-NZ'), x: 227, w: 35 },
        { label: 'Scale', value: '1:100', x: 262, w: 28 },
      ];

      cols.forEach((col, i) => {
        if (i > 0) { pdf.setDrawColor(241, 90, 34); pdf.setLineWidth(0.3); pdf.line(col.x - 1, ftY, col.x - 1, pageHeight - 2); }
        pdf.setFontSize(6); pdf.setTextColor(241, 90, 34); pdf.setFont(undefined, 'bold');
        pdf.text(col.label.toUpperCase(), col.x + 2, ftY + 5);
        pdf.setFontSize(7); pdf.setTextColor(51, 51, 51); pdf.setFont(undefined, 'normal');
        pdf.text(String(col.value), col.x + 2, ftY + 11, { maxWidth: col.w - 4 });
      });

      pdf.setFontSize(6); pdf.setTextColor(0, 0, 0); pdf.setFont(undefined, 'bold');
      pdf.text(`© ${new Date().getFullYear()} Connectapod Ltd.`, pageWidth - 9, pageHeight - 3, { align: 'right' });

      pdf.save('floor-plan.pdf');
      setGenerating(false);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF: ' + (error?.message || 'Unknown error'));
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl flex flex-col relative" style={{ width: '90vw', height: '90vh', maxWidth: '1400px' }}>

        {/* Close */}
        <div className="absolute top-3 right-3 z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow"><X size={18} /></button>
        </div>

        {/* A3 landscape preview */}
        <div className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-6">
          <div data-pdf-preview className="bg-white shadow-xl flex flex-col" style={{ width: '100%', maxWidth: '960px', aspectRatio: '420/297' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px', borderBottom: '2px solid #F15A22', flexShrink: 0 }}>
              <img src={LOGO_URL} alt="Connectapod" style={{ height: '40px', width: 'auto' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#F15A22', fontSize: '9px', fontWeight: '600' }}>www.connectapod.co.nz</div>
                <div style={{ color: '#888', fontSize: '8px' }}>hello@connectapod.co.nz · 022 396 2657</div>
              </div>
              <span style={{ color: '#888', fontSize: '14px', fontWeight: '700' }}>Floor Plan</span>
            </div>

            {/* SVG floor plan */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
              <svg
                ref={svgRef}
                width={canvasWidth}
                height={canvasHeight}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <pattern id="pgrid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
                    <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width={canvasWidth} height={canvasHeight} fill="white" />
                <rect width={canvasWidth} height={canvasHeight} fill="url(#pgrid)" />

                {placedModules.map((mod) => {
                  const x = (mod.x - minX + 1) * CELL_SIZE;
                  const y = (mod.y - minY + 1) * CELL_SIZE;
                  const w = mod.w * CELL_SIZE;
                  const h = mod.h * CELL_SIZE;
                  const rotation = mod.rotation || 0;
                  const t = [`translate(${x + w / 2}, ${y + h / 2})`, `rotate(${rotation})`, mod.flipped ? 'scale(-1, 1)' : '', `translate(${-w / 2}, ${-h / 2})`].filter(Boolean).join(' ');
                  return (
                    <g key={mod.id}>
                      <g transform={t}>
                        <rect x={0} y={0} width={w} height={h} fill="white" stroke="#111" strokeWidth="2" />
                        {showPhotoImages && mod.floorPlanImage && (
                          <image x={0} y={0} width={w} height={h} href={mod.floorPlanImage} preserveAspectRatio="xMidYMid meet" />
                        )}
                      </g>
                      <g transform={t}>
                        {[...Array(mod.w)].map((_, i) => <line key={`v${i}`} x1={(i + 1) * CELL_SIZE} y1={0} x2={(i + 1) * CELL_SIZE} y2={h} stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5" />)}
                        {[...Array(mod.h)].map((_, i) => <line key={`h${i}`} x1={0} y1={(i + 1) * CELL_SIZE} x2={w} y2={(i + 1) * CELL_SIZE} stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5" />)}
                      </g>
                    </g>
                  );
                })}

                {walls.map((wall) => {
                  const wallW = wall.orientation === "horizontal" ? wall.length * CELL_SIZE : wall.thickness * CELL_SIZE;
                  const wallH = wall.orientation === "vertical" ? wall.length * CELL_SIZE : wall.thickness * CELL_SIZE;
                  const wx = (wall.x - minX + 1) * CELL_SIZE;
                  const wy = (wall.y - minY + 1) * CELL_SIZE;
                  return (
                    <g key={wall.id}>
                      <rect x={wx} y={wy} width={wallW} height={wallH} fill="#4B5563" stroke="#2d3748" strokeWidth="1" />
                      {wall.elevationImage && <image x={wx + 2} y={wy + 2} width={wallW - 4} height={wallH - 4} href={wall.elevationImage} preserveAspectRatio="xMidYMid slice" />}
                    </g>
                  );
                })}

                {showFurniture && furniture.map((f) => {
                  const fw = ((f.width || 1.4) / CELL_M) * CELL_SIZE;
                  const fd = ((f.depth || 2.0) / CELL_M) * CELL_SIZE;
                  const fx = (f.x - minX + 1) * CELL_SIZE;
                  const fy = (f.y - minY + 1) * CELL_SIZE;
                  const t = [`translate(${fx + fw / 2}, ${fy + fd / 2})`, `rotate(${f.rotation || 0})`, f.flipped ? 'scale(-1, 1)' : '', `translate(${-fw / 2}, ${-fd / 2})`].filter(Boolean).join(' ');
                  return (
                    <g key={f.id} transform={t}>
                      <rect x={0} y={0} width={fw} height={fd} fill={f.image ? "white" : "#FFB3A8"} />
                      {f.image ? <image x={0} y={0} width={fw} height={fd} href={f.image} preserveAspectRatio="xMidYMid meet" /> : (
                        <text x={fw / 2} y={fd / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#666">{f.label || f.type}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Footer title block */}
            <div style={{ flexShrink: 0, borderTop: '3px solid #F15A22', display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr 1.5fr 1fr', fontSize: '8px' }}>
              <div style={{ borderRight: '1px solid #F15A22', padding: '4px 10px' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#F15A22', fontSize: '6px' }}>Project</p>
                <p style={{ marginTop: '1px', color: '#333', fontSize: '8px', fontWeight: '600' }}>{printDetails.projectName || '—'}</p>
              </div>
              <div style={{ borderRight: '1px solid #F15A22', padding: '4px 10px' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#F15A22', fontSize: '6px' }}>Client</p>
                <p style={{ marginTop: '1px', color: '#333', fontSize: '8px' }}>{printDetails.clientName || '—'}</p>
                {(printDetails.email || printDetails.phone) && (
                  <p style={{ marginTop: '1px', color: '#666', fontSize: '7px' }}>{[printDetails.email, printDetails.phone].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <div style={{ borderRight: '1px solid #F15A22', padding: '4px 10px' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#F15A22', fontSize: '6px' }}>Address</p>
                <p style={{ marginTop: '1px', color: '#333', fontSize: '8px' }}>{printDetails.address || '—'}</p>
              </div>
              <div style={{ borderRight: '1px solid #F15A22', padding: '4px 10px' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#F15A22', fontSize: '6px' }}>Date</p>
                <p style={{ marginTop: '1px', color: '#666', fontSize: '8px' }}>{new Date().toLocaleDateString('en-NZ')}</p>
              </div>
              <div style={{ padding: '4px 10px' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#F15A22', fontSize: '6px' }}>Scale</p>
                <p style={{ marginTop: '1px', color: '#666', fontSize: '8px' }}>1:100</p>
                <p style={{ marginTop: '2px', color: '#000', fontSize: '6px', fontWeight: '600' }}>© {new Date().getFullYear()} Connectapod Ltd.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-100">Cancel</button>
          <button
            onClick={handleDownloadPDF}
            disabled={generating}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white rounded hover:bg-[#d94e1a] disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}