import React, { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import HorizontalElevation from "./HorizontalElevation";
import VerticalElevation from "./VerticalElevation";

const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 4.2;

export default function BuildingElevation({ walls = [], placedModules = [], stickyTop = 0, navBarHeight = 0 }) {
  const [zoom, setZoom] = useState(50);


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
  const hasConnectionModules = placedModules.some(m => m.chassis === "C" || (m.y >= 18 && m.y < 21 && m.h <= 2));
  const endElevationHPx = hasConnectionModules ? Math.round(wallHPx * 0.88) : wallHPx;

  const { minX, maxX, allMinY, allMaxY, wElevation, yElevation, zElevation, xElevation } = useElevationGeometry(placedModules, walls);
  
  const slotOffset2Z = 0.12;
  const slotOffset3Z = 0;
  const slotOffset2X = 0;
  const slotOffset3X = 0;
  const labelMapZ = { 1: "P1", 2: "C", 3: "P2" };
  const labelMapX = { 1: "P2", 2: "C", 3: "P1" };

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

  // Height of the zoom bar (approx 48px) — used to offset content below it
  const zoomBarHeight = 48;

  return (
    <div className="w-full bg-white flex flex-col">
      {/* Fixed zoom bar — stays in place during horizontal scroll */}
      <div className="fixed z-20 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200" style={{ top: stickyTop, left: 0, right: 0 }}>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Building Elevations — WXYZ</span>
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

      {/* Spacer so content starts below the fixed zoom bar */}
      <div style={{ height: stickyTop + zoomBarHeight }} />

      <div
        className="relative select-none bg-gray-50"

      >
        <div style={{ padding: "40px", display: "inline-flex", flexDirection: "column", gap: 48, minWidth: "max-content" }}>
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
          <div style={{ display: "flex", gap: 48, flexDirection: "row", width: "max-content", flexWrap: "nowrap" }}>
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
              slotOffsets={{ 2: slotOffset2Z, 3: slotOffset3Z }}
              labelMap={labelMapZ}
            />
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
              slotOffsets={{ 2: slotOffset2X, 3: slotOffset3X }}
              labelMap={labelMapX}
            />
          </div>
        </div>
      </div>
    </div>
  );
}