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

  if (!hasAny) {
    return (
      <div className="bg-white p-8 text-center">
        <p className="text-gray-500">No modules in pavilion bands to display elevations.</p>
      </div>
    );
  }

  return (
    <div className="bg-white w-full">
      <button
        onClick={() => onClose?.()}
        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded text-sm font-bold print:hidden"
      >
        Close
      </button>

      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          body { margin: 0; padding: 0; }
          img { max-width: 100%; height: auto; }
          .page-break { page-break-after: always; }
        }
      `}</style>

      {pavilions.map((pav) => (
        <div key={pav.pavilionNum} className="page-break p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{getPavilionLabel(pav.pavilionNum)}</h2>

          {pav.rows.map((row, idx) => (
            <div key={`${pav.pavilionNum}-${row.yPos}-${row.type}`} className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-4">
                {row.type === "Y" ? "Face Y (Outside/Top)" : "Face W (Outside/Bottom)"}
              </h3>

              <div className="flex items-start gap-4 overflow-x-auto pb-4">
                {row.zWall && (
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="bg-gray-50 border border-gray-200 flex items-center justify-center" style={{ height: "200px", width: "150px" }}>
                      {row.zWall.elevationImage ? (
                        <img src={row.zWall.elevationImage} alt="Z" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Left (Z)</span>
                  </div>
                )}

                {row.midWalls.map((wall) => (
                  wall.elevationImage && (
                    <div key={wall.id} className="flex flex-col items-center gap-2 shrink-0">
                      <div className="bg-gray-50 border border-gray-200 flex items-center justify-center" style={{ height: "200px", width: "150px" }}>
                        <img src={wall.elevationImage} alt={wall.type} className="h-full w-full object-contain" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{wall.type || "Wall"}</span>
                    </div>
                  )
                ))}

                {row.xWall && (
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="bg-gray-50 border border-gray-200 flex items-center justify-center" style={{ height: "200px", width: "150px" }}>
                      {row.xWall.elevationImage ? (
                        <img src={row.xWall.elevationImage} alt="X" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Right (X)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}