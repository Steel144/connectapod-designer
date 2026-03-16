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
    deck: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>
        <path d="M6 3v18"/><path d="M18 3v18"/>
      </svg>
    ),
  };
  return icons[key] || icons.general;
}

// MP48 code builder
const mp48 = (chassis, widthCode, framingRef, orientation = 1) =>
  `MP48-${chassis}${widthCode}-${framingRef}-${orientation}`;

const PANEL_GROUPS = [
  {
    key: "living",
    label: "Living",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [
      { code: "006",   name: "Open 0.6m",            mpCode: mp48("SF","06","G00"),   width: 0.6, depth: 4.8, sqm: 2.9,  chassis: "SF", widthCode: "06", room: "G", description: "Living, Bedroom" },
      { code: "007",   name: "Open 1.2m",            mpCode: mp48("SF","12","G00"),   width: 1.2, depth: 4.8, sqm: 5.8,  chassis: "SF", widthCode: "12", room: "G", description: "Living, Bedroom" },
      { code: "008",   name: "Open 1.8m",            mpCode: mp48("SF","18","G00"),   width: 1.8, depth: 4.8, sqm: 8.6,  chassis: "SF", widthCode: "18", room: "G", description: "Living, Bedroom" },
      { code: "009",   name: "Open 2.4m",            mpCode: mp48("SF","24","G00"),   width: 2.4, depth: 4.8, sqm: 11.5, chassis: "SF", widthCode: "24", room: "G", description: "Living, Bedroom" },
      { code: "010",   name: "Open 3.0m",            mpCode: mp48("SF","30","G00"),   width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", description: "Living, Bedroom" },
    ],
  },
  {
    key: "bedroom",
    label: "Bedroom",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [
      { code: "001",   name: "End Cap 0.6m",         mpCode: mp48("EF","06","G00"),   width: 0.6, depth: 4.8, sqm: 2.9,  chassis: "EF", widthCode: "06", room: "G" },
      { code: "002",   name: "End Cap 1.2m",         mpCode: mp48("EF","12","G00"),   width: 1.2, depth: 4.8, sqm: 5.8,  chassis: "EF", widthCode: "12", room: "G" },
      { code: "003",   name: "End Cap 1.8m",         mpCode: mp48("EF","18","G00"),   width: 1.8, depth: 4.8, sqm: 8.6,  chassis: "EF", widthCode: "18", room: "G" },
      { code: "004",   name: "End Cap 2.4m",         mpCode: mp48("EF","24","G00"),   width: 2.4, depth: 4.8, sqm: 11.5, chassis: "EF", widthCode: "24", room: "G" },
      { code: "005",   name: "End Cap 3.0m",         mpCode: mp48("EF","30","G00"),   width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "G" },
      { code: "402-B30", name: "Ensuite + WIR Standard", mpCode: mp48("SF","30","B30",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "421-B30", name: "Ensuite + WIR End",      mpCode: mp48("EF","30","B30",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "B", orientation: 1 },
      { code: "422-B30", name: "Ensuite + WIR Passage",  mpCode: mp48("SF","30","B30",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 2 },
    ],
  },
  {
    key: "bathroom",
    label: "Bathroom",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 14000,
    items: [
      { code: "011-1", name: "Door — Top Left",      mpCode: mp48("SF","30","G11",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 1 },
      { code: "011-2", name: "Door — Top Right",     mpCode: mp48("SF","30","G11",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 2 },
      { code: "011-3", name: "Door — Bottom Left",   mpCode: mp48("SF","30","G11",3), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 3 },
      { code: "011-4", name: "Door — Bottom Right",  mpCode: mp48("SF","30","G11",4), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 4 },
      { code: "401-B10", name: "Bathroom (B10)",         mpCode: mp48("SF","30","B10",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "412-B03", name: "Compact (B03)",          mpCode: mp48("SF","30","B03",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "423-B40", name: "Large (B40)",            mpCode: mp48("SF","30","B40",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "420-B01", name: "Bathroom End (B01)",     mpCode: mp48("EF","30","B01",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "B", orientation: 1 },
    ],
  },
  {
    key: "laundry",
    label: "Laundry",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [
      { code: "050-1", name: "L-Corner 1",        mpCode: mp48("SF","30","G50",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 1 },
      { code: "050-2", name: "L-Corner 2",       mpCode: mp48("SF","30","G50",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 2 },
      { code: "050-3", name: "L-Corner 3", mpCode: mp48("SF","30","G50",3), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 3 },
      { code: "050-4", name: "L-Corner 4",mpCode: mp48("SF","30","G50",4), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 4 },
    ],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 22000,
    items: [
      { code: "005-K30", name: "End — U-Shape",         mpCode: mp48("EF","30","K30",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "K", orientation: 1 },
      { code: "005-K31", name: "End — Galley",          mpCode: mp48("EF","30","K31",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "K", orientation: 1 },
      { code: "012-K01", name: "Standard — Single Run", mpCode: mp48("SF","30","K01",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "K", orientation: 1 },
      { code: "012-K02", name: "Standard — Double Run", mpCode: mp48("SF","30","K02",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "K", orientation: 1 },
      { code: "401-B10-K10",     name: "Bathroom + Kitchen (K10)",       mpCode: mp48("SF","30","B10",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B" },
      { code: "401-B10-K11",     name: "Bathroom + Kitchen (K11)",       mpCode: mp48("SF","30","B10",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B" },
      { code: "413-K31-B30-L02", name: "Kitchen + Bath + Laundry",       mpCode: mp48("SF","30","K31",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "K" },
    ],
  },
  {
    key: "deck",
    label: "Deck",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 8000,
    items: [
      { code: "SO06", name: "Soffit Only", mpCode: mp48("SO","06","G00"), width: 0.6, depth: 4.8, sqm: 2.9,  chassis: "SO", widthCode: "06", room: "G" },
      { code: "DK12", name: "Deck 1.2m",  mpCode: mp48("DK","12","G00"), width: 1.2, depth: 4.8, sqm: 5.8,  chassis: "DK", widthCode: "12", room: "G" },
      { code: "DK18", name: "Deck 1.8m",  mpCode: mp48("DK","18","G00"), width: 1.8, depth: 4.8, sqm: 8.6,  chassis: "DK", widthCode: "18", room: "G" },
      { code: "DK24", name: "Deck 2.4m",  mpCode: mp48("DK","24","G00"), width: 2.4, depth: 4.8, sqm: 11.5, chassis: "DK", widthCode: "24", room: "G" },
      { code: "DK30", name: "Deck 3.0m",  mpCode: mp48("DK","30","G00"), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "DK", widthCode: "30", room: "G" },
    ],
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
  const dynamicPanelGroups = useMemo(() => {
    const deletedCodes = new Set(deletedModules.map(d => d.moduleCode));
    const categoryAbbreviations = {
      "Living": ["LV", "living"],
      "Bedroom": ["B0", "B1", "B2", "B3", "B4", "bedroom"],
      "Bathroom": ["W", "bathroom"],
      "Kitchen": ["K", "kitchen"],
      "Laundry": ["L", "laundry"],
      "Deck": ["DK", "D", "deck"],
      "Soffit": ["SO", "soffit"],
    };
    
    return PANEL_GROUPS.map(group => {
      const categoryModules = customModules.filter(m => {
        if (deletedCodes.has(m.code)) return false;
        const descriptions = (m.description || "").split(",").map(s => s.trim()).filter(Boolean);
        return descriptions.includes(group.label) || m.category === group.label;
      });
      
      const customItems = categoryModules.map(m => {
        const variantStr = (m.variants || []).join(",").toLowerCase();
        const isEnd = variantStr.includes("end");
        return {
          code: m.code,
          name: m.name,
          mpCode: m.code,
          width: m.width || 3.0,
          depth: m.depth || 4.8,
          sqm: m.sqm || parseFloat(((m.width || 3.0) * (m.depth || 4.8)).toFixed(1)),
          description: m.description || "",
          chassis: isEnd ? "LF" : "SF",
          widthCode: "30",
          room: "G",
          originalCode: m.originalCode || undefined,
        };
      });
      
      const sorted = customItems.sort((a, b) => {
        const aIsEnd = a.chassis === "EF" || a.chassis === "ER" || a.chassis === "LF" || a.chassis === "RF";
        const bIsEnd = b.chassis === "EF" || b.chassis === "ER" || b.chassis === "LF" || b.chassis === "RF";
        const aIsDeck = a.description?.includes("Deck") || a.description?.includes("Soffit");
        const bIsDeck = b.description?.includes("Deck") || b.description?.includes("Soffit");
        
        if (aIsEnd !== bIsEnd) return aIsEnd ? -1 : 1;
        if (aIsDeck !== bIsDeck) return aIsDeck ? 1 : -1;
        return a.width - b.width;
      });
      
      return {
        ...group,
        items: sorted,
      };
    });
  }, [customModules, deletedModules]);

  const customWallTypes = customWalls
    .filter(w => !deletedWalls.some(d => d.wallCode === w.code))
    .map(w => {
      const codeMatch = w.code && w.code.match(/^(WY|ZX)(\d{2})-/);
      const parsedOrientation = codeMatch ? (codeMatch[1] === "ZX" ? "vertical" : "horizontal") : "horizontal";
      const parsedWidthM = codeMatch ? parseInt(codeMatch[2], 10) / 10 : (w.width ? w.width / 1000 : 3.0);
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

  // Notify parent of available wall types so ConfigGrid can resolve drops
  React.useEffect(() => {
    if (onWallTypesLoaded) onWallTypesLoaded(customWallTypes);
  }, [customWalls, deletedWalls]);

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
      const resolved = MODULE_TYPES.find(m => m.type === attachedMod.type);
      chassis = chassis || resolved?.chassis || "SF";
      modWidthM = modWidthM || (attachedMod.w ? attachedMod.w * CELL_M : resolved?.w * CELL_M) || 3.0;
    } else {
      modWidthM = modWidthM || (attachedMod.w * CELL_M);
    }
    modWidthM = attachedMod.w ? attachedMod.w * CELL_M : modWidthM;

    const isDeck = chassis === "DK" || chassis === "SO";
    const isEnd = chassis === "EF" || chassis === "LF" || chassis === "RF" || chassis === "ER";
    const isLongFace = face === "W" || face === "Y";

    const faceWidthM = isLongFace ? modWidthM : attachedMod.h * CELL_M;

    if (!isLongFace && !isEnd) {
      return { compatibleWalls: [], filterReason: `Face ${face} only on End chassis (module is ${chassis})` };
    }

    let filtered = allWalls;

    let variantFilter = null;
    if (isDeck) {
      variantFilter = "Deck";
    } else if (isEnd && !isLongFace) {
      variantFilter = "End";
    } else if (!isDeck && !isEnd) {
      variantFilter = "Standard";
    }

    if (!isLongFace) {
      filtered = filtered.filter(w => {
        const matchesType = w.orientation === "vertical" && Math.abs(w.width - faceWidthM) < 0.05;
        const matchesVariant = !variantFilter || !w.variants || w.variants.length === 0 || w.variants.includes(variantFilter);
        return matchesType && matchesVariant;
      });
    } else if (isDeck) {
      filtered = filtered.filter(w => {
        const matchesWidth = Math.abs(w.width - faceWidthM) < 0.05;
        const matchesVariant = !w.variants || w.variants.length === 0 || w.variants.includes("Deck");
        return w.orientation === "horizontal" && matchesWidth && matchesVariant;
      });
    } else {
      filtered = filtered.filter(w => {
        const isCompatible = w.orientation === "horizontal" && Math.abs(w.width - faceWidthM) < 0.05;
        const matchesVariant = !w.variants || w.variants.length === 0 || w.variants.includes("Standard");
        return isCompatible && matchesVariant;
      });

      if (isEnd) {
        const endWalls = allWalls.filter(w =>
          w.orientation === "vertical" &&
          Math.abs(w.width - 4.8) < 0.05 &&
          (!w.variants || w.variants.length === 0 || w.variants.includes("End"))
        );
        filtered = [...filtered, ...endWalls];
        filtered = Array.from(new Map(filtered.map(w => [w.type, w])).values());
      }
    }

    const context = selectedWall ? `Face ${face}` : `${chassis} module`;
    const reason = `${context} · ${faceWidthM.toFixed(1)}m wide · ${filtered.length} wall${filtered.length !== 1 ? "s" : ""}`;
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
                         onDragStart(e, mod);
                       }}
                       onDragEnd={onDragEnd}
                       onMouseEnter={() => setHoveredModule({ ...mod, floorPlanImage: floorPlanImages[mod.type] })}
                       onMouseLeave={() => setHoveredModule(null)}
                       className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                     >
                       <div className="shrink-0 w-10 h-16 border border-gray-200 bg-white overflow-hidden relative">
                         {floorPlanImages[mod.type] || floorPlanImages[item.originalCode] ? (
                           <img src={floorPlanImages[mod.type] || floorPlanImages[item.originalCode]} alt={item.name} className="w-full h-full object-contain" />
                         ) : (
                           <FloorPlanSVG code={item.code} className="w-full h-full" />
                         )}
                         {(floorPlanImages[mod.type] || floorPlanImages[item.originalCode]) && (
                           <div className="absolute top-0 right-0 bg-[#F15A22] rounded-full p-0.5">
                             <ImageIcon size={8} className="text-white" />
                           </div>
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
                  <div className="shrink-0 w-10 h-16 border border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {wallImages[wall.type] ? (
                      <img src={wallImages[wall.type]} alt={wall.label} className="w-full h-full object-contain" />
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

      {/* Floor plan image upload for selected module */}
      {selectedModule && (
        <FloorPlanUpload 
          module={selectedModule} 
          onImageAssigned={(imageUrl) => {
            onModuleImageUpdate?.(selectedModule.id, imageUrl);
          }}
        />
      )}

      {/* Wall image upload for selected wall */}
      {selectedWall && (
        <WallImageUpload 
          wall={selectedWall} 
          onImageAssigned={(imageUrl) => {
            onWallImageUpdate?.(selectedWall.id, imageUrl);
          }}
        />
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
            width: "210px",
            height: "330px",
            top: "48px",
            right: "20px",
            padding: "4px",
          }}
        >
          <div className="flex-1 bg-gray-50 rounded overflow-hidden">
            {hoveredModule.floorPlanImage ? (
              <img src={hoveredModule.floorPlanImage} alt={hoveredModule.label} className="w-full h-full object-contain" />
            ) : (
              <FloorPlanSVG code={hoveredModule.type} className="w-full h-full" />
            )}
          </div>
        </div>
      )}

      {/* Magnified preview on hover — walls */}
      {hoveredWall?.elevationImage && (
        <div
          className="fixed z-[100] bg-white border-2 border-[#F15A22] shadow-xl rounded pointer-events-none"
          style={{
            maxWidth: "320px",
            maxHeight: "400px",
            top: "48px",
            right: "20px",
            padding: "4px",
          }}
        >
          <img 
            src={hoveredWall.elevationImage} 
            alt={hoveredWall.label} 
            className="w-auto h-auto max-w-[312px] max-h-[392px] object-contain" 
          />
        </div>
      )}
    </div>
  );
}