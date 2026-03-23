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
       const isConnectionModule = pavNum === 2;
       Object.keys(yRows)
         .map(Number)
         .sort((a, b) => a - b)
         .forEach(yPos => {
           const modsAtY = yRows[yPos].sort((a, b) => a.x - b.x);

           const zWall = walls.find(w => w.face === "Z" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5)) || null;
           const xWall = walls.find(w => w.face === "X" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - 0.31)) < 0.5)) || null;

           if (isConnectionModule) {
             rows.push({ type: "Z", yPos, zWall, midWalls: [], xWall: null });
             rows.push({ type: "X", yPos, zWall: null, midWalls: [], xWall });
           } else {
             const yFaceWalls = modsAtY.map(mod => findWall(mod, "Y") || makePlaceholder(mod, "Y"));
             const wFaceWalls = modsAtY.map(mod => findWall(mod, "W") || makePlaceholder(mod, "W"));

             rows.push({ type: "Y", yPos, zWall, midWalls: yFaceWalls, xWall });
             rows.push({ type: "W", yPos, zWall, midWalls: wFaceWalls, xWall });
           }
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
      @page { margin: 0.25in; size: A4 landscape; }
      @media print {
        body { margin: 0; padding: 0; }
        img { max-width: 100%; height: auto; }
        .pavilion-page { page-break-after: always; margin: 0; padding: 0.25in; }
      }
      `}</style>

      {pavilions.map((pav) => (
        <div key={pav.pavilionNum} className="pavilion-page p-4 min-h-screen flex flex-col">
          <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-[#F15A22] mb-6">
            <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" style={{ height: "25px", width: "auto" }} />
            <h2 className="text-lg font-bold text-gray-800">{getPavilionLabel(pav.pavilionNum)}</h2>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Elevations</span>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {pav.rows.map((row, idx) => {
              const hasContent = row.midWalls.some(w => w.elevationImage) || row.zWall?.elevationImage || row.xWall?.elevationImage;
              if (!hasContent) return null;

              // Calculate scale: find the module(s) for this row and get total width
              const modsInRow = placedModules.filter(m => Math.abs(m.y - row.yPos) < 0.1 && getModulePavilion(m) === pav.pavilionNum).sort((a, b) => a.x - b.x);
              const totalModWidth = modsInRow.reduce((sum, m) => sum + m.w, 0);
              const pxPerMeter = totalModWidth > 0 ? 600 / totalModWidth : 100; // 600px for total row width
              
              return (
                <div key={`${pav.pavilionNum}-${row.yPos}-${row.type}`}>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       {row.type === "Z" 
                         ? `${getPavilionLabel(pav.pavilionNum)} - Z face (left end)` 
                         : row.type === "X"
                         ? `${getPavilionLabel(pav.pavilionNum)} - X face (right end)`
                         : `${getPavilionLabel(pav.pavilionNum)} - ${row.type === "Y" ? "Y face (outside/top)" : "W face (outside/bottom)"}`}
                     </span>
                     <div className="flex-1 h-px bg-gray-200" />
                   </div>

                  <div className="flex items-end pb-2" style={{ gap: "0px" }}>
                    {row.zWall?.elevationImage && (
                      <div className="flex flex-col items-center gap-0">
                        <div className="bg-white flex items-center justify-center" style={{ height: "220px", width: `${(row.zWall.width / 1000) * pxPerMeter}px` }}>
                          <img src={row.zWall.elevationImage} alt="Z" style={{ height: "100%", width: "100%", objectFit: "contain", pointerEvents: "none" }} />
                        </div>
                      </div>
                    )}

                    {row.midWalls.map((wall, widx) => {
                      const modForWall = modsInRow[widx];
                      const wallWidth = modForWall ? modForWall.w * pxPerMeter : 100;
                      return (
                        wall.elevationImage && (
                          <div key={wall.id} className="flex items-center" style={{ marginRight: "0px" }}>
                            <div className="bg-white flex items-center justify-center" style={{ height: "220px", width: `${wallWidth}px`, marginRight: "0px" }}>
                              <img src={wall.elevationImage} alt={wall.type} style={{ height: "100%", width: "100%", objectFit: "contain", pointerEvents: "none" }} />
                            </div>
                          </div>
                        )
                      );
                    })}

                    {row.xWall?.elevationImage && (
                       <div className="flex flex-col items-center gap-0">
                         <div className="bg-white flex items-center justify-center" style={{ height: "220px", width: `${pxPerMeter * 0.6}px` }}>
                           <img src={row.xWall.elevationImage} alt="X" style={{ height: "100%", width: "100%", objectFit: "contain", pointerEvents: "none" }} />
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-200 text-[9px] text-gray-500 text-right">
            <p>{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}