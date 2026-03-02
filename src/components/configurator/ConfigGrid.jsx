import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { MODULE_TYPES } from "./ModulePanel";

const CELL_SIZE = 120;
const GRID_COLS = 3;
const GRID_ROWS = 5;

export default function ConfigGrid({ placedModules, onPlace, onRemove, onMove }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [draggingMod, setDraggingMod] = useState(null);
  const [draggingPlacedId, setDraggingPlacedId] = useState(null);
  const gridRef = useRef(null);

  const getCellFromEvent = (e) => {
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    return { x, y };
  };

  const canPlace = (mod, cx, cy, excludeId = null) => {
    if (cx < 0 || cy < 0 || cx + mod.w > GRID_COLS || cy + mod.h > GRID_ROWS) return false;
    for (let dx = 0; dx < mod.w; dx++) {
      for (let dy = 0; dy < mod.h; dy++) {
        if (isOccupied(cx + dx, cy + dy, excludeId)) return false;
      }
    }
    return true;
  };

  const isOccupied = (x, y, excludeId = null) => {
    return placedModules.some((m) => {
      if (m.id === excludeId) return false;
      return x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h;
    });
  };

  const canPlace = (mod, cx, cy) => {
    if (cx < 0 || cy < 0 || cx + mod.w > GRID_COLS || cy + mod.h > GRID_ROWS) return false;
    for (let dx = 0; dx < mod.w; dx++) {
      for (let dy = 0; dy < mod.h; dy++) {
        if (isOccupied(cx + dx, cy + dy)) return false;
      }
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const modType = e.dataTransfer.getData("moduleType");
    const mod = MODULE_TYPES.find((m) => m.type === modType);
    if (!mod || !gridRef.current) return;
    const { x, y } = getCellFromEvent(e);
    if (canPlace(mod, x, y)) {
      onPlace(mod, x, y);
    }
    setDragOverCell(null);
    setDraggingMod(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!gridRef.current) return;
    const { x, y } = getCellFromEvent(e);
    setDragOverCell({ x, y });
  };

  const getPreviewCells = () => {
    if (!dragOverCell || !draggingMod) return [];
    const cells = [];
    for (let dx = 0; dx < draggingMod.w; dx++) {
      for (let dy = 0; dy < draggingMod.h; dy++) {
        cells.push({ x: dragOverCell.x + dx, y: dragOverCell.y + dy });
      }
    }
    return cells;
  };

  const previewCells = getPreviewCells();
  const previewValid = draggingMod && dragOverCell && canPlace(draggingMod, dragOverCell.x, dragOverCell.y);

  return (
    <div className="overflow-auto">
      <div
        ref={gridRef}
        className="relative select-none"
        style={{
          width: GRID_COLS * CELL_SIZE,
          height: GRID_ROWS * CELL_SIZE,
          backgroundImage: `
            linear-gradient(to right, #E2E8F0 1px, transparent 1px),
            linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          backgroundColor: "#F8FAFC",
          borderRadius: 0,
          border: "1.5px solid #E2E8F0",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => { setDragOverCell(null); setDraggingMod(null); }}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Drop preview */}
        {previewCells.map((c, i) => (
          <div
            key={`preview-${i}`}
            className="absolute transition-all pointer-events-none"
            style={{
              left: c.x * CELL_SIZE + 2,
              top: c.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              backgroundColor: previewValid ? "rgba(99,102,241,0.15)" : "rgba(239,68,68,0.15)",
              border: `2px dashed ${previewValid ? "#6366F1" : "#EF4444"}`,
            }}
          />
        ))}

        {/* Placed modules */}
        {placedModules.map((mod) => (
          <div
            key={mod.id}
            className="absolute rounded-xl flex flex-col items-center justify-center group cursor-default transition-shadow hover:shadow-lg"
            style={{
              left: mod.x * CELL_SIZE + 3,
              top: mod.y * CELL_SIZE + 3,
              width: mod.w * CELL_SIZE - 6,
              height: mod.h * CELL_SIZE - 6,
              backgroundColor: mod.color,
              border: `2px solid ${mod.border}`,
            }}
          >
            <span className="text-2xl">{mod.icon}</span>
            <span className="text-xs font-semibold text-slate-600 mt-1 text-center leading-tight px-1">{mod.label}</span>
            <button
              onClick={() => onRemove(mod.id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm hover:bg-red-50"
            >
              <X size={12} className="text-red-400" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Grid: {GRID_COLS}×{GRID_ROWS} cells · Each cell = 2.5m²
      </p>
    </div>
  );
}