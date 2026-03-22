import React, { useState, useRef, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

/**
 * BuildingElevation — composite WXYZ elevation view.
 * Uses the same wall-matching logic as ElevationGallery.
 */

const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 3.0;

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

export default function BuildingElevation({ walls = [], placedModules = [] }) {
  const [zoom, setZoom] = useState(50);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const zoomLevels = [20, 25, 37, 50, 62, 75, 100, 125, 150, 200];

  const adjustZoom = (delta) => {
    if (delta > 0) {
      const next = zoomLevels.find(z => z > zoom);
      if (next) setZoom(next);
    } else {
      const prev = [...zoomLevels].reverse().find(z => z < zoom);
      if (prev) setZoom(prev);
    }
  };

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
    e.currentTarget.style.cursor = "grabbing";
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    setPan({
      x: panOrigin.current.x + (e.clientX - panStart.current.x),
      y: panOrigin.current.y + (e.clientY - panStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback((e) => {
    isPanning.current = false;
    if (e.currentTarget) e.currentTarget.style.cursor = "grab";
  }, []);

  const scale = zoom / 100;
  const wallHPx = Math.round(scale * WALL_H_M * PX_PER_M);

  // Same findWall logic as ElevationGallery
  const findWall = useCallback((mod, face) => {
    const WALL_OFFSET = 0.31;
    return walls.find(w => {
      if (w.face !== face) return false;
      if (face === "Y") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y + mod.h)) < 0.5;
      if (face === "W") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y - WALL_OFFSET)) < 0.5;
      if (face === "Z") return Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5;
      if (face === "X") return Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - WALL_OFFSET)) < 0.5;
      return false;
    }) || null;
  }, [walls]);

  // Build pavilion data — same approach as ElevationGallery
  const pavilionData = useMemo(() => {
    const modsByPavilion = { 1: [], 2: [], 3: [] };
    placedModules.forEach(mod => {
      const pav = getModulePavilion(mod);
      if (pav && modsByPavilion[pav]) modsByPavilion[pav].push(mod);
    });

    if (!Object.values(modsByPavilion).some(a => a.length > 0)) return [];

    return [3, 2, 1].map((pavNum) => {
      const modsInPav = modsByPavilion[pavNum];
      if (modsInPav.length === 0) return null;

      // Group by Y row
      const yRows = {};
      modsInPav.forEach(mod => {
        if (!yRows[mod.y]) yRows[mod.y] = [];
        yRows[mod.y].push(mod);
      });

      const rows = Object.keys(yRows).map(Number).sort((a, b) => a - b).map(yPos => {
        const modsAtY = yRows[yPos].sort((a, b) => a.x - b.x);
        const minX = Math.min(...modsAtY.map(m => m.x));
        const maxX = Math.max(...modsAtY.map(m => m.x + m.w));

        const yFaceWalls = modsAtY.map(mod => findWall(mod, "Y")).filter(Boolean);
        const wFaceWalls = modsAtY.map(mod => findWall(mod, "W")).filter(Boolean);
        const zWall = walls.find(w => w.face === "Z" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5)) || null;
        const xWall = walls.find(w => w.face === "X" && modsAtY.some(mod => Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - 0.31)) < 0.5)) || null;

        return { yPos, modsAtY, yFaceWalls, wFaceWalls, zWall, xWall, minX, maxX };
      });

      return { pavilionNum: pavNum, rows };
    }).filter(Boolean);
  }, [placedModules, walls, findWall]);

  if (placedModules.length === 0 || pavilionData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Place modules to view building elevations</p>
      </div>
    );
  }

  const getPavilionLabel = (pavNum) => {
    const labels = { 3: "Pavilion 1", 2: "Connection Module", 1: "Pavilion 2" };
    return labels[pavNum] || `Pavilion ${pavNum}`;
  };

  const FACE_COLORS = { W: "#22c55e", Y: "#3b82f6", Z: "#f59e0b", X: "#ef4444" };

  // Render a horizontal strip of wall images (W or Y face) with optional Z/X end caps
  const HorizElevation = ({ label, faceColor, wallSlots, zWall, xWall, minX, maxX }) => {
    const totalWidthCells = maxX - minX;
    const totalWidthPx = Math.round(scale * totalWidthCells * CELL_M * PX_PER_M);

    const allSlots = [
      ...(zWall ? [{ wall: zWall, xOffsetCells: zWall.x !== undefined ? zWall.x - minX : 0, widthCells: null, isEnd: "Z" }] : []),
      ...wallSlots,
      ...(xWall ? [{ wall: xWall, xOffsetCells: null, widthCells: null, isEnd: "X" }] : []),
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", backgroundColor: faceColor, padding: "1px 8px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
        </div>

        {/* Composite canvas */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          {/* Z end cap */}
          {zWall && (
            <div style={{ flexShrink: 0, height: wallHPx, overflow: "hidden", borderRight: "1px solid rgba(0,0,0,0.1)", position: "relative" }}>
              {renderWallSlot(zWall, null, wallHPx, scale, "Z")}
            </div>
          )}

          {/* Mid walls on a shared canvas */}
          <div style={{ position: "relative", width: totalWidthPx, height: wallHPx, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", overflow: "hidden", flexShrink: 0 }}>
            {wallSlots.map((slot, i) => {
              const leftPx = Math.round(scale * (slot.mod.x - minX) * CELL_M * PX_PER_M);
              const widthPx = Math.round(scale * slot.mod.w * CELL_M * PX_PER_M);
              return (
                <div key={i} style={{ position: "absolute", left: leftPx, top: 0, width: widthPx, height: wallHPx, overflow: "hidden", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                  {renderWallSlot(slot.wall, widthPx, wallHPx, scale, slot.face)}
                </div>
              );
            })}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151" }} />
          </div>

          {/* X end cap */}
          {xWall && (
            <div style={{ flexShrink: 0, height: wallHPx, overflow: "hidden", borderLeft: "1px solid rgba(0,0,0,0.1)", position: "relative" }}>
              {renderWallSlot(xWall, null, wallHPx, scale, "X")}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render a single wall image or placeholder
  const renderWallSlot = (wall, widthPx, heightPx, scale, face) => {
    if (!wall) {
      return (
        <div style={{ width: widthPx || 60, height: heightPx, background: "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 6px,#e5e7eb 6px,#e5e7eb 12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: "#9ca3af" }}>{face}</span>
        </div>
      );
    }
    if (wall.elevationImage) {
      return (
        <img
          src={wall.elevationImage}
          alt={wall.type || face}
          style={{ height: "100%", width: "auto", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined }}
        />
      );
    }
    return (
      <div style={{ width: widthPx || 60, height: heightPx, background: "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 6px,#e5e7eb 6px,#e5e7eb 12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 9, color: "#9ca3af" }}>{face}</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Building Elevations — WXYZ</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => adjustZoom(-1)} disabled={zoom <= zoomLevels[0]} className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
            <ZoomOut size={15} />
          </button>
          <button onClick={() => { setZoom(50); setPan({ x: 0, y: 0 }); }} className="min-w-[52px] text-center text-xs font-semibold text-gray-600 hover:text-[#F15A22] py-1 px-2 rounded hover:bg-white transition-all">
            {zoom}%
          </button>
          <button onClick={() => adjustZoom(1)} disabled={zoom >= zoomLevels[zoomLevels.length - 1]} className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-auto relative select-none bg-gray-50"
        style={{ cursor: "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, padding: "40px", display: "inline-flex", flexDirection: "column", gap: 56 }}>
          {pavilionData.map(pav => (
            <div key={pav.pavilionNum} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* Pavilion label */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", background: "#fff7ed", padding: "6px 14px", borderRadius: 4, display: "inline-block", border: "1px solid #fed7aa" }}>
                {getPavilionLabel(pav.pavilionNum)}
              </div>

              {pav.rows.map((row, ri) => (
                <div key={ri} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Y face (south / outside) */}
                  {(row.yFaceWalls.length > 0 || row.zWall || row.xWall) && (
                    <HorizElevation
                      label="Y — South Elevation"
                      faceColor={FACE_COLORS.Y}
                      wallSlots={row.yFaceWalls.map((wall, i) => ({ wall, mod: row.modsAtY[i], face: "Y" }))}
                      zWall={row.zWall}
                      xWall={row.xWall}
                      minX={row.minX}
                      maxX={row.maxX}
                    />
                  )}
                  {/* W face (north / outside) */}
                  {(row.wFaceWalls.length > 0 || row.zWall || row.xWall) && (
                    <HorizElevation
                      label="W — North Elevation"
                      faceColor={FACE_COLORS.W}
                      wallSlots={row.wFaceWalls.map((wall, i) => ({ wall, mod: row.modsAtY[i], face: "W" }))}
                      zWall={row.zWall}
                      xWall={row.xWall}
                      minX={row.minX}
                      maxX={row.maxX}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}