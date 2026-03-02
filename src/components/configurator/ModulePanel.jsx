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

const PANEL_GROUPS = [
  {
    key: "general",
    label: "General",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 12000,
    items: [
      { code: "006",   name: "Open 0.6m",            width: 0.6, depth: 4.8, sqm: 2.9  },
      { code: "007",   name: "Open 1.2m",            width: 1.2, depth: 4.8, sqm: 5.8  },
      { code: "008",   name: "Open 1.8m",            width: 1.8, depth: 4.8, sqm: 8.6  },
      { code: "009",   name: "Open 2.4m",            width: 2.4, depth: 4.8, sqm: 11.5 },
      { code: "010",   name: "Open 3.0m",            width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "001",   name: "End Cap 0.6m",         width: 0.6, depth: 4.8, sqm: 2.9  },
      { code: "002",   name: "End Cap 1.2m",         width: 1.2, depth: 4.8, sqm: 5.8  },
      { code: "003",   name: "End Cap 1.8m",         width: 1.8, depth: 4.8, sqm: 8.6  },
      { code: "004",   name: "End Cap 2.4m",         width: 2.4, depth: 4.8, sqm: 11.5 },
      { code: "005",   name: "End Cap 3.0m",         width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "011-1", name: "Door — Top Left",      width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "011-2", name: "Door — Top Right",     width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "011-3", name: "Door — Bottom Left",   width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "011-4", name: "Door — Bottom Right",  width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "012-1", name: "Double Door — Left",   width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "012-3", name: "Double Door — Right",  width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "050-1", name: "L-Corner Left",        width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "050-2", name: "L-Corner Right",       width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "050-3", name: "L-Corner Mirror Left", width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "050-4", name: "L-Corner Mirror Right",width: 3.0, depth: 4.8, sqm: 14.4 },
    ],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 22000,
    items: [
      { code: "005-K30", name: "End — U-Shape",         width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "005-K31", name: "End — Galley",          width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "012-K01", name: "Standard — Single Run", width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "012-K02", name: "Standard — Double Run", width: 3.0, depth: 4.8, sqm: 14.4 },
    ],
  },
  {
    key: "bathroom",
    label: "Bathroom",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 14000,
    items: [
      { code: "401-B10", name: "Bathroom (B10)",        width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "412-B03", name: "Compact (B03)",         width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "423-B40", name: "Large (B40)",           width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "402-B30", name: "Ensuite + WIR Standard",width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "421-B30", name: "Ensuite + WIR End",     width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "422-B30", name: "Ensuite + WIR Passage", width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "420-B01", name: "Bathroom End (B01)",    width: 3.0, depth: 4.8, sqm: 14.4 },
    ],
  },
  {
    key: "combined",
    label: "Combined Wet Areas",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 28000,
    items: [
      { code: "401-B10-K10",      name: "Bathroom + Kitchen (K10)",       width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "401-B10-K11",      name: "Bathroom + Kitchen (K11)",       width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "413-K31-B30-L02",  name: "Kitchen + Bath + Laundry",       width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "410-T01-B20-L01",  name: "Toilet + Bath + Laundry",        width: 3.0, depth: 4.8, sqm: 14.4 },
      { code: "411-T01-B20-L01",  name: "Toilet + Bath + Laundry Narrow", width: 3.0, depth: 4.8, sqm: 14.4 },
    ],
  },
  {
    key: "deck",
    label: "Deck & Soffit",
    color: "#FDF0EB",
    border: "#F15A22",
    price: 8000,
    items: [
      { code: "SO06", name: "Soffit Only", width: 0.6, depth: 4.8, sqm: 2.9  },
      { code: "DK12", name: "Deck 1.2m",  width: 1.2, depth: 4.8, sqm: 5.8  },
      { code: "DK18", name: "Deck 1.8m",  width: 1.8, depth: 4.8, sqm: 8.6  },
      { code: "DK24", name: "Deck 2.4m",  width: 2.4, depth: 4.8, sqm: 11.5 },
      { code: "DK30", name: "Deck 3.0m",  width: 3.0, depth: 4.8, sqm: 14.4 },
    ],
  },
];

// All module types flat list — used by ConfigGrid for drop resolution
const MODULE_TYPES = PANEL_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    type: item.code,
    label: item.name,
    color: group.color,
    border: group.border,
    w: 1,
    h: 1,
    sqm: item.sqm,
    price: group.price,
    groupKey: group.key,
  }))
);

// Icon lookup by groupKey — used by ConfigGrid & DesignSummary
const GROUP_ICONS = Object.fromEntries(
  PANEL_GROUPS.map((g) => [g.key, getIcon(g.key, 20)])
);

export { MODULE_TYPES, GROUP_ICONS };

export default function ModulePanel({ onDragStart }) {
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <div className="flex flex-col gap-1">
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
              <div className="border-t border-gray-100">
                {group.items.map((item) => {
                  const mod = MODULE_TYPES.find((m) => m.type === item.code);
                  return (
                    <div
                      key={item.code}
                      draggable
                      onDragStart={(e) => onDragStart(e, mod)}
                      className="flex flex-col px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-700 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.code} · {item.width}×{item.depth}m · {item.sqm}m²</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-gray-400 mt-3 text-center">Expand a category, then drag →</p>
    </div>
  );
}