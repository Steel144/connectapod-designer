import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, FlipHorizontal } from "lucide-react";
import { MODULE_TYPES, WALL_TYPES } from "./ModulePanel.jsx";
import { FloorPlanSVG } from "./FloorPlanSVG.jsx";

const CELL_SIZE = 24;
const CELL_W = CELL_SIZE;
const CELL_H = CELL_SIZE;
const GRID_COLS = 75;
const GRID_ROWS = 40;

export default function ConfigGrid({ placedModules, onPlace, onRemove, onMove, onRotate, onFlip, walls = [], onPlaceWall, onRemoveWall, onMoveWall, onWallSelect, onModuleSelect, hidden = false }) {
  const gridRef = useRef(null);

  // Selection and drag state
  const [selected, setSelected] = useState(new Set());
  const [dragging, setDragging] = useState(null);
  // { mod, offsetX, offsetY, cursorX, cursorY, isPlaced, selectedIds }
  const [selectionBox, setSelectionBox] = useState(null);
  // { startX, startY, cursorX, cursorY }
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [draggingWall, setDraggingWall] = useState(null);
  // Notify parent when selected wall changes
  const selectedWall = walls.find(w => w.id === selectedWallId) || null;
  React.useEffect(() => { onWallSelect && onWallSelect(selectedWall); }, [selectedWallId]);

  const [selectedModId, setSelectedModId] = useState(null);
  const selectedModObj = placedModules.find(m => m.id === selectedModId) || null;
  React.useEffect(() => { onModuleSelect && onModuleSelect(selectedModObj); }, [selectedModId]);
  // { wall, offsetX, offsetY, cursorX, cursorY }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.size > 0) {
          selected.forEach((id) => onRemove(id));
          setSelected(new Set());
        }
        if (selectedWallId) {
          onRemoveWall && onRemoveWall(selectedWallId);
          setSelectedWallId(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, selectedWallId, onRemove, onRemoveWall]);

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

  const canPlaceGroup = (mod, cx, cy, selectedIds) => {
    if (cx < 0 || cy < 0 || cx + mod.w > GRID_COLS || cy + mod.h > GRID_ROWS) return false;
    for (let dx = 0; dx < mod.w; dx++) {
      for (let dy = 0; dy < mod.h; dy++) {
        const collides = placedModules.some((m) => {
          if (selectedIds.has(m.id)) return false; // Ignore selected modules
          return cx + dx >= m.x && cx + dx < m.x + m.w && cy + dy >= m.y && cy + dy < m.y + m.h;
        });
        if (collides) return false;
      }
    }
    return true;
  };

  // ── Pointer events ──────────────────────────────

  const startDragPlaced = (e, mod) => {
    e.preventDefault();
    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - mod.x * CELL_W;
    const offsetY = e.clientY - rect.top - mod.y * CELL_H;
    
    // If clicking on already-selected module, prepare to toggle; otherwise select just this one
    const newSelected = selected.has(mod.id) ? selected : new Set([mod.id]);
    setSelected(newSelected);
    setSelectedModId(mod.id);
    setSelectedWallId(null); // deselect wall when clicking a module
    
    setDragging({ mod, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY, isPlaced: true, selectedIds: newSelected, wasSelected: selected.has(mod.id) });
  };

  const startSelectionBox = (e) => {
    if (e.button !== 0 || e.target !== gridRef.current) return;
    // Deselect when clicking empty space
    setSelected(new Set());
    setSelectedModId(null);
    setSelectedWallId(null);
    const rect = gridRef.current.getBoundingClientRect();
    setSelectionBox({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, cursorX: e.clientX - rect.left, cursorY: e.clientY - rect.top });
  };

  const startDragNew = (e, mod) => {
    // Called from ModulePanel via onDragStart — but we intercept differently.
    // ModulePanel still uses HTML drag; we handle the drop via onDrop on the grid.
    // This handler is for placed modules only.
  };

  const startDragWall = (e, wall) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWallId(wall.id);
    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - wall.x * CELL_W;
    const offsetY = e.clientY - rect.top - wall.y * CELL_H;
    setDraggingWall({ wall, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY });
  };

  const onMouseMove = useCallback((e) => {
    if (selectionBox) {
      const rect = gridRef.current.getBoundingClientRect();
      setSelectionBox((b) => ({ ...b, cursorX: e.clientX - rect.left, cursorY: e.clientY - rect.top }));
      return;
    }
    if (draggingWall) {
      setDraggingWall((d) => ({ ...d, cursorX: e.clientX, cursorY: e.clientY }));
      return;
    }
    if (!dragging) return;
    setDragging((d) => ({ ...d, cursorX: e.clientX, cursorY: e.clientY, selectedIds: d.selectedIds }));
  }, [dragging, draggingWall, selectionBox]);

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
    // Handle wall drag
    if (draggingWall) {
      const rect = gridRef.current.getBoundingClientRect();
      const rawX = draggingWall.cursorX - rect.left - draggingWall.offsetX;
      const rawY = draggingWall.cursorY - rect.top - draggingWall.offsetY;
      const exactX = rawX / CELL_W;
      const exactY = rawY / CELL_H;
      
      // Only snap if the wall moved significantly (more than 0.1 cells)
      const movedX = Math.abs(exactX - draggingWall.wall.x);
      const movedY = Math.abs(exactY - draggingWall.wall.y);
      const hasMoved = movedX > 0.1 || movedY > 0.1;
      
      if (hasMoved) {
        const SNAP_THRESHOLD = 1.5; // cells
        let snapped = null;
        const wall = draggingWall.wall;

        // Snap to module faces
        const WALL_OFFSET = 0.308; // 185mm offset
        if (wall.orientation === "horizontal") {
          for (const mod of placedModules) {
            const distToYFace = Math.abs(exactY - (mod.y + mod.h));
            const distToWFace = Math.abs(exactY - mod.y);

            if (distToYFace <= SNAP_THRESHOLD && exactX >= mod.x - SNAP_THRESHOLD && exactX <= mod.x + mod.w + SNAP_THRESHOLD) {
              snapped = { x: mod.x - WALL_OFFSET, y: mod.y + mod.h, length: mod.w, face: "Y" };
              break;
            }
            if (distToWFace <= SNAP_THRESHOLD && exactX >= mod.x - SNAP_THRESHOLD && exactX <= mod.x + mod.w + SNAP_THRESHOLD) {
              snapped = { x: mod.x - WALL_OFFSET, y: mod.y - WALL_OFFSET, length: mod.w, face: "W", rotation: 180 };
              break;
            }
          }
        } else {
          for (const mod of placedModules) {
            if (Math.abs(exactX - mod.x) <= SNAP_THRESHOLD && exactY >= mod.y - SNAP_THRESHOLD && exactY <= mod.y + mod.h + SNAP_THRESHOLD) {
              snapped = { x: mod.x, y: mod.y, length: mod.h, face: "Z" };
              break;
            }
            if (Math.abs(exactX - (mod.x + mod.w)) <= SNAP_THRESHOLD && exactY >= mod.y - SNAP_THRESHOLD && exactY <= mod.y + mod.h + SNAP_THRESHOLD) {
              snapped = { x: mod.x + mod.w - 0.31, y: mod.y, length: mod.h, face: "X" };
              break;
            }
          }
        }

        if (snapped) {
          // Check if the snapped module is selected
          const snappedModule = placedModules.find(mod => {
            const isLongFace = wall.orientation === "horizontal";
            if (isLongFace) {
              return (snapped.face === "Y" && snapped.x === mod.x && snapped.y === mod.y + mod.h) ||
                     (snapped.face === "W" && snapped.x === mod.x && Math.abs(snapped.y - (mod.y - 0.308)) < 0.01);
            } else {
              return (snapped.face === "Z" && snapped.y === mod.y && snapped.x === mod.x) ||
                     (snapped.face === "X" && snapped.y === mod.y && Math.abs(snapped.x - (mod.x + mod.w - 0.31)) < 0.01);
            }
          });
          
          if (snappedModule && selected.has(snappedModule.id)) {
            const wallUpdate = { length: snapped.length, face: snapped.face };
            if (snapped.rotation) wallUpdate.rotation = snapped.rotation;
            if (onMoveWall) onMoveWall(wall.id, snapped.x, snapped.y, wallUpdate);
          } else {
            const newX = Math.max(0, exactX);
            const newY = Math.max(0, exactY);
            if (onMoveWall) onMoveWall(wall.id, newX, newY);
          }
        } else {
          const newX = Math.max(0, exactX);
          const newY = Math.max(0, exactY);
          if (onMoveWall) onMoveWall(wall.id, newX, newY);
        }
      }
      setDraggingWall(null);
      return;
    }

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
      
      // Check if any wall is in the selection box
      walls.forEach((wall) => {
        const wallW = wall.orientation === "horizontal" ? wall.length * CELL_W : wall.thickness * CELL_W;
        const wallH = wall.orientation === "vertical" ? wall.length * CELL_H : wall.thickness * CELL_H;
        const wallX1 = wall.x * CELL_W;
        const wallY1 = wall.y * CELL_H;
        const wallX2 = wallX1 + wallW;
        const wallY2 = wallY1 + wallH;
        
        if (!(wallX2 < minX || wallX1 > maxX || wallY2 < minY || wallY1 > maxY)) {
          setSelectedWallId(wall.id);
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

    // Check if it was a click (no movement) on already-selected module
    const movedSignificantly = Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0;
    if (!movedSignificantly && dragging.wasSelected) {
      // Deselect if clicked without dragging
      setSelected(new Set());
      setSelectedModId(null);
      setDragging(null);
      return;
    }

    // Move all selected modules by same delta
    dragging.selectedIds.forEach((id) => {
      const mod = placedModules.find((m) => m.id === id);
      if (mod && canPlaceGroup(mod, mod.x + deltaX, mod.y + deltaY, dragging.selectedIds)) {
        onMove(id, mod.x + deltaX, mod.y + deltaY);
        
        // Move any Z and X walls attached to this module
        walls.forEach((wall) => {
          if (wall.face === "Z" && wall.y === mod.y && wall.x === mod.x) {
            if (onMoveWall) onMoveWall(wall.id, mod.x + deltaX, mod.y + deltaY);
          }
          if (wall.face === "X" && wall.y === mod.y && Math.abs(wall.x - (mod.x + mod.w - 0.31)) < 0.01) {
            if (onMoveWall) onMoveWall(wall.id, mod.x + mod.w + deltaX - 0.31, mod.y + deltaY);
          }
        });
      }
    });
    setDragging(null);
  }, [dragging, draggingWall, selectionBox, placedModules]);

  // ── HTML drag drop for new modules from panel ───

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const modType = e.dataTransfer.getData("moduleType");
    console.log("modType:", modType);
    if (modType) {
      const mod = MODULE_TYPES.find((m) => m.type === modType);
      if (!mod || !gridRef.current) return;
      const { x, y } = getCellFromClient(e.clientX, e.clientY);
      if (canPlace(mod, x, y)) onPlace(mod, x, y);
      return;
    }

    const wallType = e.dataTransfer.getData("wallType");
    console.log("wallType:", wallType);
    if (wallType) {
      const wallTemplate = WALL_TYPES.find((w) => w.type === wallType);
      if (!wallTemplate || !gridRef.current) return;
      
      const rect = gridRef.current.getBoundingClientRect();
      const exactX = (e.clientX - rect.left) / CELL_W;
      const exactY = (e.clientY - rect.top) / CELL_H;
      const SNAP_THRESHOLD = 1.5; // cells
      
      let snapped = null;

      // Snap to module faces (only if module is selected)
       const WALL_OFFSET = 0.308; // 185mm offset
       if (wallTemplate.orientation === "horizontal") {
         for (const mod of placedModules) {
           if (!selected.has(mod.id)) continue;

           const distToYFace = Math.abs(exactY - (mod.y + mod.h));
           const distToWFace = Math.abs(exactY - mod.y);

           if (distToYFace <= SNAP_THRESHOLD && exactX >= mod.x - SNAP_THRESHOLD && exactX <= mod.x + mod.w + SNAP_THRESHOLD) {
             snapped = { x: mod.x, y: mod.y + mod.h, length: mod.w, face: "Y" };
             break;
           }
           if (distToWFace <= SNAP_THRESHOLD && exactX >= mod.x - SNAP_THRESHOLD && exactX <= mod.x + mod.w + SNAP_THRESHOLD) {
             snapped = { x: mod.x, y: mod.y - WALL_OFFSET, length: mod.w, face: "W", rotation: 180 };
             break;
           }
         }
       } else {
         for (const mod of placedModules) {
           if (!selected.has(mod.id)) continue;

           if (Math.abs(exactX - mod.x) <= SNAP_THRESHOLD && exactY >= mod.y - SNAP_THRESHOLD && exactY <= mod.y + mod.h + SNAP_THRESHOLD) {
             snapped = { x: mod.x, y: mod.y, length: mod.h, face: "Z" };
             break;
           }
           if (Math.abs(exactX - (mod.x + mod.w)) <= SNAP_THRESHOLD && exactY >= mod.y - SNAP_THRESHOLD && exactY <= mod.y + mod.h + SNAP_THRESHOLD) {
             snapped = { x: mod.x + mod.w - WALL_OFFSET, y: mod.y, length: mod.h, face: "X" };
             break;
           }
         }
       }

      if (snapped) {
         const wallWithFace = { ...wallTemplate, length: snapped.length, face: snapped.face };
         if (snapped.rotation) wallWithFace.rotation = snapped.rotation;
         if (onPlaceWall) onPlaceWall(wallWithFace, snapped.x, snapped.y)
       } else {
         // Allow freeform placement if no snap
         if (onPlaceWall) onPlaceWall(wallTemplate, exactX, exactY);
       }
      return;
    }
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
      style={{ display: hidden ? "none" : undefined }}
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
          const isDragging = dragging?.isPlaced && dragging.selectedIds?.has(mod.id);
          const isSelected = selected.has(mod.id);

          // Check if sides are on exterior (no adjacent modules)
          const hasModAbove = placedModules.some(m => m.x < mod.x + mod.w && m.x + m.w > mod.x && m.y + m.h === mod.y);
          const hasModBelow = placedModules.some(m => m.x < mod.x + mod.w && m.x + m.w > mod.x && m.y === mod.y + mod.h);
          const hasModLeft = placedModules.some(m => m.y < mod.y + mod.h && m.y + m.h > mod.y && m.x + m.w === mod.x);
          const hasModRight = placedModules.some(m => m.y < mod.y + mod.h && m.y + m.h > mod.y && m.x === mod.x + mod.w);

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
                border: isSelected ? "3px solid #4F46E5" : "2px solid #F15A22",
                boxShadow: isSelected ? "inset 0 0 0 1px #4F46E5" : "none",
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
                {mod.floorPlanImage ? (
                    <img src={mod.floorPlanImage} alt={mod.label} className="w-full h-full object-cover" style={{ transform: mod.flipped ? 'scaleX(-1)' : 'none' }} />
                  ) : (
                    <FloorPlanSVG code={mod.type} className="w-full h-full" style={{ transform: mod.flipped ? 'scaleX(-1)' : 'none' }} />
                  )}
              </div>
              <span className="absolute text-[9px] font-semibold text-slate-700 text-center leading-tight px-0.5 py-0.5 truncate" style={{ bottom: '-36px', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
                {mod.label}
              </span>
              {/* Action buttons above the module, same distance as label below */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{ top: '-26px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onRotate(mod.id)}
                  className="bg-white rounded-full p-1 shadow-sm hover:bg-orange-50 z-10"
                  title="Rotate"
                >
                  <RotateCw size={10} className="text-[#F15A22]" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onFlip?.(mod.id)}
                  className="bg-white rounded-full p-1 shadow-sm hover:bg-orange-50 z-10"
                  title="Flip"
                >
                  <FlipHorizontal size={10} className="text-[#F15A22]" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onRemove(mod.id)}
                  className="bg-white rounded-full p-1 shadow-sm hover:bg-red-50 z-10"
                  title="Delete"
                >
                  <X size={10} className="text-red-400" />
                </button>
              </div>

              {/* WXYZ corner labels - larger, bold, 30% black */}
              {!hasModAbove && <span className="absolute text-2xl font-bold" style={{ left: '50%', top: '-96px', transform: 'translateX(-50%)', color: 'rgba(0, 0, 0, 0.3)' }}>W</span>}
              {!hasModRight && <span className="absolute text-2xl font-bold" style={{ right: '-48px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 0, 0, 0.3)' }}>X</span>}
              {!hasModBelow && <span className="absolute text-2xl font-bold" style={{ left: '50%', bottom: '-96px', transform: 'translateX(-50%)', color: 'rgba(0, 0, 0, 0.3)' }}>Y</span>}
              {!hasModLeft && <span className="absolute text-2xl font-bold" style={{ left: '-48px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 0, 0, 0.3)' }}>Z</span>}
              </div>
              );
              })}

        {/* Live drag ghost — snapped to grid, no shadow */}
        {dragging && dragSnap && (
          Array.from(dragging.selectedIds).map((id) => {
            const mod = placedModules.find((m) => m.id === id);
            if (!mod) return null;
            const deltaX = Math.round((dragging.cursorX - (gridRef.current.getBoundingClientRect().left + dragging.mod.x * CELL_W + dragging.offsetX)) / CELL_W);
            const deltaY = Math.round((dragging.cursorY - (gridRef.current.getBoundingClientRect().top + dragging.mod.y * CELL_H + dragging.offsetY)) / CELL_H);
            return (
              <div
                key={id}
                className="absolute pointer-events-none opacity-60"
                style={{
                  left: (mod.x + deltaX) * CELL_W,
                  top: (mod.y + deltaY) * CELL_H,
                  width: mod.w * CELL_W,
                  height: mod.h * CELL_H,
                }}
              >
                <FloorPlanSVG code={mod.type} className="w-full h-full" />
              </div>
            );
          })
        )}

        {/* Walls */}
        {walls.map((wall) => {
           const isBeingDragged = draggingWall?.wall.id === wall.id;
           const isSelected = selectedWallId === wall.id;
           const wallW = wall.orientation === "horizontal" ? wall.length * CELL_W : wall.thickness * CELL_W;
           const wallH = wall.orientation === "vertical" ? wall.length * CELL_H : wall.thickness * CELL_H;

           // Ghost position while dragging
           let ghostLeft = wall.x * CELL_W;
           let ghostTop = wall.y * CELL_H;
           if (isBeingDragged && gridRef.current) {
             const rect = gridRef.current.getBoundingClientRect();
             ghostLeft = Math.max(0, (draggingWall.cursorX - rect.left - draggingWall.offsetX));
             ghostTop = Math.max(0, (draggingWall.cursorY - rect.top - draggingWall.offsetY));
           }

           return (
             <div key={wall.id} className="group absolute" style={{ left: wall.x * CELL_W, top: wall.y * CELL_H, width: wallW, height: wallH }}>
               <div
                  onMouseDown={(e) => {
                    if (e.target.closest("button")) return;
                    startDragWall(e, wall);
                  }}
                  className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden w-full h-full"
                  style={{
                    backgroundColor: isSelected ? "#4F46E5" : "#4B5563",
                    border: isSelected ? "2px solid #4F46E5" : "1px solid #2d3748",
                    opacity: isBeingDragged ? 0.2 : 0.7,
                    transform: wall.rotation ? `rotate(${wall.rotation}deg)` : undefined,
                    transformOrigin: "center",
                  }}
                >
                 {wall.elevationImage && (
                   <img 
                     src={wall.elevationImage} 
                     alt={wall.label}
                     className="w-full h-full object-cover pointer-events-none"
                   />
                 )}
                 {wall.face && (
                   <span className="text-[8px] font-bold text-white/80 pointer-events-none select-none absolute bottom-1 left-1">
                     {wall.face}
                   </span>
                 )}
               </div>
               <button
                 onMouseDown={(e) => {
                   e.stopPropagation();
                   e.preventDefault();
                   onRemoveWall && onRemoveWall(wall.id);
                 }}
                 className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm hover:bg-red-50 z-10"
               >
                 <X size={10} className="text-red-400" />
               </button>
               {/* Ghost while dragging */}
               {isBeingDragged && (
                 <div
                   className="absolute pointer-events-none overflow-hidden"
                   style={{
                     left: ghostLeft,
                     top: ghostTop,
                     width: wallW,
                     height: wallH,
                     backgroundColor: "#4F46E5",
                     opacity: 0.5,
                     border: "2px dashed #4F46E5",
                   }}
                 >
                   {wall.elevationImage && (
                     <img 
                       src={wall.elevationImage} 
                       alt={wall.label}
                       className="w-full h-full object-cover opacity-60"
                     />
                   )}
                 </div>
               )}
             </div>
           );
           })}

        {/* Selection box */}
        {selectionBox && (
          <div
            className="absolute pointer-events-none border-2 border-indigo-500 bg-indigo-50/30"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.cursorX),
              top: Math.min(selectionBox.startY, selectionBox.cursorY),
              width: Math.abs(selectionBox.cursorX - selectionBox.startX),
              height: Math.abs(selectionBox.cursorY - selectionBox.startY),
            }}
          />
        )}

      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Grid: {GRID_COLS}×{GRID_ROWS} cells · Snap: 600mm
      </p>
    </div>
  );
}