import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import HorizontalElevation from "./HorizontalElevation";
import VerticalElevation from "./VerticalElevation";

const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 4.2;

const getPavilion = (wallY) => {
  if (wallY >= 9 && wallY < 13) return 3;
  if (wallY >= 19 && wallY < 20) return 2;
  if (wallY >= 26 && wallY < 30) return 1;
  return null;
};

const getModulePavilion = (mod) => {
  if (mod.y < 13 && mod.y + mod.h > 9) return 3;
  if (mod.y < 20 && mod.y + mod.h > 19) return 2;
  if (mod.y < 30 && mod.y + mod.h > 26) return 1;
  return null;
};

export default function CombinedElevations({ walls = [], placedModules = [], stickyTop = 0, navBarHeight = 0, showHeader = true, onWallSelect }) {
  const [zoom, setZoom] = useState(50);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const centeredRef = useRef(false);

  useEffect(() => {
    if (!centeredRef.current && containerRef.current && contentRef.current) {
      setTimeout(() => {
        const scrollWidth = contentRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        containerRef.current.scrollLeft = (scrollWidth - containerWidth) / 2;
        centeredRef.current = true;
      }, 0);
    }
  }, []);

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

  const scale = zoom / 100;
  const wallHPx = Math.round(scale * WALL_H_M * PX_PER_M);
  const endElevationHPx = wallHPx;

  const { minX, maxX, allMinY, allMaxY, wElevation, yElevation, zElevation, xElevation } = useElevationGeometry(placedModules, walls);
  
  const slotOffset1Z = -0.02;
  const slotOffset2Z = 0.14;
  const slotOffset3Z = 0;
  const slotOffset1X = -0.02;
  const slotOffset2X = 0.15;
  const slotOffset3X = 0;
  const slotScale3X = 1.1;
  const labelMapZ = { 1: "P1", 2: "C", 3: "P2" };
  const labelMapX = { 1: "P2", 2: "C", 3: "P1" };

  if (placedModules.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Place modules to view elevations</p>
      </div>
    );
  }

  const totalWidthCells = maxX - minX;
  const totalWidthPx = Math.round(scale * totalWidthCells * CELL_M * PX_PER_M);
  const totalDepthCells = allMaxY - allMinY;
  const zoomBarHeight = 48;

  // Get pavilion walls data
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

  const pavilionModules = {
    1: placedModules.filter(m => getModulePavilion(m) === 1),
    2: placedModules.filter(m => getModulePavilion(m) === 2),
    3: placedModules.filter(m => getModulePavilion(m) === 3),
  };

  const hasPavilions = Object.values(pavilionModules).some(arr => arr.length > 0);

  const imgHeight = Math.round((zoom / 100) * 480);

  const ElevationImage = ({ wall, label, face }) => {
    const wallWidthM = wall.width ?? (wall.length ? wall.length * CELL_M : CELL_M);
    const wallWidthPx = Math.round((zoom / 100) * wallWidthM * 100);
    return (
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div
          className="overflow-hidden bg-white border border-gray-200 cursor-pointer"
          style={{ height: `${imgHeight}px`, width: wall.elevationImage ? "auto" : `${wallWidthPx}px` }}
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
              <span className="text-[10px] font-semibold text-gray-400 text-center px-1 leading-tight">No wall</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <span className="inline-block bg-[#F15A22] text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
            {face}
          </span>
          <p className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{label}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white flex flex-col">
      {showHeader && (
        <div className="fixed z-20 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200" style={{ top: stickyTop, left: 0, right: 0 }}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">All Elevations</span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => adjustZoom(-1)} disabled={zoom <= zoomLevels[0]} className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
              <ZoomOut size={15} />
            </button>
            <button onClick={() => { setZoom(50); }} className="min-w-[52px] text-center text-xs font-semibold text-gray-600 hover:text-[#F15A22] py-1 px-2 rounded hover:bg-white transition-all">
              {zoom}%
            </button>
            <button onClick={() => adjustZoom(1)} disabled={zoom >= zoomLevels[zoomLevels.length - 1]} className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
              <ZoomIn size={15} />
            </button>
          </div>
        </div>
      )}

      {showHeader && <div style={{ height: stickyTop + zoomBarHeight }} />}

      <div
        className="relative select-none bg-white overflow-x-auto overflow-y-hidden"
        style={{ minHeight: "500px" }}
        ref={containerRef}
      >
        <div ref={contentRef} style={{ padding: "40px", paddingLeft: "2400px", paddingRight: "1800px", display: "inline-block", minWidth: "max-content" }}>
          
          {/* Building Elevations Section */}
          <div style={{ display: "block", marginBottom: "60px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px", paddingLeft: "4px" }}>
              Building Elevations
            </div>
            
            {/* Z & X */}
            <div style={{ display: "inline-block", marginBottom: "40px", verticalAlign: "top" }}>
              <div style={{ display: "inline-block", marginRight: "16px", verticalAlign: "top" }}>
                <VerticalElevation 
                  layers={zElevation} 
                  label="Z — West Elevation" 
                  color="#f59e0b"
                  totalDepthCells={totalDepthCells}
                  endElevationHPx={endElevationHPx}
                  scale={scale}
                  CELL_M={CELL_M}
                  PX_PER_M={PX_PER_M}
                  WALL_H_M={WALL_H_M}
                  slotOffsets={{ 1: slotOffset1Z, 2: slotOffset2Z, 3: slotOffset3Z }}
                  labelMap={labelMapZ}
                />
              </div>
              <div style={{ display: "inline-block", verticalAlign: "top" }}>
                <VerticalElevation 
                  layers={xElevation} 
                  label="X — East Elevation" 
                  color="#ef4444"
                  totalDepthCells={totalDepthCells}
                  endElevationHPx={endElevationHPx}
                  scale={scale}
                  CELL_M={CELL_M}
                  PX_PER_M={PX_PER_M}
                  WALL_H_M={WALL_H_M}
                  slotOffsets={{ 1: slotOffset1X, 2: slotOffset2X, 3: slotOffset3X }}
                  slotScales={{ 3: slotScale3X }}
                  labelMap={labelMapX}
                />
              </div>
            </div>
            
            {/* W & Y */}
            <HorizontalElevation 
              layers={wElevation} 
              label="W — North Elevation" 
              color="#22c55e"
              totalWidthPx={totalWidthPx}
              wallHPx={wallHPx}
              scale={scale}
              CELL_M={CELL_M}
              PX_PER_M={PX_PER_M}
            />
            <HorizontalElevation 
              layers={yElevation} 
              label="Y — South Elevation" 
              color="#3b82f6"
              totalWidthPx={totalWidthPx}
              wallHPx={wallHPx}
              scale={scale}
              CELL_M={CELL_M}
              PX_PER_M={PX_PER_M}
            />
          </div>

          {/* Pavilion Elevations Section */}
          {hasPavilions && (
            <div style={{ display: "block" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px", paddingLeft: "4px" }}>
                Pavilion Elevations
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
                {[3, 2, 1].map(pavNum => {
                  const mods = pavilionModules[pavNum];
                  if (!mods || mods.length === 0) return null;

                  const pavLabels = { 3: "Pavilion 1", 2: "Connection", 1: "Pavilion 2" };
                  const pavLabel = pavLabels[pavNum];

                  return (
                    <div key={pavNum} style={{ display: "inline-block", verticalAlign: "top" }}>
                      <div style={{ fontSize: "11px", fontWeight: "bold", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", marginBottom: "16px", width: "fit-content" }}>
                        {pavLabel}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {(pavNum === 2 ? ["Z", "X"] : ["Y", "W"]).map(face => {
                          const faceLabels = { Y: "Y Face (Outside/Top)", W: "W Face (Outside/Bottom)", Z: "Z Face (West)", X: "X Face (East)" };
                          const hasAny = mods.some(mod => findWall(mod, face));
                          if (!hasAny) return null;
                          return (
                            <div key={face}>
                              <div style={{ fontSize: "10px", color: "#666", marginBottom: "12px", fontWeight: "500" }}>{faceLabels[face]}</div>
                              <div style={{ display: "flex", gap: "2px", minWidth: "max-content" }}>
                                {mods.map((mod, idx) => {
                                  const wall = findWall(mod, face);
                                  return wall ? (
                                    <ElevationImage key={`${pavNum}-${face}-${idx}`} wall={wall} label={`${face}${idx + 1}`} face={face} />
                                  ) : null;
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}