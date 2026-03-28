import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FloorPlanSVG from "./FloorPlanSVG.jsx";
import WallSuggestions from "./WallSuggestions.jsx";
import WallImageUpload from "./WallImageUpload.jsx";
import FloorPlanUpload from "./FloorPlanUpload.jsx";
import ModuleTooltip, { TypeTooltip } from "./ModuleTooltip.jsx";

function getIcon(key, size = 18) {
  const s = size;
  const icons = {
    general: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>
      </svg>
    ),
    kitchen: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <rect x="2" y="5" width="20" height="14" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/>
        <line x1="8" y1="10" x2="8" y2="19"/><circle cx="16" cy="7.5" r="1"/>
      </svg>
    ),
    bathroom: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M6 12V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1"/>
      </svg>
    ),
    combined: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/>
        <rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/>
      </svg>
    ),
    connectionmodules: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <rect x="3" y="5" width="8" height="14" rx="1"/><rect x="13" y="5" width="8" height="14" rx="1"/>
        <line x1="11" y1="7" x2="13" y2="7"/><line x1="11" y1="12" x2="13" y2="12"/><line x1="11" y1="17" x2="13" y2="17"/>
      </svg>
    ),
    deck: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>
        <path d="M6 3v18"/><path d="M18 3v18"/>
      </svg>
    ),
    living: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <rect x="2" y="5" width="20" height="14" rx="1"/><line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="2" y1="12" x2="22" y2="12"/><circle cx="7" cy="10" r="1.5"/><circle cx="17" cy="10" r="1.5"/>
      </svg>
    ),
    bedroom: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M4 12h16v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z"/><rect x="4" y="5" width="16" height="7" rx="1"/>
        <line x1="8" y1="9" x2="16" y2="9"/>
      </svg>
    ),
    laundry: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <circle cx="12" cy="12" r="8"/><path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
        <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  };
  return icons[key] || icons.general;
}

const PANEL_GROUPS = [
  {
    key: "living",
    label: "Living",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [],
  },
  {
    key: "bedroom",
    label: "Bedroom",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [],
  },
  {
    key: "bathroom",
    label: "Bathroom",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 14000,
    items: [],
  },
  {
    key: "laundry",
    label: "Laundry",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 22000,
    items: [],
  },
  {
    key: "connectionmodules",
    label: "Connection",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 18000,
    items: [],
  },
  {
    key: "deck",
    label: "Deck",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 8000,
    items: [],
  },
];

const mToCells = (m) => Math.round(m / 0.6);

const MODULE_TYPES = PANEL_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    type: item.code,
    label: item.name,
    mpCode: item.mpCode,
    color: group.color,
    border: group.border,
    w: mToCells(item.width),
    h: mToCells(item.depth),
    sqm: item.sqm,
    price: group.price,
    groupKey: group.key,
    chassis: item.chassis,
    widthCode: item.widthCode,
    room: item.room,
    orientation: item.orientation || 1,
  }))
);

const GROUP_ICONS = Object.fromEntries(
  PANEL_GROUPS.map((g) => [g.key, getIcon(g.key, 20)])
);

// Empty — all walls come from the catalogue database
const WALL_TYPES = [];

export { MODULE_TYPES, GROUP_ICONS, WALL_TYPES };

