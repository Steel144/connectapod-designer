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
import { BookOpen, FolderOpen, Save, Trash2, ChevronLeft, ChevronRight, Undo2, Box, Grid2X2, Image, LayoutTemplate, Menu, X, ChevronUp, ChevronDown, Settings, Eye, EyeOff, Check, Map } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const checkIsMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  ('ontouchstart' in window) ||
  (window.screen?.width ?? window.innerWidth) < 768;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(checkIsMobile);
  useEffect(() => {
    const handler = () => setIsMobile(checkIsMobile());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

import CombinedElevations from "@/components/configurator/CombinedElevations";
import PrintRouter from "@/components/configurator/PrintRouter";
import PrintMenu from "@/components/configurator/PrintMenu";
import ProjectDetailsModal from "@/components/configurator/ProjectDetailsModal";
import FurniturePanel, { FURNITURE_ITEMS } from "@/components/configurator/FurniturePanel";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import SiteMapView from "@/components/configurator/SiteMapView";

const generateId = () => `mod-${Math.random().toString(36).substr(2, 9)}`;
const generateWallId = () => `wall-${Math.random().toString(36).substr(2, 9)}`;

export default function Configurator() {
  const { user } = useAuth();
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
  const [furniture, setFurniture] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("configurator_furniture") || "[]");
      return saved.map(f => {
        if (f.image) return f;
        const match = FURNITURE_ITEMS.find(fi => fi.id === f.type || fi.id === f.id);
        return match ? { ...f, image: match.image } : f;
      });
    } catch { return []; }
  });

  const pushHistory = useCallback((modules, w) => {
    setHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), { placedModules: modules, walls: w }]);
  }, []);
  const [draggingMod, setDraggingMod] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [lastSavedName, setLastSavedName] = useState(() => {
    try { return localStorage.getItem("configurator_last_saved_name") || ""; } catch { return ""; }
  });
  const [elevationZoom, setElevationZoom] = useState(100);

  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 16, y: 60 });
  const [draggingPanel, setDraggingPanel] = useState(null);
  const [summaryPos, setSummaryPos] = useState({ x: window.innerWidth - 256 - 16, y: 60 });
  const [draggingSummary, setDraggingSummary] = useState(null);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [selectedWall, setSelectedWall] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedFace, setSelectedFace] = useState(null);
  const [hoveredWall, setHoveredWall] = useState(null);
  const [printMode, setPrintMode] = useState(null);
  const [pendingPrintMode, setPendingPrintMode] = useState(null);
  const [printDetails, setPrintDetails] = useState(null);
  const [detailsModalMode, setDetailsModalMode] = useState(null); // 'estimate' or 'print'
  const [viewMode, setViewMode] = useState("2d");
  const [siteAddress, setSiteAddress] = useState(() => {
    try { return localStorage.getItem('sitemap_address') ?? ''; } catch { return ''; }
  });
  const [siteCoordinates, setSiteCoordinates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_coordinates')) ?? null; } catch { return null; }
  });
  const [loadCounter, setLoadCounter] = useState(0);
  const [wallToReplace, setWallToReplace] = useState(null);
  const [gridZoom, setGridZoom] = useState(100);
  const [showLabels, setShowLabels] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showPhotoImages, setShowPhotoImages] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const navBarRef = useRef(null);
  const [navBarHeight, setNavBarHeight] = useState(0);

  useEffect(() => {
    if (!navBarRef.current) return;
    const ro = new ResizeObserver(() => {
      setNavBarHeight(navBarRef.current?.offsetHeight ?? 0);
    });
    ro.observe(navBarRef.current);
    setNavBarHeight(navBarRef.current.offsetHeight);
    return () => ro.disconnect();
  }, [viewMode, isMobile]);

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
          height: w.height || 0,
          price: w.price || 0,
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
        return entries;
      } catch (e) { 
        return {}; 
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: Infinity,
  });

  // Keep ref in sync with query data (handles cached data too)
  useEffect(() => {
    wallImagesRef.current = wallImages;
  }, [wallImages]);

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
        return entries;
      } catch (e) { 
        return {}; 
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: Infinity,
  });

  // Keep ref in sync with query data (handles cached data too)
  useEffect(() => {
    floorPlanImagesRef.current = floorPlanImages;
  }, [floorPlanImages]);

  const { data: customModules = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: async () => { try { const r = await base44.entities.ModuleEntry.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeDesign.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
      toast.success("Design saved!");
      setLastSavedName(data.name);
      localStorage.setItem("configurator_last_saved_name", data.name);
      setSaveModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeDesign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
      toast.success("Design deleted");
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      toast.error("Failed to delete design");
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
    const onSelectFace = (e) => {
      setSelectedFace(e.detail.face);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("selectFace", onSelectFace);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("selectFace", onSelectFace);
    };
  }, [handleUndo]);

  useEffect(() => {
    localStorage.setItem("configurator_modules", JSON.stringify(placedModules));
  }, [placedModules]);
  useEffect(() => {
    localStorage.setItem("configurator_walls", JSON.stringify(walls));
  }, [walls]);
  useEffect(() => {
    localStorage.setItem("configurator_furniture", JSON.stringify(furniture));
  }, [furniture]);

  // Keep selectedModule in sync with placedModules
  useEffect(() => {
    if (selectedModule?.id) {
      const currentMod = placedModules.find(m => m.id === selectedModule.id);
      if (currentMod && currentMod.flipped !== selectedModule.flipped) {
        setSelectedModule(currentMod);
      }
    }
  }, [placedModules]);



  // When floorPlanImages or customModules loads/updates, enrich all placed modules with images, sqm, and price
  useEffect(() => {
    if (Object.keys(floorPlanImages).length === 0 && customModules.length === 0) return;
    setPlacedModules(prev => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map(m => {
        const img = floorPlanImages[m.type]
          || floorPlanImages[m.type?.toLowerCase()]
          || (m.originalCode && (floorPlanImages[m.originalCode] || floorPlanImages[m.originalCode?.toLowerCase()]));
        const dbMod = customModules.find(c => c.code === m.type);
        const sqm = dbMod ? (dbMod.sqm ?? (dbMod.width || 3) * (dbMod.depth || 4.8)) : (m.sqm || 0);
        const price = dbMod ? (dbMod.price ?? m.price ?? 0) : (m.price ?? 0);
        const newImg = img || m.floorPlanImage || null;
        if (newImg === m.floorPlanImage && sqm === m.sqm && price === m.price) return m;
        changed = true;
        return { ...m, floorPlanImage: newImg, sqm, price };
      });
      return changed ? next : prev;
    });
  }, [floorPlanImages, customModules]);

  // When wallImages loads/updates OR a design is loaded, enrich all walls with elevation images and prices
  useEffect(() => {
    if (Object.keys(wallImages).length === 0 && customWalls.length === 0) return;
    setWalls(prev => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map(w => {
        const wallType = w.type || w.mpCode || w.label || w.code || w.wallType || null;
        const img = wallType ? (wallImages[wallType] || null) : null;
        const newImg = img || w.elevationImage || null;
        const dbWall = wallType ? customWalls.find(cw => cw.code === wallType) : null;
        const price = dbWall ? (dbWall.price ?? w.price ?? 0) : (w.price ?? 0);
        const typeChanged = wallType && w.type !== wallType;
        const imgChanged = newImg !== w.elevationImage;
        const priceChanged = price !== w.price;
        if (!typeChanged && !imgChanged && !priceChanged) return w;
        changed = true;
        const result = { ...w, elevationImage: newImg, price };
        if (wallType) result.type = wallType;
        return result;
      });
      return changed ? next : prev;
    });
  }, [wallImages, customWalls, loadCounter]);

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
    // Look up pricing from customModules
    const dbMod = customModules.find(c => c.code === mod.type);
    if (dbMod?.price) newMod.price = dbMod.price;
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
    
    const currentRotation = modToRotate.rotation || 0;
    const newRotation = (currentRotation + 180) % 360;
    const baseW = modToRotate.baseW ?? modToRotate.w;
    const baseH = modToRotate.baseH ?? modToRotate.h;
    
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, baseW, baseH, w: baseW, h: baseH, rotation: newRotation };
      })
    );
    
    setWalls((prev) =>
      prev.map((w) => {
        const WALL_OFFSET = 0.308;
        const wallFace = w.face || (w.orientation === 'vertical' ? 'Z' : 'W');
        
        // Only transform walls attached to this module
        if (wallFace === 'W' && Math.abs(w.x - modToRotate.x) < 0.5 && Math.abs(w.y - (modToRotate.y - WALL_OFFSET)) < 0.5) {
          return {
            ...w,
            rotation: (w.rotation || 0) + 180,
            y: modToRotate.y + modToRotate.h,
            face: 'Y'
          };
        }
        if (wallFace === 'Y' && Math.abs(w.x - modToRotate.x) < 0.5 && Math.abs(w.y - (modToRotate.y + modToRotate.h)) < 0.5) {
          return {
            ...w,
            rotation: (w.rotation || 0) + 180,
            y: modToRotate.y - WALL_OFFSET,
            face: 'W'
          };
        }
        if (wallFace === 'Z' && Math.abs(w.y - modToRotate.y) < 0.5 && Math.abs(w.x - modToRotate.x) < 0.5) {
          return {
            ...w,
            rotation: (w.rotation || 0) + 180,
            x: modToRotate.x + modToRotate.w - WALL_OFFSET,
            face: 'X'
          };
        }
        if (wallFace === 'X' && Math.abs(w.y - modToRotate.y) < 0.5 && Math.abs(w.x - (modToRotate.x + modToRotate.w - WALL_OFFSET)) < 0.5) {
          return {
            ...w,
            rotation: (w.rotation || 0) + 180,
            x: modToRotate.x,
            face: 'Z'
          };
        }
        return w;
      })
    );
  };

  const handleFlip = (id) => {
    pushHistory(placedModules, walls);
    const modToFlip = placedModules.find((m) => m.id === id);
    if (!modToFlip) return;

    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, flipped: !m.flipped };
      })
    );

    // Update selectedModule if it's the one being flipped
    if (selectedModule?.id === id) {
      const flippedMod = placedModules.find(m => m.id === id);
      setSelectedModule(flippedMod ? { ...flippedMod, flipped: !flippedMod.flipped } : null);
    }

    setWalls((prev) =>
      prev.map((w) => {
        const WALL_OFFSET = 0.308;
        const wallFace = w.face || (w.orientation === 'vertical' ? 'Z' : 'W');

        // Only act on walls attached to this module (match by Y position and X proximity)
        const isAttachedVertical = wallFace === 'Z' || wallFace === 'X';
        const isAttachedHorizontal = wallFace === 'W' || wallFace === 'Y';

        if (isAttachedHorizontal) {
          // W/Y walls: match by x alignment and approximate y position
          if (!( Math.abs(w.x - modToFlip.x) < 0.5 )) return w;
          if (wallFace === 'W' && Math.abs(w.y - (modToFlip.y - WALL_OFFSET)) < 0.8) {
            return { ...w, flipped: !w.flipped };
          }
          if (wallFace === 'Y' && Math.abs(w.y - (modToFlip.y + modToFlip.h)) < 0.8) {
            return { ...w, flipped: !w.flipped };
          }
          return w;
        }

        if (wallFace === 'Z' && Math.abs(w.y - modToFlip.y) < 0.5 && Math.abs(w.x - modToFlip.x) < 0.5) {
          return { ...w, flipped: !w.flipped, x: modToFlip.x + modToFlip.w - WALL_OFFSET, face: 'X' };
        }
        if (wallFace === 'X' && Math.abs(w.y - modToFlip.y) < 0.5 && Math.abs(w.x - (modToFlip.x + modToFlip.w - WALL_OFFSET)) < 0.5) {
          return { ...w, flipped: !w.flipped, x: modToFlip.x, face: 'Z' };
        }

        return w;
      })
    );
  };

  const handleClear = () => {
    pushHistory(placedModules, walls);
    setPlacedModules([]);
    setWalls([]);
    setFurniture([]);
    localStorage.removeItem("configurator_modules");
    localStorage.removeItem("configurator_walls");
    localStorage.removeItem("configurator_furniture");
  };

  const handlePlaceFurniture = (furnitureItem, x, y) => {
    pushHistory(placedModules, walls);
    const newFurniture = {
      id: generateId(),
      type: furnitureItem.type || furnitureItem.id,
      label: furnitureItem.label || furnitureItem.type || furnitureItem.id,
      image: furnitureItem.image || null,
      x,
      y,
      rotation: 0,
      width: furnitureItem.width || 1.4,
      depth: furnitureItem.depth || 2.0,
    };
    setFurniture((prev) => [...prev, newFurniture]);
  };

  const handleRemoveFurniture = (id) => {
    pushHistory(placedModules, walls);
    setFurniture((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveFurniture = (id, x, y) => {
    pushHistory(placedModules, walls);
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
    );
  };

  const handleRotateFurniture = (id) => {
    pushHistory(placedModules, walls);
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rotation: (f.rotation || 0) + 90 } : f))
    );
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

  const handleUpdateWall = (id, wallTemplate) => {
    pushHistory(placedModules, walls);
    setWalls((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const wallType = wallTemplate.type || wallTemplate.mpCode || wallTemplate.label;
        return {
          ...w,
          type: wallType,
          label: wallTemplate.label,
          mpCode: wallTemplate.mpCode,
          length: wallTemplate.length,
          thickness: wallTemplate.thickness,
          price: wallTemplate.price || 0,
          variants: wallTemplate.variants,
          elevationImage: wallImages[wallType] || null,
        };
      })
    );
  };

  const handlePlaceWallOnFace = (wallTemplate, module, face) => {
    pushHistory(placedModules, walls);
    const wallThickness = wallTemplate.thickness || 0.31;

    // Face buttons are fixed to screen positions - place wall based on screen direction
    // W = screen-top, Y = screen-bottom, Z = screen-left, X = screen-right
    let x, y;
    if (face === "W") {
      // Screen-top edge
      x = module.x;
      y = module.y - wallThickness;
    } else if (face === "Y") {
      // Screen-bottom edge
      x = module.x;
      y = module.y + module.h;
    } else if (face === "Z") {
      // Screen-left edge
      x = module.x;
      y = module.y;
    } else if (face === "X") {
      // Screen-right edge
      x = module.x + module.w - wallThickness;
      y = module.y;
    }

    const wallWithFace = { ...wallTemplate, face };
    handlePlaceWall(wallWithFace, x, y);
    setSelectedFace(null);
    setSelectedModule(null);
  };

  const handleSave = async (name, extra = {}, replace = false) => {
    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
    const estimatedPrice = placedModules.reduce((s, m) => s + (m.price || 0), 0) + walls.reduce((s, w) => s + (w.price || 0), 0);
    const gridToSave = placedModules.map(m => {
      const dbMod = m.type ? customModules.find(c => c.code === m.type) : null;
      const sqm = dbMod?.sqm ?? (dbMod ? (dbMod.width || 3) * (dbMod.depth || 4.8) : m.sqm) ?? 0;
      const price = dbMod?.price ?? m.price ?? 0;
      return {
        id: m.id, type: m.type, label: m.label, x: m.x, y: m.y, w: m.w, h: m.h,
        sqm, price, color: m.color, border: m.border,
        chassis: m.chassis, widthCode: m.widthCode, room: m.room,
        baseW: m.baseW, baseH: m.baseH, rotation: m.rotation, flipped: m.flipped,
        groupKey: m.groupKey,
        floorPlanImage: floorPlanImages[m.type] || floorPlanImages[m.type?.toLowerCase()] || m.floorPlanImage || null,
      };
    });
    const wallsToSave = walls.map(w => {
      const wallType = w.type || w.mpCode || w.label || w.code || w.wallType || null;
      const dbWall = wallType ? customWalls.find(cw => cw.code === wallType) : null;
      return {
        id: w.id,
        type: wallType,
        label: dbWall?.name || w.label || wallType,
        x: w.x,
        y: w.y,
        orientation: w.orientation,
        length: w.length,
        thickness: w.thickness,
        face: w.face,
        rotation: w.rotation,
        flipped: w.flipped || false,
        elevationImage: w.elevationImage || null,
        mpCode: w.mpCode || wallType,
        description: dbWall?.description || w.description,
        variants: dbWall?.variants || w.variants,
        price: dbWall?.price ?? w.price ?? 0,
        width: dbWall?.width || w.width,
        height: dbWall?.height || w.height,
      };
    });
    // Sync project name to print details storage, preserving all client data
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem("connectapod_print_details")) || {};
      } catch {
        return {};
      }
    })();
    localStorage.setItem("connectapod_print_details", JSON.stringify({
      ...existing,
      projectName: name,
    }));
    const payload = {
      name,
      grid: gridToSave,
      walls: wallsToSave,
      furniture,
      totalSqm,
      estimatedPrice,
      moduleCount: placedModules.length,
      ...extra,
    };

    if (replace) {
      const existing = designs.find(d => d.name?.toLowerCase() === name.toLowerCase());
      if (existing) {
        await base44.entities.HomeDesign.update(existing.id, payload);
        queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
        toast.success("Design updated!");
        setLastSavedName(name);
        localStorage.setItem("configurator_last_saved_name", name);
        setSaveModalOpen(false);
        return;
      }
    }

    saveMutation.mutate(payload);
  };

  const handleLoad = (design) => {
    // Use both the ref (for sync access) and the live query data (wallImages/floorPlanImages)
    // to ensure images are applied even when data is already cached and ref is current
    const liveWallImages = Object.keys(wallImages).length > 0 ? wallImages : wallImagesRef.current;
    const liveFloorPlanImages = Object.keys(floorPlanImages).length > 0 ? floorPlanImages : floorPlanImagesRef.current;

    const grid = (design.grid || []).map(m => {
      const resolvedType = m.type || m.moduleType || null;
      const img = m.floorPlanImage 
        || liveFloorPlanImages[resolvedType] 
        || liveFloorPlanImages[resolvedType?.toLowerCase()];
      const dbMod = customModules.find(c => c.code === resolvedType);
      const sqm = dbMod ? (dbMod.sqm ?? (dbMod.width || 3) * (dbMod.depth || 4.8)) : (m.sqm || 0);
      const price = dbMod ? (dbMod.price ?? m.price ?? 0) : (m.price ?? 0);
      return { ...m, type: resolvedType, floorPlanImage: img || null, sqm, price };
    });

    const loadedWalls = (design.walls || []).map(w => {
      const wallType = w.type || w.mpCode || w.label || w.code || w.wallType || null;
      const img = w.elevationImage || (wallType ? liveWallImages[wallType] : null);
      // Pull live price from WallEntry catalogue
      const dbWall = wallType ? customWalls.find(cw => cw.code === wallType) : null;
      const price = dbWall?.price ?? w.price ?? 0;
      return {
        ...w,
        type: wallType,
        mpCode: w.mpCode || wallType,
        label: dbWall?.name || w.label || wallType,
        price,
        elevationImage: img || null,
      };
    });

    const loadedFurniture = (design.furniture || []).map(f => {
      if (f.image) return f;
      const match = FURNITURE_ITEMS.find(fi => fi.id === f.type || fi.id === f.id);
      return match ? { ...f, image: match.image } : f;
    });

    setPlacedModules(grid);
    setWalls(loadedWalls);
    setFurniture(loadedFurniture);
    setLoadCounter(c => c + 1);
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

  if (printMode) {
    return <PrintRouter mode={printMode} walls={walls} placedModules={placedModules} furniture={furniture} customWalls={customWalls} printDetails={printDetails} onClose={() => setPrintMode(null)} showLabels={showLabels} showFurniture={showFurniture} showPhotoImages={showPhotoImages} showDimensions={showDimensions} />;
  }

  return (
    <>
    <div className={`bg-white ${viewMode === "building" ? "fixed inset-0 overflow-auto" : "w-screen h-screen overflow-hidden relative"} flex flex-col`}>

      {/* ── DESKTOP TOP BAR ── */}
      {!isMobile && (
        <div ref={navBarRef} className={`${viewMode === "building" ? "fixed" : "absolute"} top-0 left-0 right-0 z-30 flex items-center px-4 py-4 bg-white border-b border-gray-200 overflow-x-auto gap-4 min-w-0`}>
          <div className="shrink-0 flex flex-col gap-0.5">
            <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" style={{ height: "25px", width: "auto" }} />
            <span className="text-[10px] text-gray-400 tracking-widest uppercase">Design Studio</span>
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#F15A22] text-white hover:bg-[#d94e1a] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" }}>
                  <LayoutTemplate size={13} /> Design Catalogue
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("DesignCatalogue")} className="flex items-center gap-2 cursor-pointer">
                    <LayoutTemplate size={13} /> Starter Designs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowSaved(true); setViewMode("2d"); }}>
                  <FolderOpen size={13} /> My Designs {designs.length > 0 && `(${designs.length})`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode("2d")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "2d" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`} style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              <Grid2X2 size={13} /> 2D
            </button>
            <button onClick={() => setViewMode("elevations")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "elevations" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`} style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              <Image size={13} /> Elevations
            </button>
              <button onClick={() => setDetailsModalMode('save')} disabled={placedModules.length === 0 || saveMutation.isPending} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${placedModules.length === 0 || saveMutation.isPending ? "bg-white text-gray-400 opacity-40" : "bg-white text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`} style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
                <Save size={13} /> {saveMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setViewMode("sitemap")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "sitemap" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`} style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
                <Map size={13} /> Site Map
              </button>
               <button onClick={() => setDetailsModalMode('estimate')} disabled={placedModules.length === 0} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${placedModules.length === 0 ? "bg-white text-gray-400 opacity-40" : "bg-white text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`} style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
                  Get Estimate
                </button>
               <PrintMenu placedModules={placedModules} walls={walls} onPrint={(mode) => { setPendingPrintMode(mode); setDetailsModalMode('print'); }} />
               </div>
               <button onClick={handleUndo} disabled={history.length === 0} title="Undo (Ctrl+Z)" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] disabled:opacity-30 transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" }}>
               <Undo2 size={13} /> Undo {history.length > 0 && <span className="text-[10px] text-gray-400">({history.length})</span>}
               </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] border border-gray-200 bg-white hover:border-[#F15A22] transition-all">
                  <Settings size={13} /> Settings
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
               <DropdownMenuItem onClick={() => setShowLabels(v => !v)} className="flex items-center justify-between cursor-pointer">
                 <span className="flex items-center gap-2"><Eye size={13} /> Show Labels</span>
                 {showLabels && <Check size={12} className="text-[#F15A22]" />}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowFurniture(v => !v)} className="flex items-center justify-between cursor-pointer">
                 <span className="flex items-center gap-2"><Eye size={13} /> Show Furniture</span>
                 {showFurniture && <Check size={12} className="text-[#F15A22]" />}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowPhotoImages(v => !v)} className="flex items-center justify-between cursor-pointer">
                 <span className="flex items-center gap-2"><Image size={13} /> {showPhotoImages ? "Photo Images" : "Line Drawings"}</span>
                 {showPhotoImages && <Check size={12} className="text-[#F15A22]" />}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowDimensions(v => !v)} className="flex items-center justify-between cursor-pointer">
                 <span className="flex items-center gap-2"><Eye size={13} /> Show Dimensions</span>
                 {showDimensions && <Check size={12} className="text-[#F15A22]" />}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowTooltips(v => !v)} className="flex items-center justify-between cursor-pointer">
                 <span className="flex items-center gap-2"><Eye size={13} /> Show Tooltips</span>
                 {showTooltips && <Check size={12} className="text-[#F15A22]" />}
               </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex border border-gray-200 overflow-hidden">
              <button onClick={() => viewMode === "elevations" ? setElevationZoom(z => Math.max(25, z - 10)) : setGridZoom(z => Math.max(25, z - 10))} title="Zoom out" className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] transition-all">
                <ZoomOut size={13} />
              </button>
              <button onClick={() => viewMode === "elevations" ? setElevationZoom(100) : setGridZoom(100)} title="Reset zoom" className="px-2 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#F15A22] transition-all min-w-12">
                {viewMode === "elevations" ? elevationZoom : gridZoom}%
              </button>
              <button onClick={() => viewMode === "elevations" ? setElevationZoom(z => Math.min(300, z + 10)) : setGridZoom(z => Math.min(300, z + 10))} title="Zoom in" className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] transition-all">
                <ZoomIn size={13} />
              </button>
            </div>
            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 border border-red-700 transition-all">
                    ⚙ Admin
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSaveModalOpen(true)} disabled={placedModules.length === 0 || saveMutation.isPending}>
                    <Save size={13} /> Save to Catalogue
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Catalogue")} className="flex items-center gap-2 cursor-pointer">
                      <BookOpen size={13} /> Floor Catalogue
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("WallCatalogue")} className="flex items-center gap-2 cursor-pointer">
                      <BookOpen size={13} /> Wall Catalogue
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>
      )}

      {/* ── MOBILE TOP BAR ── */}
      {isMobile && (
        <div ref={navBarRef} className={`${viewMode === "building" ? "fixed" : "absolute"} top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm`}>
          <div className="flex items-center px-3 py-2 gap-2">
            <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" style={{ height: "22px", width: "auto" }} />
            {/* View switcher */}
              <div className="flex border border-gray-200 overflow-hidden ml-2">
                <button onClick={() => setViewMode("2d")} className={`px-2.5 py-1.5 text-xs transition-all ${viewMode === "2d" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600"}`}>
                  <Grid2X2 size={14} />
                </button>
                <button onClick={() => setViewMode("elevations")} className={`px-2.5 py-1.5 text-xs transition-all ${viewMode === "elevations" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600"}`}>
                  <Image size={14} />
                </button>
                <button onClick={() => setViewMode("building")} className={`px-2.5 py-1.5 text-xs transition-all ${viewMode === "building" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600"}`}>
                    <Box size={14} />
                  </button>
                </div>
                {/* Zoom controls - only for 2D/building view */}
                {viewMode !== "elevations" && (
                  <div className="flex border border-gray-200 overflow-hidden ml-1">
                    <button onClick={() => setGridZoom(z => Math.max(25, z - 10))} title="Zoom out" className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] transition-all">
                      <ZoomOut size={14} />
                    </button>
                    <button onClick={() => setGridZoom(100)} title="Reset zoom" className="px-2 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#F15A22] transition-all min-w-10">
                      {gridZoom}%
                    </button>
                    <button onClick={() => setGridZoom(z => Math.min(300, z + 10))} title="Zoom in" className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] transition-all">
                      <ZoomIn size={14} />
                    </button>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setSaveModalOpen(true)} disabled={placedModules.length === 0 || saveMutation.isPending} className="px-3 py-1.5 text-xs bg-[#F15A22] text-white disabled:opacity-40 transition-all rounded-sm">
                <Save size={14} />
              </button>
              <button onClick={() => setMobileMenuOpen(v => !v)} className="p-1.5 text-gray-600 border border-gray-200 rounded-sm">
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>



          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-100 bg-white shadow-lg">
              <div className="grid grid-cols-2 gap-2 p-3">
                <Link to={createPageUrl("DesignCatalogue")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#F15A22] rounded-sm">
                  <LayoutTemplate size={14} /> Design Catalogue
                </Link>
                <button onClick={() => { setShowSaved(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-sm bg-white">
                  <FolderOpen size={14} /> My Designs
                </button>
                <button onClick={() => { handleUndo(); setMobileMenuOpen(false); }} disabled={history.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-sm bg-white disabled:opacity-30">
                  <Undo2 size={14} /> Undo
                </button>
                <Link to={createPageUrl("Catalogue")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-sm bg-white">
                  <BookOpen size={14} /> Floor Cat.
                </Link>
                <Link to={createPageUrl("WallCatalogue")} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-sm bg-white">
                  <BookOpen size={14} /> Wall Cat.
                </Link>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WORKSPACE ── */}
      <div className={`flex-1 relative overflow-auto ${isMobile ? "pt-12" : "pt-16"}`}>
        {viewMode === "sitemap" ? (
          <SiteMapView
            design={{ grid: placedModules, walls, furniture }}
            siteAddress={siteAddress}
            setSiteAddress={setSiteAddress}
            coordinates={siteCoordinates}
            setCoordinates={setSiteCoordinates}
            saveDetails={(() => {
              try {
                return JSON.parse(localStorage.getItem("connectapod_save_details")) || { projectName: '', clientName: '', address: '' };
              } catch {
                return { projectName: '', clientName: '', address: '' };
              }
            })()}
            setSaveDetails={(details) => {
              localStorage.setItem("connectapod_save_details", JSON.stringify(details));
            }}
          />
        ) : viewMode === "elevations" ? (
          <div style={{ transform: `scale(${elevationZoom / 100})`, transformOrigin: "top center", display: "inline-block", width: "100%" }}>
            <CombinedElevations 
              walls={walls} 
              placedModules={placedModules} 
              stickyTop={navBarHeight} 
              showHeader={true} 
              onWallSelect={setSelectedWall} 
              selectedWall={selectedWall}
              wallTypes={availableWallTypes}
              onWallReplace={(wallId, newWallType) => {
                pushHistory(placedModules, walls);
                setWalls(prev => prev.map(w => 
                  w.id === wallId 
                    ? { ...w, type: newWallType.type, label: newWallType.label, elevationImage: wallImages[newWallType.type] || null, price: newWallType.price || 0 }
                    : w
                ));
                setSelectedWall(null);
              }}
              onOpenWallsMenu={(wall) => {
                setWallToReplace(wall);
                setSelectedWall(wall);
                setMobileDrawerOpen(true);
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", height: "100%" }}>
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
                onUpdateWall={handleUpdateWall}
                onWallSelect={setSelectedWall}
                onModuleSelect={setSelectedModule}
                onFaceSelect={setSelectedFace}
                onPlaceWallOnFace={handlePlaceWallOnFace}
                furniture={furniture}
                onPlaceFurniture={handlePlaceFurniture}
                onRemoveFurniture={handleRemoveFurniture}
                onMoveFurniture={handleMoveFurniture}
                onRotateFurniture={handleRotateFurniture}
                customModules={customModules}
                floorPlanImages={floorPlanImages}
                wallImages={wallImages}
                zoom={gridZoom}
                showLabels={showLabels}
                showFurniture={showFurniture}
                showPhotoImages={showPhotoImages}
                showDimensions={showDimensions}
                />
          </div>
        )}
      </div>

      {/* ── DESKTOP FLOATING PANELS ── */}
      {!isMobile && (
        <>
          {/* Floating left panel — Module picker */}
          <div
            className="fixed z-50 flex"
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
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <ModulePanel
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    selectedWall={selectedWall}
                    selectedModule={selectedModule}
                    selectedFace={selectedFace}
                    placedModules={placedModules}
                    onModuleImageUpdate={handleModuleImageUpdate}
                    onWallImageUpdate={handleWallImageUpdate}
                    floorPlanImages={floorPlanImages}
                    wallImages={wallImages}
                    highlightWallType={wallToReplace?.type}
                    showTooltips={showTooltips}
                    onWallHover={(wall) => {
                      setHoveredWall(wall);
                      if (wall) setSummaryCollapsed(false);
                    }}
                    onWallSelected={(wallType) => {
                      if (wallToReplace) {
                        pushHistory(placedModules, walls);
                        setWalls(prev => prev.map(w => 
                          w.id === wallToReplace.id 
                            ? { ...w, type: wallType.type, label: wallType.label, elevationImage: wallImages[wallType.type] || null, price: wallType.price || 0 }
                            : w
                        ));
                        setSelectedWall(null);
                        setWallToReplace(null);
                        setSummaryCollapsed(false);
                      }
                    }}
                  />
                <FurniturePanel onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
              </div>
            </div>
            <button
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              className="self-start mt-3 ml-1 bg-white border border-gray-200 shadow-md p-1 hover:border-[#F15A22] hover:text-[#F15A22] text-gray-400 transition-all"
            >
              {panelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Floating right panel — Design summary */}
          {placedModules.length > 0 && (
            <div
              className="absolute z-20"
              style={{ left: `${summaryPos.x}px`, top: `${summaryPos.y}px`, cursor: draggingSummary ? "grabbing" : "default", width: "260px" }}
            >
              <div className="bg-white border border-gray-200 shadow-xl overflow-hidden" onMouseDown={handleSummaryMouseDown}>
                <div className="px-4 py-3 border-b border-gray-100 cursor-grab active:cursor-grabbing flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-800">{selectedWall ? `Wall: ${selectedWall.face || selectedWall.type || "Preview"}` : hoveredWall ? `Wall: ${hoveredWall.label}` : selectedModule && selectedFace ? `${selectedModule.label} — Face ${selectedFace}` : selectedModule ? `Module: ${selectedModule.label}` : "Design Summary"}</p>
                  <button onMouseDown={e => e.stopPropagation()} onClick={() => setSummaryCollapsed(c => !c)} className="text-gray-400 hover:text-[#F15A22] transition-colors text-xs leading-none">
                    {summaryCollapsed ? "▲" : "▼"}
                  </button>
                </div>
                {!summaryCollapsed && (
                   <div className="p-4 h-[320px] overflow-y-auto">
                     {selectedModule && selectedFace ? (
                       // Face selection + wall picker
                       <div className="flex flex-col h-full gap-3">
                         <div>
                           <p className="text-xs font-semibold text-gray-900">{selectedModule.label}</p>
                           <p className="text-[10px] text-gray-500 mb-2">{selectedModule.type}</p>
                           <p className="text-[10px] font-bold text-[#F15A22]">Face {selectedFace}</p>
                         </div>
                         <div className="flex-1 overflow-y-auto">
                           <p className="text-[10px] text-gray-500 mb-2">Compatible walls:</p>
                           <div className="space-y-1">
                             {availableWallTypes
                               .filter(w => {
                                 // Filter by face and orientation
                                 const isHorizontal = selectedFace === "W" || selectedFace === "Y";
                                 const isVertical = selectedFace === "Z" || selectedFace === "X";
                                 const orientMatch = (isHorizontal && w.orientation === "horizontal") || (isVertical && w.orientation === "vertical");
                                 const faceMatch = !w.face || w.face === selectedFace;
                                 return orientMatch && faceMatch;
                               })
                               .map(wt => (
                                 <button
                                   key={wt.type}
                                   onClick={() => handlePlaceWallOnFace(wt, selectedModule, selectedFace)}
                                   className="w-full text-left px-2 py-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-[#F15A22] hover:text-white hover:border-[#F15A22] transition-colors"
                                 >
                                   <div className="font-semibold">{wt.label}</div>
                                   <div className="text-[9px] opacity-70">${(wt.price || 0).toLocaleString()}</div>
                                 </button>
                               ))}
                           </div>
                         </div>
                       </div>
                     ) : selectedModule && selectedModule.floorPlanImage ? (
                       <div className="flex flex-col h-full gap-2">
                         <div>
                           <p className="text-xs font-semibold text-gray-900 break-words">{selectedModule.label}</p>
                           <p className="text-[10px] text-gray-500">{selectedModule.type}</p>
                         </div>
                         <div className="flex-1 bg-gray-50 rounded overflow-hidden flex items-center justify-center relative">
                           <img src={selectedModule.floorPlanImage} alt={selectedModule.label} className="w-full h-full object-contain" style={{ transform: `rotate(${selectedModule.rotation || 0}deg) ${selectedModule.flipped ? 'scaleX(-1)' : ''}` }} />
                           {/* Face labels on edges — Z/X visibility based on flip state, positions stay fixed */}
                           <button onClick={() => setSelectedFace("W")} className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-md">W</button>
                           {!selectedModule.flipped && <button onClick={() => setSelectedFace("Z")} className="absolute left-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-md">Z</button>}
                           {selectedModule.flipped && <button onClick={() => setSelectedFace("X")} className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-md">X</button>}
                           <button onClick={() => setSelectedFace("Y")} className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-gray-900 text-xs font-bold rounded hover:bg-[#F15A22] hover:text-white transition-colors shadow-md">Y</button>
                         </div>
                         <div className="flex justify-between items-center text-xs border-t border-gray-200 pt-2">
                           <span className="text-gray-600">{selectedModule.sqm?.toFixed(1)} m²</span>
                           <span className="font-semibold text-gray-800">${(selectedModule.price || 0).toLocaleString()}</span>
                         </div>
                       </div>
                     ) : hoveredWall ? (
                       <div className="flex flex-col h-full gap-2">
                         <div>
                           <p className="text-xs font-semibold text-gray-900 break-words">{hoveredWall.label}</p>
                           <p className="text-[10px] text-gray-500">{hoveredWall.type}</p>
                           {hoveredWall.description && <p className="text-[10px] text-gray-500 mt-1">{hoveredWall.description}</p>}
                         </div>
                         <div className="flex-1 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                           {hoveredWall.elevationImage ? (
                             <img src={hoveredWall.elevationImage} alt={hoveredWall.label} className="w-full h-full object-contain" />
                           ) : (
                             <div className="flex flex-col items-center gap-2 text-gray-400">
                               <div className="w-16 h-24 border-2 border-gray-300 rounded flex items-center justify-center">
                                 <span className="text-2xl font-bold text-gray-300">{hoveredWall.orientation === "horizontal" ? "━" : "┃"}</span>
                               </div>
                               <p className="text-[10px] text-center">No elevation image</p>
                             </div>
                           )}
                         </div>
                         <div className="text-xs border-t border-gray-200 pt-2">
                           <div className="flex justify-between">
                             <span className="text-gray-600">{hoveredWall.width?.toFixed ? hoveredWall.width.toFixed(1) : hoveredWall.width}m wide</span>
                             <span className="font-semibold text-gray-800">${(hoveredWall.price || 0).toLocaleString()}</span>
                           </div>
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
                             <img src={selectedWall.elevationImage} alt={selectedWall.label} className="w-full h-full object-contain" style={{ transform: selectedWall.flipped ? 'scaleX(-1)' : undefined }} />
                           ) : (
                             <div className="flex flex-col items-center gap-2 text-gray-400">
                               <div className="w-16 h-24 border-2 border-gray-300 rounded flex items-center justify-center">
                                 <span className="text-2xl font-bold text-gray-300">{selectedWall.face || "W"}</span>
                               </div>
                               <p className="text-[10px] text-center">No elevation image</p>
                             </div>
                           )}
                         </div>
                         <div className="flex gap-1">
                           <select
                             value={selectedWall.type || ""}
                             onChange={(e) => {
                               const newType = e.target.value;
                               const wallEntry = availableWallTypes.find(w => w.type === newType);
                               setWalls(prev => prev.map(w => 
                                 w.id === selectedWall.id 
                                   ? { ...w, type: newType, label: wallEntry?.label || newType, elevationImage: wallImages[newType] || null, price: wallEntry?.price || 0 }
                                   : w
                               ));
                               setSelectedWall(prev => prev ? { ...prev, type: newType, label: wallEntry?.label || newType, elevationImage: wallImages[newType] || null, price: wallEntry?.price || 0 } : null);
                             }}
                             className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                           >
                             {availableWallTypes.map(wt => (
                               <option key={wt.type} value={wt.type}>{wt.label}</option>
                             ))}
                           </select>
                           <button
                             onClick={() => {
                               setWalls(prev => prev.map(w => w.id === selectedWall.id ? { ...w, flipped: !w.flipped } : w));
                               setSelectedWall(prev => prev ? { ...prev, flipped: !prev.flipped } : null);
                             }}
                             className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
                             title="Flip"
                           >
                             ↔
                           </button>
                         </div>
                         <div className="text-xs border-t border-gray-200 pt-2 text-right">
                           <span className="font-semibold text-gray-800">${(selectedWall.price || 0).toLocaleString()}</span>
                         </div>
                       </div>
                     ) : (
                      <DesignSummary
                        placedModules={placedModules}
                        walls={walls}
                        furniture={furniture}
                        onSave={() => setSaveModalOpen(true)}
                        onClear={handleClear}
                        isSaving={saveMutation.isPending}
                        onQuote={() => setDetailsModalMode('estimate')}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MOBILE BOTTOM DRAWER — Module Library ── */}
      {isMobile && (
        <div
          className={`${viewMode === "building" ? "fixed" : "absolute"} bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl transition-all duration-300`}
          style={{ height: mobileDrawerOpen ? "65vh" : "48px" }}
        >
          {/* Drawer handle / toggle */}
          <button
            onClick={() => setMobileDrawerOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-300 rounded absolute left-1/2 -translate-x-1/2 top-2" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Module Library</span>
              {placedModules.length > 0 && (
                <span className="text-[10px] bg-[#F15A22] text-white rounded-full px-1.5 py-0.5">{placedModules.length}</span>
              )}
            </div>
            {mobileDrawerOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
          </button>

          {mobileDrawerOpen && (
            <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ height: "calc(65vh - 48px)" }}>
              <p className="text-[11px] text-gray-400 mb-2 text-center">Tap items below to view · drag-and-drop available on desktop</p>
              <ModulePanel
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                selectedWall={selectedWall}
                selectedModule={selectedModule}
                selectedFace={selectedFace}
                placedModules={placedModules}
                onModuleImageUpdate={handleModuleImageUpdate}
                onWallImageUpdate={handleWallImageUpdate}
                floorPlanImages={floorPlanImages}
                wallImages={wallImages}
                highlightWallType={wallToReplace?.type}
                showTooltips={showTooltips}
                onWallSelected={(wallType) => {
                   if (wallToReplace) {
                     pushHistory(placedModules, walls);
                     setWalls(prev => prev.map(w => 
                       w.id === wallToReplace.id 
                         ? { ...w, type: wallType.type, label: wallType.label, elevationImage: wallImages[wallType.type] || null, price: wallType.price || 0 }
                         : w
                     ));
                     setSelectedWall(null);
                     setWallToReplace(null);
                     setMobileDrawerOpen(false);
                   }
                 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Saved Designs overlay panel */}
      {showSaved && (
        <div className="absolute inset-0 z-50 bg-black/30 flex items-start justify-center pt-12" onClick={() => setShowSaved(false)}>
          <div
            className="bg-white border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto mx-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">My Saved Designs</h2>
              <button onClick={() => setShowSaved(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-4">
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
        lastSavedName={lastSavedName}
        designs={designs}
        projectName={(() => {
          try {
            const saved = JSON.parse(localStorage.getItem("connectapod_print_details")) || {};
            return saved.projectName?.trim() || "";
          } catch {
            return "";
          }
        })()}
      />

      <ProjectDetailsModal
        open={!!detailsModalMode}
        mode={detailsModalMode}
        onClose={() => setDetailsModalMode(null)}
        designs={designs}
        placedModules={placedModules}
        walls={walls}
        printMode={pendingPrintMode}
        onConfirm={(details, replace = false) => {
          if (detailsModalMode === 'print') {
            setPrintDetails(details);
            setPrintMode(pendingPrintMode);
            setPendingPrintMode(null);
            setDetailsModalMode(null);
          } else if (detailsModalMode === 'save') {
            handleSave(details.projectName, { 
              clientFirstName: details.clientFirstName,
              clientFamilyName: details.clientFamilyName,
              homeAddress: details.homeAddress,
              siteAddress: details.siteAddress, 
              email: details.email, 
              phone: details.phone 
            }, replace);
            setDetailsModalMode(null);
          }
        }}
      />

      {/* Copyright footer */}
      {!isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-10 text-center py-1 text-[10px] text-gray-400 bg-white/70 backdrop-blur pointer-events-none select-none">
          © {new Date().getFullYear()} connectapod. All rights reserved.
        </div>
      )}
    </div>
    </>
  );
}