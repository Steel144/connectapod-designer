import React, { useState, useMemo, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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

  // Group walls by pavilion using end modules as boundaries
  const { pavilions, hasAny } = useMemo(() => {
    const withImage = walls.filter(w => w.elevationImage);
    if (withImage.length === 0) return { pavilions: [], hasAny: false };

    // Find all end modules (pairs that face each other)
    const isEndModule = (m) => m.chassis === "EF" || m.chassis === "ER" || m.chassis === "LF" || m.chassis === "RF";
    const endModules = placedModules.filter(isEndModule).sort((a, b) => a.x - b.x);

    // Create pavilions between consecutive pairs of end modules
    const pavilionGroups = [];
    
    if (endModules.length >= 2) {
      for (let i = 0; i < endModules.length - 1; i++) {
        const leftEnd = endModules[i];
        const rightEnd = endModules[i + 1];
        const minX = leftEnd.x;
        const maxX = rightEnd.x + (rightEnd.w || 1);
        
        const pavWalls = withImage.filter(w => w.x >= minX && w.x <= maxX);
        if (pavWalls.length > 0) {
          pavilionGroups.push(pavWalls);
        }
      }
    } else {
      // Fallback: if fewer than 2 end modules, just use all walls
      pavilionGroups.push(withImage);
    }

    // For each pavilion, group walls by y-position (row), then by face
    const pavilions = pavilionGroups.map((group) => {
      // Find pavilion-level end walls (leftmost and rightmost across all y positions)
      const vertical = group.filter(w => w.orientation === "vertical" || w.face === "Z" || w.face === "X");
      const vertXs = vertical.map(w => w.x);
      const minX = vertXs.length > 0 ? Math.min(...vertXs) : null;
      const maxX = vertXs.length > 0 ? Math.max(...vertXs) : null;
      const pavZWall = vertical.find(w => minX !== null && Math.abs(w.x - minX) < 0.1) || null;
      const pavXWall = vertical.find(w => maxX !== null && Math.abs(w.x - maxX) < 0.1) || null;

      // Group by unique y coordinates to create rows
      const yGroups = {};
      group.forEach(w => {
        const yKey = Math.round(w.y * 100) / 100;
        if (!yGroups[yKey]) yGroups[yKey] = [];
        yGroups[yKey].push(w);
      });

      const yPositions = Object.keys(yGroups).map(Number).sort((a, b) => a - b);
      
      // For each y position, separate into W (top) and Y (bottom) rows
      const rows = yPositions.flatMap(yPos => {
        const wallsAtY = yGroups[yPos];
        const horizontal = wallsAtY.filter(w => w.orientation === "horizontal" || w.face === "W" || w.face === "Y");
        
        const wWalls = horizontal.filter(w => !w.face || w.face === "W").sort((a, b) => a.x - b.x);
        const yWalls = horizontal.filter(w => w.face === "Y").sort((a, b) => b.x - a.x);

        return [
          { type: "Y", yPos, zWall: pavZWall, midWalls: yWalls, xWall: pavXWall },
          { type: "W", yPos, zWall: pavZWall, midWalls: wWalls, xWall: pavXWall }
        ].filter(r => r.midWalls.length > 0 || r.zWall || r.xWall);
      });

      return {
        pavilionNum: pavilionGroups.indexOf(group) + 1,
        rows,
      };
    });

    return { pavilions, hasAny: withImage.length > 0 };
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

  const ElevationRow = ({ endLeft, midWalls, endRight, rowLabel, mirrorH }) => {
    const hasContent = endLeft || midWalls.length > 0 || endRight;
    if (!hasContent) return null;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rowLabel}</span>
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
        className="flex-1 overflow-hidden relative select-none bg-gray-50"
        style={{ cursor: "grab" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            adjustZoom(e.deltaY < 0 ? 1 : -1);
          } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
          }
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            position: "absolute",
            top: 40,
            left: 40,
            paddingBottom: "100px",
          }}
        >
          <div className="flex flex-col" style={{ width: "max-content", gap: `${Math.round((zoom / 100) * 128)}px` }}>
            {pavilions.map((pav) => (
              <div key={pav.pavilionNum} className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 64)}px` }}>
                <div className="text-sm font-bold text-gray-800 uppercase tracking-widest ml-1 px-3 py-2 bg-orange-100 rounded w-fit">
                  Pavilion {pav.pavilionNum}
                </div>
                <div className="flex flex-col" style={{ gap: `${Math.round((zoom / 100) * 64)}px` }}>
                  {pav.rows.map((row, idx) => (
                    <ElevationRow
                      key={`${pav.pavilionNum}-${row.yPos}-${row.type}`}
                      endLeft={row.zWall}
                      midWalls={row.midWalls}
                      endRight={row.xWall}
                      rowLabel={row.type === "Y" ? "Y face (outside / top)" : "W face (outside / bottom)"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}