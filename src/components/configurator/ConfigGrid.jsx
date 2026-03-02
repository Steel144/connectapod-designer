import React, { useState, useRef, useCallback } from "react";
import { X, RotateCw } from "lucide-react";
import { MODULE_TYPES } from "./ModulePanel.jsx";
import { FloorPlanSVG } from "./FloorPlanSVG.jsx";

const CELL_SIZE = 24;
const CELL_W = CELL_SIZE;
const CELL_H = CELL_SIZE;
const GRID_COLS = 75;
const GRID_ROWS = 40;

export default function ConfigGrid({ placedModules, onPlace, onRemove, onMove, onRotate }) {
  const gridRef = useRef(null);

  // Selection and drag state
  const [selected, setSelected] = useState(new Set());
  const [dragging, setDragging] = useState(null);
  // { mod, offsetX, offsetY, cursorX, cursorY, isPlaced, selectedIds }
  const [selectionBox, setSelectionBox] = useState(null);
  // { startX, startY, cursorX, cursorY }

  const getCellFromClient = (clientX, clientY) => {
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / CELL_W);
    const y = Math.floor((clientY - rect.top) / CELL_H);
    return { x, y };
  };

  const isOccupied = (x, y, excludeId = null) =>
    placedModules.some((m) => {
      if (m.id === excludeId) return false;
      return x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h;
    });

  const canPlace = (mod, cx, cy, excludeId = null) => {
    if (cx < 0 || cy < 0 || cx + mod.w > GRID_COLS || cy + mod.h > GRID_ROWS) return false;
    for (let dx = 0; dx < mod.w; dx++)
      for (let dy = 0; dy < mod.h; dy++)
        if (isOccupied(cx + dx, cy + dy, excludeId)) return false;
    return true;
  };

  // ── Pointer events ──────────────────────────────

  const startDragPlaced = (e, mod) => {
    e.preventDefault();
    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - mod.x * CELL_W;
    const offsetY = e.clientY - rect.top - mod.y * CELL_H;
    
    // If clicking on a selected module, drag all selected; otherwise start selection
    if (!selected.has(mod.id)) {
      setSelected(new Set([mod.id]));
    }
    
    setDragging({ mod, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY, isPlaced: true, selectedIds: selected });
  };

  const startSelectionBox = (e) => {
    if (e.button !== 0 || e.target !== gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    setSelectionBox({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, cursorX: e.clientX - rect.left, cursorY: e.clientY - rect.top });
  };

  const startDragNew = (e, mod) => {
    // Called from ModulePanel via onDragStart — but we intercept differently.
    // ModulePanel still uses HTML drag; we handle the drop via onDrop on the grid.
    // This handler is for placed modules only.
  };

  const onMouseMove = useCallback((e) => {
    if (selectionBox) {
      const rect = gridRef.current.getBoundingClientRect();
      setSelectionBox((b) => ({ ...b, cursorX: e.clientX - rect.left, cursorY: e.clientY - rect.top }));
      return;
    }
    if (!dragging) return;
    setDragging((d) => ({ ...d, cursorX: e.clientX, cursorY: e.clientY }));
  }, [dragging, selectionBox]);

  // Snap to nearest placed module edge within SNAP_THRESHOLD cells
  const SNAP_THRESHOLD = 1;

  const magnetSnap = (mod, rawX, rawY, excludeId = null) => {
    let snapX = rawX;
    let snapY = rawY;

    for (const other of placedModules) {
      if (other.id === excludeId) continue;

      // Horizontal snapping: right edge of other → left edge of mod
      if (Math.abs(rawX - (other.x + other.w)) <= SNAP_THRESHOLD) {
        const vertOverlap = rawY < other.y + other.h && rawY + mod.h > other.y;
        if (vertOverlap) snapX = other.x + other.w;
      }
      // Horizontal snapping: left edge of mod aligns to left edge of other
      if (Math.abs(rawX - other.x) <= SNAP_THRESHOLD) {
        const vertOverlap = rawY < other.y + other.h && rawY + mod.h > other.y;
        if (vertOverlap) snapX = other.x;
      }
      // Horizontal snapping: right edge of mod aligns to left edge of other
      if (Math.abs((rawX + mod.w) - other.x) <= SNAP_THRESHOLD) {
        const vertOverlap = rawY < other.y + other.h && rawY + mod.h > other.y;
        if (vertOverlap) snapX = other.x - mod.w;
      }

      // Vertical snapping: bottom edge of other → top edge of mod
      if (Math.abs(rawY - (other.y + other.h)) <= SNAP_THRESHOLD) {
        const horizOverlap = rawX < other.x + other.w && rawX + mod.w > other.x;
        if (horizOverlap) snapY = other.y + other.h;
      }
      // Vertical snapping: top edge of mod aligns to top edge of other
      if (Math.abs(rawY - other.y) <= SNAP_THRESHOLD) {
        const horizOverlap = rawX < other.x + other.w && rawX + mod.w > other.x;
        if (horizOverlap) snapY = other.y;
      }
      // Vertical snapping: bottom edge of mod aligns to top edge of other
      if (Math.abs((rawY + mod.h) - other.y) <= SNAP_THRESHOLD) {
        const horizOverlap = rawX < other.x + other.w && rawX + mod.w > other.x;
        if (horizOverlap) snapY = other.y - mod.h;
      }
    }

    return { snapX, snapY };
  };

  const onMouseUp = useCallback((e) => {
    // Handle selection box
    if (selectionBox) {
      const rect = gridRef.current.getBoundingClientRect();
      const minX = Math.min(selectionBox.startX, selectionBox.cursorX);
      const maxX = Math.max(selectionBox.startX, selectionBox.cursorX);
      const minY = Math.min(selectionBox.startY, selectionBox.cursorY);
      const maxY = Math.max(selectionBox.startY, selectionBox.cursorY);
      
      const newSelected = new Set();
      placedModules.forEach((mod) => {
        const modX1 = mod.x * CELL_W;
        const modY1 = mod.y * CELL_H;
        const modX2 = modX1 + mod.w * CELL_W;
        const modY2 = modY1 + mod.h * CELL_H;
        
        if (!(modX2 < minX || modX1 > maxX || modY2 < minY || modY1 > maxY)) {
          newSelected.add(mod.id);
        }
      });
      
      if (newSelected.size > 0) setSelected(newSelected);
      setSelectionBox(null);
      return;
    }

    if (!dragging) return;
    const rect = gridRef.current.getBoundingClientRect();
    const deltaX = Math.round((dragging.cursorX - (rect.left + dragging.mod.x * CELL_W + dragging.offsetX)) / CELL_W);
    const deltaY = Math.round((dragging.cursorY - (rect.top + dragging.mod.y * CELL_H + dragging.offsetY)) / CELL_H);

    // Move all selected modules by same delta
    dragging.selectedIds.forEach((id) => {
      const mod = placedModules.find((m) => m.id === id);
      if (mod && canPlace(mod, mod.x + deltaX, mod.y + deltaY, id)) {
        onMove(id, mod.x + deltaX, mod.y + deltaY);
      }
    });
    setDragging(null);
  }, [dragging, selectionBox, placedModules]);

  // ── HTML drag drop for new modules from panel ───

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const modType = e.dataTransfer.getData("moduleType");
    if (!modType) return;
    const mod = MODULE_TYPES.find((m) => m.type === modType);
    if (!mod || !gridRef.current) return;
    const { x, y } = getCellFromClient(e.clientX, e.clientY);
    if (canPlace(mod, x, y)) onPlace(mod, x, y);
  };

  // Compute live snap position for dragging module
  const getDragSnapPos = () => {
    if (!dragging || !gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const rawX = dragging.cursorX - rect.left - dragging.offsetX;
    const rawY = dragging.cursorY - rect.top - dragging.offsetY;
    const snapX = Math.round(rawX / CELL_W);
    const snapY = Math.round(rawY / CELL_H);
    return { snapX, snapY };
  };

  const dragSnap = getDragSnapPos();

  return (
    <div
      className="overflow-auto w-full h-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        ref={gridRef}
        className="relative select-none"
        style={{
          width: GRID_COLS * CELL_W,
          height: GRID_ROWS * CELL_H,
          backgroundImage: `
            linear-gradient(to right, #D1D5DB 1px, transparent 1px),
            linear-gradient(to bottom, #D1D5DB 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_W}px ${CELL_H}px`,
          backgroundColor: "#F5F5F3",
          border: "1.5px solid #D1D5DB",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={startSelectionBox}
      >
        {/* Placed modules */}
        {placedModules.map((mod) => {
          const isDragging = dragging?.isPlaced && dragging.mod.id === mod.id;
          return (
            <div
              key={mod.id}
              onMouseDown={(e) => startDragPlaced(e, mod)}
              className="absolute group cursor-grab active:cursor-grabbing"
              style={{
                left: mod.x * CELL_W,
                top: mod.y * CELL_H,
                width: mod.w * CELL_W,
                height: mod.h * CELL_H,
                opacity: isDragging ? 0 : 1,
                userSelect: "none",
                border: "2px solid #F15A22",
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center"
                style={{
                  transform: `rotate(${mod.rotation || 0}deg)`,
                  width: "100%",
                  height: "100%",
                }}
              >
                <FloorPlanSVG code={mod.type} className="w-full h-full" />
              </div>
              <span className="absolute bottom-0 left-0 right-0 text-[9px] font-semibold text-slate-700 text-center leading-tight px-0.5 py-0.5 bg-white/60 truncate">
                {mod.label}
              </span>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onRotate(mod.id)}
                className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm hover:bg-orange-50 z-10"
              >
                <RotateCw size={10} className="text-[#F15A22]" />
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(mod.id)}
                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm hover:bg-red-50 z-10"
              >
                <X size={10} className="text-red-400" />
              </button>
            </div>
          );
        })}

        {/* Live drag ghost — snapped to grid, no shadow */}
        {dragging && dragSnap && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: dragSnap.snapX * CELL_W,
              top: dragSnap.snapY * CELL_H,
              width: dragging.mod.w * CELL_W,
              height: dragging.mod.h * CELL_H,
            }}
          >
            <FloorPlanSVG code={dragging.mod.type} className="w-full h-full" />
          </div>
        )}


      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Grid: {GRID_COLS}×{GRID_ROWS} cells · Snap: 600mm
      </p>
    </div>
  );
}