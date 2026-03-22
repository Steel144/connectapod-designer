import React, { useMemo } from "react";

const GRID_ROWS = 40;

const getPavilion = (wallY) => {
  if (wallY >= 9 && wallY < 13) return 3;
  if (wallY >= 19 && wallY < 20) return 2;
  if (wallY >= 26 && wallY < 30) return 1;
  return null;
};

const modTouchesBand = (mod, bandStart, bandEnd) =>
  mod.y < bandEnd && mod.y + mod.h > bandStart;

const getModulePavilion = (mod) => {
  if (modTouchesBand(mod, 9, 13)) return 3;
  if (modTouchesBand(mod, 19, 20)) return 2;
  if (modTouchesBand(mod, 26, 30)) return 1;
  return null;
};

export default function PrintableElevationsSheet({ walls = [], placedModules = [], customWalls = [], onClose }) {
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

  const getWallPavilion = (wall) => {
    if (wall.pavilionNum !== null && wall.pavilionNum !== undefined) {
      return wall.pavilionNum;
    }
    const THRESHOLD = 1.0;
    const snappedMod = placedModules.find(mod => {
      if (wall.face === "Y") return Math.abs(wall.y - (mod.y + mod.h)) < THRESHOLD && Math.abs(wall.x - mod.x) < THRESHOLD;
      if (wall.face === "W") return Math.abs(wall.y - (mod.y - 0.31)) < THRESHOLD && Math.abs(wall.x - mod.x) < THRESHOLD;
      if (wall.face === "Z") return Math.abs(wall.y - mod.y) < THRESHOLD && Math.abs(wall.x - mod.x) < THRESHOLD;
      if (wall.face === "X") return Math.abs(wall.y - mod.y) < THRESHOLD && Math.abs(wall.x - (mod.x + mod.w - 0.31)) < THRESHOLD;
      return false;
    });
    if (snappedMod) return getPavilion(snappedMod.y);
    return getPavilion(wall.y);
  };

  const { pavilions, hasAny } = useMemo(() => {
    const modsByPavilion = { 1: [], 2: [], 3: [] };
    placedModules.forEach(mod => {
      const pav = getModulePavilion(mod);
      if (pav && modsByPavilion[pav]) modsByPavilion[pav].push(mod);
    });

    if (!Object.values(modsByPavilion).some(a => a.length > 0)) return { pavilions: [], hasAny: false };

    const findWall = (mod, face) => {
      const WALL_OFFSET = 0.31;
      return walls.find(w => {
        if (w.face !== face) return false;
        if (face === "Y") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y + mod.h)) < 0.5;
        if (face === "W") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y - WALL_OFFSET)) < 0.5;
        if (face === "Z") return Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5;
        if (face === "X") return Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - WALL_OFFSET)) < 0.5;
        return false;
      }) || null;
    };

    const makePlaceholder = (mod, face) => ({
      id: `placeholder-${mod.id}-${face}`,
      type: null,
      face,
      elevationImage: null,
      width: mod.w * 0.6,
      length: mod.w,
      x: mod.x,
      y: mod.y,
    });

    const pavilions = [3, 2, 1].map((pavNum) => {
      const modsInPav = modsByPavilion[pavNum];
      if (modsInPav.length === 0) return null;

      const yRows = {};
      modsInPav.forEach(mod => {
        const yKey = mod.y;
        if (!yRows[yKey]) yRows[yKey] = [];
        yRows[yKey].push(mod);
      });

      const rows = [];
      Object.keys(yRows)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(yPos => {
          const modsAtY = yRows[yPos].sort((a, b) => a.x - b.x);

          const yFaceWalls = modsAtY.map(mod => findWall(mod, "Y") || makePlaceholder(mod, "Y"));
          const wFaceWalls = modsAtY.map(mod => findWall(mod, "W") || makePlaceholder(mod, "W"));

          const zWall = walls.find(w => w.face === "Z" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5)) || null;
          const xWall = walls.find(w => w.face === "X" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - 0.31)) < 0.5)) || null;

          rows.push({ type: "Y", yPos, zWall, midWalls: yFaceWalls, xWall });
          rows.push({ type: "W", yPos, zWall, midWalls: wFaceWalls, xWall });
        });

      return { pavilionNum: pavNum, rows };
    });

    return { pavilions: pavilions.filter(Boolean), hasAny: true };
  }, [walls, placedModules]);

  const getPavilionLabel = (pavNum) => {
    const labels = { 3: "Pavilion 1", 2: "Connection Module", 1: "Pavilion 2" };
    return labels[pavNum] || `Pavilion ${pavNum}`;
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
        });
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