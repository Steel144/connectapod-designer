import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, FlipHorizontal } from "lucide-react";
import { MODULE_TYPES } from "./ModulePanel.jsx";
import { FloorPlanSVG } from "./FloorPlanSVG.jsx";

const CELL_SIZE = 24;
const CELL_W = CELL_SIZE;
const CELL_H = CELL_SIZE;
const GRID_COLS = 75;
const GRID_ROWS = 40;

const getPavilion = (moduleY) => {
  const midpoint = GRID_ROWS / 2;
  if (moduleY >= midpoint - 12 && moduleY < midpoint - 4) return 3; // Green
  if (moduleY >= midpoint - 4 && moduleY < midpoint + 4) return 2;  // Red
  if (moduleY >= midpoint + 4 && moduleY < midpoint + 12) return 1; // Blue
  return null;
};

export default function ConfigGrid({ placedModules, onPlace, onRemove, onMove, onRotate, onFlip, walls = [], wallTypes = [], onPlaceWall, onRemoveWall, onFlipWall, onMoveWall, onWallSelect, onModuleSelect, hidden = false, customModules = [] }) {
  const gridRef = useRef(null);

  // Calculate dynamic pavilion spacing based on connection module width
  const getConnectionModuleWidth = () => {
    const midpoint = GRID_ROWS / 2;
    const centerModules = placedModules.filter(m => m.y >= midpoint - 4 && m.y < midpoint + 4);
    if (centerModules.length === 0) return 0;
    const centerLeft = Math.min(...centerModules.map(m => m.x));
    const centerRight = Math.max(...centerModules.map(m => m.x + m.w));
    return centerRight - centerLeft;
  };

  const connectionWidth = getConnectionModuleWidth();
  // Cap at 5 cells (3m / 0.6m per cell), min 4 cells for pavilion stripe height
  const maxSpacing = Math.min(connectionWidth, 5);
  const pavilionSpacing = Math.max(4, maxSpacing);

  // Selection and drag state
  const [selected, setSelected] = useState(new Set());
  const [dragging, setDragging] = useState(null);
  // { mod, offsetX, offsetY, cursorX, cursorY, isPlaced, selectedIds }
  const [selectionBox, setSelectionBox] = useState(null);
  // { startX, startY, cursorX, cursorY }
  const [selectedWallIds, setSelectedWallIds] = useState(new Set());
  const [draggingWall, setDraggingWall] = useState(null);
  const [hoveredWallId, setHoveredWallId] = useState(null);
  const [hoveredModuleId, setHoveredModuleId] = useState(null);
  // Notify parent when selected wall changes
  const selectedWall = selectedWallIds.size === 1 ? walls.find(w => w.id === Array.from(selectedWallIds)[0]) || null : null;
  React.useEffect(() => { onWallSelect && onWallSelect(hoveredWallId ? walls.find(w => w.id === hoveredWallId) : selectedWall); }, [hoveredWallId, selectedWallIds, walls]);

  const [selectedModId, setSelectedModId] = useState(null);
  const selectedModObj = hoveredModuleId ? placedModules.find(m => m.id === hoveredModuleId) : placedModules.find(m => m.id === selectedModId);
  React.useEffect(() => { onModuleSelect && onModuleSelect(selectedModObj || null); }, [hoveredModuleId, selectedModId, placedModules]);
  // { wall, offsetX, offsetY, cursorX, cursorY }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.size > 0) {
             selected.forEach((id) => onRemove(id));
             setSelected(new Set());
           }
           if (selectedWallIds.size > 0) {
             selectedWallIds.forEach((id) => onRemoveWall && onRemoveWall(id));
             setSelectedWallIds(new Set());
           }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, selectedWallIds, onRemove, onRemoveWall]);

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
    
    // Check deck/soffit adjacency rules
    const isDeckOrSoffit = mod.description && (mod.description.includes("Deck") || mod.description.includes("Soffit"));
    if (isDeckOrSoffit) {
      for (const other of placedModules) {
        if (other.id === excludeId) continue;
        const isAdjacent = (other.x === cx + mod.w && other.y < cy + mod.h && other.y + other.h > cy) ||
                          (other.x + other.w === cx && other.y < cy + mod.h && other.y + other.h > cy) ||
                          (other.y === cy + mod.h && other.x < cx + mod.w && other.x + mod.w > cx) ||
                          (other.y + other.h === cy && other.x < cx + mod.w && other.x + mod.w > cx);
        if (isAdjacent) {
          const otherIsEnd = other.chassis === "EF" || other.chassis === "ER" || other.chassis === "LF" || other.chassis === "RF";
          if (!otherIsEnd) return false;
        }
      }
    }
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
    setSelectedWallIds(new Set()); // deselect walls when clicking a module
    
    setDragging({ mod, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY, isPlaced: true, selectedIds: newSelected, wasSelected: selected.has(mod.id) });
  };

  const startSelectionBox = (e) => {
    if (e.button !== 0 || e.target !== gridRef.current) return;
    // Deselect when clicking empty space
    setSelected(new Set());
    setSelectedModId(null);
    setSelectedWallIds(new Set());
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
    const newWallSelection = selectedWallIds.has(wall.id) ? selectedWallIds : new Set([wall.id]);
    setSelectedWallIds(newWallSelection);
    setSelectedModId(null);
    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - wall.x * CELL_W;
    const offsetY = e.clientY - rect.top - wall.y * CELL_H;
    setDraggingWall({ wall, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY, selectedIds: newWallSelection });
  };

  const onMouseMove = useCallback((e) => {
    if (selectionBox) {
      const rect = gridRef.current.getBoundingClientRect();
      setSelectionBox((b) => ({ ...b, cursorX: e.clientX - rect.left, cursorY: e.clientY - rect.top }));
      return;
    }
    if (draggingWall) {
      setDraggingWall((d) => d ? ({ ...d, cursorX: e.clientX, cursorY: e.clientY }) : null);
      return;
    }
    if (!dragging) return;
    setDragging((d) => d ? { ...d, cursorX: e.clientX, cursorY: e.clientY } : null);
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
        draggingWall.selectedIds.forEach((wallId) => {
          const wall = walls.find(w => w.id === wallId);
          if (!wall) return;

          const SNAP_THRESHOLD = 0.8; // cells — tight enough to avoid adjacent modules
          let snapped = null;
          const wallExactX = exactX + (wall.x - draggingWall.wall.x);
          const wallExactY = exactY + (wall.y - draggingWall.wall.y);

          if (wall.orientation === "horizontal") {
            let bestDist = Infinity;
            for (const mod of placedModules) {
              const distToYFace = Math.abs(wallExactY - (mod.y + mod.h));
              const distToWFace = Math.abs(wallExactY - mod.y);

              if (distToYFace <= SNAP_THRESHOLD && wallExactX >= mod.x - SNAP_THRESHOLD && wallExactX <= mod.x + mod.w + SNAP_THRESHOLD) {
                if (distToYFace < bestDist) {
                  bestDist = distToYFace;
                  snapped = { x: mod.x, y: mod.y + mod.h, length: mod.w, face: "Y" };
                }
              }
              if (distToWFace <= SNAP_THRESHOLD && wallExactX >= mod.x - SNAP_THRESHOLD && wallExactX <= mod.x + mod.w + SNAP_THRESHOLD) {
                if (distToWFace < bestDist) {
                     bestDist = distToWFace;
                     snapped = { x: mod.x, y: mod.y - wall.thickness, length: mod.w, face: "W" };
                   }
              }
            }
          } else {
            let bestDist = Infinity;
            for (const mod of placedModules) {
              const distToZFace = Math.abs(wallExactX - mod.x);
              const distToXFace = Math.abs(wallExactX - (mod.x + mod.w));

              if (distToZFace <= SNAP_THRESHOLD && wallExactY >= mod.y - SNAP_THRESHOLD && wallExactY <= mod.y + mod.h + SNAP_THRESHOLD) {
                if (distToZFace < bestDist) {
                  bestDist = distToZFace;
                  snapped = { x: mod.x, y: mod.y, length: mod.h, face: "Z" };
                }
              }
              if (distToXFace <= SNAP_THRESHOLD && wallExactY >= mod.y - SNAP_THRESHOLD && wallExactY <= mod.y + mod.h + SNAP_THRESHOLD) {
                if (distToXFace < bestDist) {
                  bestDist = distToXFace;
                  snapped = { x: mod.x + mod.w - 0.31, y: mod.y, length: mod.h, face: "X" };
                }
              }
            }
          }

          if (snapped) {
            const wallUpdate = { length: snapped.length, face: snapped.face };
            if (snapped.rotation) wallUpdate.rotation = snapped.rotation;
            if (onMoveWall) onMoveWall(wall.id, snapped.x, snapped.y, wallUpdate);
          } else {
            const newX = Math.max(0, wallExactX);
            const newY = Math.max(0, wallExactY);
            if (onMoveWall) onMoveWall(wall.id, newX, newY);
          }
        });
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
      const newSelectedWalls = new Set(selectedWallIds);
      walls.forEach((wall) => {
        const wallW = wall.orientation === "horizontal" ? wall.length * CELL_W : wall.thickness * CELL_W;
        const wallH = wall.orientation === "vertical" ? wall.length * CELL_H : wall.thickness * CELL_H;
        const wallX1 = wall.x * CELL_W;
        const wallY1 = wall.y * CELL_H;
        const wallX2 = wallX1 + wallW;
        const wallY2 = wallY1 + wallH;
        
        if (!(wallX2 < minX || wallX1 > maxX || wallY2 < minY || wallY1 > maxY)) {
          newSelectedWalls.add(wall.id);
        }
      });
      if (newSelectedWalls.size > 0) setSelectedWallIds(newSelectedWalls);
      
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
      const isEndModule = mod?.chassis === "EF" || mod?.chassis === "ER" || mod?.chassis === "LF" || mod?.chassis === "RF" || mod?.variants?.some?.(v => v.toLowerCase().includes("end"));
      if (mod && isEndModule) {
        return; // Don't move end modules
      }
      
      // Check if moving deck/soffit adjacent to non-end module
      const isDeckOrSoffit = mod?.type?.toLowerCase().includes("deck") || mod?.type?.toLowerCase().includes("soffit");
      if (mod && isDeckOrSoffit) {
        const newX = mod.x + deltaX;
        const newY = mod.y + deltaY;
        const adjacentMod = placedModules.find(m => {
          if (m.id === id) return false;
          const isAdjacent = (m.x === newX + mod.w && m.y < newY + mod.h && m.y + m.h > newY) ||
                            (m.x + m.w === newX && m.y < newY + mod.h && m.y + m.h > newY) ||
                            (m.y === newY + mod.h && m.x < newX + mod.w && m.x + m.w > newX) ||
                            (m.y + m.h === newY && m.x < newX + mod.w && m.x + m.w > newX);
          return isAdjacent;
        });
        const isAdjacentModEnd = adjacentMod?.chassis === "EF" || adjacentMod?.chassis === "ER" || adjacentMod?.chassis === "LF" || adjacentMod?.chassis === "RF";
        if (adjacentMod && !isAdjacentModEnd) {
          return; // Don't allow deck next to non-end module
        }
      }
      
      if (mod && canPlaceGroup(mod, mod.x + deltaX, mod.y + deltaY, dragging.selectedIds)) {
        onMove(id, mod.x + deltaX, mod.y + deltaY);
        
        // Move walls attached to this module
        const WALL_THRESHOLD = 1.0;
        walls.forEach((wall) => {
          if (wall.orientation === "horizontal") {
            // Wall must be roughly aligned horizontally with the module
            if (Math.abs(wall.x - mod.x) < WALL_THRESHOLD) {
              // Above (W face)
              if (Math.abs(wall.y - (mod.y - wall.thickness)) < WALL_THRESHOLD) {
                if (onMoveWall) onMoveWall(wall.id, wall.x + deltaX, wall.y + deltaY);
              }
              // Below (Y face)
              else if (Math.abs(wall.y - (mod.y + mod.h)) < WALL_THRESHOLD) {
                if (onMoveWall) onMoveWall(wall.id, wall.x + deltaX, wall.y + deltaY);
              }
            }
          } else if (wall.orientation === "vertical") {
            // Wall must be roughly aligned vertically with the module
            if (Math.abs(wall.y - mod.y) < WALL_THRESHOLD) {
              // Left (Z face)
              if (Math.abs(wall.x - mod.x) < WALL_THRESHOLD) {
                if (onMoveWall) onMoveWall(wall.id, wall.x + deltaX, wall.y + deltaY);
              }
              // Right (X face)
              else if (Math.abs(wall.x - (mod.x + mod.w)) < WALL_THRESHOLD) {
                if (onMoveWall) onMoveWall(wall.id, wall.x + deltaX, wall.y + deltaY);
              }
            }
          }
        });
      }
    });
    setDragging(null);
  }, [dragging, draggingWall, selectionBox, placedModules, walls]);

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
    const moduleImage = e.dataTransfer.getData("moduleImage");
    console.log("modType:", modType, "image:", moduleImage);
    if (modType) {
      let mod = MODULE_TYPES.find((m) => m.type === modType);

      // If not in MODULE_TYPES, try custom modules
      if (!mod && customModules.length > 0) {
        const customMod = customModules.find(c => c.code === modType);
        if (customMod) {
          const variants = (customMod.variants || []).map(v => v.toLowerCase());
          const isEnd = variants.some(v => v.includes("end"));
          const isConnection = variants.some(v => v.includes("connection"));
          const chassis = isConnection ? "CM" : isEnd ? "LF" : "SF";
          
          mod = {
            type: customMod.code,
            label: customMod.name,
            w: Math.round((customMod.width || 3.0) / 0.6),
            h: Math.round((customMod.depth || 4.8) / 0.6),
            sqm: customMod.sqm || (customMod.width || 3.0) * (customMod.depth || 4.8),
            price: customMod.price || 0,
            groupKey: customMod.category || "Living",
            description: customMod.description || "",
            chassis: chassis,
            color: "#FDF0EB",
            border: "#F15A22",
          };
        }
      }

      if (!mod || !gridRef.current) return;
      if (moduleImage) mod.floorPlanImage = moduleImage;
      const { x, y } = getCellFromClient(e.clientX, e.clientY);
      if (canPlace(mod, x, y)) onPlace(mod, x, y);
      return;
    }

    const wallType = e.dataTransfer.getData("wallType");
    console.log("wallType:", wallType);
    if (wallType) {
      const wallTemplate = wallTypes.find((w) => w.type === wallType);
      if (!wallTemplate || !gridRef.current) return;
      
      const rect = gridRef.current.getBoundingClientRect();
      const exactX = (e.clientX - rect.left) / CELL_W;
      const exactY = (e.clientY - rect.top) / CELL_H;
      const SNAP_THRESHOLD = 0.8; // cells — tight enough to avoid adjacent modules
      
      let snapped = null;

      // Snap to nearest module face — no selection required
       if (wallTemplate.orientation === "horizontal") {
         let bestDist = Infinity;
         for (const mod of placedModules) {
           const distToYFace = Math.abs(exactY - (mod.y + mod.h));
           const distToWFace = Math.abs(exactY - mod.y);

           if (distToYFace <= SNAP_THRESHOLD && exactX >= mod.x - SNAP_THRESHOLD && exactX <= mod.x + mod.w + SNAP_THRESHOLD) {
             if (distToYFace < bestDist) {
               bestDist = distToYFace;
               snapped = { x: mod.x, y: mod.y + mod.h, length: mod.w, face: "Y" };
             }
           }
           if (distToWFace <= SNAP_THRESHOLD && exactX >= mod.x - SNAP_THRESHOLD && exactX <= mod.x + mod.w + SNAP_THRESHOLD) {
             if (distToWFace < bestDist) {
               bestDist = distToWFace;
               snapped = { x: mod.x, y: mod.y - wallTemplate.thickness, length: mod.w, face: "W" };
             }
           }
         }
       } else {
         let bestDist = Infinity;
         for (const mod of placedModules) {
           const distToZFace = Math.abs(exactX - mod.x);
           const distToXFace = Math.abs(exactX - (mod.x + mod.w));

           if (distToZFace <= SNAP_THRESHOLD && exactY >= mod.y - SNAP_THRESHOLD && exactY <= mod.y + mod.h + SNAP_THRESHOLD) {
             if (distToZFace < bestDist) {
               bestDist = distToZFace;
               snapped = { x: mod.x, y: mod.y, length: mod.h, face: "Z" };
             }
           }
           if (distToXFace <= SNAP_THRESHOLD && exactY >= mod.y - SNAP_THRESHOLD && exactY <= mod.y + mod.h + SNAP_THRESHOLD) {
             if (distToXFace < bestDist) {
               bestDist = distToXFace;
               snapped = { x: mod.x + mod.w, y: mod.y, length: mod.h, face: "X" };
             }
           }
         }
       }

      if (snapped) {
         const wallWithFace = { ...wallTemplate, length: snapped.length, face: snapped.face };
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
        {/* Colour stripes — rendered first so they appear behind */}
         {(() => {
           const midpoint = GRID_ROWS / 2;
           const centerModules = placedModules.filter(m => m.y >= midpoint - 4 && m.y < midpoint + 4);

           let centerLeft = 0;
           let centerWidth = 0;

           if (centerModules.length > 0) {
             centerLeft = Math.min(...centerModules.map(m => m.x));
             const centerRight = Math.max(...centerModules.map(m => m.x + m.w));
             centerWidth = centerRight - centerLeft;
           }

           const p1Top = midpoint - pavilionSpacing / 2 - 4;
           const cmTop = midpoint - pavilionSpacing / 2;
           const p2Top = midpoint + pavilionSpacing / 2;

           return (
             <>
               {/* Green strip — Pavilion 1 */}
               <div
                 className="absolute pointer-events-none"
                 style={{
                   left: 0,
                   top: p1Top * CELL_H,
                   width: GRID_COLS * CELL_W,
                   height: 4 * CELL_H,
                   backgroundColor: "rgba(34, 197, 94, 0.075)",
                   transition: "top 0.2s ease-out",
                 }}
               />
               <div
                 className="absolute pointer-events-none text-green-700 font-bold text-sm"
                 style={{
                   left: "12px",
                   top: p1Top * CELL_H + 4,
                   transition: "top 0.2s ease-out",
                 }}
               >
                 Pavilion 1
               </div>

               {/* Red center stripe — dynamic height matching connection module */}
               {centerWidth > 0 && (
                 <>
                   <div
                     className="absolute pointer-events-none"
                     style={{
                       left: centerLeft * CELL_W,
                       top: cmTop * CELL_H,
                       width: centerWidth * CELL_W,
                       height: pavilionSpacing * CELL_H,
                       backgroundColor: "rgba(239, 68, 68, 0.075)",
                       transition: "all 0.2s ease-out",
                     }}
                   />
                   <div
                     className="absolute pointer-events-none text-red-700 font-bold text-sm"
                     style={{
                       left: centerLeft * CELL_W + 12,
                       top: cmTop * CELL_H + 4,
                       transition: "all 0.2s ease-out",
                     }}
                   >
                     Connection Module
                   </div>
                 </>
               )}

               {/* Blue stripe — Pavilion 2 */}
               <div
                 className="absolute pointer-events-none"
                 style={{
                   left: 0,
                   top: p2Top * CELL_H,
                   width: GRID_COLS * CELL_W,
                   height: 4 * CELL_H,
                   backgroundColor: "rgba(59, 130, 246, 0.075)",
                   transition: "top 0.2s ease-out",
                 }}
               />
               <div
                 className="absolute pointer-events-none text-blue-700 font-bold text-sm"
                 style={{
                   left: "12px",
                   top: p2Top * CELL_H + 4,
                   transition: "top 0.2s ease-out",
                 }}
               >
                 Pavilion 2
               </div>
             </>
           );
         })()}

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
              onMouseEnter={() => setHoveredModuleId(mod.id)}
              onMouseLeave={() => setHoveredModuleId(null)}
              className="absolute group cursor-grab active:cursor-grabbing"
              style={{
                left: mod.x * CELL_W,
                top: mod.y * CELL_H,
                width: mod.w * CELL_W,
                height: mod.h * CELL_H,
                opacity: isDragging ? 0 : 1,
                userSelect: "none",
                border: isSelected ? "3px solid #4F46E5" : "none",
                boxShadow: isSelected ? "inset 0 0 0 1px #4F46E5" : "none",
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  transform: `rotate(${mod.rotation || 0}deg)`,
                  width: "100%",
                  height: "100%",
                  backgroundColor: mod.floorPlanImage ? "white" : "transparent",
                }}
              >
                {mod.floorPlanImage ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={mod.floorPlanImage} alt={mod.label} className="w-auto h-auto" style={{ transform: mod.flipped ? 'scaleX(-1)' : 'none' }} />
                    </div>
                  ) : (
                    <FloorPlanSVG code={mod.type} className="w-full h-full" style={{ transform: mod.flipped ? 'scaleX(-1)' : 'none' }} />
                  )}
              </div>
              <span className="absolute text-[9px] font-semibold text-slate-700 text-center leading-tight px-0.5 py-0.5 pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', whiteSpace: 'nowrap', opacity: 0.4 }}>
                {mod.label}
              </span>
              {getPavilion(mod.y) && (
                <span className="absolute text-[8px] font-bold text-slate-500 pointer-events-none" style={{ bottom: '2px', right: '2px', opacity: 0.6 }}>
                  {(() => { const p = getPavilion(mod.y); const labels = { 3: "P1", 2: "CM", 1: "P2" }; return labels[p] || `P${p}`; })()}
                </span>
              )}
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
           const isSelected = selectedWallIds.has(wall.id);
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
             <div key={wall.id} className="group absolute" style={{ left: wall.x * CELL_W, top: wall.y * CELL_H, width: wallW, height: wallH }} onMouseEnter={() => setHoveredWallId(wall.id)} onMouseLeave={() => setHoveredWallId(null)}>
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
                     style={{ transform: wall.flipped ? 'scaleX(-1)' : undefined }}
                   />
                 )}
                 {wall.face && (
                   <span className="text-[8px] font-bold text-white/80 pointer-events-none select-none absolute bottom-1 left-1">
                     {wall.face}
                   </span>
                 )}
               </div>
               <button
                 onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onFlipWall && onFlipWall(wall.id); }}
                 className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm hover:bg-orange-50 z-10"
                 title="Flip wall"
               >
                 <FlipHorizontal size={10} className="text-[#F15A22]" />
               </button>
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