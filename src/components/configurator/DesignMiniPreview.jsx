import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DesignMiniPreview({ grid = [], walls = [] }) {
  const CELL = 6; // pixels per grid cell

  const { data: floorPlanImages = {} } = useQuery({
    queryKey: ["floorPlanImages", "miniPreview"],
    queryFn: async () => {
      const images = await base44.entities.FloorPlanImage.list();
      return Object.fromEntries(images.map(img => [img.moduleType, img.imageUrl]));
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: wallImages = {} } = useQuery({
    queryKey: ["wallImages", "miniPreview"],
    queryFn: async () => {
      const images = await base44.entities.WallImage.list();
      return Object.fromEntries(images.map(img => [img.wallType, img.imageUrl]));
    },
    staleTime: 0,
    refetchOnMount: true,
  });

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
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
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
        </defs>

        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill="#F5F5F3" />

        {/* Modules */}
        {grid.map((m, i) => {
          const imgUrl = m.floorPlanImage || floorPlanImages[m.type] || (m.originalCode && floorPlanImages[m.originalCode]);
          return (
            <g key={m.id || i}>
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

        {/* Walls */}
        {walls.map((w, i) => {
          const isH = w.orientation === "horizontal";
          const ww = isH ? (w.length || 5) * CELL : (w.thickness || 0.31) * CELL;
          const wh = isH ? (w.thickness || 0.31) * CELL : (w.length || 5) * CELL;
          return (
            <rect
              key={w.id || i}
              x={toX(w.x)}
              y={toY(w.y)}
              width={Math.max(ww, 1)}
              height={Math.max(wh, 1)}
              fill="#4B5563"
              opacity={0.6}
            />
          );
        })}
      </svg>
    </div>
  );
}