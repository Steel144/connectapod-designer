import React, { useState, useMemo, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

const GRID_ROWS = 40;

const getPavilion = (wallY) => {
  const midpoint = GRID_ROWS / 2;
  if (wallY >= midpoint - 12 && wallY < midpoint - 4) return 3; // Green
  if (wallY >= midpoint - 4 && wallY < midpoint + 4) return 2;  // Red
  if (wallY >= midpoint + 4 && wallY < midpoint + 12) return 1; // Blue
  return null;
};

export default function ElevationGallery({ walls = [], placedModules = [], onWallSelect = () => {} }) {
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

  // Group walls by pavilion: each y-position is one pavilion with Y/W faces, shared Z/X ends
  const { pavilions, hasAny } = useMemo(() => {
    // Add pavilion info to each wall
    const wallsWithPavilion = walls.map(w => ({ ...w, pavilionNum: getPavilion(w.y) }));
    const withImage = wallsWithPavilion.filter(w => w.elevationImage);
    if (withImage.length === 0) return { pavilions: [], hasAny: false };

    // Group all walls by y-position
    const yGroups = {};
    withImage.forEach(w => {
      const yKey = Math.round(w.y * 100) / 100;
      if (!yGroups[yKey]) yGroups[yKey] = [];
      yGroups[yKey].push(w);
    });

    // Get unique y-positions sorted
    const yPositions = Object.keys(yGroups).map(Number).sort((a, b) => a - b);

    // Create pavilions: one per y-position
    const pavilions = yPositions.map((yPos, pavIndex) => {
      const wallsAtY = yGroups[yPos];
      const pavilionNum = getPavilion(yPos);

      // Find Z and X walls (ends)
      const verticalWalls = wallsAtY.filter(w => w.face === "Z" || w.face === "X");
      const zWall = verticalWalls.find(w => w.face === "Z") || null;
      const xWall = verticalWalls.find(w => w.face === "X") || null;

      // Separate W and Y walls
      const horizontal = wallsAtY.filter(w => w.face === "W" || w.face === "Y");
      const wWalls = horizontal.filter(w => w.face === "W").sort((a, b) => a.x - b.x);
      const yWalls = horizontal.filter(w => w.face === "Y").sort((a, b) => b.x - a.x);

      // Create rows: Y first, then W
      const rows = [
        { type: "Y", yPos, zWall, midWalls: yWalls, xWall },
        { type: "W", yPos, zWall, midWalls: wWalls, xWall }
      ].filter(r => r.midWalls.length > 0 || r.zWall || r.xWall);

      return {
        pavilionNum: pavIndex + 1,
        rows,
      };
    });

    return { pavilions, hasAny: withImage.length > 0 };
    }, [walls, placedModules, getPavilion]);

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

  const ElevationImage = ({ wall, label, face, tight, mirrorH }) => (
    <div className={`flex flex-col items-center ${tight ? "gap-0" : "gap-2"} shrink-0`} style={{ margin: tight ? "-1px 0" : "0" }}>
      <div
        className={`bg-white overflow-hidden ${tight ? "" : "border border-gray-200 cursor-pointer"}`}
        style={{ height: `${imgHeight}px` }}
        onMouseEnter={() => onWallSelect(wall)}
        onMouseLeave={() => onWallSelect(null)}
        onClick={() => onWallSelect(wall)}
      >
        <img
          src={wall.elevationImage}
          alt={label}
          style={{ height: "100%", width: "auto", display: "block", transform: wall.flipped ? 'scaleX(-1)' : undefined, pointerEvents: "none" }}
        />
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

  const ElevationRow = ({ pavilionNum, endLeft, midWalls, endRight, rowLabel, mirrorH }) => {
    const hasContent = endLeft || midWalls.length > 0 || endRight;
    if (!hasContent) return null;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pavilion {pavilionNum} - {rowLabel}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex items-center">
          {/* Left end */}
          {endLeft && (
            <div className="flex items-center shrink-0" style={{ marginRight: `${Math.round((zoom / 100) * 48)}px` }}>
              <ElevationImage wall={endLeft} label={endLeft.type || "End"} face={endLeft.face || "Z"} tight mirrorH={mirrorH} />
            </div>
          )}

          {/* Middle walls joined tightly — no gap between */}
          <div className="flex items-center">
            {midWalls.map((wall) => (
              <div key={wall.id} className="flex items-center" style={{ marginRight: "-1px" }}>
                <ElevationImage wall={wall} label={wall.type || "Wall"} face={wall.face} tight mirrorH={mirrorH} />
              </div>
            ))}
          </div>

          {/* Right end */}
          {endRight && (
            <div className="flex items-center shrink-0" style={{ marginLeft: `${Math.round((zoom / 100) * 48)}px` }}>
              <ElevationImage wall={endRight} label={endRight.type || "End"} face={endRight.face || "X"} tight mirrorH={mirrorH} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
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
            onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}
            className="min-w-[52px] text-center text-xs font-semibold text-gray-600 hover:text-[#F15A22] py-1 px-2 rounded hover:bg-white transition-all"
            title="Reset zoom & position"
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

      {/* Canvas — pannable & zoomable */}
      <div
        className="flex-1 overflow-auto relative select-none bg-gray-50"
        style={{ cursor: "grab" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            adjustZoom(e.deltaY < 0 ? 1 : -1);
          }
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            position: "relative",
            paddingBottom: "100px",
            paddingTop: "40px",
            paddingLeft: "40px",
          }}
        >
          <div className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 128)}px` }}>
            {Array.from({ length: Math.ceil(pavilions.length / 3) }).map((_, rowIdx) => {
              const pavs = pavilions.slice(rowIdx * 3, (rowIdx + 1) * 3);
              return (
                <div key={`row-${rowIdx}`} className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 64)}px` }}>
                  <div className="text-sm font-bold text-gray-800 uppercase tracking-widest ml-1 px-3 py-2 bg-orange-100 rounded w-fit">
                    Pavilion {pavs[0].pavilionNum}{pavs.length > 1 ? ` - ${pavs[pavs.length - 1].pavilionNum}` : ""}
                  </div>
                  <div className="flex gap-8" style={{ gap: `${Math.round((zoom / 100) * 128)}px` }}>
                    {pavs.map((pav) => (
                      <div key={pav.pavilionNum} className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 64)}px` }}>
                        {pav.rows
                          .sort((a, b) => a.type === "Y" ? -1 : 1)
                          .map((row) => (
                            <ElevationRow
                              key={`${pav.pavilionNum}-${row.yPos}-${row.type}`}
                              pavilionNum={pav.pavilionNum}
                              endLeft={row.zWall}
                              midWalls={row.midWalls}
                              endRight={row.xWall}
                              rowLabel={row.type === "Y" ? "Y face (outside / top)" : "W face (outside / bottom)"}
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}