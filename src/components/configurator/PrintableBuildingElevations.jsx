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

  // Group walls by face
  const wallsByFace = {
    W: walls.filter(w => w.face === "W"),
    Y: walls.filter(w => w.face === "Y"),
    Z: walls.filter(w => w.face === "Z"),
    X: walls.filter(w => w.face === "X"),
  };

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
            <div className="bg-gray-50 p-6 rounded border border-gray-200 space-y-4">
              {wallsByFace.W.length === 0 ? (
                <p className="text-gray-400">No walls placed on W face</p>
              ) : (
                wallsByFace.W.map(wall => (
                  <div key={wall.id} className="border border-gray-300 rounded overflow-hidden bg-white p-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">{wall.label || wall.type}</div>
                    {wall.elevationImage ? (
                      <img src={wall.elevationImage} alt={wall.label} className="w-full h-auto max-h-64 object-contain" />
                    ) : (
                      <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">Y — South Elevation</h2>
            <div className="bg-gray-50 p-6 rounded border border-gray-200 space-y-4">
              {wallsByFace.Y.length === 0 ? (
                <p className="text-gray-400">No walls placed on Y face</p>
              ) : (
                wallsByFace.Y.map(wall => (
                  <div key={wall.id} className="border border-gray-300 rounded overflow-hidden bg-white p-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">{wall.label || wall.type}</div>
                    {wall.elevationImage ? (
                      <img src={wall.elevationImage} alt={wall.label} className="w-full h-auto max-h-64 object-contain" />
                    ) : (
                      <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* End Elevations */}
        <div className="page-break print-section">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">Z — West Elevation</h2>
              <div className="bg-gray-50 p-6 rounded border border-gray-200 space-y-4">
                {wallsByFace.Z.length === 0 ? (
                  <p className="text-gray-400">No walls placed on Z face</p>
                ) : (
                  wallsByFace.Z.map(wall => (
                    <div key={wall.id} className="border border-gray-300 rounded overflow-hidden bg-white p-2">
                      <div className="text-xs font-semibold text-gray-700 mb-2">{wall.label || wall.type}</div>
                      {wall.elevationImage ? (
                        <img src={wall.elevationImage} alt={wall.label} className="w-full h-auto max-h-40 object-contain" />
                      ) : (
                        <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-6">X — East Elevation</h2>
              <div className="bg-gray-50 p-6 rounded border border-gray-200 space-y-4">
                {wallsByFace.X.length === 0 ? (
                  <p className="text-gray-400">No walls placed on X face</p>
                ) : (
                  wallsByFace.X.map(wall => (
                    <div key={wall.id} className="border border-gray-300 rounded overflow-hidden bg-white p-2">
                      <div className="text-xs font-semibold text-gray-700 mb-2">{wall.label || wall.type}</div>
                      {wall.elevationImage ? (
                        <img src={wall.elevationImage} alt={wall.label} className="w-full h-auto max-h-40 object-contain" />
                      ) : (
                        <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}