export default function ModulePanel({ onDragStart, onDragEnd, selectedWall, selectedModule, placedModules = [], onModuleImageUpdate, onWallImageUpdate, onWallTypesLoaded, floorPlanImages = {}, wallImages = {}, onWallSelected, highlightWallType, onWallHover, showTooltips = true }) {
   const [openGroup, setOpenGroup] = useState(null);
   const [expandedSizes, setExpandedSizes] = useState({});
   const [hoveredModule, setHoveredModule] = useState(null);
   const [modulesCollapsed, setModulesCollapsed] = useState(false);
   const [hoveredWall, setHoveredWall] = useState(null);
   const [showWallSuggestions, setShowWallSuggestions] = useState(true);

  const { data: customModules = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: async () => { try { const r = await base44.entities.ModuleEntry.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const { data: deletedModules = [] } = useQuery({
    queryKey: ["deletedModules"],
    queryFn: async () => { try { const r = await base44.entities.DeletedModule.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const { data: customWalls = [] } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: async () => { try { const r = await base44.entities.WallEntry.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const { data: deletedWalls = [] } = useQuery({
    queryKey: ["deletedWalls"],
    queryFn: async () => { try { const r = await base44.entities.DeletedWall.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  const { data: localWallImages = {} } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => {
      try {
        const list = await base44.entities.WallImage.list();
        if (!Array.isArray(list)) return {};
        const entries = {};
        list.forEach(img => { if (img.wallType && img.imageUrl) entries[img.wallType] = img.imageUrl; });
        return entries;
      } catch { return {}; }
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Merge custom modules with PANEL_GROUPS by category, supporting multi-category modules
   const dynamicPanelGroups = React.useMemo(() => {
     const deletedCodes = new Set((Array.isArray(deletedModules) ? deletedModules : []).map(d => d.moduleCode));
     const categoryAbbreviations = {
       "Living": ["LV", "living"],
       "Bedroom": ["B0", "B1", "B2", "B3", "B4", "bedroom"],
       "Bathroom": ["W", "bathroom"],
       "Kitchen": ["K", "kitchen"],
       "Laundry": ["L", "laundry"],
       "Connection": ["C", "connection", "connectionmodules"],
       "Deck": ["DK", "D", "deck"],
       "Soffit": ["SO", "soffit"],
     };



     const knownGroupLabels = new Set(PANEL_GROUPS.map(g => g.label));
     const assignedCodes = new Set();

     const toItem = (m) => {
       const variants = (m.variants || []).map(v => v.toLowerCase());
       const isEnd = variants.some(v => v.includes("end"));
       const isConnection = variants.some(v => v.includes("connection"));
       const chassis = isConnection ? "C" : isEnd ? "LF" : "SF";
       return {
         code: m.code,
         name: m.name,
         mpCode: m.code,
         width: m.width || 3.0,
         depth: m.depth || 4.8,
         sqm: m.sqm || parseFloat(((m.width || 3.0) * (m.depth || 4.8)).toFixed(1)),
         description: m.description || "",
         chassis,
         widthCode: "30",
         room: "G",
         originalCode: m.originalCode || undefined,
       };
     };

     const sortItems = (items) => items.sort((a, b) => {
       const aIsEnd = a.chassis === "EF" || a.chassis === "ER" || a.chassis === "LF" || a.chassis === "RF";
       const bIsEnd = b.chassis === "EF" || b.chassis === "ER" || b.chassis === "LF" || b.chassis === "RF";
       const aIsDeck = a.description?.includes("Deck") || a.description?.includes("Soffit");
       const bIsDeck = b.description?.includes("Deck") || b.description?.includes("Soffit");
       if (aIsEnd !== bIsEnd) return aIsEnd ? -1 : 1;
       if (aIsDeck !== bIsDeck) return aIsDeck ? 1 : -1;
       return a.width - b.width;
     });

     const builtInGroups = PANEL_GROUPS.map(group => {
       const builtInItems = group.items.filter(item => !deletedCodes.has(item.code));

       const categoryModules = (Array.isArray(customModules) ? customModules : []).filter(m => {
        if (deletedCodes.has(m.code)) return false;
        const categories = Array.isArray(m.categories) ? m.categories : [];
        const descCategories = (m.description || "").split(",").map(s => s.trim()).filter(Boolean);
        const matchesPrimaryCategory = m.category === group.label;
        const matchesAdditionalCategories = categories.includes(group.label);
        const matchesDescription = descCategories.includes(group.label);
        const matches = matchesPrimaryCategory || matchesAdditionalCategories || matchesDescription;
        if (matches) assignedCodes.add(m.code);
        return matches;
       });

       return {
         ...group,
         items: sortItems([...builtInItems, ...categoryModules.map(toItem)]),
       };
     });

     // Create new groups for custom modules with unknown categories
     const extraModules = (Array.isArray(customModules) ? customModules : []).filter(m => {
       if (deletedCodes.has(m.code)) return false;
       if (assignedCodes.has(m.code)) return false;
       return true;
     });

     const extraGroups = [];
     const extraByCategory = {};
     extraModules.forEach(m => {
       const cat = m.category || "Other";
       if (!extraByCategory[cat]) extraByCategory[cat] = [];
       extraByCategory[cat].push(m);
     });
     Object.entries(extraByCategory).forEach(([cat, mods]) => {
       extraGroups.push({
         key: cat.toLowerCase().replace(/\s+/g, "_"),
         label: cat,
         color: "#FDF0EB",
         border: "#F15A22",
         price: 12000,
         items: sortItems(mods.map(toItem)),
       });
     });

     return [...builtInGroups, ...extraGroups];
     }, [customModules, deletedModules]);

  const customWallTypes = React.useMemo(() => (Array.isArray(customWalls) ? customWalls : [])
     .filter(w => !(Array.isArray(deletedWalls) ? deletedWalls : []).some(d => d.wallCode === w.code))
     .map(w => {
       const isVertical = w.code.startsWith("XC-");
       const parsedWidthM = w.width ? w.width / 1000 : 3.0;
       return {
         type: w.code,
         label: w.name,
         description: w.description || "",
         mpCode: w.code,
         width: parsedWidthM,
         orientation: isVertical ? "vertical" : "horizontal",
         length: Math.round(parsedWidthM / 0.6),
         thickness: 0.31,
         variants: w.variants || [],
       };
     }), [customWalls, deletedWalls]);

  React.useEffect(() => {
    // Keep all groups collapsed by default - don't auto-open on selection
  }, [selectedWall?.id, selectedModule?.id]);

  const { compatibleWalls, filterReason } = React.useMemo(() => {
    const CELL_M = 0.6;

    let attachedMod = null;
    let face = null;

    if (selectedWall) {
      face = selectedWall.face;
      const isLongFace = face === "W" || face === "Y";
      for (const mod of placedModules) {
        if (isLongFace) {
          if (face === "W" && selectedWall.x === mod.x && selectedWall.y === mod.y - 1) {
            attachedMod = mod; break;
          }
          if (face === "Y" && selectedWall.x === mod.x && selectedWall.y === mod.y + mod.h) {
            attachedMod = mod; break;
          }
        } else {
          if (face === "Z" && Math.abs(selectedWall.y - mod.y) < 0.5 && Math.abs(selectedWall.x - mod.x) < 0.5) {
            attachedMod = mod; break;
          }
          if (face === "X" && Math.abs(selectedWall.y - mod.y) < 0.5 && Math.abs(selectedWall.x - (mod.x + mod.w - 0.31)) < 0.5) {
            attachedMod = mod; break;
          }
        }
      }
    } else if (selectedModule) {
      attachedMod = selectedModule;
      face = "W";
    }

    const allWalls = [...customWallTypes];
    if (!attachedMod) return { compatibleWalls: allWalls, filterReason: null };

    let chassis = attachedMod.chassis;
    let modWidthM = attachedMod.width;
    if (!chassis || !modWidthM) {
      const resolved = dynamicPanelGroups.flatMap(g => g.items).find(m => m.code === attachedMod.type) || 
                       MODULE_TYPES.find(m => m.type === attachedMod.type);
      chassis = chassis || resolved?.chassis || "SF";
      modWidthM = modWidthM || (attachedMod.w ? attachedMod.w * CELL_M : resolved?.w * CELL_M) || 3.0;
    } else {
      modWidthM = modWidthM || (attachedMod.w * CELL_M);
    }
    modWidthM = attachedMod.w ? attachedMod.w * CELL_M : modWidthM;

    const isDeck = chassis === "DK" || chassis === "SO";
    const isEnd = chassis === "EF" || chassis === "LF" || chassis === "RF" || chassis === "ER" || chassis === "End";
    const isConnection = chassis === "C";
    const isLongFace = face === "W" || face === "Y";

    const faceWidthM = isLongFace ? modWidthM : attachedMod.h * CELL_M;

    let filtered = allWalls;

    if (isConnection) {
     // Connection modules: filter by width and Connection variant only
     filtered = allWalls.filter(w => {
       const matchesWidth = Math.abs(w.width - faceWidthM) < 0.05;
       const isConnectionWall = Array.isArray(w.variants) && w.variants.includes("Connection");
       return matchesWidth && isConnectionWall;
     });
    } else if (isEnd) {
     // End modules: show walls matching width or 4.8m, but exclude Connection walls
     filtered = allWalls.filter(w => {
       const isConnectionWall = Array.isArray(w.variants) && w.variants.includes("Connection");
       if (isConnectionWall) return false;
       const matchesWidth = Math.abs(w.width - faceWidthM) < 0.05;
       const matches4P8m = Math.abs(w.width - 4.8) < 0.05;
       return matchesWidth || matches4P8m;
     });
    } else if (!isConnection && !isDeck && (face === "W" || face === "Y")) {
     // Regular modules on long faces: show walls matching width, but exclude Connection walls
     filtered = allWalls.filter(w => {
       const isConnectionWall = Array.isArray(w.variants) && w.variants.includes("Connection");
       return !isConnectionWall && Math.abs(w.width - faceWidthM) < 0.05;
     });
    } else {
     filtered = [];
    }

    const context = selectedWall ? `Face ${face}` : `${chassis} module`;
    const reason = `${context} · ${faceWidthM.toFixed(1)}m wide · ${filtered.length} wall${filtered.length !== 1 ? "s" : ""}`;
    console.log(`[ModulePanel] Filter: isEnd=${isEnd}, isConnection=${isConnection}, face=${face}, faceWidthM=${faceWidthM}, allWalls=${allWalls.length}, filtered=${filtered.length}`, filtered);
    return { compatibleWalls: filtered, filterReason: reason };
  }, [selectedWall, selectedModule, placedModules, customWallTypes]);

  return (
    <div className="flex flex-col gap-1 relative">
      <button 
        onClick={() => setModulesCollapsed(!modulesCollapsed)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors text-left border border-gray-200 bg-white"
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Modules</p>
        <span className="text-gray-400">
          {modulesCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {!modulesCollapsed && dynamicPanelGroups.map((group) => {
        const isOpen = openGroup === group.key;
        return (
          <div key={group.key} className="border border-gray-200 bg-white overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setOpenGroup(isOpen ? null : group.key)}
            >
              <span className="flex items-center justify-center w-5 h-5 shrink-0">
                {getIcon(group.key, 18)}
              </span>
              <span className="flex-1 text-sm font-semibold text-gray-800 leading-tight">{group.label}</span>
              <span className="text-gray-400 shrink-0">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>

            {isOpen && (
                <div className="border-t border-gray-100 max-h-96 overflow-y-auto">
                  {(() => {
                    const bySize = {};
                    group.items.forEach(item => {
                      const size = `${item.width}m`;
                      if (!bySize[size]) bySize[size] = [];
                      bySize[size].push(item);
                    });
                    const sizes = Object.keys(bySize).sort((a, b) => parseFloat(b) - parseFloat(a));

                    return sizes.map(size => {
                      const sizeKey = `${group.key}-${size}`;
                      const isExpanded = expandedSizes[sizeKey] === true;
                      const sizeItems = bySize[size];
                      
                      // Split items by type: end vs standard
                      const endItems = sizeItems.filter(item => {
                        const chassis = item.chassis || "SF";
                        return chassis === "EF" || chassis === "ER" || chassis === "LF" || chassis === "RF";
                      });
                      const standardItems = sizeItems.filter(item => {
                        const chassis = item.chassis || "SF";
                        return !(chassis === "EF" || chassis === "ER" || chassis === "LF" || chassis === "RF");
                      });

                      const hasEndModules = endItems.length > 0;
                      const hasStandardModules = standardItems.length > 0;

                      return (
                      <div key={size} className="border-b border-gray-100 last:border-0">
                        <button 
                          onClick={() => setExpandedSizes(prev => ({ ...prev, [sizeKey]: !prev[sizeKey] }))}
                          className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors sticky top-0 z-10"
                        >
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{size} wide</p>
                          <span className="text-gray-400">
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </span>
                        </button>
                        {isExpanded && (
                          <div>
                            {hasStandardModules && (
                              <div>
                                <TypeTooltip type="standard">
                                  <button
                                    onClick={() => {
                                      const subKey = `${group.key}-${size}-standard`;
                                      setExpandedSizes(prev => ({ ...prev, [subKey]: !prev[subKey] }));
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-1 bg-gray-100 border-b border-gray-100 hover:bg-gray-200 transition-colors"
                                  >
                                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Standard</p>
                                    <span className="text-gray-500">
                                      {expandedSizes[`${group.key}-${size}-standard`] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                    </span>
                                  </button>
                                </TypeTooltip>
                                {expandedSizes[`${group.key}-${size}-standard`] && standardItems.map((item) => {
                                  const mod = MODULE_TYPES.find((m) => m.type === item.code) || {
                                    type: item.code,
                                    label: item.name,
                                    mpCode: item.mpCode,
                                    color: group.color,
                                    border: group.border,
                                    w: Math.round(item.width / 0.6),
                                    h: Math.round(item.depth / 0.6),
                                    sqm: item.sqm,
                                    price: group.price,
                                    groupKey: group.key,
                                    chassis: item.chassis || "SF",
                                    widthCode: item.widthCode || "30",
                                    room: item.room || "G",
                                    orientation: item.orientation || 1,
                                  };
                                  const variants = item.description ? item.description.split(",").map(v => v.trim()) : [];
                                  const moduleElement = (
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = "copy";
                                        e.dataTransfer.setData("moduleType", mod.type);
                                        const imageUrl = floorPlanImages[mod.type] || floorPlanImages[item.originalCode];
                                        if (imageUrl) {
                                          e.dataTransfer.setData("moduleImage", imageUrl);
                                        }
                                        onDragStart(e, mod);
                                      }}
                                      onDragEnd={onDragEnd}
                                      onMouseEnter={() => setHoveredModule({ ...mod, floorPlanImage: floorPlanImages[mod.type] })}
                                      onMouseLeave={() => setHoveredModule(null)}
                                      className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                                    >
                                      <div className="shrink-0 bg-white overflow-hidden relative flex items-center justify-center border border-gray-200" style={{ height: "60px", width: "60px" }}>
                                        {floorPlanImages[mod.type] || floorPlanImages[item.originalCode] ? (
                                          <img src={floorPlanImages[mod.type] || floorPlanImages[item.originalCode]} alt={item.name} className="w-auto h-full object-contain" />
                                        ) : (
                                          <FloorPlanSVG code={item.code} className="h-full w-auto" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-700 leading-tight">{item.name}</p>
                                        {variants.length > 0 && <p className="text-[9px] text-gray-500 mt-0.5">{variants.join(" · ")}</p>}
                                        <p className="text-[10px] font-mono text-[#F15A22] mt-0.5" title={item.mpCode}>{item.mpCode}</p>
                                        <p className="text-[10px] text-gray-400">{item.sqm}m²</p>
                                      </div>
                                    </div>
                                  );
                                  return <div key={item.code}>{moduleElement}</div>;
                                })}
                              </div>
                            )}
                            {hasEndModules && (
                              <div>
                                <TypeTooltip type="end">
                                  <button
                                    onClick={() => {
                                      const subKey = `${group.key}-${size}-end`;
                                      setExpandedSizes(prev => ({ ...prev, [subKey]: !prev[subKey] }));
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-1 bg-gray-100 border-b border-gray-100 hover:bg-gray-200 transition-colors"
                                  >
                                    <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">End</p>
                                    <span className="text-gray-500">
                                      {expandedSizes[`${group.key}-${size}-end`] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                    </span>
                                  </button>
                                </TypeTooltip>
                                {expandedSizes[`${group.key}-${size}-end`] && endItems.map((item) => {
                                  const mod = MODULE_TYPES.find((m) => m.type === item.code) || {
                                    type: item.code,
                                    label: item.name,
                                    mpCode: item.mpCode,
                                    color: group.color,
                                    border: group.border,
                                    w: Math.round(item.width / 0.6),
                                    h: Math.round(item.depth / 0.6),
                                    sqm: item.sqm,
                                    price: group.price,
                                    groupKey: group.key,
                                    chassis: item.chassis || "SF",
                                    widthCode: item.widthCode || "30",
                                    room: item.room || "G",
                                    orientation: item.orientation || 1,
                                  };
                                  const variants = item.description ? item.description.split(",").map(v => v.trim()) : [];
                                  const moduleElement = (
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = "copy";
                                        e.dataTransfer.setData("moduleType", mod.type);
                                        const imageUrl = floorPlanImages[mod.type] || floorPlanImages[item.originalCode];
                                        if (imageUrl) {
                                          e.dataTransfer.setData("moduleImage", imageUrl);
                                        }
                                        onDragStart(e, mod);
                                      }}
                                      onDragEnd={onDragEnd}
                                      onMouseEnter={() => setHoveredModule({ ...mod, floorPlanImage: floorPlanImages[mod.type] })}
                                      onMouseLeave={() => setHoveredModule(null)}
                                      className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                                    >
                                      <div className="shrink-0 bg-white overflow-hidden relative flex items-center justify-center border border-gray-200" style={{ height: "60px", width: "60px" }}>
                                        {floorPlanImages[mod.type] || floorPlanImages[item.originalCode] ? (
                                          <img src={floorPlanImages[mod.type] || floorPlanImages[item.originalCode]} alt={item.name} className="w-auto h-full object-contain" />
                                        ) : (
                                          <FloorPlanSVG code={item.code} className="h-full w-auto" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-700 leading-tight">{item.name}</p>
                                        {variants.length > 0 && <p className="text-[9px] text-gray-500 mt-0.5">{variants.join(" · ")}</p>}
                                        <p className="text-[10px] font-mono text-[#F15A22] mt-0.5" title={item.mpCode}>{item.mpCode}</p>
                                        <p className="text-[10px] text-gray-400">{item.sqm}m²</p>
                                      </div>
                                    </div>
                                  );
                                  return <div key={item.code}>{moduleElement}</div>;
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                        );
                        });
                        })()}
                        </div>
                        )}
          </div>
        );
        })}
        )}





      {/* Wall suggestions for selected end module */}
      {showWallSuggestions && (
        <WallSuggestions selectedModule={selectedModule} selectedWall={selectedWall} placedModules={placedModules} />
      )}

      {/* Magnified preview on hover — modules */}
      {hoveredModule && (
        <div
          className="fixed z-[100] bg-white border-2 border-[#F15A22] shadow-xl rounded pointer-events-none flex flex-col"
          style={{
            width: "320px",
            height: "400px",
            top: "48px",
            right: "20px",
            padding: "4px",
          }}
        >
          <div className="flex-1 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
            {hoveredModule.floorPlanImage ? (
              <img src={hoveredModule.floorPlanImage} alt={hoveredModule.label} className="w-full h-full object-contain" style={{ transform: `rotate(${hoveredModule.rotation || 0}deg) ${hoveredModule.flipped ? 'scaleX(-1)' : ''}` }} />
            ) : (
              <FloorPlanSVG code={hoveredModule.type} className="w-full h-full" />
            )}
          </div>
        </div>
      )}

      {/* Magnified preview on hover — walls */}
      {hoveredWall && (
        <div
          className="fixed z-[100] bg-white border-2 border-[#F15A22] shadow-xl rounded pointer-events-none flex flex-col"
          style={{
            width: "480px",
            height: "560px",
            top: "48px",
            right: "20px",
            padding: "4px",
          }}
        >
          <div className="flex-1 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
            {hoveredWall.elevationImage ? (
              <img src={hoveredWall.elevationImage} alt={hoveredWall.label} className="w-full h-full object-contain" />
            ) : (
              <div
                style={{
                  width: hoveredWall.orientation === "horizontal" ? "90%" : "6px",
                  height: hoveredWall.orientation === "vertical" ? "90%" : "6px",
                  backgroundColor: "#4B5563",
                }}
              />
            )}
          </div>
        </div>
      )}


    </div>
  );
}