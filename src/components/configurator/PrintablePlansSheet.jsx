import React, { useState, useEffect } from "react";
import PrintPDFModal from "./PrintPDFModal";

const CELL_M = 0.6;
const PX_PER_M = 100;
const PRINT_SCALE = 0.55;

async function toDataURL(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function PrintablePlansSheet({ placedModules, furniture = [], walls = [], onClose, printDetails = {}, paperSize = "a4", showLabels = true, showFurniture = true, showPhotoImages = true, showDimensions = true }) {
  const [imageMap, setImageMap] = useState({});
  const [imagesReady, setImagesReady] = useState(false);

  const modules = placedModules || [];
  const scale = paperSize === "a3" ? 1.5 : PRINT_SCALE;

  // Pre-load all images as base64
  useEffect(() => {
    const urls = [];
    if (showPhotoImages) {
      modules.forEach(m => { if (m.floorPlanImage) urls.push(m.floorPlanImage); });
    }
    furniture.forEach(f => { if (f.image) urls.push(f.image); });

    if (urls.length === 0) { setImagesReady(true); return; }

    const unique = [...new Set(urls)];
    Promise.all(unique.map(async url => [url, await toDataURL(url)]))
      .then(entries => {
        const map = {};
        entries.forEach(([url, data]) => { if (data) map[url] = data; });
        setImageMap(map);
        setImagesReady(true);
      });
  }, []);

  // Calculate grid bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  modules.forEach(m => {
    minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x + m.w);
    minY = Math.min(minY, m.y); maxY = Math.max(maxY, m.y + m.h);
  });
  furniture.forEach(f => {
    const fw = (f.width || 1.4) / CELL_M, fd = (f.depth || 2.0) / CELL_M;
    minX = Math.min(minX, f.x - fw / 2); maxX = Math.max(maxX, f.x + fw / 2);
    minY = Math.min(minY, f.y - fd / 2); maxY = Math.max(maxY, f.y + fd / 2);
  });
  walls.forEach(w => {
    minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x + (w.orientation === "horizontal" ? w.length : w.thickness));
    minY = Math.min(minY, w.y); maxY = Math.max(maxY, w.y + (w.orientation === "vertical" ? w.length : w.thickness));
  });
  if (modules.length === 0 && furniture.length === 0) { minX = 0; maxX = 10; minY = 0; maxY = 10; }

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
        const imgSrc = showPhotoImages && mod.floorPlanImage ? (imageMap[mod.floorPlanImage] || null) : null;
        return (
          <g key={mod.id}>
            <g transform={transforms}>
              <rect x={0} y={0} width={w} height={h} fill="white" stroke="#111" strokeWidth="2" />
              {imgSrc && <image x={0} y={0} width={w} height={h} href={imgSrc} preserveAspectRatio="xMidYMid slice" />}
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
        return <rect key={wall.id} x={wx} y={wy} width={wallW} height={wallH} fill="#4B5563" stroke="#2d3748" strokeWidth="1" />;
      })}
      {showFurniture && furniture.map((f) => {
        const fWidth = ((f.width || 1.4) / CELL_M) * CELL_SIZE;
        const fDepth = ((f.depth || 2.0) / CELL_M) * CELL_SIZE;
        const fx = (f.x - minX + 1) * CELL_SIZE;
        const fy = (f.y - minY + 1) * CELL_SIZE;
        const transforms = [`translate(${fx + fWidth / 2}, ${fy + fDepth / 2})`, `rotate(${f.rotation || 0})`, `translate(${-fWidth / 2}, ${-fDepth / 2})`].join(" ");
        const fImgSrc = f.image ? (imageMap[f.image] || null) : null;
        return (
          <g key={f.id} transform={transforms}>
            <rect x={0} y={0} width={fWidth} height={fDepth} fill={fImgSrc ? "white" : "#FFB3A8"} />
            {fImgSrc && <image x={0} y={0} width={fWidth} height={fDepth} href={fImgSrc} preserveAspectRatio="xMidYMid meet" />}
            {!fImgSrc && <text x={fWidth/2} y={fDepth/2+3} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#666">{f.label || f.type}</text>}
          </g>
        );
      })}
    </svg>
  );

  if (!imagesReady) return null;

  return (
    <PrintPDFModal
      title="Floor Plan"
      printDetails={printDetails}
      onClose={onClose}
      pages={[{ content: floorPlanContent, sheet: "Floor Plan", pageNum: 1, totalPages: 1 }]}
    />
  );
}