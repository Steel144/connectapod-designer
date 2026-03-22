import React, { useState, useRef, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

/**
 * BuildingElevation — true composite WXYZ elevation view.
 *
 * W (North) elevation: all exterior-W modules composited on a shared X axis,
 *   back rows drawn first so front rows (lower Y on plan) paint over them — 
 *   giving a realistic "building seen from the north" view.
 * Y (South) elevation: same idea but front is highest Y (southernmost).
 * Z (West) elevation: modules stacked by their Y position on plan, leftmost X column visible.
 * X (East) elevation: rightmost X column visible.
 */

const CELL_M = 0.6;      // metres per grid cell
const PX_PER_M = 100;    // px per metre at 100% zoom
const WALL_H_M = 4.2;    // assumed wall height in metres for display (includes roof/foundation)
const PAV_END_WIDTH_M = 5.2;  // pavilion elevation end width in metres (5200mm)

const THRESH = 0.6;

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

  // ── Derived geometry ──────────────────────────────────────────────────────────

  const {
    minX, maxX,          // overall grid X span (cells)
    allMinY, allMaxY,    // overall grid Y span (cells)
    wElevation,          // W face: layers back→front
    yElevation,          // Y face: layers front→back
    zElevation,          // Z face: layers right→left (back-to-front)
    xElevation,          // X face: layers left→right (back-to-front)
  } = useMemo(() => {
    if (placedModules.length === 0) return { minX: 0, maxX: 0, wElevation: [], yElevation: [], zElevation: [], xElevation: [] };

    const allMinX = Math.min(...placedModules.map(m => m.x));
    const allMaxX = Math.max(...placedModules.map(m => m.x + m.w));
    const allMinY = Math.min(...placedModules.map(m => m.y));
    const allMaxY = Math.max(...placedModules.map(m => m.y + m.h));

    // Helper: find W/Y face wall attached to a module
    const findWall = (face, mod) => {
      if (face === "W") {
        return walls.find(w =>
          w.face === "W" &&
          Math.abs(w.x - mod.x) < THRESH &&
          w.y < mod.y && w.y > mod.y - 2
        ) || null;
      }
      if (face === "Y") {
        return walls.find(w =>
          w.face === "Y" &&
          Math.abs(w.x - mod.x) < THRESH &&
          Math.abs(w.y - (mod.y + mod.h)) < THRESH
        ) || null;
      }
      return null;
    };

    // ── W (North) elevation ───────────────────────────────────────────────────
    // Exterior-W modules = no module directly above (lower Y) touching them
    const exteriorW = placedModules.filter(m =>
      !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y + o.h === m.y)
    );
    // Group by Y row, sort rows so highest Y (furthest back/north on plan) is drawn first
    const wByY = {};
    exteriorW.forEach(m => { if (!wByY[m.y]) wByY[m.y] = []; wByY[m.y].push(m); });
    // Descending Y = back first, front last (front row has lowest Y on plan = closest to viewer looking north)
    const wRowsSorted = Object.keys(wByY).map(Number).sort((a, b) => b - a);
    const wElevation = wRowsSorted.map(rowY => ({
      rowY,
      slots: [...wByY[rowY]].sort((a, b) => a.x - b.x).map(mod => ({
        mod, face: "W",
        wall: findWall("W", mod),
        xOffsetCells: mod.x - allMinX,
        widthCells: mod.w,
      })),
    }));

    // ── Y (South) elevation ───────────────────────────────────────────────────
    const exteriorY = placedModules.filter(m =>
      !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y === m.y + m.h)
    );
    const yByY = {};
    exteriorY.forEach(m => { if (!yByY[m.y]) yByY[m.y] = []; yByY[m.y].push(m); });
    // For south face: ascending Y = furthest away drawn first (front = highest Y)
    const yRowsSorted = Object.keys(yByY).map(Number).sort((a, b) => a - b);
    const yElevation = yRowsSorted.map(rowY => ({
      rowY,
      slots: [...yByY[rowY]].sort((a, b) => a.x - b.x).map(mod => ({
        mod, face: "Y",
        wall: findWall("Y", mod),
        xOffsetCells: mod.x - allMinX,
        widthCells: mod.w,
      })),
    }));

    // ── Z (West) elevation ────────────────────────────────────────────────────

    // For each exterior module, find the best matching wall by face.
    // Match on: correct face, X proximity, and wall Y overlaps module Y range.
    const bestWallForMod = (mod, face) => {
      const candidates = walls.filter(w => {
        if (w.face !== face) return false;
        if (face === "Z") {
          // Z wall can be snapped at mod.x OR mod.x+mod.w (placed on either end)
          const nearLeft = Math.abs(w.x - mod.x) < 2;
          const nearRight = Math.abs(w.x - (mod.x + mod.w)) < 2;
          return (nearLeft || nearRight) && w.y >= mod.y - 1 && w.y < mod.y + mod.h + 1;
        }
        if (face === "X") {
          // X wall can be snapped at mod.x+mod.w OR mod.x
          const nearRight = Math.abs(w.x - (mod.x + mod.w)) < 2;
          const nearLeft = Math.abs(w.x - mod.x) < 2;
          return (nearRight || nearLeft) && w.y >= mod.y - 1 && w.y < mod.y + mod.h + 1;
        }
        return false;
      });
      if (candidates.length === 0) return null;
      // Pick the one whose X is closest to the expected edge
      const expectedX = face === "Z" ? mod.x : mod.x + mod.w;
      return candidates.sort((a, b) => Math.abs(a.x - expectedX) - Math.abs(b.x - expectedX))[0];
    };

    // Exterior-Z: no module directly to the left
    const exteriorZ = placedModules.filter(m =>
      !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x + o.w === m.x)
    );
    // Z (West) elevation: for each Y-row segment, pick the westernmost (lowest X) exterior module
    // All slots share one composite canvas positioned by their Y offset
    const zSlots = [];
    // Group exteriorZ by Y position, pick lowest X per row
    const zByY = {};
    exteriorZ.forEach(m => {
      const key = `${m.y}-${m.y + m.h}`;
      if (!zByY[key] || m.x < zByY[key].x) zByY[key] = m;
    });
    Object.values(zByY).forEach(m => {
      zSlots.push({ mod: m, wall: bestWallForMod(m, "Z"), yOffsetCells: m.y - allMinY, depthCells: m.h, face: "Z" });
    });
    zSlots.sort((a, b) => a.yOffsetCells - b.yOffsetCells);
    const zElevation = zSlots.length > 0 ? [{ colX: 0, slots: zSlots }] : [];

    // ── X (East) elevation ────────────────────────────────────────────────────
    // Exterior-X: no module directly to the right
    const exteriorX = placedModules.filter(m =>
      !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x === m.x + m.w)
    );
    // For each Y-row segment, pick the easternmost (highest X+w) exterior module
    const xByY = {};
    exteriorX.forEach(m => {
      const key = `${m.y}-${m.y + m.h}`;
      if (!xByY[key] || (m.x + m.w) > (xByY[key].x + xByY[key].w)) xByY[key] = m;
    });
    const xSlots = [];
    Object.values(xByY).forEach(m => {
      xSlots.push({ mod: m, wall: bestWallForMod(m, "X"), yOffsetCells: m.y - allMinY, depthCells: m.h, face: "X" });
    });
    xSlots.sort((a, b) => a.yOffsetCells - b.yOffsetCells);
    const xElevation = xSlots.length > 0 ? [{ colX: 0, slots: xSlots }] : [];

    return { minX: allMinX, maxX: allMaxX, allMinY, allMaxY, wElevation, yElevation, zElevation, xElevation };
  }, [placedModules, walls]);

  if (placedModules.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Place modules to view building elevations</p>
      </div>
    );
  }

  const totalWidthCells = maxX - minX;
  const totalWidthPx = Math.round(scale * totalWidthCells * CELL_M * PX_PER_M);
  const totalDepthCells = allMaxY - allMinY;
  const totalDepthPx = Math.round(scale * totalDepthCells * CELL_M * PX_PER_M);

  // ── Render a horizontal (W/Y) composite elevation ───────────────────────────
  // All layers share the same canvas width = totalWidthPx.
  // Each layer is absolutely positioned so modules line up on their X position.
  const HorizElevation = ({ layers, label, color }) => {
    if (layers.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: color, padding: "2px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
        </div>
        {/* Composite canvas: layers stacked, each absolutely positioned */}
        <div style={{ position: "relative", width: totalWidthPx, height: wallHPx, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", overflow: "hidden" }}>
          {layers.map((layer, li) =>
            layer.slots.map((slot, si) => {
              const leftPx = Math.round(scale * slot.xOffsetCells * CELL_M * PX_PER_M);
              const widthPx = Math.round(scale * slot.widthCells * CELL_M * PX_PER_M);
              const wall = slot.wall;
              return (
                <div
                  key={`${li}-${si}`}
                  style={{
                    position: "absolute",
                    left: leftPx,
                    top: 0,
                    width: widthPx,
                    height: wallHPx,
                    overflow: "hidden",
                    borderRight: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {wall?.elevationImage ? (
                    <img
                      src={wall.elevationImage}
                      alt={wall.type}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>{slot.face}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {/* Ground line */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151" }} />
        </div>
      </div>
    );
  };

  // ── Render a vertical (Z/X) composite elevation ─────────────────────────────
  // Canvas X axis = building depth (total Y span on plan).
  // Each slot is positioned at its Y offset on plan; width = module depth (h cells).
  // The wall image is shown at natural aspect ratio centred in its slot.
  const VertElevation = ({ layers, label, color }) => {
    if (layers.length === 0) return null;
    // Calculate canvas width: extent of all slots
    let maxContentWidth = totalDepthPx;
    layers.forEach(layer => {
      layer.slots.forEach(slot => {
        const slotRight = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M) + Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
        maxContentWidth = Math.max(maxContentWidth, slotRight);
      });
    });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: color, padding: "2px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
        </div>
        {/* Composite canvas: width = total extent of all slots */}
        <div style={{ position: "relative", width: maxContentWidth, height: wallHPx, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", overflowY: "hidden", overflowX: "auto" }}>
          {layers.map((layer) =>
            layer.slots.map((slot, si) => {
              const leftPx = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M);
              const slotWidthPx = Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
              const wall = slot.wall;
              return (
                <div
                  key={`${layer.colX}-${si}`}
                  style={{
                    position: "absolute",
                    left: leftPx,
                    top: 0,
                    width: slotWidthPx,
                    height: wallHPx,
                    overflow: "hidden",
                    borderRight: "1px solid rgba(0,0,0,0.12)",
                  }}
                >
                  {wall?.elevationImage ? (
                    <img
                      src={wall.elevationImage}
                      alt={wall.label || wall.type || slot.face}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transform: wall.flipped ? "scaleX(-1)" : undefined,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>{slot.face}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151" }} />
        </div>
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
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, padding: "40px", display: "flex", flexDirection: "column", gap: 48, width: "max-content", minWidth: "max-content" }}>
          <div style={{ maxHeight: "600px", overflow: "auto", overflowX: "hidden" }}>
            <HorizElevation layers={wElevation} label="W — North Elevation" color="#22c55e" />
          </div>
          <div style={{ maxHeight: "600px", overflow: "auto", overflowX: "hidden" }}>
            <HorizElevation layers={yElevation} label="Y — South Elevation" color="#3b82f6" />
          </div>
          <div style={{ flex: "0 0 auto", maxHeight: "600px", overflowY: "auto", overflowX: "auto" }}>
            <VertElevation layers={zElevation} label="Z — West Elevation" color="#f59e0b" />
          </div>
          <div style={{ flex: "0 0 auto", maxHeight: "600px", overflowY: "auto", overflowX: "auto" }}>
            <VertElevation layers={xElevation} label="X — East Elevation" color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  );
}