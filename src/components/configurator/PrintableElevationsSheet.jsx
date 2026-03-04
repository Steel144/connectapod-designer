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

  // Group by face with dynamic position-based inference
  const horizontal = elevations.filter(w => w.orientation === "horizontal" || w.face === "W" || w.face === "Y");
  const vertical = elevations.filter(w => w.orientation === "vertical" || w.face === "Z" || w.face === "X");

  // Calculate midpoint for horizontal walls to split W (top) from Y (bottom)
  const ys = horizontal.map(w => w.y).filter(y => y !== undefined);
  const midY = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;

  // Calculate midpoint for vertical walls to split Z (left) from X (right)
  const xs = vertical.map(w => w.x).filter(x => x !== undefined);
  const midX = xs.length > 0 ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;

  const getFace = (w) => {
    if (w.face) return w.face;
    if (w.orientation === "vertical") return w.x <= midX ? "Z" : "X";
    return w.y <= midY ? "W" : "Y";
  };

  const groupedByFace = {
    W: horizontal.filter(w => getFace(w) === "W").sort((a, b) => a.x - b.x),
    Y: horizontal.filter(w => getFace(w) === "Y").sort((a, b) => a.x - b.x),
    Z: vertical.filter(w => getFace(w) === "Z"),
    X: vertical.filter(w => getFace(w) === "X"),
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
      {/* Logo */}
      <div className="fixed top-4 right-20 z-40 print:absolute print:top-4 print:right-4 print:fixed:none">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a55c0c222e61cb3fbc417c/ca3b9f322_ConnectapodArchLogo.pdf" 
          alt="Connectapod Logo" 
          style={{ height: "60px", width: "auto" }}
        />
      </div>
      {Object.entries(groupedByFace).map(([face, walls]) => {
        if (walls.length === 0) return null;

        return (
          <div key={face} className="bg-white flex flex-col p-0" style={{ pageBreakAfter: "always", minHeight: "100vh" }}>
            {/* Main content */}
            <div className="flex-1 flex flex-col p-8">
              {/* Title */}
              <div className="text-center mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Elevation Drawing</p>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{faceLabels[face]}</h1>
              </div>

              {/* Elevations grid */}
              <div className="flex-1 flex items-center justify-center overflow-x-auto">
                {(face === "W" || face === "Y") ? (
                  // Horizontal elevations layout
                  <div className="flex items-end gap-0">
                    {walls.map((wall, idx) => (
                      <div key={wall.id} className="flex flex-col items-center gap-2 shrink-0" style={{ marginLeft: idx > 0 ? "-1px" : 0 }}>
                        <div className="bg-white flex items-center justify-center" style={{ height: "280px", width: "150px" }}>
                          {wall.elevationImage && (
                            <img src={wall.elevationImage} alt={wall.label} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-900 text-center whitespace-nowrap">{wall.label || wall.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Vertical end elevations (Z and X) - displayed separately
                  <div className="flex flex-col gap-8">
                    {walls.map(wall => (
                      <div key={wall.id} className="flex flex-col items-center gap-2">
                        <div className="bg-white flex items-center justify-center" style={{ maxHeight: "175px", maxWidth: "300px" }}>
                          {wall.elevationImage && (
                            <img src={wall.elevationImage} alt={wall.label} className="h-auto w-auto max-h-full max-w-full object-contain" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-900 text-center">{wall.label || wall.type}</p>
                      </div>
                    ))}
                  </div>
                )}
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
        @page { margin: 0; size: A4 landscape; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}