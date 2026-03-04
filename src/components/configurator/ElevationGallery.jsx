import React, { useState, useMemo, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function ElevationGallery({ walls = [] }) {
  const [zoom, setZoom] = useState(100);

  const zoomLevels = [50, 75, 100, 125, 150, 200, 300];

  const adjustZoom = (delta) => {
    if (delta > 0) {
      const next = zoomLevels.find(z => z > zoom);
      if (next) setZoom(next);
    } else {
      const prev = [...zoomLevels].reverse().find(z => z < zoom);
      if (prev) setZoom(prev);
    }
  };

  // Group walls by face — with fallback for walls missing the face property
  const { wWalls, yWalls, zWall, xWall, hasAny } = useMemo(() => {
    const withImage = walls.filter(w => w.elevationImage);

    // Infer face from orientation if missing
    const inferFace = (w) => {
      if (w.face) return w.face;
      if (w.orientation === "vertical") return "Z"; // treat all vertical end walls as Z (left end)
      // horizontal: no reliable way to distinguish W vs Y without grid context
      // use a heuristic: if this wall's y is the smallest among horizontal walls, it's W (top)
      return null;
    };

    // For walls without face, split horizontal ones by relative y position
    const horizontal = withImage.filter(w => w.orientation === "horizontal" || w.face === "W" || w.face === "Y");
    const vertical = withImage.filter(w => w.orientation === "vertical" || w.face === "Z" || w.face === "X");

    // Determine midpoint y to split W (top) from Y (bottom)
    const ys = horizontal.map(w => w.y);
    const midY = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;

    const getFace = (w) => {
      if (w.face) return w.face;
      if (w.orientation === "vertical") return "Z";
      return w.y <= midY ? "W" : "Y";
    };

    const w = horizontal.filter(w => getFace(w) === "W").sort((a, b) => a.x - b.x);
    const y = horizontal.filter(w => getFace(w) === "Y").sort((a, b) => a.x - b.x);

    // For vertical/end walls, split by x position (left vs right)
    const vertXs = vertical.map(w => w.x);
    const midX = vertXs.length > 0 ? (Math.min(...vertXs) + Math.max(...vertXs)) / 2 : 0;
    const zCandidates = vertical.filter(w => w.face === "Z" || (!w.face && w.x <= midX));
    const xCandidates = vertical.filter(w => w.face === "X" || (!w.face && w.x > midX));

    const z = zCandidates[0] || null;
    const x = xCandidates[0] || null;

    return {
      wWalls: w,
      yWalls: y,
      zWall: z,
      xWall: x,
      hasAny: withImage.length > 0,
    };
  }, [walls]);

  if (!hasAny) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400 max-w-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Maximize2 size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-medium text-gray-500 mb-1">No elevations yet</p>
          <p className="text-sm text-gray-400">Upload elevation images to walls in your design to view them here</p>
        </div>
      </div>
    );
  }

  const imgHeight = Math.round((zoom / 100) * 480);

  const ElevationImage = ({ wall, label, face, tight }) => (
    <div className={`flex flex-col items-center gap-2 shrink-0 ${tight ? "" : ""}`}>
      <div
        className={`bg-white overflow-hidden ${tight ? "border-y border-gray-200" : "border border-gray-200 shadow-sm"}`}
        style={{ height: `${imgHeight}px` }}
      >
        <img
          src={wall.elevationImage}
          alt={label}
          style={{ height: "100%", width: "auto", display: "block" }}
        />
      </div>
      <div className="text-center">
        <span className="inline-block bg-[#F15A22] text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
          {face}
        </span>
        <p className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{label}</p>
      </div>
    </div>
  );

  const ElevationRow = ({ endLeft, midWalls, endRight, rowLabel }) => {
    const hasContent = endLeft || midWalls.length > 0 || endRight;
    if (!hasContent) return null;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rowLabel}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex items-end">
          {/* Z end — left, separated */}
          {endLeft && (
            <div className="flex items-end shrink-0">
              <ElevationImage wall={endLeft} label={endLeft.type || "End"} face={endLeft.face || "Z"} />
              <div className="w-10 shrink-0" />
            </div>
          )}

          {/* Middle walls joined tightly — no gap between */}
          <div className="flex items-end">
            {midWalls.map((wall, idx) => (
              <div key={wall.id} className="flex items-end" style={{ marginLeft: idx === 0 ? 0 : "-1px" }}>
                <ElevationImage wall={wall} label={wall.type || "Wall"} face={wall.face} tight />
              </div>
            ))}
          </div>

          {/* X end — right, separated */}
          {endRight && (
            <div className="flex items-end shrink-0">
              <div className="w-10 shrink-0" />
              <ElevationImage wall={endRight} label={endRight.type || "End"} face={endRight.face || "X"} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Elevations</span>
          <span className="text-xs text-gray-400">{walls.filter(w => w.elevationImage).length} wall{walls.filter(w => w.elevationImage).length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => adjustZoom(-1)}
            disabled={zoom <= zoomLevels[0]}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="min-w-[52px] text-center text-xs font-semibold text-gray-600 hover:text-[#F15A22] py-1 px-2 rounded hover:bg-white transition-all"
            title="Reset zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={() => adjustZoom(1)}
            disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto p-8"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            adjustZoom(e.deltaY < 0 ? 1 : -1);
          }
        }}
      >
        <div className="flex flex-col gap-16" style={{ width: "max-content" }}>
          <ElevationRow
            endLeft={zWall}
            midWalls={wWalls}
            endRight={xWall}
            rowLabel="W face (outside / top)"
          />
          <ElevationRow
            endLeft={zWall}
            midWalls={yWalls}
            endRight={xWall}
            rowLabel="Y face (outside / bottom)"
          />
        </div>
      </div>
    </div>
  );
}