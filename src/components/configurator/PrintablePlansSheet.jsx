import React from "react";

const CELL_SIZE = 40; // pixels per grid cell in print

export default function PrintablePlansSheet({ placedModules, onClose }) {
  React.useEffect(() => {
    window.print();
    const handleAfterPrint = () => {
      onClose?.();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
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

  if (modules.length === 0) {
    minX = 0; maxX = 10; minY = 0; maxY = 10;
  }

  const gridWidth = Math.max(maxX - minX, 0) + 2;
  const gridHeight = Math.max(maxY - minY, 0) + 2;
  const canvasWidth = gridWidth * CELL_SIZE;
  const canvasHeight = gridHeight * CELL_SIZE;

  return (
    <div className="bg-white relative">
      <button
        onClick={() => onClose?.()}
        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded text-sm font-bold print:hidden"
      >
        Close
      </button>
      <div className="bg-white flex flex-col p-0 relative" style={{ minHeight: "100vh" }}>

         {/* Header with logo */}
         <div className="flex items-center px-6 pt-4 pb-2 border-b" style={{ borderColor: "#F15A22" }}>
           <span style={{ color: "#F15A22", fontWeight: "bold", fontSize: "20pt", letterSpacing: "0.04em" }}>connectapod</span>
           <span style={{ marginLeft: "8mm", color: "#666", fontSize: "12pt" }}>Floor Plan</span>
         </div>

         {/* Main content */}
         <div className="flex-1 flex flex-col p-6">
           {/* Grid view */}
           <div className="flex-1 flex items-center justify-center overflow-hidden mb-8">
            <svg
              width={canvasWidth}
              height={canvasHeight}
              style={{ maxWidth: "100%", height: "auto" }}
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
            </svg>
          </div>

          </div>

          {/* Title block footer */}
          <div className="border-t-4 grid grid-cols-4 text-[10px]" style={{ borderColor: "#F15A22" }}>
            <div className="border-r p-4" style={{ borderColor: "#F15A22" }}>
              <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Project</p>
              <p className="mt-1 text-gray-600">connectapod Design</p>
            </div>
            <div className="border-r p-4" style={{ borderColor: "#F15A22" }}>
              <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Sheet</p>
              <p className="mt-1 text-gray-600">Floor Plan</p>
            </div>
            <div className="border-r p-4" style={{ borderColor: "#F15A22" }}>
              <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Date</p>
              <p className="mt-1 text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="p-4">
              <p className="uppercase font-bold" style={{ color: "#F15A22" }}>Scale</p>
              <p className="mt-1 text-gray-600">1:100</p>
            </div>
          </div>
      </div>



      <style>{`
        @page { margin: 0; size: A4 landscape; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}