import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import FloorPlanSVG from "./FloorPlanSVG.jsx";

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

// MP48 code builder: MP48-{chassis}{width}-{framingRef}-{orientation}
// chassis: SF=Standard Flat, EF=End Flat, SR=Standard Raking, ER=End Raking, DK=Deck, SO=Soffit
// width:   06=0.6m 12=1.2m 18=1.8m 24=2.4m 30=3.0m
// room:    G=General B=Bathroom R=Bedroom K=Kitchen L=Laundry T=Toilet S=Storage
// orientation: 1=standard 2=rotated 3=flipped 4=flipped+rotated
const mp48 = (chassis, widthCode, framingRef, orientation = 1) =>
  `MP48-${chassis}${widthCode}-${framingRef}-${orientation}`;

const PANEL_GROUPS = [
  {
    key: "general",
    label: "General",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [
      { code: "006",   name: "Open 0.6m",            mpCode: mp48("SF","06","G00"),   width: 0.6, depth: 4.8, sqm: 2.9,  chassis: "SF", widthCode: "06", room: "G" },
      { code: "007",   name: "Open 1.2m",            mpCode: mp48("SF","12","G00"),   width: 1.2, depth: 4.8, sqm: 5.8,  chassis: "SF", widthCode: "12", room: "G" },
      { code: "008",   name: "Open 1.8m",            mpCode: mp48("SF","18","G00"),   width: 1.8, depth: 4.8, sqm: 8.6,  chassis: "SF", widthCode: "18", room: "G" },
      { code: "009",   name: "Open 2.4m",            mpCode: mp48("SF","24","G00"),   width: 2.4, depth: 4.8, sqm: 11.5, chassis: "SF", widthCode: "24", room: "G" },
      { code: "010",   name: "Open 3.0m",            mpCode: mp48("SF","30","G00"),   width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G" },
      { code: "001",   name: "End Cap 0.6m",         mpCode: mp48("EF","06","G00"),   width: 0.6, depth: 4.8, sqm: 2.9,  chassis: "EF", widthCode: "06", room: "G" },
      { code: "002",   name: "End Cap 1.2m",         mpCode: mp48("EF","12","G00"),   width: 1.2, depth: 4.8, sqm: 5.8,  chassis: "EF", widthCode: "12", room: "G" },
      { code: "003",   name: "End Cap 1.8m",         mpCode: mp48("EF","18","G00"),   width: 1.8, depth: 4.8, sqm: 8.6,  chassis: "EF", widthCode: "18", room: "G" },
      { code: "004",   name: "End Cap 2.4m",         mpCode: mp48("EF","24","G00"),   width: 2.4, depth: 4.8, sqm: 11.5, chassis: "EF", widthCode: "24", room: "G" },
      { code: "005",   name: "End Cap 3.0m",         mpCode: mp48("EF","30","G00"),   width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "G" },
      { code: "011-1", name: "Door — Top Left",      mpCode: mp48("SF","30","G11",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 1 },
      { code: "011-2", name: "Door — Top Right",     mpCode: mp48("SF","30","G11",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 2 },
      { code: "011-3", name: "Door — Bottom Left",   mpCode: mp48("SF","30","G11",3), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 3 },
      { code: "011-4", name: "Door — Bottom Right",  mpCode: mp48("SF","30","G11",4), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 4 },
      { code: "012-1", name: "Double Door — Left",   mpCode: mp48("SF","30","G12",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 1 },
      { code: "012-3", name: "Double Door — Right",  mpCode: mp48("SF","30","G12",3), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 3 },
      { code: "050-1", name: "L-Corner Left",        mpCode: mp48("SF","30","G50",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 1 },
      { code: "050-2", name: "L-Corner Right",       mpCode: mp48("SF","30","G50",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 2 },
      { code: "050-3", name: "L-Corner Mirror Left", mpCode: mp48("SF","30","G50",3), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 3 },
      { code: "050-4", name: "L-Corner Mirror Right",mpCode: mp48("SF","30","G50",4), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "G", orientation: 4 },
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
    ],
  },
  {
    key: "bathroom",
    label: "Bathroom",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 14000,
    items: [
      { code: "401-B10", name: "Bathroom (B10)",         mpCode: mp48("SF","30","B10",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "412-B03", name: "Compact (B03)",          mpCode: mp48("SF","30","B03",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "423-B40", name: "Large (B40)",            mpCode: mp48("SF","30","B40",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "402-B30", name: "Ensuite + WIR Standard", mpCode: mp48("SF","30","B30",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 1 },
      { code: "421-B30", name: "Ensuite + WIR End",      mpCode: mp48("EF","30","B30",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "B", orientation: 1 },
      { code: "422-B30", name: "Ensuite + WIR Passage",  mpCode: mp48("SF","30","B30",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B", orientation: 2 },
      { code: "420-B01", name: "Bathroom End (B01)",     mpCode: mp48("EF","30","B01",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "EF", widthCode: "30", room: "B", orientation: 1 },
    ],
  },
  {
    key: "combined",
    label: "Combined Wet Areas",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 28000,
    items: [
      { code: "401-B10-K10",     name: "Bathroom + Kitchen (K10)",       mpCode: mp48("SF","30","B10",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B" },
      { code: "401-B10-K11",     name: "Bathroom + Kitchen (K11)",       mpCode: mp48("SF","30","B10",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "B" },
      { code: "413-K31-B30-L02", name: "Kitchen + Bath + Laundry",       mpCode: mp48("SF","30","K31",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "K" },
      { code: "410-T01-B20-L01", name: "Toilet + Bath + Laundry",        mpCode: mp48("SF","30","T01",1), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "T" },
      { code: "411-T01-B20-L01", name: "Toilet + Bath + Laundry Narrow", mpCode: mp48("SF","30","T01",2), width: 3.0, depth: 4.8, sqm: 14.4, chassis: "SF", widthCode: "30", room: "T" },
    ],
  },
  {
    key: "deck",
    label: "Deck & Soffit",
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

// All module types flat list — used by ConfigGrid for drop resolution
// Convert metres to 600mm grid cells
const mToCells = (m) => Math.round(m / 0.6);

const MODULE_TYPES = PANEL_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    type: item.code,
    label: item.name,
    color: group.color,
    border: group.border,
    w: mToCells(item.width),   // e.g. 3.0m → 5 cells
    h: mToCells(item.depth),   // e.g. 4.8m → 8 cells
    sqm: item.sqm,
    price: group.price,
    groupKey: group.key,
  }))
);

// Icon lookup by groupKey — used by ConfigGrid & DesignSummary
const GROUP_ICONS = Object.fromEntries(
  PANEL_GROUPS.map((g) => [g.key, getIcon(g.key, 20)])
);

const WALL_TYPES = [
  { type: "wall-h", label: "Horizontal Wall (185mm)", orientation: "horizontal", length: 8, thickness: 0.31 },
  { type: "wall-v", label: "Vertical Wall (185mm)", orientation: "vertical", length: 8, thickness: 0.31 },
];

export { MODULE_TYPES, GROUP_ICONS, WALL_TYPES };

export default function ModulePanel({ onDragStart, onDragEnd }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [hoveredModule, setHoveredModule] = useState(null);

  return (
    <div className="flex flex-col gap-1 relative">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Modules</p>

      {PANEL_GROUPS.map((group) => {
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
                  const mod = MODULE_TYPES.find((m) => m.type === item.code);
                  return (
                    <div
                      key={item.code}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "copy";
                        onDragStart(e, mod);
                      }}
                      onDragEnd={onDragEnd}
                      onMouseEnter={() => setHoveredModule(mod)}
                      onMouseLeave={() => setHoveredModule(null)}
                      className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="shrink-0 w-10 h-16 border border-gray-200 bg-white overflow-hidden">
                        <FloorPlanSVG code={item.code} className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 leading-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.code}</p>
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
          <span className="flex-1 text-sm font-semibold text-gray-800">Walls</span>
          <span className="text-gray-400 shrink-0">
            {openGroup === "walls" ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>

        {openGroup === "walls" && (
          <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
            {WALL_TYPES.map((wall) => (
              <div
                key={wall.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "copy";
                  e.dataTransfer.setData("wallType", wall.type);
                  onDragStart(e, wall);
                }}
                onDragEnd={onDragEnd}
                className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="shrink-0 w-10 h-8 border border-gray-200 bg-white flex items-center justify-center">
                  <div 
                    style={{
                      width: wall.orientation === "horizontal" ? "90%" : `${wall.thickness * 2}px`,
                      height: wall.orientation === "vertical" ? "90%" : `${wall.thickness * 2}px`,
                      backgroundColor: "#4B5563",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 leading-tight">{wall.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Thickness: {wall.thickness}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">Expand a category, then drag →</p>

      {/* Magnified preview on hover */}
      {hoveredModule && (
        <div
          className="fixed z-[100] bg-white border-2 border-[#F15A22] shadow-xl rounded pointer-events-none"
          style={{
            width: "240px",
            height: "240px",
            top: "48px",
            right: "20px",
            padding: "8px",
          }}
        >
          <div className="w-full h-full bg-gray-50 border border-gray-200 rounded overflow-hidden">
            <FloorPlanSVG code={hoveredModule.type} className="w-full h-full" />
          </div>
          <p className="text-xs font-semibold text-gray-700 text-center mt-2">
            {hoveredModule.label}
          </p>
        </div>
      )}
    </div>
  );
}