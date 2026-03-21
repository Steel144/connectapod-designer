import React, { useState, useMemo, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

const GRID_ROWS = 40;

const getPavilion = (wallY) => {
  if (wallY >= 9 && wallY < 13) return 3;
  if (wallY >= 19 && wallY < 20) return 2;
  if (wallY >= 26 && wallY < 30) return 1;
  return null;
};

// Returns true if a module (with y and h) overlaps the given band
const modTouchesBand = (mod, bandStart, bandEnd) =>
  mod.y < bandEnd && mod.y + mod.h > bandStart;

const getModulePavilion = (mod) => {
  if (modTouchesBand(mod, 9, 13)) return 3;
  if (modTouchesBand(mod, 19, 20)) return 2;
  if (modTouchesBand(mod, 26, 30)) return 1;
  return null;
};

export default function ElevationGallery({ walls = [], placedModules = [], onWallSelect = () => {}, customWalls = [] }) {
  const [zoom, setZoom] = useState(50);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
    e.currentTarget.style.cursor = "grabbing";
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    setPan({
      x: panOrigin.current.x + (e.clientX - panStart.current.x),
      y: panOrigin.current.y + (e.clientY - panStart.current.y),
    });
  }, []);

  const handleCanvasMouseUp = useCallback((e) => {
    isPanning.current = false;
    e.currentTarget.style.cursor = "grab";
  }, []);

  const zoomLevels = [20, 25, 37, 50, 62, 75, 100, 125, 150, 200, 300];

  const adjustZoom = (delta) => {
    if (delta > 0) {
      const next = zoomLevels.find(z => z > zoom);
      if (next) setZoom(next);
    } else {
      const prev = [...zoomLevels].reverse().find(z => z < zoom);
      if (prev) setZoom(prev);
    }
  };

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
    // Group placed modules by pavilion — show pavilion if any module touches the band
    const modsByPavilion = { 1: [], 2: [], 3: [] };
    placedModules.forEach(mod => {
      const pav = getModulePavilion(mod);
      if (pav && modsByPavilion[pav]) modsByPavilion[pav].push(mod);
    });

    if (!Object.values(modsByPavilion).some(a => a.length > 0)) return { pavilions: [], hasAny: false };

    // Helper: find the wall placed on a specific face of a module
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

    // Make a placeholder wall object for modules that have no wall assigned
    const makePlaceholder = (mod, face) => ({
      id: `placeholder-${mod.id}-${face}`,
      type: null,
      face,
      elevationImage: null,
      width: mod.w * 0.6, // convert grid cells to metres
      length: mod.w,
      x: mod.x,
      y: mod.y,
    });

    const pavilions = [3, 2, 1].map((pavNum) => {
      const modsInPav = modsByPavilion[pavNum];
      if (modsInPav.length === 0) return null;

      // Group modules by their Y row
      const yRows = {};
      modsInPav.forEach(mod => {
        const yKey = mod.y;
        if (!yRows[yKey]) yRows[yKey] = [];
        yRows[yKey].push(mod);
      });

      const rows = [];
      Object.keys(yRows).map(Number).sort((a, b) => a - b).forEach(yPos => {
        const modsAtY = yRows[yPos].sort((a, b) => a.x - b.x);

        // For each module in this row, find its W and Y face walls (or make a placeholder)
        const yFaceWalls = modsAtY.map(mod => findWall(mod, "Y") || makePlaceholder(mod, "Y"));
        const wFaceWalls = modsAtY.map(mod => findWall(mod, "W") || makePlaceholder(mod, "W"));

        // End cap walls (Z/X) — search all walls in this pavilion for Z/X face walls
        const zWall = walls.find(w => w.face === "Z" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5)) || null;
        const xWall = walls.find(w => w.face === "X" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - 0.31)) < 0.5)) || null;

        rows.push({ type: "Y", yPos, zWall, midWalls: yFaceWalls, xWall });
        rows.push({ type: "W", yPos, zWall, midWalls: wFaceWalls, xWall });
      });

      return { pavilionNum: pavNum, rows };
    });

    return { pavilions, hasAny: true };
  }, [walls, placedModules]);

  if (!hasAny) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400 max-w-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Maximize2 size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-medium text-gray-500 mb-1">No modules in pavilion bands</p>
          <p className="text-sm text-gray-400">Place modules in the coloured pavilion bands to view elevations here</p>
        </div>
      </div>
    );
  }

  const imgHeight = Math.round((zoom / 100) * 480);

  const ElevationImage = ({ wall, label, face, tight }) => {
    // Compute the wall's physical pixel width from its length (cells) or width (metres)
    const CELL_M = 0.6;
    const wallWidthM = wall.width ?? (wall.length ? wall.length * CELL_M : CELL_M);
    // Scale: at 100% zoom, 1 metre = 100px (so a 3m wall = 300px)
    const wallWidthPx = Math.round((zoom / 100) * wallWidthM * 100);
    return (
      <div className={`flex flex-col items-center ${tight ? "gap-0" : "gap-2"} shrink-0`} style={{ margin: tight ? "-1px 0" : "0" }}>
        <div
          className={`overflow-hidden ${tight ? "" : "bg-white border border-gray-200 cursor-pointer"}`}
          style={{ height: `${imgHeight}px`, width: wall.elevationImage ? "auto" : `${wallWidthPx}px` }}
          onMouseEnter={() => onWallSelect(wall)}
          onMouseLeave={() => onWallSelect(null)}
          onClick={() => onWallSelect(wall)}
        >
          {wall.elevationImage ? (
            <img
              src={wall.elevationImage}
              alt={label}
              style={{ height: "100%", width: "auto", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined, pointerEvents: "none" }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-1"
              style={{ background: "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)", border: "1.5px dashed #d1d5db" }}
            >
              <span className="text-[10px] font-semibold text-gray-400 text-center px-1 leading-tight">No wall specified</span>
              <span className="text-[9px] text-gray-400 text-center px-1 leading-tight truncate max-w-full">{wall.type}</span>
            </div>
          )}
        </div>
        {!tight && (
          <div className="text-center">
            <span className="inline-block bg-[#F15A22] text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
              {face}
            </span>
            <p className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{label}</p>
          </div>
        )}
      </div>
    );
  };

  const getPavilionLabel = (pavNum) => {
    const labels = { 3: "Pavilion 1", 2: "Connection Module", 1: "Pavilion 2" };
    return labels[pavNum] || `Pavilion ${pavNum}`;
  };

  const ElevationRow = ({ pavilionNum, endLeft, midWalls, endRight, rowLabel }) => {
    const hasContent = endLeft || midWalls.length > 0 || endRight;
    if (!hasContent) return null;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getPavilionLabel(pavilionNum)} - {rowLabel}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex items-center gap-2">
          {endLeft && (
            <div className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-0">
                <ElevationImage wall={endLeft} label={endLeft.type || "End"} face={endLeft.face} tight />
                <span className="text-[8px] text-gray-400 mt-0.5">Left</span>
              </div>
            </div>
          )}
          <div className="flex items-center">
            {midWalls.map((wall) => (
              <div key={wall.id} className="flex items-center" style={{ marginRight: "-1px" }}>
                <ElevationImage wall={wall} label={wall.type || "Wall"} face={wall.face} tight />
              </div>
            ))}
          </div>
          {endRight && (
            <div className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-0">
                <ElevationImage wall={endRight} label={endRight.type || "End"} face={endRight.face} tight />
                <span className="text-[8px] text-gray-400 mt-0.5">Right</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Elevations</span>
          <span className="text-xs text-gray-400">{walls.filter(w => w.elevationImage).length} wall{walls.filter(w => w.elevationImage).length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => adjustZoom(-1)} disabled={zoom <= zoomLevels[0]} className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Zoom out">
            <ZoomOut size={15} />
          </button>
          <button onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }} className="min-w-[52px] text-center text-xs font-semibold text-gray-600 hover:text-[#F15A22] py-1 px-2 rounded hover:bg-white transition-all" title="Reset zoom & position">
            {zoom}%
          </button>
          <button onClick={() => adjustZoom(1)} disabled={zoom >= zoomLevels[zoomLevels.length - 1]} className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Zoom in">
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto relative select-none bg-gray-50"
        style={{ cursor: "grab" }}
        ref={(el) => {
          if (el && !el._wheelListenerAdded) {
            el._wheelListenerAdded = true;
            el.addEventListener('wheel', (e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                adjustZoom(e.deltaY < 0 ? 1 : -1);
              }
            }, { passive: false });
          }
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, position: "relative", minHeight: "100%", paddingBottom: "100px", paddingTop: "40px", paddingLeft: "40px" }}>
          <div className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 128)}px` }}>
            {pavilions.filter(Boolean).map((pav) => (
              <div key={pav.pavilionNum} className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 64)}px` }}>
                <div className="text-sm font-bold text-black uppercase tracking-widest ml-1 px-3 py-2 bg-orange-100 rounded w-fit">
                  {getPavilionLabel(pav.pavilionNum)}
                </div>
                {(() => {
                  const yRows = pav.rows.filter(r => r.type === "Y");
                  const wRows = pav.rows.filter(r => r.type === "W");
                  const zxRows = pav.rows.filter(r => r.type === "ZX");
                  const zWallFromZX = zxRows.find(r => r.zWall && r.zWall.elevationImage)?.zWall;
                  const xWallFromZX = zxRows.find(r => r.xWall && r.xWall.elevationImage)?.xWall;
                  // Connection module: only show Z and X faces, only connection-type walls (ZC-/XC-)
                  if (pav.pavilionNum === 2) {
                    const isConnectionWall = (w) => w && w.type && (w.type.startsWith("ZC-") || w.type.startsWith("XC-"));
                    const rawZ = zWallFromZX || (yRows[0]?.zWall) || null;
                    const rawX = xWallFromZX || (yRows[0]?.xWall) || null;
                    const zWall = isConnectionWall(rawZ) ? rawZ : null;
                    const xWall = isConnectionWall(rawX) ? rawX : null;
                    if (!zWall && !xWall) return null;
                    return (
                      <>
                        {zWall && (
                          <ElevationRow
                            pavilionNum={pav.pavilionNum}
                            endLeft={null}
                            midWalls={[zWall]}
                            endRight={null}
                            rowLabel="Z face (left end)"
                          />
                        )}
                        {xWall && (
                          <ElevationRow
                            pavilionNum={pav.pavilionNum}
                            endLeft={null}
                            midWalls={[xWall]}
                            endRight={null}
                            rowLabel="X face (right end)"
                          />
                        )}
                      </>
                    );
                  }

                  return (
                    <>
                      {yRows.map((row) => (
                        <ElevationRow
                          key={`${pav.pavilionNum}-${row.yPos}-Y`}
                          pavilionNum={pav.pavilionNum}
                          endLeft={zWallFromZX || row.zWall}
                          midWalls={row.midWalls || []}
                          endRight={xWallFromZX || row.xWall}
                          rowLabel="Y face (outside / top)"
                        />
                      ))}
                      {wRows.map((row) => (
                        <ElevationRow
                          key={`${pav.pavilionNum}-${row.yPos}-W`}
                          pavilionNum={pav.pavilionNum}
                          endLeft={xWallFromZX || row.xWall}
                          midWalls={row.midWalls || []}
                          endRight={zWallFromZX || row.zWall}
                          rowLabel="W face (outside / bottom)"
                        />
                      ))}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}