import React from "react";

export default function PrintableElevationsSheet({ walls, onClose }) {
  const elevations = walls;
  
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

  // Group walls by pavilion based on x-position clusters
  const clusterWallsByPavilion = () => {
    const sorted = [...elevations].sort((a, b) => a.x - b.x);
    const clusters = [];
    const threshold = 0.5; // x-distance to consider walls in same pavilion

    for (const wall of sorted) {
      let foundCluster = false;
      for (const cluster of clusters) {
        if (Math.abs(cluster[0].x - wall.x) < threshold) {
          cluster.push(wall);
          foundCluster = true;
          break;
        }
      }
      if (!foundCluster) {
        clusters.push([wall]);
      }
    }
    return clusters;
  };

  const pavilionClusters = clusterWallsByPavilion();

  // Group walls by face within each pavilion
  const groupWallsByFace = (pavilionWalls) => {
    const horizontal = pavilionWalls.filter(w => w.orientation === "horizontal" || w.face === "W" || w.face === "Y");
    const vertical = pavilionWalls.filter(w => w.orientation === "vertical" || w.face === "Z" || w.face === "X");

    const ys = horizontal.map(w => w.y).filter(y => y !== undefined);
    const midY = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;

    const xs = vertical.map(w => w.x).filter(x => x !== undefined);
    const midX = xs.length > 0 ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;

    const getFace = (w) => {
      if (w.face) return w.face;
      if (w.orientation === "vertical") return w.x <= midX ? "Z" : "X";
      return w.y <= midY ? "W" : "Y";
    };

    return {
      W: horizontal.filter(w => getFace(w) === "W").sort((a, b) => a.x - b.x),
      Y: horizontal.filter(w => getFace(w) === "Y").sort((a, b) => a.x - b.x),
      Z: vertical.filter(w => getFace(w) === "Z"),
      X: vertical.filter(w => getFace(w) === "X"),
    };
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
      {pavilionClusters.map((pavilionWalls, pavilionIdx) => {
        const groupedByFace = groupWallsByFace(pavilionWalls);
        return Object.entries(groupedByFace).map(([face, walls], faceIdx) => {
          if (walls.length === 0) return null;
          
          const isLastFace = Object.entries(groupedByFace).filter(([, w]) => w.length > 0).length === faceIdx + 1;
          const isLastPavilion = pavilionIdx === pavilionClusters.length - 1;

          return (
            <div key={`${pavilionIdx}-${face}`} className="bg-white flex flex-col p-0" style={{ pageBreakAfter: (isLastFace && isLastPavilion) ? "avoid" : "always", minHeight: "100vh" }}>
            {/* Header with logo */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b" style={{ borderColor: "#F15A22" }}>
              <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/61a42fba4_ConnectapodArchLogo-01.png" alt="connectapod" style={{ height: "40px", width: "auto" }} />
              <span style={{ color: "#666", fontSize: "12pt" }}>Elevations</span>
            </div>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col p-8">
               {/* Elevations grid */}
               <div className="flex-1 flex items-center justify-center overflow-x-auto">
                {(face === "W" || face === "Y") ? (
                  // Horizontal elevations layout
                  <div className="flex items-start gap-0">
                    {walls.map((wall, idx) => (
                      <div key={wall.id} className="flex flex-col items-center shrink-0" style={{ marginLeft: idx > 0 ? "-1px" : 0 }}>
                        <div className="bg-white flex items-center justify-center" style={{ height: "280px", width: "150px" }}>
                          {wall.elevationImage && (
                            <img src={wall.elevationImage} alt={wall.label} className="h-full w-full object-contain" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-900 text-center whitespace-nowrap mt-2">{wall.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                   // Vertical end elevations (Z and X) - displayed separately
                   <div className="flex flex-col gap-12">
                     {walls.map(wall => (
                       <div key={wall.id} className="flex flex-col items-center gap-3">
                         <div className="bg-gray-100 flex items-center justify-center border border-gray-300" style={{ maxHeight: "87px", maxWidth: "350px", minHeight: "87px", minWidth: "350px" }}>
                           {wall.elevationImage ? (
                             <img src={wall.elevationImage} alt={wall.label} className="h-auto w-auto max-h-full object-contain" />
                           ) : (
                             <p className="text-gray-400 text-xs">No image</p>
                           )}
                         </div>
                         <p className="text-xs font-bold text-gray-900 text-center whitespace-nowrap">{wall.label || wall.type}</p>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              {/* Title */}
              <div className="text-center mt-6 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Elevation Drawing</p>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{faceLabels[face]}</h1>
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
           img { max-width: 100%; height: auto; }
         }
       `}</style>
    </div>
  );
}