import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, FlipHorizontal } from "lucide-react";
import { MODULE_TYPES } from "./ModulePanel.jsx";
import { FloorPlanSVG } from "./FloorPlanSVG.jsx";

const CELL_SIZE = 24;
const CELL_W = CELL_SIZE;
const CELL_H = CELL_SIZE;
const GRID_COLS = 150;
const GRID_ROWS = 40;

const getPavilion = (moduleY) => {
  if (moduleY >= 9 && moduleY < 13) return 3;   // Green — Pavilion 1
  if (moduleY >= 19 && moduleY < 20) return 2;  // Red — Connection Module
  if (moduleY >= 26 && moduleY < 30) return 1;  // Blue — Pavilion 2
  return null;
};

export default function ConfigGrid({ placedModules, onPlace, onRemove, onMove, onRotate, onFlip, walls = [], wallTypes = [], onPlaceWall, onRemoveWall, onFlipWall, onMoveWall, onUpdateWall, onWallSelect, onModuleSelect, onFaceSelect, onPlaceWallOnFace, furniture = [], onPlaceFurniture, onRemoveFurniture, onMoveFurniture, onRotateFurniture, hidden = false, customModules = [], floorPlanImages = {}, wallImages = {}, zoom = 100 }) {
   const gridRef = useRef(null);
   const scrollRef = useRef(null);

   // Calculate scaled cell size based on zoom
   const scaledCellW = CELL_W * (zoom / 100);
   const scaledCellH = CELL_H * (zoom / 100);

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
  // Pavilion spacing: 4.2m = 7 cells (4.2 / 0.6)
  const pavilionSpacing = 7;

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
  const [dragPreview, setDragPreview] = useState(null);
  const [faceMenuOpen, setFaceMenuOpen] = useState(null); // { module, face, x, y }
  // Notify parent when selected wall changes
  const selectedWall = selectedWallIds.size === 1 ? walls.find(w => w.id === Array.from(selectedWallIds)[0]) || null : null;
  React.useEffect(() => { onWallSelect && onWallSelect(hoveredWallId ? walls.find(w => w.id === hoveredWallId) : selectedWall); }, [hoveredWallId, selectedWallIds, walls]);

  const [selectedModId, setSelectedModId] = useState(null);
  const selectedModObj = hoveredModuleId ? placedModules.find(m => m.id === hoveredModuleId) : placedModules.find(m => m.id === selectedModId);
  React.useEffect(() => { onModuleSelect && onModuleSelect(selectedModObj || null); }, [hoveredModuleId, selectedModId, placedModules]);
  
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);
  // { wall, offsetX, offsetY, cursorX, cursorY }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        setSelected((prevSelected) => {
          if (prevSelected.size > 0) {
            prevSelected.forEach((id) => onRemove(id));
          }
          return new Set();
        });
        setSelectedWallIds((prevWalls) => {
          if (prevWalls.size > 0) {
            prevWalls.forEach((id) => onRemoveWall && onRemoveWall(id));
          }
          return new Set();
        });
        if (selectedFurnitureId) {
          onRemoveFurniture?.(selectedFurnitureId);
          setSelectedFurnitureId(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRemove, onRemoveWall, onRemoveFurniture, selectedFurnitureId]);

  const getCellFromClient = (clientX, clientY) => {
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / scaledCellW);
    const y = Math.floor((clientY - rect.top) / scaledCellH);
    return { x, y };
  };

  const isOccupied = (x, y, excludeId = null) =>
    placedModules.some((m) => {
      if (m.id === excludeId) return false;
      return x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h;
    });

  const isConnectionModule = (mod) => mod.chassis === "C" || (mod.y >= 18 && mod.y < 21 && mod.h <= 2);

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
    e.stopPropagation();
    const rect = gridRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - mod.x * scaledCellW;
    const offsetY = e.clientY - rect.top - mod.y * scaledCellH;
    
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
    setSelectionBox({ startX: (e.clientX - rect.left) / (zoom / 100), startY: (e.clientY - rect.top) / (zoom / 100), cursorX: (e.clientX - rect.left) / (zoom / 100), cursorY: (e.clientY - rect.top) / (zoom / 100) });
  };

  const startDragNew = (e, mod) => {
    // Called from ModulePanel via onDragStart — but we intercept differently.
    // ModulePanel still uses HTML drag; we handle the drop via onDrop on the grid.
    // This handler is for placed modules only.
  };

  const startDragWall = (e, wall) => {
    // Only allow dragging if a module is selected
    if (selected.size === 0) return;

    e.preventDefault();
    e.stopPropagation();
    const newWallSelection = selectedWallIds.has(wall.id) ? selectedWallIds : new Set([wall.id]);
    setSelectedWallIds(newWallSelection);
    setSelectedModId(null);
    const rect = gridRef.current.getBoundingClientRect();
    // Offset from center of wall, not top-left
    const wallCenterX = wall.x * scaledCellW + (wall.orientation === "horizontal" ? wall.length * scaledCellW / 2 : wall.thickness * scaledCellW / 2);
    const wallCenterY = wall.y * scaledCellH + (wall.orientation === "vertical" ? wall.length * scaledCellH / 2 : wall.thickness * scaledCellH / 2);
    const offsetX = e.clientX - rect.left - wallCenterX;
    const offsetY = e.clientY - rect.top - wallCenterY;
    setDraggingWall({ wall, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY, selectedIds: newWallSelection });
  };

  const onMouseMove = useCallback((e) => {
    if (selectionBox) {
      const rect = gridRef.current.getBoundingClientRect();
      setSelectionBox((b) => ({ ...b, cursorX: (e.clientX - rect.left) / (zoom / 100), cursorY: (e.clientY - rect.top) / (zoom / 100) }));
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
    // Handle furniture drag
    if (dragging?.isFurniture) {
      const rect = gridRef.current.getBoundingClientRect();
      const cursorX = dragging.cursorX - rect.left;
      const cursorY = dragging.cursorY - rect.top;
      const exactX = (cursorX - dragging.offsetX) / scaledCellW;
      const exactY = (cursorY - dragging.offsetY) / scaledCellH;
      const newX = Math.max(0, Math.min(exactX, GRID_COLS - 1));
      const newY = Math.max(0, Math.min(exactY, GRID_ROWS - 1));
      onMoveFurniture?.(dragging.mod.id, newX, newY);
      setDragging(null);
      return;
    }

    // Handle wall drag
    if (draggingWall) {
      const rect = gridRef.current.getBoundingClientRect();
      const cursorX = draggingWall.cursorX - rect.left;
      const cursorY = draggingWall.cursorY - rect.top;
      const rawX = cursorX - draggingWall.offsetX;
      const rawY = cursorY - draggingWall.offsetY;
      const exactX = rawX / scaledCellW;
      const exactY = rawY / scaledCellH;

      // Only snap if the wall moved significantly (more than 0.1 cells)
      const movedX = Math.abs(exactX - draggingWall.wall.x);
      const movedY = Math.abs(exactY - draggingWall.wall.y);
      const hasMoved = movedX > 0.1 || movedY > 0.1;

      if (hasMoved) {
        draggingWall.selectedIds.forEach((wallId) => {
          const wall = walls.find(w => w.id === wallId);
          if (!wall) return;

          const SNAP_THRESHOLD = 0.5; // cells — very tight snapping for accuracy
          let snapped = null;
          // Calculate cursor position as cells, accounting for wall center
          const wallCenterOffsetX = draggingWall.wall.orientation === "horizontal" ? draggingWall.wall.length * scaledCellW / 2 : draggingWall.wall.thickness * scaledCellW / 2;
          const wallCenterOffsetY = draggingWall.wall.orientation === "vertical" ? draggingWall.wall.length * scaledCellH / 2 : draggingWall.wall.thickness * scaledCellH / 2;
          const cursorCellX = (cursorX - draggingWall.offsetX - wallCenterOffsetX / 2) / scaledCellW;
          const cursorCellY = (cursorY - draggingWall.offsetY - wallCenterOffsetY / 2) / scaledCellH;

          if (wall.orientation === "horizontal") {
            // Find ALL valid snap positions and pick the single nearest one
            const candidates = [];
            for (const mod of placedModules) {
              // Only snap if wall length matches module width
              if (Math.abs(wall.length - mod.w) > 0.1) continue;
              // Skip connection modules
              const isCM = isConnectionModule(mod);
              if (isCM) continue;
              // Wall can snap to any module with matching width — remove X alignment check

              // Y face (bottom of module) — snap X to module's left edge and Y below
              const distToYFace = Math.abs(cursorCellY - (mod.y + mod.h));
              if (distToYFace <= SNAP_THRESHOLD) {
                candidates.push({ dist: distToYFace, x: mod.x, y: mod.y + mod.h, length: mod.w, face: "Y" });
              }

              // W face (top of module) — snap X to module's left edge and Y above
              const distToWFace = Math.abs(cursorCellY - mod.y);
              if (distToWFace <= SNAP_THRESHOLD) {
                candidates.push({ dist: distToWFace, x: mod.x, y: mod.y - wall.thickness, length: mod.w, face: "W" });
              }
            }

            // Pick the single nearest candidate
            if (candidates.length > 0) {
              const nearest = candidates.reduce((a, b) => a.dist < b.dist ? a : b);
              snapped = { x: nearest.x, y: nearest.y, length: nearest.length, face: nearest.face };
            }
          } else {
           // Vertical walls - find nearest of Z or X face
           const candidates = [];
           const isEndWall = wall.face === "Z" || wall.face === "X";

           for (const mod of placedModules) {
             // Only snap if wall length matches module height
             if (Math.abs(wall.length - mod.h) > 0.1) continue;
             // Wall can snap to any module with matching height — remove Y alignment check

             const isEnd = mod.chassis === "EF" || mod.chassis === "ER" || mod.chassis === "LF" || mod.chassis === "RF" || mod.chassis === "End";
             if (isEndWall && !isEnd) continue;

             // Z face (left side of module) — snap X to left edge and Y to module's top
             const distToZFace = Math.abs(cursorCellX - mod.x);
             if (distToZFace <= SNAP_THRESHOLD) {
               candidates.push({ dist: distToZFace, x: mod.x, y: mod.y, length: mod.h, face: "Z" });
             }

             // X face (right side of module) — snap X to right edge and Y to module's top
             const distToXFace = Math.abs(cursorCellX - (mod.x + mod.w));
             if (distToXFace <= SNAP_THRESHOLD) {
               candidates.push({ dist: distToXFace, x: mod.x + mod.w - wall.thickness, y: mod.y, length: mod.h, face: "X" });
             }
           }

           // Pick the single nearest candidate
           if (candidates.length > 0) {
             const nearest = candidates.reduce((a, b) => a.dist < b.dist ? a : b);
             snapped = { x: nearest.x, y: nearest.y, length: nearest.length, face: nearest.face };
           }
          }

          if (snapped) {
            const wallUpdate = { length: snapped.length, face: snapped.face };
            if (snapped.rotation) wallUpdate.rotation = snapped.rotation;
            if (onMoveWall) onMoveWall(wall.id, snapped.x, snapped.y, wallUpdate);
          } else {
            // No snap found - place at cursor center
            const wallHalfLengthX = wall.orientation === "horizontal" ? wall.length / 2 : wall.thickness / 2;
            const wallHalfLengthY = wall.orientation === "vertical" ? wall.length / 2 : wall.thickness / 2;
            const newX = Math.max(0, Math.min(exactX - wallHalfLengthX, GRID_COLS - 1));
            const newY = Math.max(0, Math.min(exactY - wallHalfLengthY, GRID_ROWS - 1));
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
      const minX = Math.min(selectionBox.startX, selectionBox.cursorX) * (zoom / 100);
      const maxX = Math.max(selectionBox.startX, selectionBox.cursorX) * (zoom / 100);
      const minY = Math.min(selectionBox.startY, selectionBox.cursorY) * (zoom / 100);
      const maxY = Math.max(selectionBox.startY, selectionBox.cursorY) * (zoom / 100);

      const newSelected = new Set();
      placedModules.forEach((mod) => {
        const modX1 = mod.x * scaledCellW;
        const modY1 = mod.y * scaledCellH;
        const modX2 = modX1 + mod.w * scaledCellW;
        const modY2 = modY1 + mod.h * scaledCellH;
        
        if (!(modX2 < minX || modX1 > maxX || modY2 < minY || modY1 > maxY)) {
          newSelected.add(mod.id);
        }
      });
      
      // Check if any wall is in the selection box
      const newSelectedWalls = new Set(selectedWallIds);
      walls.forEach((wall) => {
        const wallW = wall.orientation === "horizontal" ? wall.length * scaledCellW : wall.thickness * scaledCellW;
        const wallH = wall.orientation === "vertical" ? wall.length * scaledCellH : wall.thickness * scaledCellH;
        const wallX1 = wall.x * scaledCellW;
        const wallY1 = wall.y * scaledCellH;
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
    const deltaX = Math.round((dragging.cursorX - (rect.left + dragging.mod.x * scaledCellW + dragging.offsetX)) / scaledCellW);
    const deltaY = Math.round((dragging.cursorY - (rect.top + dragging.mod.y * scaledCellH + dragging.offsetY)) / scaledCellH);

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
      if (!mod) return;
      
      const canPlace = canPlaceGroup(mod, mod.x + deltaX, mod.y + deltaY, dragging.selectedIds);
      if (canPlace) {
        onMove(id, mod.x + deltaX, mod.y + deltaY);
        
        // Move walls attached to this module (only if exactly snapped)
        const WALL_THRESHOLD = 0.1;
        walls.forEach((wall) => {
          if (wall.orientation === "horizontal") {
            // Wall must be exactly aligned with the module
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
            // Only move Z/X walls with end modules
            const isEndMod = mod.chassis === "EF" || mod.chassis === "ER" || mod.chassis === "LF" || mod.chassis === "RF" || mod.chassis === "End";
            if (!isEndMod) return;
            // Wall must be exactly aligned with the module
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

    try {
      const wallType = e.dataTransfer.getData("wallType");
      if (wallType && selectedWallIds.size > 0 && gridRef.current) {
        const wallTemplate = wallTypes.find((w) => w.type === wallType);
        const selectedWallId = Array.from(selectedWallIds)[0];
        const selectedWall = walls.find(w => w.id === selectedWallId);

        if (wallTemplate && selectedWall && selectedWall.orientation === wallTemplate.orientation) {
          // Calculate cursor position in grid coordinates
          const rect = gridRef.current.getBoundingClientRect();
          const exactX = (e.clientX - rect.left) / scaledCellW;
          const exactY = (e.clientY - rect.top) / scaledCellH;
          
          // Snap preview to selected wall's position (live drag preview)
          setDragPreview({ x: selectedWall.x, y: selectedWall.y, wallTemplate });
        } else {
          setDragPreview(null);
        }
      } else {
        setDragPreview(null);
      }
    } catch {
      setDragPreview(null);
    }
  };

  const handleDrop = (e) => {
   e.preventDefault();
   e.stopPropagation();

   const furnitureType = e.dataTransfer.getData("furnitureType");
   const furnitureDataStr = e.dataTransfer.getData("furnitureData");
   if (furnitureType && gridRef.current) {
     const { x, y } = getCellFromClient(e.clientX, e.clientY);
     let furnitureItem = { id: furnitureType, type: furnitureType, label: furnitureType };
     if (furnitureDataStr) {
       try {
         furnitureItem = JSON.parse(furnitureDataStr);
       } catch (err) {
         // Fallback to simple item if parsing fails
       }
     }
     onPlaceFurniture?.(furnitureItem, x, y);
     return;
   }

   const modType = e.dataTransfer.getData("moduleType");
    const moduleImage = e.dataTransfer.getData("moduleImage");
    if (modType) {
      let mod = MODULE_TYPES.find((m) => m.type === modType);

      // If not in MODULE_TYPES, try custom modules
      if (!mod && customModules.length > 0) {
        const customMod = customModules.find(c => c.code === modType);
        if (customMod) {
          const variants = (customMod.variants || []).map(v => v.toLowerCase());
          const isEnd = variants.some(v => v.includes("end"));
          const isConnection = variants.some(v => v.includes("connection"));
          const chassis = isConnection ? "C" : isEnd ? "LF" : "SF";

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
      let { x, y } = getCellFromClient(e.clientX, e.clientY);

      // Clamp to grid bounds
      x = Math.max(0, Math.min(x, GRID_COLS - mod.w));
      y = Math.max(0, Math.min(y, GRID_ROWS - mod.h));

      // Try to snap to nearby modules, otherwise place as-is
      const snapped = magnetSnap(mod, x, y);
      onPlace(mod, snapped.snapX, snapped.snapY);
      return;
    }

    const wallType = e.dataTransfer.getData("wallType");
    if (wallType) {
      const wallTemplate = wallTypes.find((w) => w.type === wallType);
      if (!wallTemplate || !gridRef.current) return;

      // Allow wall placement if a module is selected OR a wall is selected (for wall swapping)
      if (selected.size === 0 && selectedWallIds.size === 0) return;

      // If a wall is selected, update it with the new wall type
      if (selectedWallIds.size > 0) {
        const selectedWallId = Array.from(selectedWallIds)[0];
        const selectedWall = walls.find(w => w.id === selectedWallId);
        if (selectedWall && selectedWall.orientation === wallTemplate.orientation) {
          // Update wall properties directly (preserves position and ID)
          if (onUpdateWall) onUpdateWall(selectedWall.id, wallTemplate);
          return;
        }
      }

      const rect = gridRef.current.getBoundingClientRect();
      const exactX = (e.clientX - rect.left) / scaledCellW;
      const exactY = (e.clientY - rect.top) / scaledCellH;
      const SNAP_THRESHOLD = 0.8; // cells
      const CELL_M = 0.6;
      
      let snapped = null;
      const candidates = [];

      if (wallTemplate.orientation === "horizontal") {
        for (const mod of placedModules) {
          if (isConnectionModule(mod)) continue;

          const modWidthM = mod.w * CELL_M;
          const wallLengthM = wallTemplate.length;
          if (Math.abs(modWidthM - wallLengthM) > 0.1) continue;

          // Y face (below) — wall sits directly below module
          const distY = Math.abs(exactY - (mod.y + mod.h));
          if (distY <= SNAP_THRESHOLD) {
            candidates.push({ dist: distY, x: mod.x, y: mod.y + mod.h, face: "Y" });
          }

          // W face (above) — wall sits directly above module
          const distW = Math.abs(exactY - mod.y);
          if (distW <= SNAP_THRESHOLD) {
            candidates.push({ dist: distW, x: mod.x, y: mod.y - wallTemplate.thickness, face: "W" });
          }
        }
      } else {
        // Vertical walls
        const isEndWall = wallTemplate.face === "Z" || wallTemplate.face === "X";
        for (const mod of placedModules) {
          const isEnd = mod.chassis === "EF" || mod.chassis === "ER" || mod.chassis === "LF" || mod.chassis === "RF" || mod.chassis === "End";
          if (isEndWall && !isEnd) continue;

          const modHeightM = mod.h * CELL_M;
          const wallLengthM = wallTemplate.length;
          if (Math.abs(modHeightM - wallLengthM) > 0.1) continue;

          // Z face (left)
          const distZ = Math.abs(exactX - mod.x);
          if (distZ <= SNAP_THRESHOLD) {
            candidates.push({ dist: distZ, x: mod.x, y: mod.y, face: "Z" });
          }

          // X face (right)
          const distX = Math.abs(exactX - (mod.x + mod.w));
          if (distX <= SNAP_THRESHOLD) {
            candidates.push({ dist: distX, x: mod.x + mod.w - wallTemplate.thickness, y: mod.y, face: "X" });
          }
        }
      }

      // Pick nearest candidate
      if (candidates.length > 0) {
        const nearest = candidates.reduce((a, b) => a.dist < b.dist ? a : b);
        const wallWithFace = { ...wallTemplate, face: nearest.face };
        if (onPlaceWall) onPlaceWall(wallWithFace, nearest.x, nearest.y);
      } else {
        // Freeform placement centered on cursor
        const halfLenX = wallTemplate.orientation === "horizontal" ? wallTemplate.length / 2 : wallTemplate.thickness / 2;
        const halfLenY = wallTemplate.orientation === "vertical" ? wallTemplate.length / 2 : wallTemplate.thickness / 2;
        const centerX = Math.max(0, Math.min(exactX - halfLenX, GRID_COLS - 1));
        const centerY = Math.max(0, Math.min(exactY - halfLenY, GRID_ROWS - 1));
        if (onPlaceWall) onPlaceWall(wallTemplate, centerX, centerY);
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
    const snapX = Math.round(rawX / scaledCellW);
    const snapY = Math.round(rawY / scaledCellH);
    return { snapX, snapY };
  };

  const dragSnap = getDragSnapPos();

  const SCROLL_BUFFER = 75 * scaledCellW; // 75 extra cells of space on the left

  // Scroll to centre on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = SCROLL_BUFFER;
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="overflow-auto w-full h-full"
      style={{ display: hidden ? "none" : undefined }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div style={{ paddingLeft: SCROLL_BUFFER, display: "inline-block" }}>
      <div
        ref={gridRef}
        className="relative select-none"
        style={{
          width: GRID_COLS * scaledCellW,
          height: GRID_ROWS * scaledCellH,
          backgroundImage: `
            linear-gradient(to right, #D1D5DB 1px, transparent 1px),
            linear-gradient(to bottom, #D1D5DB 1px, transparent 1px),
            linear-gradient(to right, #E5E7EB 0.5px, transparent 0.5px),
            linear-gradient(to bottom, #E5E7EB 0.5px, transparent 0.5px)
          `,
          backgroundSize: `${scaledCellW}px ${scaledCellH}px, ${scaledCellW}px ${scaledCellH}px, ${scaledCellW / 6}px ${scaledCellH / 6}px, ${scaledCellW / 6}px ${scaledCellH / 6}px`,
          backgroundColor: "#F5F5F3",
          border: "1.5px solid #D1D5DB",
        }}
        onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragPreview(null)}
          onMouseDown={startSelectionBox}
      >
        {/* Colour stripes — fixed absolute Y bands */}
        <>
          {/* Green strip — Pavilion 1 (1 row, 5 rows above connection module row 19) */}
          <div className="absolute pointer-events-none" style={{ left: 0, top: 14 * scaledCellH, width: GRID_COLS * scaledCellW, height: 1 * scaledCellH, backgroundColor: "rgba(34, 197, 94, 0.075)" }} />
          <div className="absolute pointer-events-none text-gray-400 font-bold text-sm uppercase tracking-wide" style={{ left: "12px", top: 14 * scaledCellH + 4 }}>Pavilion 1</div>

          {/* Red strip — Connection Module (row 19) */}
          <div className="absolute pointer-events-none" style={{ left: 0, top: 19 * scaledCellH, width: GRID_COLS * scaledCellW, height: 1 * scaledCellH, backgroundColor: "rgba(239, 68, 68, 0.075)" }} />
          <div className="absolute pointer-events-none text-gray-400 font-bold text-sm uppercase tracking-wide" style={{ left: "12px", top: 19 * scaledCellH + 4 }}>Connection Module</div>

          {/* Blue stripe — Pavilion 2 (1 row, 5 rows below connection module row 19) */}
          <div className="absolute pointer-events-none" style={{ left: 0, top: 24 * scaledCellH, width: GRID_COLS * scaledCellW, height: 1 * scaledCellH, backgroundColor: "rgba(59, 130, 246, 0.075)" }} />
          <div className="absolute pointer-events-none text-gray-400 font-bold text-sm uppercase tracking-wide" style={{ left: "12px", top: 24 * scaledCellH + 4 }}>Pavilion 2</div>
        </>

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
              data-module-id={mod.id}
              onMouseDown={(e) => startDragPlaced(e, mod)}
              onMouseEnter={() => setHoveredModuleId(mod.id)}
              onMouseLeave={() => setHoveredModuleId(null)}
              className="absolute group cursor-grab active:cursor-grabbing"
              style={{
                left: mod.x * scaledCellW,
                top: mod.y * scaledCellH,
                width: mod.w * scaledCellW,
                height: mod.h * scaledCellH,
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
                {(mod.floorPlanImage || floorPlanImages[mod.type] || floorPlanImages[mod.type?.toLowerCase()]) ? (
                   <img src={mod.floorPlanImage || floorPlanImages[mod.type] || floorPlanImages[mod.type?.toLowerCase()]} alt={mod.label} className="w-full h-full object-cover" style={{ transform: mod.flipped ? 'scaleX(-1)' : undefined }} />
                 ) : (
                   <FloorPlanSVG code={mod.type} className="w-full h-full" style={{ transform: mod.flipped ? 'scaleX(-1)' : undefined }} />
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

              {/* Face labels - conditionally shown based on module type */}
              {(() => {
                const isConnection = mod.chassis === "C" || isConnectionModule(mod);
                const isLeftEnd = mod.chassis === "LF" || mod.chassis === "ER";
                const isRightEnd = mod.chassis === "RF" || mod.chassis === "LR";
                const isDeck = mod.description && mod.description.includes("Deck");
                
                // Standard: W, Y | Left end: W, Z, Y | Right end: W, X, Y | Deck: W, Y | Connection: Z, X
                const showW = !isConnection;
                const showX = isConnection || isRightEnd;
                const showY = !isConnection;
                const showZ = (isLeftEnd || isConnection);
                
                const isVisibleBtn = isSelected || hoveredModuleId === mod.id;
                
                return (
                  <>
                    {showW && <button onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setFaceMenuOpen({ module: mod, face: 'W', x: e.clientX, y: e.clientY }); }} className={`absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-sm z-20 ${!isVisibleBtn ? 'opacity-0 pointer-events-none' : ''}`}>W</button>}
                    {showX && <button onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setFaceMenuOpen({ module: mod, face: 'X', x: e.clientX, y: e.clientY }); }} className={`absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-sm z-20 ${!isVisibleBtn ? 'opacity-0 pointer-events-none' : ''}`}>X</button>}
                    {showY && <button onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setFaceMenuOpen({ module: mod, face: 'Y', x: e.clientX, y: e.clientY }); }} className={`absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-sm z-20 ${!isVisibleBtn ? 'opacity-0 pointer-events-none' : ''}`}>Y</button>}
                    {showZ && <button onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setFaceMenuOpen({ module: mod, face: 'Z', x: e.clientX, y: e.clientY }); }} className={`absolute left-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-sm z-20 ${!isVisibleBtn ? 'opacity-0 pointer-events-none' : ''}`}>Z</button>}
                  </>
                );
              })()}
            
            </div>
              );
              })}

        {/* Live drag preview — modules and furniture */}
        {dragging && (
          <>
            {/* Furniture drag preview */}
            {dragging.isFurniture && (
              (() => {
                const item = dragging.mod;
                const rect = gridRef.current?.getBoundingClientRect();
                if (!rect) return null;
                const width = (item.width || 1.4) / 0.6;
                const height = (item.depth || 2.0) / 0.6;
                const deltaX = (dragging.cursorX - rect.left - item.x * scaledCellW - dragging.offsetX) / scaledCellW;
                const deltaY = (dragging.cursorY - rect.top - item.y * scaledCellH - dragging.offsetY) / scaledCellH;
                return (
                  <div
                    className="absolute pointer-events-none overflow-visible flex flex-col items-center justify-center"
                    style={{
                      left: (item.x + deltaX) * scaledCellW,
                      top: (item.y + deltaY) * scaledCellH,
                      width: width * scaledCellW,
                      height: height * scaledCellH,
                      opacity: 0.75,
                      boxShadow: "0 4px 12px rgba(241, 90, 34, 0.3)",
                      transform: `rotate(${item.rotation || 0}deg)`,
                      transformOrigin: "center",
                    }}
                  >
                    {item.image && (
                      <img src={item.image} alt={item.label} className="absolute object-contain" style={{ width: item.id.startsWith('bed_') ? '109%' : '100%', height: item.id.startsWith('bed_') ? '109%' : '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    )}
                    <span className="absolute text-[8px] font-semibold text-gray-700 bg-white/80 px-1 py-0.5 rounded bottom-1">
                      {item.label}
                    </span>
                  </div>
                );
              })()
            )}
            {/* Modules drag preview */}
            {dragging.isPlaced && !dragging.isFurniture && Array.from(dragging.selectedIds).map((id) => {
              const mod = placedModules.find((m) => m.id === id);
              if (!mod) return null;
              const rect = gridRef.current?.getBoundingClientRect();
              if (!rect) return null;
              const deltaX = (dragging.cursorX - rect.left - dragging.mod.x * scaledCellW - dragging.offsetX) / scaledCellW;
              const deltaY = (dragging.cursorY - rect.top - dragging.mod.y * scaledCellH - dragging.offsetY) / scaledCellH;
              return (
                <div
                  key={id}
                  className="absolute pointer-events-none"
                  style={{
                    left: (mod.x + deltaX) * scaledCellW,
                    top: (mod.y + deltaY) * scaledCellH,
                    width: mod.w * scaledCellW,
                    height: mod.h * scaledCellH,
                    opacity: 0.65,
                    border: "2px solid #4F46E5",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  {(mod.floorPlanImage || floorPlanImages[mod.type] || floorPlanImages[mod.type?.toLowerCase()]) ? (
                    <img src={mod.floorPlanImage || floorPlanImages[mod.type] || floorPlanImages[mod.type?.toLowerCase()]} alt={mod.label} className="w-full h-full object-cover" />
                  ) : (
                    <FloorPlanSVG code={mod.type} className="w-full h-full" />
                  )}
                </div>
              );
            })}

          </>
        )}

        {/* Drag preview for new walls */}
        {dragPreview && (
          (() => {
            const { x, y, wallTemplate } = dragPreview;
            const wallW = wallTemplate.orientation === "horizontal" ? wallTemplate.length * scaledCellW : wallTemplate.thickness * scaledCellW;
            const wallH = wallTemplate.orientation === "vertical" ? wallTemplate.length * scaledCellH : wallTemplate.thickness * scaledCellH;
            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: x * scaledCellW,
                  top: y * scaledCellH,
                  width: wallW,
                  height: wallH,
                  backgroundColor: "#22c55e",
                  opacity: 0.4,
                  border: "2px dashed #16a34a",
                }}
              />
            );
          })()
        )}

        {/* Furniture */}
         {furniture.map((item) => {
           const width = (item.width || 1.4) / 0.6;
           const height = (item.depth || 2.0) / 0.6;

           return (
             <div
               key={item.id}
               className="absolute group cursor-grab active:cursor-grabbing"
               style={{
                 left: item.x * scaledCellW,
                 top: item.y * scaledCellH,
                 width: width * scaledCellW,
                 height: height * scaledCellH,
                 transform: `rotate(${item.rotation || 0}deg)`,
                 transformOrigin: "center",
                 backgroundColor: "transparent",
                 border: "none",
               }}
               onMouseDown={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 const rect = gridRef.current.getBoundingClientRect();
                 const offsetX = e.clientX - rect.left - item.x * scaledCellW;
                 const offsetY = e.clientY - rect.top - item.y * scaledCellH;
                 setDragging({ mod: item, offsetX, offsetY, cursorX: e.clientX, cursorY: e.clientY, isPlaced: true, selectedIds: new Set([item.id]), isFurniture: true, dragImage: true });
                 // Set empty drag image on next frame to hide browser icon
                 setTimeout(() => {
                   if (e.dataTransfer) {
                     const emptyImage = new Image();
                     e.dataTransfer?.setDragImage?.(emptyImage, 0, 0);
                   }
                 }, 0);
               }}
             >
               <div className="w-full h-full overflow-visible relative">
                 {item.image ? (
                   <img src={item.image} alt={item.label} className="absolute object-contain" loading="eager" style={{ width: item.id.startsWith('bed_') ? '109%' : '100%', height: item.id.startsWith('bed_') ? '109%' : '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-[7px] font-semibold text-gray-400">
                     {item.label}
                   </div>
                 )}
                 <span className="absolute text-center text-[7px] font-semibold text-gray-500 pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', zIndex: 10 }}>
                   {item.label}<br />{(item.width || 1.4).toFixed(1)}m × {(item.depth || 2.0).toFixed(1)}m
                 </span>
               </div>
               <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{ top: '-26px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                 <button
                   onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onRotateFurniture?.(item.id); }}
                   className="bg-white rounded-full p-1 shadow-sm hover:bg-orange-50 z-10"
                   title="Rotate"
                 >
                   <RotateCw size={10} className="text-[#F15A22]" />
                 </button>
                 <button
                   onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onRemoveFurniture?.(item.id); }}
                   className="bg-white rounded-full p-1 shadow-sm hover:bg-red-50 z-10"
                   title="Delete"
                 >
                   <X size={10} className="text-red-400" />
                 </button>
               </div>
             </div>
           );
         })}

        {/* Walls */}
         {walls.map((wall) => {
           const isBeingDragged = draggingWall?.wall.id === wall.id;
           const isSelected = selectedWallIds.has(wall.id);
           const wallW = wall.orientation === "horizontal" ? wall.length * scaledCellW : wall.thickness * scaledCellW;
           const wallH = wall.orientation === "vertical" ? wall.length * scaledCellH : wall.thickness * scaledCellH;

           // Ghost position while dragging — round to cell grid
           let ghostLeft = wall.x * scaledCellW;
           let ghostTop = wall.y * scaledCellH;
           if (isBeingDragged && gridRef.current) {
             const rect = gridRef.current.getBoundingClientRect();
             const cursorX = draggingWall.cursorX - rect.left;
             const cursorY = draggingWall.cursorY - rect.top;
             const rawCellX = (cursorX - draggingWall.offsetX) / scaledCellW;
             const rawCellY = (cursorY - draggingWall.offsetY) / scaledCellH;
             // Round to nearest cell for smooth snapping
             const snappedCellX = Math.round(rawCellX * 2) / 2;
             const snappedCellY = Math.round(rawCellY * 2) / 2;
             ghostLeft = snappedCellX * scaledCellW;
             ghostTop = snappedCellY * scaledCellH;
           }

           return (
             <div key={wall.id} className="group absolute" style={{ left: wall.x * scaledCellW, top: wall.y * scaledCellH, width: wallW, height: wallH }} onMouseEnter={() => setHoveredWallId(wall.id)} onMouseLeave={() => setHoveredWallId(null)}>
               <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.target.closest("button")) return;
                    e.preventDefault();
                    setSelected(new Set());
                    setSelectedModId(null);
                    setSelectedWallIds(new Set([wall.id]));
                  }}
                  className={`absolute flex items-center justify-center overflow-hidden w-full h-full cursor-grab active:cursor-grabbing`}
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
                       className="w-full h-full object-contain opacity-60"
                     />
                   )}
                 </div>
               )}
             </div>
           );
           })}



        {/* Dimensions */}
        {placedModules.length > 0 && (() => {
          const minX = Math.min(...placedModules.map(m => m.x));
          const maxX = Math.max(...placedModules.map(m => m.x + m.w));
          const minY = Math.min(...placedModules.map(m => m.y));
          const maxY = Math.max(...placedModules.map(m => m.y + m.h));
          const widthM = (maxX - minX) * 0.6;
          const zoomScale = zoom / 100;

          // Detect pavilions dynamically by clustering modules by Y position
          const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
          const sortedYs = [...new Set(placedModules.map(m => m.y))].sort((a, b) => a - b);
          const groups = [];
          let currentGroup = [];
          for (const y of sortedYs) {
            if (currentGroup.length === 0 || y - currentGroup[currentGroup.length - 1] <= 3) {
              currentGroup.push(y);
            } else {
              groups.push(currentGroup);
              currentGroup = [y];
            }
          }
          if (currentGroup.length > 0) groups.push(currentGroup);

          // Identify which groups are pavilions vs connection module (middle group)
          // Connection module is the group between two pavilion groups (if 3 groups exist)
          const dimColor = '#94a3b8';

          const allGroupDimensions = groups.map((group, i) => {
            const yMin = group[0];
            const yMax = group[group.length - 1];
            const modsInPav = placedModules.filter(m => m.y >= yMin && m.y <= yMax + 2);
            if (modsInPav.length === 0) return null;
            const pavMinX = Math.min(...modsInPav.map(m => m.x));
            const pavMaxX = Math.max(...modsInPav.map(m => m.x + m.w));
            const pavMinY = Math.min(...modsInPav.map(m => m.y));
            const pavMaxY = Math.max(...modsInPav.map(m => m.y + m.h));
            const isConnection = groups.length === 3 && i === 1;
            return { name: isConnection ? 'Conn' : `P${i+1}`, isConnection, color: dimColor, minX: pavMinX, maxX: pavMaxX, pavMinY, pavMaxY };
          }).filter(Boolean);

          const pavilionDimensions = allGroupDimensions.filter(g => !g.isConnection);
          const connectionDimensions = allGroupDimensions.filter(g => g.isConnection);

          const depthM = (maxY - minY) * 0.6;

          return (
            <>
              {/* Overall length dimension (horizontal) */}
              <div className="absolute pointer-events-none flex items-center justify-center" style={{ left: minX * scaledCellW, top: (minY - 3) * scaledCellH, width: (maxX - minX) * scaledCellW, height: 1 }}>
                <div className="absolute" style={{ height: 2, width: '100%', backgroundColor: '#CBD5E1' }} />
                <div className="absolute pointer-events-none" style={{ left: 0, top: '-4px', width: 2, height: 10, backgroundColor: '#CBD5E1' }} />
                <div className="absolute pointer-events-none" style={{ right: 0, top: '-4px', width: 2, height: 10, backgroundColor: '#CBD5E1' }} />
                <span className="relative text-xs font-semibold text-slate-400 px-1" style={{ backgroundColor: '#F5F5F3' }}>{widthM.toFixed(1)}m</span>
              </div>



              {/* Pavilion depth dimensions (vertical, fixed 5.2m) */}
               {pavilionDimensions.map(pav => {
                 const actualHeightCells = 5.2 / 0.6;
                 const pavCenterY = (pav.pavMinY + pav.pavMaxY) / 2;
                 const dimTop = pavCenterY - actualHeightCells / 2;
                 const dimLeft = (pav.minX - 3) * CELL_W;
                 return (
                   <div key={pav.name} className="absolute pointer-events-none" style={{ left: dimLeft, top: dimTop * CELL_H, width: 12, height: actualHeightCells * CELL_H }}>
                     <div className="absolute" style={{ left: 4, width: 1.5, top: 0, bottom: 0, backgroundColor: pav.color, opacity: 0.6 }} />
                     <div className="absolute" style={{ left: 0, top: 0, width: 10, height: 1.5, backgroundColor: pav.color, opacity: 0.6 }} />
                     <div className="absolute" style={{ left: 0, bottom: 0, width: 10, height: 1.5, backgroundColor: pav.color, opacity: 0.6 }} />
                     <span className="absolute text-xs font-semibold" style={{ top: '50%', left: 10, transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'left center', color: pav.color, backgroundColor: '#F5F5F3', padding: '0 2px', whiteSpace: 'nowrap' }}>5.2m</span>
                   </div>
                 );
               })}

               {/* Pavilion 2 bottom length dimension */}
               {pavilionDimensions.length >= 2 && (() => {
                 const pav2 = pavilionDimensions[pavilionDimensions.length - 1];
                 const pav2WidthM = (pav2.maxX - pav2.minX) * 0.6;
                 return (
                   <div key="pav2-bottom-dim" className="absolute pointer-events-none flex items-center justify-center" style={{ left: pav2.minX * CELL_W, top: (pav2.pavMaxY + 3) * CELL_H, width: (pav2.maxX - pav2.minX) * CELL_W, height: 1 }}>
                     <div className="absolute" style={{ height: 2, width: '100%', backgroundColor: '#CBD5E1' }} />
                     <div className="absolute pointer-events-none" style={{ left: 0, top: '-4px', width: 2, height: 10, backgroundColor: '#CBD5E1' }} />
                     <div className="absolute pointer-events-none" style={{ right: 0, top: '-4px', width: 2, height: 10, backgroundColor: '#CBD5E1' }} />
                     <span className="relative text-xs font-semibold text-slate-400 px-1" style={{ backgroundColor: '#F5F5F3' }}>{pav2WidthM.toFixed(1)}m</span>
                   </div>
                 );
               })()}

               {/* Connection module depth dimensions (vertical, actual size) */}
               {connectionDimensions.map(conn => {
                 const actualHeightCells = conn.pavMaxY - conn.pavMinY;
                 const actualHeightM = (actualHeightCells * 0.6).toFixed(1);
                 const dimTop = conn.pavMinY;
                 const dimLeft = (conn.minX - 3) * CELL_W;
                 return (
                   <div key={conn.name} className="absolute pointer-events-none" style={{ left: dimLeft, top: dimTop * CELL_H, width: 12, height: actualHeightCells * CELL_H }}>
                     <div className="absolute" style={{ left: 4, width: 1.5, top: 0, bottom: 0, backgroundColor: conn.color, opacity: 0.6 }} />
                     <div className="absolute" style={{ left: 0, top: 0, width: 10, height: 1.5, backgroundColor: conn.color, opacity: 0.6 }} />
                     <div className="absolute" style={{ left: 0, bottom: 0, width: 10, height: 1.5, backgroundColor: conn.color, opacity: 0.6 }} />
                     <span className="absolute text-xs font-semibold" style={{ top: '50%', left: 10, transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'left center', color: conn.color, backgroundColor: '#F5F5F3', padding: '0 2px', whiteSpace: 'nowrap' }}>{actualHeightM}m</span>
                   </div>
                 );
               })}

            </>
          );
        })()}

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

        {/* Face menu popup */}
        {faceMenuOpen && (
          <div 
            className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 overflow-hidden"
            style={{ left: `${faceMenuOpen.x + 8}px`, top: `${faceMenuOpen.y + 8}px`, maxWidth: '280px' }}
            onMouseLeave={() => setFaceMenuOpen(null)}
          >
            <div className="py-1 max-h-96 overflow-y-auto">
              {wallTypes
                .filter(w => {
                  const isHorizontal = faceMenuOpen.face === "W" || faceMenuOpen.face === "Y";
                  const isVertical = faceMenuOpen.face === "Z" || faceMenuOpen.face === "X";
                  const orientMatch = (isHorizontal && w.orientation === "horizontal") || (isVertical && w.orientation === "vertical");
                  if (!orientMatch) return false;

                  // Match wall size to module size
                  const moduleSize = isHorizontal ? faceMenuOpen.module.w * 0.6 : faceMenuOpen.module.h * 0.6;
                  const wallSize = w.width || 0;
                  const sizeMatch = Math.abs(wallSize - moduleSize) < 0.1;
                  
                  return sizeMatch;
                })
                .map(wt => (
                  <button
                    key={wt.type}
                    onClick={() => {
                      onModuleSelect?.(faceMenuOpen.module);
                      onPlaceWallOnFace?.(wt, faceMenuOpen.module, faceMenuOpen.face);
                      setFaceMenuOpen(null);
                    }}
                    className="w-full text-left px-2 py-2 hover:bg-[#F15A22] hover:text-white transition-colors border-b border-gray-100 last:border-b-0 flex gap-2 items-start"
                  >
                    <div className="w-16 h-12 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                      {(wt.elevationImage || wallImages[wt.type]) ? (
                        <img src={wt.elevationImage || wallImages[wt.type]} alt={wt.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[10px] text-gray-400 font-bold">{wt.type}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs leading-tight">{wt.label}</div>
                      <div className="text-[9px] text-gray-500">{wt.type || wt.mpCode}</div>
                      {wt.description && <div className="text-[9px] text-gray-500 leading-tight">{wt.description}</div>}
                      <div className="text-[9px] opacity-70 text-gray-600">${(wt.price || 0).toLocaleString()}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-1 text-center">
          Grid: {GRID_COLS}×{GRID_ROWS} cells · Snap: 600mm
        </p>
      </div>
      </div>
      );
      }