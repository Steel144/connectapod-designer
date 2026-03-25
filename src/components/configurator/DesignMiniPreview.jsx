import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DesignMiniPreview({ grid = [], walls = [], furniture = [], floorPlanImages: propFloorPlanImages, wallImages: propWallImages }) {
  const CELL = 6; // pixels per grid cell
  const [hoveredItem, setHoveredItem] = useState(null); // { label, width, depth, image, svgX, svgY }
  const [hoveredModule, setHoveredModule] = useState(null); // { label, type, sqm, price }

  const { data: queryFloorPlanImages = {} } = useQuery({
    queryKey: ["floorPlanImages", "miniPreview"],
    queryFn: async () => {
      const images = await base44.entities.FloorPlanImage.list();
      return Object.fromEntries(images.map(img => [img.moduleType, img.imageUrl]));
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: queryWallImages = {} } = useQuery({
    queryKey: ["wallImages", "miniPreview"],
    queryFn: async () => {
      const images = await base44.entities.WallImage.list();
      return Object.fromEntries(images.map(img => [img.wallType, img.imageUrl]));
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const floorPlanImages = propFloorPlanImages || queryFloorPlanImages;
  const wallImages = propWallImages || queryWallImages;

  const bounds = useMemo(() => {
    if (grid.length === 0) return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const xs = grid.map((m) => m.x);
    const ys = grid.map((m) => m.y);
    const xe = grid.map((m) => m.x + (m.w || 5));
    const ye = grid.map((m) => m.y + (m.h || 8));
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xe),
      maxY: Math.max(...ye),
    };
  }, [grid]);

  const PAD = 2; // cells of padding
  const W = (bounds.maxX - bounds.minX + PAD * 2) * CELL;
  const H = (bounds.maxY - bounds.minY + PAD * 2) * CELL;

  const toX = (x) => (x - bounds.minX + PAD) * CELL;
  const toY = (y) => (y - bounds.minY + PAD) * CELL;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
      {/* Furniture hover tooltip */}
      {hoveredItem && (
        <div className="absolute z-20 bg-white border border-gray-200 shadow-lg p-2 rounded pointer-events-none text-left"
          style={{ bottom: 4, right: 4, maxWidth: 140 }}>
          {hoveredItem.image && (
            <img src={hoveredItem.image} alt={hoveredItem.label} className="w-full h-16 object-contain mb-1 bg-gray-50" />
          )}
          <p className="text-[10px] font-semibold text-gray-800 leading-tight">{hoveredItem.label}</p>
          <p className="text-[9px] text-gray-500">{hoveredItem.width?.toFixed(1)}m × {hoveredItem.depth?.toFixed(1)}m</p>
        </div>
      )}
      {/* Module hover tooltip */}
      {hoveredModule && !hoveredItem && (
        <div className="absolute z-20 bg-white border border-gray-200 shadow-lg p-2 rounded pointer-events-none text-left"
          style={{ bottom: 4, right: 4, maxWidth: 140 }}>
          <p className="text-[10px] font-semibold text-gray-800 leading-tight">{hoveredModule.label}</p>
          <p className="text-[9px] text-gray-500">{hoveredModule.type}</p>
          {hoveredModule.sqm > 0 && <p className="text-[9px] text-gray-500">{hoveredModule.sqm?.toFixed(1)} m²</p>}
          {hoveredModule.price > 0 && <p className="text-[9px] font-semibold text-[#F15A22]">${hoveredModule.price?.toLocaleString()}</p>}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {grid.map((m, i) => {
            const imgUrl = m.floorPlanImage || floorPlanImages[m.type] || (m.originalCode && floorPlanImages[m.originalCode]);
            if (!imgUrl) return null;
            return (
              <pattern
                key={`pat-${m.id || i}`}
                id={`img-${m.id || i}`}
                patternUnits="userSpaceOnUse"
                x={toX(m.x)}
                y={toY(m.y)}
                width={(m.w || 5) * CELL}
                height={(m.h || 8) * CELL}
              >
                <image
                  href={imgUrl}
                  x={0}
                  y={0}
                  width={(m.w || 5) * CELL}
                  height={(m.h || 8) * CELL}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            );
          })}
          {walls.map((w, i) => {
            const imgUrl = w.elevationImage || wallImages[w.type];
            if (!imgUrl) return null;
            const isH = w.orientation === "horizontal";
            const ww = isH ? (w.length || 5) * CELL : (w.thickness || 0.31) * CELL;
            const wh = isH ? (w.thickness || 0.31) * CELL : (w.length || 5) * CELL;
            return (
              <pattern
                key={`wall-pat-${w.id || i}`}
                id={`wall-img-${w.id || i}`}
                patternUnits="userSpaceOnUse"
                x={toX(w.x)}
                y={toY(w.y)}
                width={Math.max(ww, 1)}
                height={Math.max(wh, 1)}
              >
                <image
                  href={imgUrl}
                  x={0}
                  y={0}
                  width={Math.max(ww, 1)}
                  height={Math.max(wh, 1)}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            );
          })}
        </defs>

        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill="#F5F5F3" />

        {/* Modules */}
        {grid.map((m, i) => {
          const imgUrl = m.floorPlanImage || floorPlanImages[m.type] || (m.originalCode && floorPlanImages[m.originalCode]);
          return (
            <g key={m.id || i}
              onMouseEnter={() => setHoveredModule({ label: m.label, type: m.type, sqm: m.sqm, price: m.price })}
              onMouseLeave={() => setHoveredModule(null)}
              style={{ cursor: "default" }}
            >
              <rect
                x={toX(m.x)}
                y={toY(m.y)}
                width={(m.w || 5) * CELL}
                height={(m.h || 8) * CELL}
                fill={imgUrl ? `url(#img-${m.id || i})` : "#FDF0EB"}
                stroke="#F15A22"
                strokeWidth={0.8}
              />
            </g>
          );
        })}

        {/* Furniture */}
        {furniture.map((item, i) => {
          const fw = (item.width || 1.4) / 0.6 * CELL;
          const fh = (item.depth || 1.4) / 0.6 * CELL;
          const cx = toX(item.x) + fw / 2;
          const cy = toY(item.y) + fh / 2;
          return (
            <g key={`furn-${item.id || i}`} transform={`rotate(${item.rotation || 0}, ${cx}, ${cy})`}>
              {item.image ? (
                <image
                  href={item.image}
                  x={toX(item.x)}
                  y={toY(item.y)}
                  width={fw}
                  height={fh}
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <rect
                  x={toX(item.x)}
                  y={toY(item.y)}
                  width={fw}
                  height={fh}
                  fill="#e5e7eb"
                  stroke="#9ca3af"
                  strokeWidth={0.5}
                />
              )}
            </g>
          );
        })}

        {/* Walls */}
        {walls.map((w, i) => {
          const isH = w.orientation === "horizontal";
          const ww = isH ? (w.length || 5) * CELL : (w.thickness || 0.31) * CELL;
          const wh = isH ? (w.thickness || 0.31) * CELL : (w.length || 5) * CELL;
          const imgUrl = w.elevationImage || wallImages[w.type];
          return (
            <rect
              key={w.id || i}
              x={toX(w.x)}
              y={toY(w.y)}
              width={Math.max(ww, 1)}
              height={Math.max(wh, 1)}
              fill={imgUrl ? `url(#wall-img-${w.id || i})` : "#4B5563"}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}