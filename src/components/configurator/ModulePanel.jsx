import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FloorPlanSVG from "./FloorPlanSVG.jsx";
import WallSuggestions from "./WallSuggestions.jsx";
import WallImageUpload from "./WallImageUpload.jsx";
import FloorPlanUpload from "./FloorPlanUpload.jsx";

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

export default function ModulePanel({ onDragStart, onDragEnd, selectedWall, selectedModule, placedModules = [], onModuleImageUpdate, onWallImageUpdate, onWallTypesLoaded, floorPlanImages = {}, wallImages = {} }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [hoveredModule, setHoveredModule] = useState(null);
  const [hoveredWall, setHoveredWall] = useState(null);
  const [showWallSuggestions, setShowWallSuggestions] = useState(true);

  const { data: customModules = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: () => base44.entities.ModuleEntry.list(),
  });

  const { data: deletedModules = [] } = useQuery({
    queryKey: ["deletedModules"],
    queryFn: () => base44.entities.DeletedModule.list(),
  });

  const { data: customWalls = [] } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: () => base44.entities.WallEntry.list(),
  });

  const { data: deletedWalls = [] } = useQuery({
    queryKey: ["deletedWalls"],
    queryFn: () => base44.entities.DeletedWall.list(),
  });

  // Merge custom modules with PANEL_GROUPS by category, supporting multi-category modules
   const dynamicPanelGroups = React.useMemo(() => {
     const deletedCodes = new Set(deletedModules.map(d => d.moduleCode));
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

     console.log("[ModulePanel] customModules count:", customModules.length);
     customModules.forEach(m => {
       if (m.code === "30C") console.log("[ModulePanel] Found 30C:", m);
     });

     return PANEL_GROUPS.map(group => {
       // Keep built-in items, filter out deleted ones
       const builtInItems = group.items.filter(item => !deletedCodes.has(item.code));

       // Find custom modules for this category
        const categoryModules = customModules.filter(m => {
          if (deletedCodes.has(m.code)) return false;
          const descriptions = (m.description || "").split(",").map(s => s.trim()).filter(Boolean);
          const categories = Array.isArray(m.categories) ? m.categories : [];
          const variants = Array.isArray(m.variants) ? m.variants.map(v => v.toLowerCase()) : [];

          // Check if this module matches the group
          const matchesPrimaryCategory = m.category === group.label;
          const matchesDescription = descriptions.includes(group.label);
          const matchesAdditionalCategories = categories.includes(group.label);
          const matchesVariant = variants.some(v => v.toLowerCase().includes(group.label.toLowerCase()));

          const matches = matchesPrimaryCategory || matchesDescription || matchesAdditionalCategories || matchesVariant;

          if (m.code === "30C") {
            console.log(`[DEBUG 30C] group=${group.label}, category=${m.category}, descriptions=${descriptions.join(", ")}, variants=${variants.join(", ")}, matchesPrimary=${matchesPrimaryCategory}, matchesDesc=${matchesDescription}, matchesAddl=${matchesAdditionalCategories}, matchesVar=${matchesVariant}, RESULT=${matches}`);
          }

          return matches;
        });

       const customItems = categoryModules.map(m => {
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
           chassis: chassis,
           widthCode: "30",
           room: "G",
           originalCode: m.originalCode || undefined,
         };
       });

       // Merge built-in and custom items
       const allItems = [...builtInItems, ...customItems];
       const sorted = allItems.sort((a, b) => {
         const aIsEnd = a.chassis === "EF" || a.chassis === "ER" || a.chassis === "LF" || a.chassis === "RF";
         const bIsEnd = b.chassis === "EF" || b.chassis === "ER" || b.chassis === "LF" || b.chassis === "RF";
         const aIsDeck = a.description?.includes("Deck") || a.description?.includes("Soffit");
         const bIsDeck = b.description?.includes("Deck") || b.description?.includes("Soffit");

         if (aIsEnd !== bIsEnd) return aIsEnd ? -1 : 1;
         if (aIsDeck !== bIsDeck) return aIsDeck ? 1 : -1;
         return a.width - b.width;
       });

       if (group.label === "Connection") {
         console.log(`[ModulePanel] Connection group items:`, sorted.map(i => ({ code: i.code, chassis: i.chassis })));
       }

       return {
         ...group,
         items: sorted,
       };
       });
       }, [customModules, deletedModules]);

  const customWallTypes = React.useMemo(() => customWalls
     .filter(w => !deletedWalls.some(d => d.wallCode === w.code))
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
    if (selectedWall || selectedModule) setOpenGroup("walls");
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
          if (face === "Z" && selectedWall.y === mod.y && selectedWall.x === mod.x + 1) {
            attachedMod = mod; break;
          }
          if (face === "X" && selectedWall.y === mod.y && selectedWall.x === mod.x + mod.w - 1) {
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
     // Connection modules: filter by width and Connection variant
     filtered = allWalls.filter(w => {
       const matchesWidth = Math.abs(w.width - faceWidthM) < 0.05;
       const matchesVariant = !w.variants || w.variants.length === 0 || w.variants.includes("Connection");
       return matchesWidth && matchesVariant;
     });
    } else if (isEnd) {
     // End modules: show walls matching width or 4.8m
     filtered = allWalls.filter(w => {
       const matchesWidth = Math.abs(w.width - faceWidthM) < 0.05;
       const matches4P8m = Math.abs(w.width - 4.8) < 0.05;
       return matchesWidth || matches4P8m;
     });
    } else if (!isConnection && !isDeck && (face === "W" || face === "Y")) {
     // Regular modules on long faces: show all walls that match width
     filtered = allWalls.filter(w => Math.abs(w.width - faceWidthM) < 0.05);
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
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Modules</p>

      {dynamicPanelGroups.map((group) => {
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
              <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                {group.items.map((item) => {
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
                   return (
                     <div
                       key={item.code}
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
                       <div className="shrink-0 bg-white overflow-hidden relative flex items-center justify-center border border-gray-200" style={{ height: "76px" }}>
                         {floorPlanImages[mod.type] || floorPlanImages[item.originalCode] ? (
                           <img src={floorPlanImages[mod.type] || floorPlanImages[item.originalCode]} alt={item.name} className="w-auto h-full object-contain" />
                         ) : (
                           <FloorPlanSVG code={item.code} className="h-full w-auto" />
                         )}
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-medium text-gray-700 leading-tight">{item.name}</p>
                         {item.description && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.description}</p>}
                         <p className="text-[10px] font-mono text-[#F15A22] mt-0.5 truncate" title={item.mpCode}>{item.mpCode}</p>
                         <p className="text-[10px] text-gray-400">{item.width}×{item.depth}m · {item.sqm}m²</p>
                       </div>
                     </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Walls section */}
      {customWallTypes.length > 0 && (
        <div className="border border-gray-200 bg-white overflow-hidden mt-1">
          <button
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
            onClick={() => setOpenGroup(openGroup === "walls" ? null : "walls")}
          >
            <span className="flex items-center justify-center w-5 h-5 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="2" width="18" height="18">
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth="3"/>
              </svg>
            </span>
            <span className="flex-1 text-sm font-semibold text-gray-800">
              Walls {(selectedModule || selectedWall) && <span className="text-[10px] font-normal text-[#F15A22]">· for selected plan</span>}
            </span>
            <span className="text-gray-400 shrink-0">
              {openGroup === "walls" ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </button>

          {openGroup === "walls" && (
            <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
              {filterReason && (
                <div className="px-3 py-1.5 bg-orange-50 border-b border-orange-100">
                  <p className="text-[10px] text-[#F15A22]">{filterReason}</p>
                </div>
              )}
              {compatibleWalls.length === 0 && (
                <div className="px-3 py-3 text-center text-[11px] text-gray-400">
                  No compatible walls for this chassis.
                </div>
              )}
              {compatibleWalls.map((wall) => (
                <div
                  key={wall.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "copy";
                    e.dataTransfer.setData("wallType", wall.type);
                    onDragStart(e, wall);
                  }}
                  onDragEnd={onDragEnd}
                  onMouseEnter={() => setHoveredWall({ ...wall, elevationImage: wallImages[wall.type] })}
                  onMouseLeave={() => setHoveredWall(null)}
                  className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="shrink-0 bg-gray-50 flex items-center justify-center relative border border-gray-200" style={{ height: "76px" }}>
                    {wallImages[wall.type] ? (
                      <img src={wallImages[wall.type]} alt={wall.label} className="w-auto h-full object-contain" />
                    ) : (
                      <div
                        style={{
                          width: wall.orientation === "horizontal" ? "90%" : "6px",
                          height: wall.orientation === "vertical" ? "90%" : "6px",
                          backgroundColor: "#4B5563",
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 leading-tight">{wall.label}</p>
                    <p className="text-[10px] font-mono text-[#F15A22] mt-0.5 truncate" title={wall.mpCode}>{wall.mpCode}</p>
                    {wall.description && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{wall.description}</p>}
                    <p className="text-[10px] text-gray-400">{wall.width.toFixed ? wall.width.toFixed(1) : wall.width}m wide</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">Expand a category, then drag →</p>

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
              <img src={hoveredModule.floorPlanImage} alt={hoveredModule.label} className="w-auto h-auto max-w-[312px] max-h-[392px] object-contain" style={{ transform: `rotate(${hoveredModule.rotation || 0}deg) ${hoveredModule.flipped ? 'scaleX(-1)' : ''}` }} />
            ) : (
              <FloorPlanSVG code={hoveredModule.type} className="w-full h-full" />
            )}
          </div>
        </div>
      )}


    </div>
  );
}