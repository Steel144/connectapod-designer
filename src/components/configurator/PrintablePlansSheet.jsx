import React from "react";
import PrintPDFModal from "./PrintPDFModal";

const CELL_M = 0.6;
const PX_PER_M = 100;
const PRINT_SCALE = 0.55;



export default function PrintablePlansSheet({ placedModules, furniture = [], walls = [], onClose, printDetails = {}, paperSize = "a4", showLabels = true, showFurniture = true, showPhotoImages = true, showDimensions = true }) {

  const modules = placedModules || [];
  const totalSqm = modules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const totalPrice = modules.reduce((sum, m) => sum + (m.price || 0), 0);
  
  const scale = paperSize === "a3" ? 1.5 : PRINT_SCALE;

  // Calculate grid bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  modules.forEach(m => {
    minX = Math.min(minX, m.x);
    maxX = Math.max(maxX, m.x + m.w);
    minY = Math.min(minY, m.y);
    maxY = Math.max(maxY, m.y + m.h);
  });
  furniture.forEach(f => {
    const fWidthGridUnits = (f.width || 1.4) / CELL_M;
    const fDepthGridUnits = (f.depth || 2.0) / CELL_M;
    minX = Math.min(minX, f.x - fWidthGridUnits / 2);
    maxX = Math.max(maxX, f.x + fWidthGridUnits / 2);
    minY = Math.min(minY, f.y - fDepthGridUnits / 2);
    maxY = Math.max(maxY, f.y + fDepthGridUnits / 2);
  });
  walls.forEach(w => {
    minX = Math.min(minX, w.x);
    maxX = Math.max(maxX, w.x + (w.orientation === "horizontal" ? w.length : w.thickness));
    minY = Math.min(minY, w.y);
    maxY = Math.max(maxY, w.y + (w.orientation === "vertical" ? w.length : w.thickness));
  });

  if (modules.length === 0 && furniture.length === 0) {
    minX = 0; maxX = 10; minY = 0; maxY = 10;
  }

  const gridWidth = Math.max(maxX - minX, 0) + 2;
  const gridHeight = Math.max(maxY - minY, 0) + 2;
  const CELL_SIZE = scale * CELL_M * PX_PER_M;
  const canvasWidth = gridWidth * CELL_SIZE;
  const canvasHeight = gridHeight * CELL_SIZE;



  const floorPlanContent = (
    <svg
      width={canvasWidth}
      height={canvasHeight}
      style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
          <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={canvasWidth} height={canvasHeight} fill="white" />
      <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />
      {modules.map((mod) => {
        const x = (mod.x - minX + 1) * CELL_SIZE;
        const y = (mod.y - minY + 1) * CELL_SIZE;
        const w = mod.w * CELL_SIZE;
        const h = mod.h * CELL_SIZE;
        const transforms = [
          `translate(${x + w / 2}, ${y + h / 2})`,
          `rotate(${mod.rotation || 0})`,
          mod.flipped ? "scale(-1, 1)" : "",
          `translate(${-w / 2}, ${-h / 2})`
        ].filter(Boolean).join(" ");
        return (
          <g key={mod.id}>
            <g transform={transforms}>
              <rect x={0} y={0} width={w} height={h} fill="white" stroke="#111" strokeWidth="2" />
              {showPhotoImages && mod.floorPlanImage && (
                <image x={0} y={0} width={w} height={h} href={mod.floorPlanImage} preserveAspectRatio="xMidYMid slice" crossOrigin="anonymous" />
              )}
            </g>
            <g transform={transforms}>
              {[...Array(mod.w)].map((_, i) => <line key={`v-${i}`} x1={(i+1)*CELL_SIZE} y1={0} x2={(i+1)*CELL_SIZE} y2={h} stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5" />)}
              {[...Array(mod.h)].map((_, i) => <line key={`h-${i}`} x1={0} y1={(i+1)*CELL_SIZE} x2={w} y2={(i+1)*CELL_SIZE} stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5" />)}
            </g>
          </g>
        );
      })}
      {walls.map((wall) => {
        const wallW = wall.orientation === "horizontal" ? wall.length * CELL_SIZE : wall.thickness * CELL_SIZE;
        const wallH = wall.orientation === "vertical" ? wall.length * CELL_SIZE : wall.thickness * CELL_SIZE;
        const wx = (wall.x - minX + 1) * CELL_SIZE;
        const wy = (wall.y - minY + 1) * CELL_SIZE;
        return (
          <g key={wall.id}>
            <rect x={wx} y={wy} width={wallW} height={wallH} fill="#4B5563" stroke="#2d3748" strokeWidth="1" />
          </g>
        );
      })}
      {showFurniture && furniture.map((f) => {
        const fWidth = ((f.width || 1.4) / CELL_M) * CELL_SIZE;
        const fDepth = ((f.depth || 2.0) / CELL_M) * CELL_SIZE;
        const fx = (f.x - minX + 1) * CELL_SIZE;
        const fy = (f.y - minY + 1) * CELL_SIZE;
        const transforms = [
          `translate(${fx + fWidth / 2}, ${fy + fDepth / 2})`,
          `rotate(${f.rotation || 0})`,
          `translate(${-fWidth / 2}, ${-fDepth / 2})`
        ].join(" ");
        return (
          <g key={f.id} transform={transforms}>
            <rect x={0} y={0} width={fWidth} height={fDepth} fill={f.image ? "white" : "#FFB3A8"} />
            {f.image && <image x={0} y={0} width={fWidth} height={fDepth} href={f.image} preserveAspectRatio="xMidYMid meet" crossOrigin="anonymous" />}
            {!f.image && <text x={fWidth/2} y={fDepth/2+3} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#666">{f.label || f.type}</text>}
          </g>
        );
      })}
    </svg>
  );

  return (
    <PrintPDFModal
      title="Floor Plan"
      printDetails={printDetails}
      onClose={onClose}
      pages={[{ content: floorPlanContent, sheet: "Floor Plan", pageNum: 1, totalPages: 1 }]}
    />
  );
}