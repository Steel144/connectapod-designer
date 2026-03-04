import React from "react";

export default function PrintableElevationsSheet({ walls, onClose }) {
  const elevations = walls.filter(w => w.elevationImage);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      const handleAfterPrint = () => {
        onClose?.();
      };
      window.addEventListener("afterprint", handleAfterPrint);
      return () => window.removeEventListener("afterprint", handleAfterPrint);
    }, 1000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Group by face, treating undefined face as horizontal vs vertical
  const groupedByFace = {
    W: elevations.filter(w => w.face === "W" || (w.orientation === "horizontal" && !w.face && w.y < 5)).sort((a, b) => a.x - b.x),
    Y: elevations.filter(w => w.face === "Y" || (w.orientation === "horizontal" && !w.face && w.y >= 5)).sort((a, b) => a.x - b.x),
    Z: elevations.filter(w => w.face === "Z" || (w.orientation === "vertical" && !w.face && w.x < 5)),
    X: elevations.filter(w => w.face === "X" || (w.orientation === "vertical" && !w.face && w.x >= 5)),
  };

  const faceLabels = {
    W: "Front Elevation (Face W)",
    Y: "Rear Elevation (Face Y)",
    Z: "Left End Elevation (Face Z)",
    X: "Right End Elevation (Face X)",
  };

  return (
    <div className="bg-white relative">
      <button
        onClick={() => onClose?.()}
        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded text-sm font-bold print:hidden"
      >
        Close
      </button>
      {Object.entries(groupedByFace).map(([face, walls]) => {
        if (walls.length === 0) return null;

        return (
          <div key={face} className="h-screen flex flex-col p-0" style={{ pageBreakAfter: "always" }}>
            {/* Main content */}
            <div className="flex-1 flex flex-col p-16">
              {/* Title */}
              <div className="text-center mb-8">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Elevation Drawing</p>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">{faceLabels[face]}</h1>
              </div>

              {/* Elevations grid */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-end gap-6">
                  {/* Z (left end) - separated */}
                  {walls.find(w => w.face === "Z" || w.orientation === "vertical") && (
                    <div className="flex flex-col items-center gap-2">
                      {walls.filter(w => w.face === "Z" || (w.orientation === "vertical" && !w.face && w.x < 5)).map(wall => (
                        <div key={wall.id}>
                          <div className="border-2 border-gray-900 bg-white flex items-center justify-center" style={{ height: "300px", width: "200px" }}>
                            {wall.elevationImage && (
                              <img src={wall.elevationImage} alt={wall.label} className="h-full w-full object-contain p-2" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-900 mt-2">{wall.label || wall.type}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="w-12" />

                  {/* Middle walls - tightly joined */}
                  <div className="flex items-end">
                    {walls.filter(w => w.face === face || (w.orientation === "horizontal" && !w.face)).map((wall, idx) => (
                      <div key={wall.id} className="flex flex-col items-center gap-2">
                        <div className="border-2 border-gray-900 bg-white flex items-center justify-center" style={{ height: "300px", width: "200px", marginLeft: idx > 0 ? "-2px" : 0 }}>
                          {wall.elevationImage && (
                            <img src={wall.elevationImage} alt={wall.label} className="h-full w-full object-contain p-2" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-900 mt-2">{wall.label || wall.type}</p>
                      </div>
                    ))}
                  </div>

                  <div className="w-12" />

                  {/* X (right end) - separated */}
                  {walls.find(w => w.face === "X" || w.orientation === "vertical") && (
                    <div className="flex flex-col items-center gap-2">
                      {walls.filter(w => w.face === "X" || (w.orientation === "vertical" && !w.face && w.x >= 5)).map(wall => (
                        <div key={wall.id}>
                          <div className="border-2 border-gray-900 bg-white flex items-center justify-center" style={{ height: "300px", width: "200px" }}>
                            {wall.elevationImage && (
                              <img src={wall.elevationImage} alt={wall.label} className="h-full w-full object-contain p-2" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-900 mt-2">{wall.label || wall.type}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title block footer */}
            <div className="border-t-2 border-gray-900 grid grid-cols-4 text-[10px] text-gray-600">
              <div className="border-r border-gray-900 p-4">
                <p className="uppercase font-bold text-gray-900">Project</p>
                <p className="mt-1">connectapod Design</p>
              </div>
              <div className="border-r border-gray-900 p-4">
                <p className="uppercase font-bold text-gray-900">Elevation</p>
                <p className="mt-1">{face}</p>
              </div>
              <div className="border-r border-gray-900 p-4">
                <p className="uppercase font-bold text-gray-900">Date</p>
                <p className="mt-1">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="p-4">
                <p className="uppercase font-bold text-gray-900">Scale</p>
                <p className="mt-1">As Noted</p>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}