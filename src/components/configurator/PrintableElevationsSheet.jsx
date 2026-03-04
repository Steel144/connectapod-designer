import React from "react";

export default function PrintableElevationsSheet({ walls }) {
  const elevations = walls.filter(w => w.elevationImage);

  React.useEffect(() => {
    window.print();
  }, []);

  const groupedByFace = {
    W: elevations.filter(w => w.face === "W").sort((a, b) => a.x - b.x),
    Y: elevations.filter(w => w.face === "Y").sort((a, b) => a.x - b.x),
    Z: elevations.filter(w => w.face === "Z"),
    X: elevations.filter(w => w.face === "X"),
  };

  const faceLabels = {
    W: "Front Face (Outside / Top)",
    Y: "Back Face (Outside / Bottom)",
    Z: "Left End (Left Side)",
    X: "Right End (Right Side)",
  };

  return (
    <div className="p-12 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Elevations</h1>
      <p className="text-sm text-gray-500 mb-8">connectapod Design - Wall Elevations</p>

      {Object.entries(groupedByFace).map(([face, walls]) => {
        if (walls.length === 0) return null;

        return (
          <div key={face} className="mb-12 page-break">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-900">
              {faceLabels[face]}
            </h2>

            <div className="space-y-6">
              {walls.map((wall) => (
                <div key={wall.id} className="border border-gray-300 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                    <div>
                      <h3 className="font-bold text-gray-900">{wall.label || wall.type}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Code: {wall.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Face</p>
                      <p className="inline-block bg-[#F15A22] text-white text-xs font-bold px-2 py-1 rounded">
                        {wall.face || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Elevation Image */}
                  {wall.elevationImage && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={wall.elevationImage}
                        alt={wall.label}
                        className="max-h-64 object-contain bg-gray-50 border border-gray-200 p-2"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500">Orientation</p>
                      <p className="font-semibold text-gray-900">{wall.orientation}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Length</p>
                      <p className="font-semibold text-gray-900">{wall.length}m</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Thickness</p>
                      <p className="font-semibold text-gray-900">{wall.thickness || "N/A"}mm</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="border-t-2 border-gray-900 pt-8 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Walls</p>
            <p className="text-2xl font-bold text-gray-900">{elevations.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Length</p>
            <p className="text-2xl font-bold text-gray-900">{elevations.reduce((sum, w) => sum + (w.length || 0), 0)}m</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}