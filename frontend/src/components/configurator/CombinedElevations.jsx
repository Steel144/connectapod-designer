import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import HorizontalElevation from "./HorizontalElevation";
import VerticalElevation from "./VerticalElevation";
import ElevationSlot from "./ElevationSlot";

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

export default function CombinedElevations({ walls = [], placedModules = [], stickyTop = 0, navBarHeight = 0, showHeader = true, onWallSelect, selectedWall = null, wallTypes = [], onWallReplace, onOpenWallsMenu, customWalls = [] }) {
   const [replaceOpen, setReplaceOpen] = React.useState(false);
  const [zoom, setZoom] = useState(50);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const centeredRef = useRef(false);

  useEffect(() => {
    if (!centeredRef.current && containerRef.current && contentRef.current) {
      setTimeout(() => {
        // Start from left side of actual content (skip the left padding)
        // The content has 2400px left padding, so scroll to that position
        containerRef.current.scrollLeft = 2300; // Slight offset from padding edge
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

  console.log("CombinedElevations - placedModules:", placedModules.length, "walls:", walls.length);
  
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

  // Global max module depth — ensures ALL Z/X elevations (building + pavilion) render at the same width
  const globalMaxDepthCells = Math.max(...placedModules.map(m => m.h));

  // Get pavilion walls data - improved logic matching main building
  const findWall = (mod, face) => {
    const WALL_OFFSET = 0.31;
    
    // For Z and X, find walls within the module's depth range
    if (face === "Z" || face === "X") {
      const candidates = walls.filter(w => {
        if (w.face !== face) return false;
        // Wall should be within module's Y range (depth)
        const withinDepth = w.y >= mod.y - 1 && w.y < mod.y + mod.h + 1;
        if (!withinDepth) return false;
        
        if (face === "Z") {
          // Z face is at left edge (mod.x)
          const nearLeft = Math.abs(w.x - mod.x) < 2;
          return nearLeft;
        }
        if (face === "X") {
          // X face is at right edge (mod.x + mod.w)
          const nearRight = Math.abs(w.x - (mod.x + mod.w - WALL_OFFSET)) < 2;
          return nearRight;
        }
        return false;
      });
      
      if (candidates.length === 0) return null;
      
      // Pick the wall closest to expected position
      const expectedX = face === "Z" ? mod.x : (mod.x + mod.w - WALL_OFFSET);
      return candidates.sort((a, b) => Math.abs(a.x - expectedX) - Math.abs(b.x - expectedX))[0];
    }
    
    // For W and Y, use simple position matching
    return walls.find(w => {
      if (w.face !== face) return false;
      if (face === "Y") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y + mod.h)) < 0.5;
      if (face === "W") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y - WALL_OFFSET)) < 0.5;
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

  const ElevationImage = ({ wall, label, face, isPavilion = false, forceWidth = null }) => {
    const wallWidthM = wall.width ?? (wall.length ? wall.length * CELL_M : CELL_M);
    const wallWidthPx = Math.round((zoom / 100) * wallWidthM * 100);
    const isSelected = selectedWall?.id === wall.id;
    
    // Use forced width for pavilions to ensure correct dimensional scaling
    const containerWidth = forceWidth ?? (wall.elevationImage ? "auto" : `${wallWidthPx}px`);
    const imageWidth = forceWidth ? "100%" : "auto";
    
    return (
      <div className="flex flex-col items-center gap-2 shrink-0 relative">
        <div
          className={`overflow-hidden bg-white border transition-colors relative ${isSelected ? "border-blue-500 shadow-md" : (isPavilion ? "border-[#F15A22] hover:border-orange-600 cursor-pointer hover:shadow-md" : "border-gray-200 cursor-pointer hover:border-[#F15A22]")}`}
          style={{ height: `${imgHeight}px`, width: containerWidth }}
          onClick={() => onWallSelect?.(wall)}
        >
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWallsMenu?.(wall);
              }}
              className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600 transition-colors"
              title="Replace wall"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {wall.elevationImage ? (
            <img
              src={wall.elevationImage}
              alt={label}
              style={{ height: "100%", width: imageWidth, display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined, pointerEvents: "none", objectFit: forceWidth ? "fill" : "contain" }}
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
                  globalMaxDepthCells={globalMaxDepthCells}
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
                  globalMaxDepthCells={globalMaxDepthCells}
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
              flip={true}
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
            <div style={{ display: "block", marginTop: "80px", paddingTop: "40px", borderTop: "2px solid #e5e7eb" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "40px" }}>
                Pavilion Elevations
              </div>
              
              {[3, 2, 1].map(pavNum => {
                const mods = pavilionModules[pavNum];
                if (!mods || mods.length === 0) return null;

                const pavLabels = { 3: "Pavilion 1", 2: "Connection", 1: "Pavilion 2" };
                const pavLabel = pavLabels[pavNum];

                return (
                  <div key={pavNum} style={{ marginBottom: "60px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", backgroundColor: "#fed7aa", color: "#000", padding: "10px 16px", borderRadius: "4px", marginBottom: "32px", width: "fit-content" }}>
                      {pavLabel}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                      {["W", "Y", "Z", "X"].map(face => {
                        const faceLabels = { 
                          Y: "Y — South Elevation", 
                          W: "W — North Elevation", 
                          Z: "Z — West Elevation", 
                          X: "X — East Elevation" 
                        };
                        const hasAny = mods.some(mod => findWall(mod, face));
                        if (!hasAny) return null;
                        
                        // Determine if this is a vertical (side) or horizontal (front/back) elevation
                        const isVerticalElevation = face === "Z" || face === "X";
                        
                        // Calculate pavilion bounds based on elevation type
                        let pavMinCoord, pavMaxCoord, pavWidthCells, pavWidthPx;
                        
                        if (isVerticalElevation) {
                          // For Z and X (vertical elevations), use Y-axis (depth)
                          pavMinCoord = Math.min(...mods.map(m => m.y));
                          pavMaxCoord = Math.max(...mods.map(m => m.y + m.h));
                          pavWidthCells = pavMaxCoord - pavMinCoord;
                          // Use globalMaxDepthCells for consistent container sizing
                          pavWidthPx = Math.round(scale * globalMaxDepthCells * CELL_M * PX_PER_M * 1.1);
                        } else {
                          // For W and Y (horizontal elevations), use X-axis (width)
                          pavMinCoord = Math.min(...mods.map(m => m.x));
                          pavMaxCoord = Math.max(...mods.map(m => m.x + m.w));
                          pavWidthCells = pavMaxCoord - pavMinCoord;
                          pavWidthPx = Math.round(scale * pavWidthCells * CELL_M * PX_PER_M);
                        }
                        
                        // Apply flip for W (North) elevation like main building
                        const shouldFlip = face === "W";
                        
                        return (
                          <div key={face} style={{ display: "block", marginBottom: "40px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "bold", color: "black", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", width: "fit-content", marginLeft: "4px", marginBottom: "16px" }}>
                              {faceLabels[face]}
                            </div>
                            
                            {/* Elevation images with dividers */}
                            <div style={{ 
                              position: "relative", 
                              display: "inline-block", 
                              width: pavWidthPx, 
                              height: wallHPx, 
                              backgroundColor: "#f9fafb",
                              transform: shouldFlip ? "scaleX(-1)" : undefined
                            }}>
                              {mods.map((mod, idx) => {
                                const wall = findWall(mod, face);
                                if (!wall) return null;
                                
                                let offsetCells, widthCells;
                                
                                if (isVerticalElevation) {
                                  offsetCells = 0;
                                  widthCells = globalMaxDepthCells;
                                } else {
                                  offsetCells = mod.x - pavMinCoord;
                                  widthCells = mod.w;
                                }
                                
                                const leftPx = Math.round(scale * offsetCells * CELL_M * PX_PER_M);
                                const widthPx = isVerticalElevation 
                                  ? Math.round(scale * widthCells * CELL_M * PX_PER_M * 1.1)
                                  : Math.round(scale * widthCells * CELL_M * PX_PER_M);
                                
                                const wallWidthM = widthCells * CELL_M;
                                
                                const modifiedWall = shouldFlip ? {
                                  ...wall,
                                  flipped: !(wall.flipped || false),
                                  width: wallWidthM,
                                  length: widthCells
                                } : {
                                  ...wall,
                                  width: wallWidthM,
                                  length: widthCells
                                };
                                
                                return (
                                  <React.Fragment key={`${pavNum}-${face}-${mod.x}-${mod.y}`}>
                                    <ElevationSlot
                                      slot={{ wall: modifiedWall, face }}
                                      leftPx={leftPx}
                                      widthPx={widthPx}
                                      heightPx={wallHPx}
                                      objectFit="fill"
                                      showLabel={false}
                                    />
                                    {/* Orange divider line at module boundary */}
                                    {!isVerticalElevation && idx < mods.length - 1 && (
                                      <div style={{
                                        position: "absolute",
                                        left: leftPx + widthPx,
                                        top: 0,
                                        width: 2,
                                        height: "100%",
                                        backgroundColor: "#F15A22",
                                        zIndex: 10
                                      }} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              {/* Ground line */}
                              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 2 }} />
                            </div>
                            
                            {/* Wall labels underneath - never flipped */}
                            <div style={{ 
                              display: "flex", 
                              flexDirection: isVerticalElevation ? "column" : "row",
                              gap: isVerticalElevation ? "8px" : "0",
                              marginTop: "10px"
                            }}>
                              {mods.map((mod, idx) => {
                                const wall = findWall(mod, face);
                                if (!wall) return null;
                                
                                const widthCells = isVerticalElevation ? globalMaxDepthCells : mod.w;
                                const widthPx = isVerticalElevation 
                                  ? Math.round(scale * widthCells * CELL_M * PX_PER_M * 1.1)
                                  : Math.round(scale * widthCells * CELL_M * PX_PER_M);
                                
                                // Look up wall details from customWalls
                                const wallDetail = customWalls.find(cw => cw.code === wall.type);
                                const wallName = wall.label || wallDetail?.name || wall.type || "—";
                                const wallCode = wall.type || wallDetail?.code || "—";
                                const winH = wallDetail?.windowHeight;
                                const winW = wallDetail?.windowWidth;
                                const windowSize = (winH || winW) ? `${winH || "—"} x ${winW || "—"}mm` : null;
                                const doorH = wallDetail?.doorHeight;
                                const doorW = wallDetail?.doorWidth;
                                const doorSize = (doorH || doorW) ? `${doorH || "—"} x ${doorW || "—"}mm` : null;
                                
                                return (
                                  <div key={`label-${pavNum}-${face}-${mod.x}-${mod.y}`} style={{ 
                                    width: widthPx, 
                                    flexShrink: 0,
                                    borderLeft: !isVerticalElevation && idx > 0 ? "2px solid #F15A22" : undefined,
                                    paddingLeft: !isVerticalElevation && idx > 0 ? "6px" : "2px",
                                    paddingTop: "4px"
                                  }}>
                                    <div style={{ fontSize: Math.max(9, Math.round(scale * 11)), fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>
                                      {wallName}
                                    </div>
                                    <div style={{ fontSize: Math.max(8, Math.round(scale * 10)), color: "#6b7280", lineHeight: 1.3, fontFamily: "monospace" }}>
                                      {wallCode}
                                    </div>
                                    {windowSize && (
                                      <div style={{ fontSize: Math.max(8, Math.round(scale * 9)), color: "#9ca3af", lineHeight: 1.3 }}>
                                        Window: {windowSize}
                                      </div>
                                    )}
                                    {doorSize && (
                                      <div style={{ fontSize: Math.max(8, Math.round(scale * 9)), color: "#9ca3af", lineHeight: 1.3 }}>
                                        Door: {doorSize}
                                      </div>
                                    )}
                                  </div>
                                );
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
          )}
        </div>
      </div>
    </div>
  );
}