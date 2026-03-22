import React, { useState, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

/**
 * BuildingElevation — renders a composite WXYZ elevation view of the whole building.
 *
 * For each face (W, X, Y, Z) it collects all placed walls on that face,
 * stitches them side-by-side in x-order (W/Y) or y-order (Z/X), and draws them.
 * Modules with no wall on a face show a hatched placeholder sized to that module's span.
 */

const CELL_M = 0.6; // metres per grid cell
const PX_PER_M = 100; // px per metre at 100% zoom

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
  const imgH = Math.round(scale * 4.8 * PX_PER_M); // 4.8m pavilion depth

  if (placedModules.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Place modules to view building elevations</p>
      </div>
    );
  }

  // ── Build each face ──────────────────────────────────────────────────────────

  /**
   * W face: top (north) long face of pavilions — horizontal walls, face="W"
   * Y face: bottom (south) long face of pavilions — horizontal walls, face="Y"
   * Z face: left (west) end face — vertical walls, face="Z"
   * X face: right (east) end face — vertical walls, face="X"
   */

  // For W/Y faces: group modules by Y row, sort rows by Y, sort modules in row by X
  // For Z/X faces: group modules by X column — each unique X column of end modules

  const THRESH = 0.5;

  // Collect modules that are "exterior" on each face (no adjacent neighbour on that side)
  const exteriorW = placedModules.filter(m =>
    !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y + o.h === m.y)
  );
  const exteriorY = placedModules.filter(m =>
    !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y === m.y + m.h)
  );
  const exteriorZ = placedModules.filter(m =>
    !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x + o.w === m.x)
  );
  const exteriorX = placedModules.filter(m =>
    !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x === m.x + m.w)
  );

  const findWall = (face, mod) => {
    return walls.find(w => {
      if (w.face !== face) return false;
      if (face === "W") return Math.abs(w.x - mod.x) < THRESH && Math.abs(w.y - (mod.y - 0.31)) < THRESH;
      if (face === "Y") return Math.abs(w.x - mod.x) < THRESH && Math.abs(w.y - (mod.y + mod.h)) < THRESH;
      if (face === "Z") return Math.abs(w.y - mod.y) < THRESH && Math.abs(w.x - mod.x) < THRESH;
      if (face === "X") return Math.abs(w.y - mod.y) < THRESH && Math.abs(w.x - (mod.x + mod.w - 0.31)) < THRESH;
      return false;
    }) || null;
  };

  // Build a face strip from a list of modules (horizontal: sort by x; vertical: sort by y)
  const buildHorizontalStrip = (mods, face) => {
    const sorted = [...mods].sort((a, b) => a.x - b.x);
    return sorted.map(mod => ({
      wall: findWall(face, mod),
      widthM: mod.w * CELL_M,
      heightM: mod.h * CELL_M,
      mod,
      face,
    }));
  };

  const buildVerticalStrip = (mods, face) => {
    const sorted = [...mods].sort((a, b) => a.y - b.y);
    return sorted.map(mod => ({
      wall: findWall(face, mod),
      widthM: mod.h * CELL_M, // rotated: depth becomes width
      heightM: mod.w * CELL_M,
      mod,
      face,
    }));
  };

  // Group horizontal exterior modules into rows (same Y), sort rows top-to-bottom
  const groupByY = (mods) => {
    const map = {};
    mods.forEach(m => {
      if (!map[m.y]) map[m.y] = [];
      map[m.y].push(m);
    });
    return Object.keys(map).map(Number).sort((a, b) => a - b).map(y => map[y]);
  };

  const wRows = groupByY(exteriorW);
  const yRows = groupByY(exteriorY);

  // Group vertical exterior modules into columns (same X), sort left-to-right
  const groupByX = (mods) => {
    const map = {};
    mods.forEach(m => {
      if (!map[m.x]) map[m.x] = [];
      map[m.x].push(m);
    });
    return Object.keys(map).map(Number).sort((a, b) => a - b).map(x => map[x]);
  };

  const zCols = groupByX(exteriorZ);
  const xCols = groupByX(exteriorX);

  const FACE_LABELS = { W: "W — North (Top)", Y: "Y — South (Bottom)", Z: "Z — West (Left)", X: "X — East (Right)" };
  const FACE_COLORS = { W: "#22c55e", Y: "#3b82f6", Z: "#f59e0b", X: "#ef4444" };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const WallSlot = ({ slot }) => {
    const wPx = Math.round(scale * slot.widthM * PX_PER_M);
    const hPx = imgH;
    const wall = slot.wall;
    return (
      <div style={{ width: wPx, height: hPx, flexShrink: 0, position: "relative", border: "1px solid #e5e7eb", overflow: "hidden", backgroundColor: "#fff" }}>
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
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          }}>
            <span style={{ fontSize: 9, color: "#9ca3af", textAlign: "center", padding: "0 4px", lineHeight: 1.3 }}>
              {wall ? wall.type : "No wall"}
            </span>
          </div>
        )}
        {/* face badge */}
        <span style={{
          position: "absolute", bottom: 2, left: 2,
          fontSize: 8, fontWeight: "bold", color: "rgba(255,255,255,0.9)",
          backgroundColor: "rgba(0,0,0,0.45)", padding: "1px 3px", borderRadius: 2,
        }}>
          {slot.face}
        </span>
      </div>
    );
  };

  const FaceSection = ({ label, color, strips }) => {
    if (strips.length === 0 || strips.every(s => s.length === 0)) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: color, padding: "2px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
        </div>
        {/* Each strip is a row (W/Y) or column (Z/X) */}
        {strips.map((strip, i) => (
          strip.length > 0 && (
            <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
              {strip.map((slot, j) => <WallSlot key={j} slot={slot} />)}
            </div>
          )
        ))}
      </div>
    );
  };

  const wStrips = wRows.map(row => buildHorizontalStrip(row, "W"));
  const yStrips = yRows.map(row => buildHorizontalStrip(row, "Y"));
  const zStrips = zCols.map(col => buildVerticalStrip(col, "Z"));
  const xStrips = xCols.map(col => buildVerticalStrip(col, "X"));

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
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, padding: "40px", display: "inline-flex", flexDirection: "column", gap: 48 }}>
          <FaceSection label={FACE_LABELS.W} color={FACE_COLORS.W} strips={wStrips} />
          <FaceSection label={FACE_LABELS.Y} color={FACE_COLORS.Y} strips={yStrips} />
          <FaceSection label={FACE_LABELS.Z} color={FACE_COLORS.Z} strips={zStrips} />
          <FaceSection label={FACE_LABELS.X} color={FACE_COLORS.X} strips={xStrips} />
        </div>
      </div>
    </div>
  );
}