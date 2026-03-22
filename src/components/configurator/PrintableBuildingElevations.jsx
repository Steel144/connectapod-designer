import React, { useEffect } from "react";

export default function PrintableBuildingElevations({ walls = [], placedModules = [], onClose }) {
  useEffect(() => {
    window.print();
    const handleAfterPrint = () => {
      onClose();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [onClose]);

  const CELL_M = 0.6;
  const PX_PER_M = 100;
  const WALL_H_M = 4.2;
  const scale = 0.5; // 50% scale for printing
  const wallHPx = Math.round(scale * WALL_H_M * PX_PER_M);

  const hasConnectionModules = placedModules.some(m => m.chassis === "C" || (m.y >= 18 && m.y < 21 && m.h <= 2));
  const endElevationHPx = hasConnectionModules ? Math.round(wallHPx * 0.88) : wallHPx;

  return (
    <div className="w-full bg-white p-12">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          html { margin: 0; padding: 0; }
          .print-container { margin: 0; padding: 0; }
          .page-break { page-break-after: always; }
          .print-section { page-break-inside: avoid; }
        }
      `}</style>

      <div className="print-container">
        {/* Cover Page */}
        <div className="page-break text-center py-20">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Building Elevations</h1>
          <p className="text-gray-600 mb-2">W · Y · Z · X</p>
          <p className="text-sm text-gray-400 mt-8">{new Date().toLocaleDateString()}</p>
        </div>

        {/* Elevation Grid */}
        <div className="page-break print-section">
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">W — North Elevation</h2>
            <div className="bg-gray-50 p-6 rounded border border-gray-200" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {placedModules.length > 0 ? (
                <svg width="100%" height="400" viewBox={`0 0 800 ${wallHPx + 100}`} className="border border-gray-300">
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern)" />
                  <text x="10" y="20" className="text-xs fill-gray-400">W — North</text>
                </svg>
              ) : (
                <p className="text-gray-400">No modules placed</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">Y — South Elevation</h2>
            <div className="bg-gray-50 p-6 rounded border border-gray-200" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {placedModules.length > 0 ? (
                <svg width="100%" height="400" viewBox={`0 0 800 ${wallHPx + 100}`} className="border border-gray-300">
                  <defs>
                    <pattern id="gridPattern2" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern2)" />
                  <text x="10" y="20" className="text-xs fill-gray-400">Y — South</text>
                </svg>
              ) : (
                <p className="text-gray-400">No modules placed</p>
              )}
            </div>
          </div>
        </div>

        {/* End Elevations */}
        <div className="page-break print-section">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">Z — West Elevation</h2>
              <div className="bg-gray-50 p-6 rounded border border-gray-200" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {placedModules.length > 0 ? (
                  <svg width="100%" height="400" viewBox={`0 0 400 ${endElevationHPx + 100}`} className="border border-gray-300">
                    <defs>
                      <pattern id="gridPattern3" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridPattern3)" />
                    <text x="10" y="20" className="text-xs fill-gray-400">Z — West</text>
                  </svg>
                ) : (
                  <p className="text-gray-400">No modules placed</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">X — East Elevation</h2>
              <div className="bg-gray-50 p-6 rounded border border-gray-200" style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {placedModules.length > 0 ? (
                  <svg width="100%" height="400" viewBox={`0 0 400 ${endElevationHPx + 100}`} className="border border-gray-300">
                    <defs>
                      <pattern id="gridPattern4" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridPattern4)" />
                    <text x="10" y="20" className="text-xs fill-gray-400">X — East</text>
                  </svg>
                ) : (
                  <p className="text-gray-400">No modules placed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}