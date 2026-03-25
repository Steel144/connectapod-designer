import React from "react";

const CELL_SIZE = 40; // pixels per grid cell in print

export default function PrintablePlansSheet({ placedModules, furniture = [], onClose, printDetails = {} }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onClose]);

  const modules = placedModules || [];
  const totalSqm = modules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const totalPrice = modules.reduce((sum, m) => sum + (m.price || 0), 0);

  // Calculate grid bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  modules.forEach(m => {
    minX = Math.min(minX, m.x);
    maxX = Math.max(maxX, m.x + m.w);
    minY = Math.min(minY, m.y);
    maxY = Math.max(maxY, m.y + m.h);
  });
  furniture.forEach(f => {
    minX = Math.min(minX, f.x);
    maxX = Math.max(maxX, f.x + (f.width || 1.4) / 0.6);
    minY = Math.min(minY, f.y);
    maxY = Math.max(maxY, f.y + (f.depth || 2.0) / 0.6);
  });

  if (modules.length === 0 && furniture.length === 0) {
    minX = 0; maxX = 10; minY = 0; maxY = 10;
  }

  const gridWidth = Math.max(maxX - minX, 0) + 2;
  const gridHeight = Math.max(maxY - minY, 0) + 2;
  const canvasWidth = gridWidth * CELL_SIZE;
  const canvasHeight = gridHeight * CELL_SIZE;

  return (
    <div className="bg-white relative" style={{ overflow: "hidden" }}>
      <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
        <button
          onClick={() => { setTimeout(() => window.print(), 300); }}
          className="bg-[#F15A22] text-white px-4 py-2 rounded text-sm font-bold"
        >
          Print Again
        </button>
        <button
          onClick={() => onClose?.()}
          className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold"
        >
          ← Back to Design
        </button>
      </div>
      <div className="bg-white flex flex-col p-0 relative" style={{ height: "calc(210mm - 14mm)", overflow: "hidden", boxSizing: "border-box" }}>

         {/* Header with logo */}
           <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b" style={{ borderColor: "#F15A22" }}>
             <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/201470147_ConnectapodArchLogo-01.png" alt="connectapod" style={{ height: "72px", width: "auto" }} />
             <div style={{ textAlign: "center" }}>
               <div style={{ color: "#F15A22", fontSize: "14px", fontWeight: "600" }}>www.connectapod.co.nz</div>
               <div style={{ color: "#888", fontSize: "12px" }}>hello@connectapod.com · 022 396 2657</div>
             </div>
             <span style={{ color: "#888", fontSize: "20pt", fontWeight: "700" }}>Floor Plan</span>
           </div>

         {/* Main content */}
         <div className="flex-1 flex flex-col p-6" style={{ minHeight: 0 }}>
           {/* Grid view */}
           <div className="flex-1 flex items-center justify-center overflow-hidden mb-4" style={{ minHeight: 0 }}>
            <svg
              width={canvasWidth}
              height={canvasHeight}
              style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={canvasWidth} height={canvasHeight} fill="white" />
              <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

              {/* Modules */}
              {modules.map((mod) => {
                const x = (mod.x - minX + 1) * CELL_SIZE;
                const y = (mod.y - minY + 1) * CELL_SIZE;
                const w = mod.w * CELL_SIZE;
                const h = mod.h * CELL_SIZE;

                return (
                  <g key={mod.id}>
                    {/* Module background */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="white"
                      stroke="#111"
                      strokeWidth="2"
                    />

                    {/* Floor plan image if available */}
                    {mod.floorPlanImage && (
                      <image
                        x={x + 4}
                        y={y + 4}
                        width={w - 8}
                        height={h - 24}
                        href={mod.floorPlanImage}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}

                    {/* Grid lines inside */}
                    {[...Array(mod.w)].map((_, i) => (
                      <line
                        key={`v-${i}`}
                        x1={x + (i + 1) * CELL_SIZE}
                        y1={y}
                        x2={x + (i + 1) * CELL_SIZE}
                        y2={y + h}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                        opacity="0.5"
                      />
                    ))}
                    {[...Array(mod.h)].map((_, i) => (
                      <line
                        key={`h-${i}`}
                        x1={x}
                        y1={y + (i + 1) * CELL_SIZE}
                        x2={x + w}
                        y2={y + (i + 1) * CELL_SIZE}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                        opacity="0.5"
                      />
                    ))}

                    {/* Module label */}
                    <rect
                      x={x}
                      y={y + h - 20}
                      width={w}
                      height={20}
                      fill="white"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x={x + w / 2}
                      y={y + h - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#111"
                    >
                      {mod.label || mod.type} • {mod.type}
                    </text>
                  </g>
                );
              })}

              {/* Furniture */}
              {furniture.map((f) => {
                const fWidth = (f.width || 1.4) * CELL_SIZE;
                const fDepth = (f.depth || 2.0) * CELL_SIZE;
                const fx = (f.x - minX + 1) * CELL_SIZE;
                const fy = (f.y - minY + 1) * CELL_SIZE;
                const rotation = f.rotation || 0;

                return (
                  <g key={f.id} transform={`translate(${fx + fWidth / 2}, ${fy + fDepth / 2}) rotate(${rotation}) translate(${-fWidth / 2}, ${-fDepth / 2})`}>
                    <rect
                      x={0}
                      y={0}
                      width={fWidth}
                      height={fDepth}
                      fill={f.image ? "white" : "#FFB3A8"}
                      stroke="#E8725B"
                      strokeWidth="1.5"
                    />
                    {f.image && (
                      <image
                        x={2}
                        y={2}
                        width={fWidth - 4}
                        height={fDepth - 4}
                        href={f.image}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                    {!f.image && (
                      <text
                        x={fWidth / 2}
                        y={fDepth / 2 + 3}
                        textAnchor="middle"
                        fontSize="7"
                        fontWeight="bold"
                        fill="#666"
                      >
                        {f.label || f.type}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          </div>

          {/* Title block footer */}
          <div className="shrink-0">
            <div className="border-t-4 grid" style={{ borderColor: "#F15A22", gridTemplateColumns: "2fr 2fr 1.5fr 1fr", fontSize: "9px", lineHeight: "1.3" }}>
              <div className="border-r p-2" style={{ borderColor: "#F15A22" }}>
                <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Project</p>
                <p className="mt-0.5 text-gray-800 font-semibold" style={{ fontSize: "13.5px" }}>{printDetails.projectName || "—"}</p>

              </div>
              <div className="border-r p-2" style={{ borderColor: "#F15A22" }}>
                <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Client</p>
                <p className="mt-0.5 text-gray-700">{printDetails.clientName || "—"}</p>
                {printDetails.address && <p className="text-gray-500">{printDetails.address}</p>}
                {(printDetails.email || printDetails.phone) && (
                  <p className="text-gray-400">{[printDetails.email, printDetails.phone].filter(Boolean).join(" · ")}</p>
                )}
              </div>
              <div className="border-r p-2" style={{ borderColor: "#F15A22" }}>
                <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Date</p>
                <p className="mt-0.5 text-gray-600">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="p-2">
                <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Scale</p>
                <p className="mt-0.5 text-gray-600">1:100</p>
                <p className="mt-1" style={{ fontSize: "9px", color: "#000", fontWeight: "600" }}>© {new Date().getFullYear()} Connectapod Ltd.</p>
              </div>
            </div>
          </div>
      </div>



      <style>{`
         @page { margin: 7mm; size: A4 landscape; }
         @media print {
           html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
           * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
         }
       `}</style>
    </div>
  );
}