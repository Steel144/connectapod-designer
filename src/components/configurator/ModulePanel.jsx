import React from "react";

const ICONS = {
  living: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M3 9V19h18V9"/><path d="M2 9h20"/><path d="M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
      <path d="M7 19v-5h10v5"/>
    </svg>
  ),
  bedroom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M2 9V19"/><path d="M22 9v10"/><path d="M2 14h20"/><rect x="2" y="9" width="20" height="5" rx="1"/>
      <path d="M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  kitchen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="2" y="5" width="20" height="14" rx="1"/><line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="8" y1="10" x2="8" y2="19"/><circle cx="16" cy="7.5" r="1"/>
    </svg>
  ),
  bathroom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M6 12V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  office: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="2" y="4" width="20" height="13" rx="1"/><line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  garage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M3 21V9l9-6 9 6v12"/><line x1="3" y1="13" x2="21" y2="13"/>
      <line x1="3" y1="17" x2="21" y2="17"/><line x1="9" y1="21" x2="9" y2="13"/><line x1="15" y1="21" x2="15" y2="13"/>
    </svg>
  ),
  studio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  ),
  laundry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="2" y="2" width="20" height="20" rx="1"/><circle cx="12" cy="13" r="4"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="9" y1="6" x2="9.01" y2="6"/>
    </svg>
  ),
};

const MODULE_TYPES = [
  { type: "living", label: "Living Room", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 18000 },
  { type: "bedroom", label: "Bedroom", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 15000 },
  { type: "kitchen", label: "Kitchen", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 22000 },
  { type: "bathroom", label: "Bathroom", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 14000 },
  { type: "office", label: "Home Office", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 12000 },
  { type: "garage", label: "Garage", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 16000 },
  { type: "studio", label: "Studio", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 10000 },
  { type: "laundry", label: "Laundry", color: "#FDF0EB", border: "#F15A22", w: 1, h: 1, sqm: 14.4, price: 8000 },
];

export { MODULE_TYPES };

export default function ModulePanel({ onDragStart }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Modules</p>
      {MODULE_TYPES.map((mod) => (
        <div
          key={mod.type}
          draggable
          onDragStart={(e) => onDragStart(e, mod)}
          className="flex items-center gap-3 p-3 cursor-grab active:cursor-grabbing border border-gray-200 bg-white transition-all hover:shadow-md hover:border-[#F15A22]"
        >
          <span className="text-xl">{mod.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{mod.label}</p>
            <p className="text-xs text-gray-400">3×4.8m · ${(mod.price / 1000).toFixed(0)}k</p>
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-400 mt-3 text-center">Drag modules onto the grid →</p>
    </div>
  );
}