import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { MODULE_TYPES } from "./ModulePanel";

const CELL_W = 120;
const CELL_H = 192; // 120 * (4.8/3) to reflect 3x4.8m ratio
const GRID_COLS = 3;
const GRID_ROWS = 5;

export default function ConfigGrid({ placedModules, onPlace, onRemove, onMove }) {
  const [dragOverCell, setDragOverCell] = useState(null);
  const [draggingMod, setDraggingMod] = useState(null);       // from panel
  const [draggingPlaced, setDraggingPlaced] = useState(null); // existing placed module
  const gridRef = useRef(null);

  const getCellFromEvent = (e) => {
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_W);
    const y = Math.floor((e.clientY - rect.top) / CELL_H);
    return { x, y };
  };

  const isOccupied = (x, y, excludeId = null) => {
    return placedModules.some((m) => {
      if (m.id === excludeId) return false;
      return x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h;
    });
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

  const activeMod = draggingPlaced || draggingMod;

  const handleDrop = (e) => {
    e.preventDefault();
    if (!gridRef.current) return;
    const { x, y } = getCellFromEvent(e);

    if (draggingPlaced) {
      // Moving an existing placed module
      if (canPlace(draggingPlaced, x, y, draggingPlaced.id)) {
        onMove(draggingPlaced.id, x, y);
      }
    } else {
      // Dropping a new module from the panel
      const modType = e.dataTransfer.getData("moduleType");
      const mod = MODULE_TYPES.find((m) => m.type === modType);
      if (mod && canPlace(mod, x, y)) {
        onPlace(mod, x, y);
      }
    }

    setDragOverCell(null);
    setDraggingMod(null);
    setDraggingPlaced(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!gridRef.current) return;
    const { x, y } = getCellFromEvent(e);
    setDragOverCell({ x, y });
  };

  const getPreviewCells = () => {
    if (!dragOverCell || !activeMod) return [];
    const cells = [];
    for (let dx = 0; dx < activeMod.w; dx++) {
      for (let dy = 0; dy < activeMod.h; dy++) {
        cells.push({ x: dragOverCell.x + dx, y: dragOverCell.y + dy });
      }
    }
    return cells;
  };

  const previewCells = getPreviewCells();
  const previewValid = activeMod && dragOverCell &&
    canPlace(activeMod, dragOverCell.x, dragOverCell.y, draggingPlaced?.id);

  return (
    <div className="overflow-auto">
      <div
        ref={gridRef}
        className="relative select-none"
        style={{
          width: GRID_COLS * CELL_W,
          height: GRID_ROWS * CELL_H,
          backgroundImage: `
            linear-gradient(to right, #E2E8F0 1px, transparent 1px),
            linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_W}px ${CELL_H}px`,
          backgroundColor: "#F8FAFC",
          borderRadius: 0,
          border: "1.5px solid #E2E8F0",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => { setDragOverCell(null); }}
      >
        {/* Drop preview */}
        {previewCells.map((c, i) => (
          <div
            key={`preview-${i}`}
            className="absolute pointer-events-none"
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
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("placedModuleId", mod.id);
              setDraggingPlaced(mod);
              setDraggingMod(null);
            }}
            onDragEnd={() => { setDraggingPlaced(null); setDragOverCell(null); }}
            className="absolute flex flex-col items-center justify-center group cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg"
            style={{
              left: mod.x * CELL_SIZE + 3,
              top: mod.y * CELL_SIZE + 3,
              width: mod.w * CELL_SIZE - 6,
              height: mod.h * CELL_SIZE - 6,
              backgroundColor: mod.color,
              border: `2px solid ${mod.border}`,
              opacity: draggingPlaced?.id === mod.id ? 0.4 : 1,
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
        Grid: {GRID_COLS}×{GRID_ROWS} cells · Each module = 3×4.8m
      </p>
    </div>
  );
}