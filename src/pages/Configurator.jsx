import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ModulePanel, { MODULE_TYPES } from "@/components/configurator/ModulePanel";
import ConfigGrid from "@/components/configurator/ConfigGrid";
import DesignSummary from "@/components/configurator/DesignSummary";
import SavedDesigns from "@/components/configurator/SavedDesigns";
import SaveDesignModal from "@/components/configurator/SaveDesignModal";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, FolderOpen, Save, Trash2, ChevronLeft, ChevronRight, Undo2, Box, Grid2X2, Image, LayoutTemplate } from "lucide-react";

import PrintablePlansSheet from "@/components/configurator/PrintablePlansSheet";
import PrintableElevationsSheet from "@/components/configurator/PrintableElevationsSheet";
import ElevationGallery from "@/components/configurator/ElevationGallery";
import QuoteGenerator from "@/components/configurator/QuoteGenerator";

const generateId = () => `mod-${Math.random().toString(36).substr(2, 9)}`;
const generateWallId = () => `wall-${Math.random().toString(36).substr(2, 9)}`;

export default function Configurator() {
  const MAX_HISTORY = 10;
  const [history, setHistory] = useState([]);
  const [placedModules, setPlacedModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem("configurator_modules") || "[]"); } catch { return []; }
  });
  const [walls, setWalls] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("configurator_walls") || "[]");
      return saved.map(w => {
        const wallType = w.type || w.mpCode || w.label || w.code || w.wallType || null;
        return wallType ? { ...w, type: wallType } : { ...w };
      });
    } catch { return []; }
  });

  const pushHistory = useCallback((modules, w) => {
    setHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), { placedModules: modules, walls: w }]);
  }, []);
  const [draggingMod, setDraggingMod] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 16, y: 60 });
  const [draggingPanel, setDraggingPanel] = useState(null);
  const [summaryPos, setSummaryPos] = useState({ x: window.innerWidth - 256 - 16, y: 60 });
  const [draggingSummary, setDraggingSummary] = useState(null);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [selectedWall, setSelectedWall] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [printMode, setPrintMode] = useState(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [viewMode, setViewMode] = useState("2d");

  // Load template from catalogue if set
  useEffect(() => {
    const raw = sessionStorage.getItem("load_template");
    if (raw) {
      sessionStorage.removeItem("load_template");
      try {
        const design = JSON.parse(raw);
        handleLoad(design);
      } catch {}
    }
  }, []);
  const { data: customWalls = [] } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: async () => { try { const r = await base44.entities.WallEntry.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const { data: deletedWalls = [] } = useQuery({
    queryKey: ["deletedWalls"],
    queryFn: async () => { try { const r = await base44.entities.DeletedWall.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const availableWallTypes = React.useMemo(() => {
    const deletedCodes = new Set(deletedWalls.map(d => d.wallCode));
    return customWalls
      .filter(w => !deletedCodes.has(w.code))
      .map(w => {
        let parsedOrientation = "horizontal";
        let parsedWidthM = w.width ? w.width / 1000 : 3.0;

        // Try to detect orientation from code prefix
        if (w.code) {
          if (w.code.startsWith("ZX") || w.code.startsWith("ZC-") || w.code.startsWith("XC-")) {
            parsedOrientation = "vertical";
          } else if (w.code.startsWith("WY")) {
            parsedOrientation = "horizontal";
          }
        }

        return {
          type: w.code,
          label: w.name,
          description: w.description || "",
          mpCode: w.code,
          width: parsedWidthM,
          orientation: parsedOrientation,
          length: Math.round(parsedWidthM / 0.6),
          thickness: 0.31,
          variants: w.variants || [],
        };
      });
  }, [customWalls, deletedWalls]);
  const queryClient = useQueryClient();

  const { data: designs = [] } = useQuery({
    queryKey: ["homeDesigns"],
    queryFn: async () => { try { const r = await base44.entities.HomeDesign.list("-created_date"); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const wallImagesRef = useRef({});
  const floorPlanImagesRef = useRef({});

  const { data: wallImages = {} } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => {
      try {
        const wallImages = await base44.entities.WallImage.list();
        if (!Array.isArray(wallImages)) return {};
        const entries = {};
        wallImages.forEach(img => {
          if (img.wallType && img.imageUrl) {
            entries[img.wallType] = img.imageUrl;
          }
        });
        console.log("[Configurator] WallImages loaded:", Object.keys(entries).length, "images");
        wallImagesRef.current = entries;
        return entries;
      } catch (e) { 
        console.error("[Configurator] WallImages error:", e);
        return {}; 
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  const { data: floorPlanImages = {} } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => {
      try {
        const images = await base44.entities.FloorPlanImage.list();
        const entries = {};
        (Array.isArray(images) ? images : []).forEach(img => {
          if (img.moduleType && img.imageUrl) {
            entries[img.moduleType] = img.imageUrl;
            entries[img.moduleType.toLowerCase()] = img.imageUrl;
            entries[img.moduleType.trim()] = img.imageUrl;
          }
        });
        console.log("[Configurator] FloorPlanImages loaded:", Object.keys(entries).length, "images");
        floorPlanImagesRef.current = entries;
        return entries;
      } catch (e) { 
        console.error("[Configurator] FloorPlanImages error:", e);
        return {}; 
      }
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: customModules = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: async () => { try { const r = await base44.entities.ModuleEntry.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeDesign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
      toast.success("Design saved!");
      setSaveModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeDesign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
      toast.success("Design deleted");
    },
  });

  const [isDraggingFromPanel, setIsDraggingFromPanel] = useState(false);
  const handleDragStart = (e, mod) => {
    setIsDraggingFromPanel(true);
    if (mod.orientation) {
      return;
    }
    e.dataTransfer.setData("moduleType", mod.type);
    setDraggingMod(mod);
  };

  const handleDragEnd = () => {
    setIsDraggingFromPanel(false);
  };

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop();
      setPlacedModules(last.placedModules);
      setWalls(last.walls);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo]);

  useEffect(() => {
    localStorage.setItem("configurator_modules", JSON.stringify(placedModules));
  }, [placedModules]);
  useEffect(() => {
    localStorage.setItem("configurator_walls", JSON.stringify(walls));
  }, [walls]);



  // When floorPlanImages or customModules loads/updates, enrich all placed modules with images, sqm, and price
  useEffect(() => {
    if (Object.keys(floorPlanImages).length === 0 && customModules.length === 0) return;
    setPlacedModules(prev => prev.map(m => {
      const img = floorPlanImages[m.type]
        || floorPlanImages[m.type?.toLowerCase()]
        || (m.originalCode && (floorPlanImages[m.originalCode] || floorPlanImages[m.originalCode?.toLowerCase()]));
      // Enrich sqm and price from customModules if missing
      const dbMod = customModules.find(c => c.code === m.type);
      const sqm = m.sqm || dbMod?.sqm || (dbMod ? (dbMod.width || 3) * (dbMod.depth || 4.8) : 0);
      const price = m.price || dbMod?.price || 0;
      return { ...m, floorPlanImage: img || m.floorPlanImage || null, sqm, price };
    }));
  }, [floorPlanImages, customModules]);

  // When wallImages loads/updates, enrich all placed walls with elevation images
  useEffect(() => {
    if (Object.keys(wallImages).length === 0) return;
    setWalls(prev => {
      if (prev.length === 0) return prev;
      return prev.map(w => {
        const wallType = w.type || w.mpCode || w.label || w.code || w.wallType || null;
        const img = wallType ? wallImages[wallType] : null;
        const result = { ...w, elevationImage: img || w.elevationImage || null };
        if (wallType) result.type = wallType;
        return result;
      });
    });
  }, [wallImages]);

  // Fix walls that were placed outside a connection module — nudge them inside
  useEffect(() => {
    const WALL_THICKNESS = 0.31;
    const isCM = (mod) => mod.chassis === "C" || (mod.y >= 18 && mod.y < 21 && mod.h <= 2);
    const cmModules = placedModules.filter(isCM);
    if (cmModules.length === 0) return;

    setWalls(prev => prev.map(w => {
      if (w.orientation !== "horizontal") return w;
      for (const mod of cmModules) {
        // W face: wall should be AT mod.y (inside top), not at mod.y - thickness (outside)
        if (w.face === "W" && Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y - WALL_THICKNESS)) < 0.1) {
          return { ...w, y: mod.y };
        }
        // Y face: wall should be at mod.y + mod.h - thickness (inside bottom), not mod.y + mod.h (outside)
        if (w.face === "Y" && Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y + mod.h)) < 0.1) {
          return { ...w, y: mod.y + mod.h - WALL_THICKNESS };
        }
      }
      return w;
    }));
  }, [placedModules]);

  const handlePlace = (mod, x, y) => {
    // Check if placing deck/soffit on non-end module
    const isDeckOrSoffit = mod.type?.toLowerCase().includes("deck") || mod.type?.toLowerCase().includes("soffit");
    if (isDeckOrSoffit && (mod.chassis !== "EF" && mod.chassis !== "ER" && mod.chassis !== "LF" && mod.chassis !== "RF")) {
      toast.error("Deck and Soffit can only be added to end modules");
      return;
    }

    pushHistory(placedModules, walls);
    const fullMod = MODULE_TYPES.find(m => m.type === mod.type) || mod;
    const newMod = { ...fullMod, ...mod, id: generateId(), x, y };
    // Check for image using the type or originalCode (case-insensitive)
    const imgUrl = floorPlanImages[mod.type]
      || floorPlanImages[mod.type?.toLowerCase()]
      || (mod.originalCode && (floorPlanImages[mod.originalCode] || floorPlanImages[mod.originalCode?.toLowerCase()]));
    if (imgUrl) newMod.floorPlanImage = imgUrl;
    setPlacedModules((prev) => [...prev, newMod]);
  };

  const handleRemove = (id) => {
    pushHistory(placedModules, walls);
    const modToRemove = placedModules.find((m) => m.id === id);
    if (modToRemove) {
      setWalls((prev) =>
        prev.filter((w) => {
          const isLongFace = w.face === "W" || w.face === "Y" || (!w.face && w.orientation === "horizontal");
          if (isLongFace) {
            if ((w.face === "W" || !w.face) && w.x === modToRemove.x && w.y === modToRemove.y - 1) return false;
            if (w.face === "Y" && w.x === modToRemove.x && w.y === modToRemove.y + modToRemove.h) return false;
          } else {
            if (w.face === "Z" && w.y === modToRemove.y && w.x === modToRemove.x + 1) return false;
            if (w.face === "X" && w.y === modToRemove.y && w.x === modToRemove.x + modToRemove.w - 1) return false;
          }
          return true;
        })
      );
    }
    setPlacedModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMove = (id, x, y) => {
    const oldMod = placedModules.find((m) => m.id === id);
    if (!oldMod) return;
    
    pushHistory(placedModules, walls);
    
    const deltaX = x - oldMod.x;
    const deltaY = y - oldMod.y;
    
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, x, y } : m))
    );
    
    const WALL_OFFSET = 0.308;
    setWalls((prev) =>
      prev.map((w) => {
        if (!w.face) return w;
        if (w.face === "Y" && Math.abs(w.x - oldMod.x) < 0.5 && Math.abs(w.y - (oldMod.y + oldMod.h)) < 0.5) {
          return { ...w, x: w.x + deltaX, y: w.y + deltaY };
        }
        if (w.face === "W" && Math.abs(w.x - oldMod.x) < 0.5 && Math.abs(w.y - (oldMod.y - WALL_OFFSET)) < 0.5) {
          return { ...w, x: w.x + deltaX, y: w.y + deltaY };
        }
        if (w.face === "Z" && Math.abs(w.y - oldMod.y) < 0.5 && Math.abs(w.x - oldMod.x) < 0.5) {
          return { ...w, x: w.x + deltaX, y: w.y + deltaY };
        }
        if (w.face === "X" && Math.abs(w.y - oldMod.y) < 0.5 && Math.abs(w.x - (oldMod.x + oldMod.w - WALL_OFFSET)) < 0.5) {
          return { ...w, x: w.x + deltaX, y: w.y + deltaY };
        }
        return w;
      })
    );
  };

  const handleRotate = (id) => {
    pushHistory(placedModules, walls);
    const modToRotate = placedModules.find((m) => m.id === id);
    if (!modToRotate) return;
    
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const currentRotation = m.rotation || 0;
        const newRotation = (currentRotation + 180) % 360;
        const baseW = m.baseW ?? m.w;
        const baseH = m.baseH ?? m.h;
        return { ...m, baseW, baseH, w: baseW, h: baseH, rotation: newRotation };
      })
    );
    
    setWalls((prev) =>
      prev.map((w) => {
        const WALL_OFFSET = 0.308;
        if (w.face === 'Z' && Math.abs(w.y - modToRotate.y) < 0.5 && Math.abs(w.x - modToRotate.x) < 0.5) {
          return { ...w, rotation: (w.rotation || 0) + 180 };
        }
        if (w.face === 'X' && Math.abs(w.y - modToRotate.y) < 0.5 && Math.abs(w.x - (modToRotate.x + modToRotate.w - WALL_OFFSET)) < 0.5) {
          return { ...w, rotation: (w.rotation || 0) + 180 };
        }
        return w;
      })
    );
  };

  const handleFlip = (id) => {
    pushHistory(placedModules, walls);
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, flipped: !m.flipped };
      })
    );
  };

  const handleClear = () => {
    pushHistory(placedModules, walls);
    setPlacedModules([]);
    setWalls([]);
    localStorage.removeItem("configurator_modules");
    localStorage.removeItem("configurator_walls");
  };

  const handlePlaceWall = (wallData, x, y) => {
    pushHistory(placedModules, walls);
    const wallType = wallData.type || wallData.mpCode || wallData.label;
    const wallWithImage = { 
      ...wallData,
      type: wallType,
      elevationImage: wallImages[wallType] || null 
    };
    if (wallData.face === "W") {
      wallWithImage.rotation = 180;
    }
    const newWall = { ...wallWithImage, id: generateWallId(), x, y };

    setWalls((prev) => {
      if (wallData.face === "Z" || wallData.face === "X" ||
          wallData.face === "W" || wallData.face === "Y") {
        // Remove any existing walls at the same location and face
        const filtered = prev.filter(w => !(w.face === wallData.face && Math.abs(w.x - x) < 0.5 && Math.abs(w.y - y) < 0.5));

        if (wallData.face === "Z" || wallData.face === "X") {
          const opposingFace = wallData.face === "Z" ? "X" : "Z";
          const attachedMod = placedModules.find(mod => {
            const isEndChassis = mod.chassis === "EF" || mod.chassis === "ER" || mod.chassis === "LF" || mod.chassis === "RF";
            if (!isEndChassis) return false;
            if (wallData.face === "Z") return Math.abs(mod.y - y) < 1.0 && Math.abs(mod.x - x) < 1.0;
            if (wallData.face === "X") return Math.abs(mod.y - y) < 1.0 && Math.abs((mod.x + mod.w - 0.31) - x) < 1.0;
          });
          if (attachedMod) {
            const oppositeAlreadyWalled = prev.some(w => {
              if (w.face !== opposingFace) return false;
              if (opposingFace === "Z") return Math.abs(w.y - attachedMod.y) < 1.0 && Math.abs(w.x - attachedMod.x) < 1.0;
              if (opposingFace === "X") return Math.abs(w.y - attachedMod.y) < 1.0 && Math.abs(w.x - (attachedMod.x + attachedMod.w - 0.31)) < 1.0;
            });
            if (oppositeAlreadyWalled) {
              toast.error("One end must remain open on end modules.");
              return prev;
            }
          }
        }

        return [...filtered, newWall];
      }
      return [...prev, newWall];
    });
  };

  const handleRemoveWall = (id) => {
    pushHistory(placedModules, walls);
    setWalls((prev) => prev.filter((w) => w.id !== id));
  };

  const handleFlipWall = (id) => {
    pushHistory(placedModules, walls);
    setWalls((prev) =>
      prev.map((w) => w.id === id ? { ...w, flipped: !w.flipped } : w)
    );
  };

  const handleMoveWall = (id, x, y, wallUpdate) => {
    pushHistory(placedModules, walls);
    setWalls((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y, ...wallUpdate } : w))
    );
  };

  const handleSave = (name) => {
    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
    const estimatedPrice = placedModules.reduce((s, m) => s + (m.price || 0), 0);
    const gridToSave = placedModules.map(m => ({
      id: m.id, type: m.type, label: m.label, x: m.x, y: m.y, w: m.w, h: m.h,
      sqm: m.sqm, price: m.price, color: m.color, border: m.border,
      chassis: m.chassis, widthCode: m.widthCode, room: m.room,
      baseW: m.baseW, baseH: m.baseH, rotation: m.rotation, flipped: m.flipped,
      groupKey: m.groupKey,
    }));
    const wallsToSave = walls.map(w => ({
      id: w.id, type: w.type || w.mpCode || w.label, label: w.label, x: w.x, y: w.y,
      orientation: w.orientation, length: w.length, thickness: w.thickness,
      face: w.face, rotation: w.rotation, flipped: w.flipped || false, elevationImage: w.elevationImage || null,
      mpCode: w.mpCode, description: w.description, variants: w.variants,
    }));
    saveMutation.mutate({
      name,
      grid: gridToSave,
      walls: wallsToSave,
      totalSqm,
      estimatedPrice,
      moduleCount: placedModules.length,
    });
  };

  const handleLoad = (design) => {
    const currentWallImages = wallImagesRef.current;
    const currentFloorPlanImages = floorPlanImagesRef.current;
    const grid = (design.grid || []).map(m => {
      const resolvedType = m.type || m.moduleType || null;
      const img = m.floorPlanImage || currentFloorPlanImages[resolvedType] || currentFloorPlanImages[resolvedType?.toLowerCase()];
      const dbMod = customModules.find(c => c.code === resolvedType);
      const sqm = m.sqm || dbMod?.sqm || (dbMod ? (dbMod.width || 3) * (dbMod.depth || 4.8) : 0);
      const price = m.price || dbMod?.price || 0;
      return { ...m, type: resolvedType, floorPlanImage: img || null, sqm, price };
    });
    const loadedWalls = (design.walls || []).map(w => {
      const wallType = w.type || w.mpCode || w.label || w.code || w.wallType || null;
      const img = wallType ? (w.elevationImage || currentWallImages[wallType]) : null;
      const result = { ...w, elevationImage: img || null };
      if (wallType) result.type = wallType;
      return result;
    });
    setPlacedModules(grid);
    setWalls(loadedWalls);
    setShowSaved(false);
    toast.success(`Loaded "${design.name}"`);
  };

  const handleModuleImageUpdate = async (moduleId, imageUrl) => {
    const module = placedModules.find(m => m.id === moduleId);
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, floorPlanImage: imageUrl } : m))
    );
    if (module && module.type) {
      const existing = await base44.entities.FloorPlanImage.filter({ moduleType: module.type });
      if (existing.length > 0) {
        await base44.entities.FloorPlanImage.update(existing[0].id, { imageUrl });
      } else {
        await base44.entities.FloorPlanImage.create({ moduleType: module.type, imageUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
    }
  };

  const handleWallImageUpdate = async (wallId, imageUrl) => {
    const wall = walls.find(w => w.id === wallId);
    setWalls((prev) =>
      prev.map((w) => w.id === wallId ? { ...w, elevationImage: imageUrl } : w)
    );
    if (wall && wall.type) {
      const existing = await base44.entities.WallImage.filter({ wallType: wall.type });
      if (existing.length > 0) {
        await base44.entities.WallImage.update(existing[0].id, { imageUrl });
      } else {
        await base44.entities.WallImage.create({ wallType: wall.type, imageUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["wallImages"] });
    }
  };

  const handlePanelMouseDown = (e) => {
    if (e.target.closest("button")) return;
    const headerDiv = e.currentTarget.querySelector('[class*="border-b"]');
    if (!headerDiv || !headerDiv.contains(e.target)) return;
    setDraggingPanel({ startX: e.clientX, startY: e.clientY, panelX: panelPos.x, panelY: panelPos.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (draggingPanel) {
      setPanelPos({
        x: draggingPanel.panelX + (e.clientX - draggingPanel.startX),
        y: draggingPanel.panelY + (e.clientY - draggingPanel.startY),
      });
    }
    if (draggingSummary) {
      setSummaryPos({
        x: draggingSummary.summaryX + (e.clientX - draggingSummary.startX),
        y: draggingSummary.summaryY + (e.clientY - draggingSummary.startY),
      });
    }
  }, [draggingPanel, draggingSummary]);

  const handleMouseUp = useCallback(() => {
    setDraggingPanel(null);
    setDraggingSummary(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSummaryMouseDown = (e) => {
    if (e.target.closest("button")) return;
    const headerDiv = e.currentTarget.querySelector('[class*="border-b"]');
    if (!headerDiv || !headerDiv.contains(e.target)) return;
    setDraggingSummary({ startX: e.clientX, startY: e.clientY, summaryX: summaryPos.x, summaryY: summaryPos.y });
  };

  if (printMode === "plans") {
    return <PrintablePlansSheet placedModules={placedModules} onClose={() => setPrintMode(null)} />;
  }
  if (printMode === "elevations") {
    return <PrintableElevationsSheet walls={walls} onClose={() => setPrintMode(null)} />;
  }

  return (
    <div 
      className="w-screen h-screen bg-[#F0EFEd] overflow-hidden relative flex flex-col"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center px-4 py-4 bg-white/80 backdrop-blur border-b border-gray-200 overflow-x-auto gap-4 min-w-0">
        <div className="shrink-0 flex flex-col gap-0.5">
          <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" style={{ height: "25px", width: "auto" }} />
          <span className="text-[10px] text-gray-400 tracking-widest uppercase">Design Studio</span>
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <div className="flex border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "2d" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`}
            >
              <Grid2X2 size={13} />
              2D
            </button>
            <button
              onClick={() => setViewMode("elevations")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "elevations" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`}
            >
              <Image size={13} />
              Elevations
            </button>

          </div>

          <Link
            to={createPageUrl("DesignCatalogue")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-[#F15A22] hover:bg-[#d94e1a] border border-[#F15A22] transition-all"
          >
            <LayoutTemplate size={13} />
            Design Catalogue
          </Link>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] disabled:opacity-30 transition-all"
          >
            <Undo2 size={13} />
            Undo {history.length > 0 && <span className="text-[10px] text-gray-400">({history.length})</span>}
          </button>
          <Link
            to={createPageUrl("Catalogue")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] border border-gray-200 bg-white hover:border-[#F15A22] transition-all"
          >
            <BookOpen size={13} />
            Floor Catalogue
          </Link>
          <Link
            to={createPageUrl("WallCatalogue")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] border border-gray-200 bg-white hover:border-[#F15A22] transition-all"
          >
            <BookOpen size={13} />
            Wall Catalogue
          </Link>
          <button
            onClick={() => setShowSaved(!showSaved)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all ${
              showSaved ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 bg-white border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
            }`}
          >
            <FolderOpen size={13} />
            My Designs
            {designs.length > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${showSaved ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"}`}>
                {designs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            disabled={placedModules.length === 0 || saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#F15A22] text-white hover:bg-[#d94e1a] disabled:opacity-40 transition-all"
          >
            <Save size={13} />
            {saveMutation.isPending ? "Saving…" : "Save Design"}
          </button>
          {placedModules.length > 0 && (
            <button
              onClick={() => setPrintMode("plans")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
              title="Print floor plans sheet"
            >
              <Save size={13} />
              Print Plans
            </button>
          )}
          {walls.some(w => w.elevationImage) && (
            <button
              onClick={() => setPrintMode("elevations")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
              title="Print elevations sheet"
            >
              <Save size={13} />
              Print Elevations
            </button>
          )}
          {placedModules.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-white border border-gray-200 hover:border-red-300 hover:text-red-500 transition-all"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 pt-16 relative flex overflow-hidden">
        {viewMode === "elevations" ? (
          <div className="flex-1 z-10">
            <ElevationGallery walls={walls} placedModules={placedModules} onWallSelect={setSelectedWall} />
          </div>
        ) : (
          <ConfigGrid
            placedModules={placedModules}
            onPlace={handlePlace}
            onRemove={handleRemove}
            onMove={handleMove}
            onRotate={handleRotate}
            onFlip={handleFlip}
            draggingMod={draggingMod}
            walls={walls}
            wallTypes={availableWallTypes}
            onPlaceWall={handlePlaceWall}
            onRemoveWall={handleRemoveWall}
            onFlipWall={handleFlipWall}
            onMoveWall={handleMoveWall}
            onWallSelect={setSelectedWall}
            onModuleSelect={setSelectedModule}
            customModules={customModules}
            floorPlanImages={floorPlanImages}
            wallImages={wallImages}
          />
        )}
        </div>

      {/* Floating left panel — Module picker */}
      <div
        className="absolute z-40 flex"
        style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px`, cursor: draggingPanel ? "grabbing" : "default" }}
      >
        <div
          className={`bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden transition-all duration-200 ${
            panelCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-64 opacity-100"
          }`}
          onMouseDown={handlePanelMouseDown}
        >
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 shrink-0 cursor-grab active:cursor-grabbing">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Module Library</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Expand a category · drag to place</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ModulePanel
               onDragStart={handleDragStart}
               onDragEnd={handleDragEnd}
               selectedWall={selectedWall}
               selectedModule={selectedModule}
               placedModules={placedModules}
               onModuleImageUpdate={handleModuleImageUpdate}
               onWallImageUpdate={handleWallImageUpdate}
               floorPlanImages={floorPlanImages}
               wallImages={wallImages}
             />
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className="self-start mt-3 ml-1 bg-white border border-gray-200 shadow-md p-1 hover:border-[#F15A22] hover:text-[#F15A22] text-gray-400 transition-all"
        >
          {panelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Floating right panel — Design summary or preview */}
       {placedModules.length > 0 && (
         <div
           className="absolute z-20"
           style={{ left: `${summaryPos.x}px`, top: `${summaryPos.y}px`, cursor: draggingSummary ? "grabbing" : "default", width: "260px" }}
         >
           <div className="bg-white border border-gray-200 shadow-xl overflow-hidden" onMouseDown={handleSummaryMouseDown}>
             <div className="px-4 py-3 border-b border-gray-100 cursor-grab active:cursor-grabbing flex items-center justify-between">
               <p className="text-xs font-semibold text-gray-800">{selectedModule || selectedWall ? (selectedWall ? `Wall: ${selectedWall.face || selectedWall.type || "Preview"}` : "Preview") : "Design Summary"}</p>
               <button
                 onMouseDown={e => e.stopPropagation()}
                 onClick={() => setSummaryCollapsed(c => !c)}
                 className="text-gray-400 hover:text-[#F15A22] transition-colors text-xs leading-none"
                 title={summaryCollapsed ? "Expand" : "Minimise"}
               >
                 {summaryCollapsed ? "▲" : "▼"}
               </button>
             </div>
             {!summaryCollapsed && (
               <div className="p-4 h-[320px] overflow-y-auto">
                 {selectedModule && selectedModule.floorPlanImage ? (
                   <div className="flex flex-col h-full gap-2">
                     <div>
                       <p className="text-xs font-semibold text-gray-900 break-words">{selectedModule.label}</p>
                       <p className="text-[10px] text-gray-500">{selectedModule.type}</p>
                     </div>
                     <div className="flex-1 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                       <img src={selectedModule.floorPlanImage} alt={selectedModule.label} className="w-full object-cover" style={{ transform: `rotate(${selectedModule.rotation || 0}deg) ${selectedModule.flipped ? 'scaleX(-1)' : ''}` }} />
                     </div>
                   </div>
                 ) : selectedWall ? (
                   <div className="flex flex-col h-full gap-2">
                     <div>
                       <p className="text-xs font-semibold text-gray-900 break-words">{selectedWall.label}</p>
                       <p className="text-[10px] text-gray-500">{selectedWall.type}</p>
                       {selectedWall.face && <span className="text-[10px] font-bold text-[#F15A22]">Face {selectedWall.face}</span>}
                     </div>
                     <div className="flex-1 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                       {selectedWall.elevationImage ? (
                         <img src={selectedWall.elevationImage} alt={selectedWall.label} className="w-full object-cover" style={{ transform: selectedWall.flipped ? 'scaleX(-1)' : undefined }} />
                       ) : (
                         <div className="flex flex-col items-center gap-2 text-gray-400">
                           <div className="w-16 h-24 border-2 border-gray-300 rounded flex items-center justify-center">
                             <span className="text-2xl font-bold text-gray-300">{selectedWall.face || "W"}</span>
                           </div>
                           <p className="text-[10px] text-center">No elevation image</p>
                         </div>
                       )}
                     </div>
                   </div>
                 ) : (
                   <DesignSummary
                     placedModules={placedModules}
                     onSave={() => setSaveModalOpen(true)}
                     onClear={handleClear}
                     isSaving={saveMutation.isPending}
                     onQuote={() => setQuoteOpen(true)}
                   />
                 )}
               </div>
             )}
           </div>
         </div>
       )}

      {/* Saved Designs overlay panel */}
      {showSaved && (
        <div className="absolute inset-0 z-40 bg-black/30 flex items-start justify-center pt-16" onClick={() => setShowSaved(false)}>
          <div
            className="bg-white border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">My Saved Designs</h2>
              <button onClick={() => setShowSaved(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <SavedDesigns
                designs={designs}
                onLoad={handleLoad}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </div>
          </div>
        </div>
      )}

      <SaveDesignModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={handleSave}
        isSaving={saveMutation.isPending}
      />

      <QuoteGenerator
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        placedModules={placedModules}
        walls={walls}
      />

      {/* Copyright footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 text-center py-1 text-[10px] text-gray-400 bg-white/70 backdrop-blur pointer-events-none select-none">
        © {new Date().getFullYear()} connectapod. All rights reserved.
      </div>
    </div>
  );
}