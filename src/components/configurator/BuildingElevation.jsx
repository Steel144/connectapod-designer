import React, { useState, useRef, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

/**
 * BuildingElevation — true composite WXYZ elevation view.
 *
 * W (North) / Y (South): horizontal long faces. All pavilion rows composited on a
 *   shared X axis (matching plan X position). Back rows drawn first, front rows on top.
 *
 * Z (West) / X (East): end faces. Each exterior end module contributes one wall panel.
 *   Panels are stacked vertically in plan-depth order (top = northernmost pavilion).
 *   Canvas width = widest end module width. Gaps between pavilions shown as empty space.
 */

const CELL_M = 0.6;      // metres per grid cell
const PX_PER_M = 100;    // px per metre at 100% zoom
const WALL_H_M = 3.0;    // wall height metres (for display)
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

  const derived = useMemo(() => {
    if (placedModules.length === 0) return null;

    const allMinX = Math.min(...placedModules.map(m => m.x));
    const allMaxX = Math.max(...placedModules.map(m => m.x + m.w));
    const allMinY = Math.min(...placedModules.map(m => m.y));
    const allMaxY = Math.max(...placedModules.map(m => m.y + m.h));

    const findWall = (face, mod) => walls.find(w => {
      if (w.face !== face) return false;
      if (face === "W") return Math.abs(w.x - mod.x) < THRESH && Math.abs(w.y - (mod.y - 0.31)) < THRESH;
      if (face === "Y") return Math.abs(w.x - mod.x) < THRESH && Math.abs(w.y - (mod.y + mod.h)) < THRESH;
      if (face === "Z") return Math.abs(w.y - mod.y) < THRESH && Math.abs(w.x - mod.x) < THRESH;
      if (face === "X") return Math.abs(w.y - mod.y) < THRESH && Math.abs(w.x - (mod.x + mod.w - 0.31)) < THRESH;
      return false;
    }) || null;

    // ── W (North) elevation ───────────────────────────────────────────────────
    // Exterior-W = no module directly above (lower Y) overlapping in X
    const exteriorW = placedModules.filter(m =>
      !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y + o.h === m.y)
    );
    const wByY = {};
    exteriorW.forEach(m => { if (!wByY[m.y]) wByY[m.y] = []; wByY[m.y].push(m); });
    // Descending Y = back first, front (lowest Y) last → paints over
    const wLayers = Object.keys(wByY).map(Number).sort((a, b) => b - a).map(rowY => ({
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
    // Ascending Y = back first (lowest Y furthest from south viewer), highest Y on top
    const yLayers = Object.keys(yByY).map(Number).sort((a, b) => a - b).map(rowY => ({
      rowY,
      slots: [...yByY[rowY]].sort((a, b) => a.x - b.x).map(mod => ({
        mod, face: "Y",
        wall: findWall("Y", mod),
        xOffsetCells: mod.x - allMinX,
        widthCells: mod.w,
      })),
    }));

    // ── Z (West) elevation ────────────────────────────────────────────────────
    // Find all modules that are on the leftmost exposed Z face (no neighbour to their left).
    // Group by Y row (each pavilion row has its own end panel).
    // Canvas: vertical stack of panels, one per Y row, separated by gaps if Y rows aren't adjacent.
    const exteriorZ = placedModules.filter(m =>
      !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x + o.w === m.x)
    );
    // Find leftmost module per Y-row group (same y)
    const zByY = {};
    exteriorZ.forEach(m => {
      if (!zByY[m.y]) zByY[m.y] = m;
      else if (m.x < zByY[m.y].x) zByY[m.y] = m; // pick leftmost
    });
    // Sort rows top (lowest Y = northernmost) to bottom
    const zRows = Object.keys(zByY).map(Number).sort((a, b) => a - b).map(rowY => {
      const mod = zByY[rowY];
      return {
        mod, face: "Z",
        wall: findWall("Z", mod),
        yOffsetCells: rowY - allMinY,
        widthCells: mod.w,   // end wall is as wide as the module width
        heightCells: mod.h,  // panel height = module depth
      };
    });
    const zMaxWidthCells = zRows.length > 0 ? Math.max(...zRows.map(r => r.widthCells)) : 0;

    // ── X (East) elevation ────────────────────────────────────────────────────
    const exteriorX = placedModules.filter(m =>
      !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x === m.x + m.w)
    );
    const xByY = {};
    exteriorX.forEach(m => {
      if (!xByY[m.y]) xByY[m.y] = m;
      else if (m.x + m.w > xByY[m.y].x + xByY[m.y].w) xByY[m.y] = m; // pick rightmost
    });
    const xRows = Object.keys(xByY).map(Number).sort((a, b) => a - b).map(rowY => {
      const mod = xByY[rowY];
      return {
        mod, face: "X",
        wall: findWall("X", mod),
        yOffsetCells: rowY - allMinY,
        widthCells: mod.w,
        heightCells: mod.h,
      };
    });
    const xMaxWidthCells = xRows.length > 0 ? Math.max(...xRows.map(r => r.widthCells)) : 0;

    return {
      allMinX, allMaxX, allMinY, allMaxY,
      totalWidthCells: allMaxX - allMinX,
      totalDepthCells: allMaxY - allMinY,
      wLayers, yLayers,
      zRows, zMaxWidthCells,
      xRows, xMaxWidthCells,
    };
  }, [placedModules, walls]);

  if (!derived || placedModules.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Place modules to view building elevations</p>
      </div>
    );
  }

  const { totalWidthCells, totalDepthCells, wLayers, yLayers, zRows, zMaxWidthCells, xRows, xMaxWidthCells } = derived;
  const totalWidthPx = Math.round(scale * totalWidthCells * CELL_M * PX_PER_M);
  const totalDepthPx = Math.round(scale * totalDepthCells * CELL_M * PX_PER_M);

  // ── Horizontal elevation (W / Y) ─────────────────────────────────────────────
  // Shared canvas width = total building width. Layers painted back→front via z-index/order.
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
        <div style={{ position: "relative", width: totalWidthPx, height: wallHPx, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", overflow: "hidden" }}>
          {layers.map((layer, li) =>
            layer.slots.map((slot, si) => {
              const leftPx = Math.round(scale * slot.xOffsetCells * CELL_M * PX_PER_M);
              const widthPx = Math.round(scale * slot.widthCells * CELL_M * PX_PER_M);
              const wall = slot.wall;
              return (
                <div key={`${li}-${si}`} style={{ position: "absolute", left: leftPx, top: 0, width: widthPx, height: wallHPx, overflow: "hidden", zIndex: li }}>
                  {wall?.elevationImage ? (
                    <img src={wall.elevationImage} alt={wall.type} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, color: "#9ca3af" }}>{slot.face}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 99 }} />
        </div>
      </div>
    );
  };

  // ── End elevation (Z / X) ────────────────────────────────────────────────────
  // Canvas: width = widest end module (module width in metres), height = total building depth.
  // Each pavilion row's end wall is placed at the correct Y offset (depth position).
  // The wall image fills the panel height proportionally.
  const EndElevation = ({ rows, maxWidthCells, label, color }) => {
    if (rows.length === 0) return null;
    const canvasWidthPx = Math.round(scale * maxWidthCells * CELL_M * PX_PER_M);
    const canvasHeightPx = totalDepthPx;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: color, padding: "2px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
        </div>
        <div style={{ position: "relative", width: canvasWidthPx, height: canvasHeightPx, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", overflow: "hidden" }}>
          {rows.map((row, ri) => {
            const topPx = Math.round(scale * row.yOffsetCells * CELL_M * PX_PER_M);
            const panelHeightPx = Math.round(scale * row.heightCells * CELL_M * PX_PER_M);
            const wall = row.wall;
            return (
              <div key={ri} style={{ position: "absolute", left: 0, top: topPx, width: canvasWidthPx, height: panelHeightPx, overflow: "hidden", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                {wall?.elevationImage ? (
                  <img src={wall.elevationImage} alt={wall.type} style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "#9ca3af" }}>{row.face}</span>
                  </div>
                )}
              </div>
            );
          })}
          {/* Ground line at bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 99 }} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
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

      <div
        className="flex-1 overflow-auto relative select-none bg-gray-50"
        style={{ cursor: "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, padding: "40px", display: "inline-flex", flexDirection: "column", gap: 48 }}>
          <HorizElevation layers={wLayers} label="W — North Elevation" color="#22c55e" />
          <HorizElevation layers={yLayers} label="Y — South Elevation" color="#3b82f6" />
          <EndElevation rows={zRows} maxWidthCells={zMaxWidthCells} label="Z — West Elevation" color="#f59e0b" />
          <EndElevation rows={xRows} maxWidthCells={xMaxWidthCells} label="X — East Elevation" color="#ef4444" />
        </div>
      </div>
    </div>
  );
}