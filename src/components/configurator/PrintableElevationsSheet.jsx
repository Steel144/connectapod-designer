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
    }, 500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const groupedByFace = {
    W: elevations.filter(w => w.face === "W").sort((a, b) => a.x - b.x),
    Y: elevations.filter(w => w.face === "Y").sort((a, b) => a.x - b.x),
    Z: elevations.filter(w => w.face === "Z"),
    X: elevations.filter(w => w.face === "X"),
  };

  const faceLabels = {
    W: "Front Elevation (Face W)",
    Y: "Rear Elevation (Face Y)",
    Z: "Left End Elevation (Face Z)",
    X: "Right End Elevation (Face X)",
  };

  return (
    <div className="bg-white">
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
              <div className="flex-1 flex flex-col gap-8 justify-center">
                {walls.map((wall, idx) => (
                  <div key={wall.id} className="flex gap-8 items-start">
                    {/* Image */}
                    <div className="flex-1 border-2 border-gray-900 bg-white aspect-video flex items-center justify-center">
                      {wall.elevationImage && (
                        <img
                          src={wall.elevationImage}
                          alt={wall.label}
                          className="w-full h-full object-contain p-6"
                        />
                      )}
                    </div>

                    {/* Specifications */}
                    <div className="w-48">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">{wall.label || wall.type}</h3>
                      
                      <div className="space-y-4 text-xs border-l-2 border-gray-900 pl-4">
                        <div>
                          <p className="uppercase text-gray-500 text-[10px] font-bold tracking-widest">Code</p>
                          <p className="text-gray-900 font-mono font-bold text-sm">{wall.type}</p>
                        </div>
                        
                        <div>
                          <p className="uppercase text-gray-500 text-[10px] font-bold tracking-widest">Length</p>
                          <p className="text-gray-900 font-bold">{wall.length}m</p>
                        </div>

                        <div>
                          <p className="uppercase text-gray-500 text-[10px] font-bold tracking-widest">Orientation</p>
                          <p className="text-gray-900 capitalize font-bold">{wall.orientation}</p>
                        </div>

                        {wall.thickness && (
                          <div>
                            <p className="uppercase text-gray-500 text-[10px] font-bold tracking-widest">Thickness</p>
                            <p className="text-gray-900 font-bold">{wall.thickness}mm</p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-300">
                          <p className="uppercase text-gray-500 text-[10px] font-bold tracking-widest mb-1">Face</p>
                          <div className="bg-[#F15A22] text-white text-xs font-bold px-2 py-1 rounded text-center inline-block">
                            {wall.face || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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