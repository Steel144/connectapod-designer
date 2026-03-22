import React, { useEffect, useMemo } from "react";

export default function PrintableElevationGallery({ walls = [], placedModules = [], onClose }) {
  useEffect(() => {
    window.print();
    const handleAfterPrint = () => {
      onClose();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [onClose]);

  const pavilionData = useMemo(() => {
    const pavilions = { 1: {}, 2: {}, 3: {} };

    placedModules.forEach(mod => {
      let pavilion = 1;
      if (mod.x >= 3.6) pavilion = 3;
      else if (mod.x >= 1.8) pavilion = 2;

      if (!pavilions[pavilion][mod.y]) {
        pavilions[pavilion][mod.y] = [];
      }
      pavilions[pavilion][mod.y].push(mod);
    });

    return pavilions;
  }, [placedModules]);

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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Elevation Gallery</h1>
          <p className="text-gray-600 mb-2">Wall Elevations by Module</p>
          <p className="text-sm text-gray-400 mt-8">{new Date().toLocaleDateString()}</p>
        </div>

        {/* Pavilion Pages */}
        {[1, 2, 3].map(pavNum => (
          <div key={pavNum} className="page-break print-section">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Pavilion {pavNum}</h2>

            {Object.keys(pavilionData[pavNum]).length === 0 ? (
              <p className="text-gray-400">No modules in this pavilion</p>
            ) : (
              <div className="space-y-12">
                {Object.entries(pavilionData[pavNum]).map(([yPos, modules]) => (
                  <div key={yPos} className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest">Position Y: {yPos}</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {modules.map(mod => (
                        <div key={mod.id} className="border border-gray-200 rounded overflow-hidden bg-gray-50">
                          <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                            <p className="text-xs font-semibold text-gray-700">{mod.label}</p>
                            <p className="text-[10px] text-gray-500">{mod.type}</p>
                          </div>
                          <div className="p-4" style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {mod.floorPlanImage ? (
                              <img src={mod.floorPlanImage} alt={mod.label} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <div className="text-center text-gray-400">
                                <p className="text-sm">No floor plan image</p>
                              </div>
                            )}
                          </div>
                          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">{mod.sqm?.toFixed(1) || 0} m²</span>
                              <span className="font-semibold text-gray-800">${(mod.price || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Wall Details Page */}
        {walls.length > 0 && (
          <div className="page-break print-section">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Wall Details</h2>
            <div className="space-y-6">
              {walls.map(wall => (
                <div key={wall.id} className="border border-gray-200 rounded p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{wall.label || wall.type}</p>
                      <p className="text-[10px] text-gray-500">{wall.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Face: <span className="font-semibold">{wall.face || 'N/A'}</span></p>
                      <p className="text-xs text-gray-600">Position: <span className="font-semibold">({wall.x}, {wall.y})</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">${(wall.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {wall.elevationImage && (
                    <div className="bg-white border border-gray-200 rounded p-2" style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={wall.elevationImage} alt={wall.label} className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}