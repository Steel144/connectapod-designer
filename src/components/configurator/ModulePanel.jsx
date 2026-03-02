import React from "react";

const MODULE_TYPES = [
  { type: "living", label: "Living Room", icon: "🛋️", color: "#E8F4FD", border: "#93C5FD", w: 2, h: 2, sqm: 25, price: 18000 },
  { type: "bedroom", label: "Bedroom", icon: "🛏️", color: "#F0FDF4", border: "#86EFAC", w: 2, h: 2, sqm: 18, price: 15000 },
  { type: "kitchen", label: "Kitchen", icon: "🍳", color: "#FFF7ED", border: "#FCA5A5", w: 2, h: 1, sqm: 12, price: 22000 },
  { type: "bathroom", label: "Bathroom", icon: "🚿", color: "#F5F3FF", border: "#C4B5FD", w: 1, h: 1, sqm: 8, price: 14000 },
  { type: "office", label: "Home Office", icon: "💻", color: "#FFF1F2", border: "#FDA4AF", w: 1, h: 2, sqm: 12, price: 12000 },
  { type: "garage", label: "Garage", icon: "🚗", color: "#F8FAFC", border: "#94A3B8", w: 2, h: 2, sqm: 20, price: 16000 },
  { type: "studio", label: "Studio", icon: "🎨", color: "#FEFCE8", border: "#FDE047", w: 1, h: 1, sqm: 10, price: 10000 },
  { type: "laundry", label: "Laundry", icon: "🧺", color: "#F0F9FF", border: "#7DD3FC", w: 1, h: 1, sqm: 6, price: 8000 },
];

export { MODULE_TYPES };

export default function ModulePanel({ onDragStart }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Modules</p>
      {MODULE_TYPES.map((mod) => (
        <div
          key={mod.type}
          draggable
          onDragStart={(e) => onDragStart(e, mod)}
          className="flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing border transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ backgroundColor: mod.color, borderColor: mod.border, borderWidth: 1.5 }}
        >
          <span className="text-xl">{mod.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 leading-tight">{mod.label}</p>
            <p className="text-xs text-slate-400">{mod.sqm} m² · ${(mod.price / 1000).toFixed(0)}k</p>
          </div>
          <div className="text-xs text-slate-300 font-mono">{mod.w}×{mod.h}</div>
        </div>
      ))}
      <p className="text-xs text-slate-400 mt-3 text-center">Drag modules onto the grid →</p>
    </div>
  );
}