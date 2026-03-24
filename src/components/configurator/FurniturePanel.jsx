import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const FURNITURE_ITEMS = [
  { id: "bed", label: "Bed", width: 1.6, depth: 1.8 },
  { id: "sofa", label: "Sofa", width: 2.5, depth: 1.0 },
  { id: "table", label: "Table", width: 0.614, depth: 0.614 },
  { id: "chair", label: "Chair", width: 0.8, depth: 0.8 },
  { id: "desk", label: "Desk", width: 1.5, depth: 0.8 },
];

function getFurnitureIcon(id, size = 18) {
  const s = size;
  const icons = {
    bed: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M4 10h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z"/><line x1="4" y1="10" x2="20" y2="10"/>
        <rect x="4" y="6" width="16" height="4" rx="1"/>
      </svg>
    ),
    sofa: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M2 12h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/><line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="6" y1="12" x2="6" y2="18"/><line x1="18" y1="12" x2="18" y2="18"/>
      </svg>
    ),
    table: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" width={s} height={s}>
        <circle cx="12" cy="12" r="9"/>
      </svg>
    ),
    chair: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <path d="M4 8h16v4a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2V8z"/><line x1="6" y1="12" x2="6" y2="18"/>
        <line x1="18" y1="12" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="18" strokeWidth="2"/>
      </svg>
    ),
    desk: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F15A22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={s} height={s}>
        <line x1="2" y1="9" x2="22" y2="9" strokeWidth="2.5"/><line x1="6" y1="9" x2="6" y2="18"/>
        <line x1="18" y1="9" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="18" strokeWidth="2"/>
        <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
      </svg>
    ),
  };
  return icons[id] || icons.chair;
}

export default function FurniturePanel({ onDragStart, onDragEnd }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-gray-200 bg-white overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center justify-center w-5 h-5 shrink-0">
          {getFurnitureIcon("chair", 18)}
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-800">Furniture</span>
        <span className="text-gray-400 shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 max-h-48 overflow-y-auto p-2 space-y-1">
          {FURNITURE_ITEMS.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData("furnitureType", item.id);
                onDragStart?.(e, item);
              }}
              onDragEnd={onDragEnd}
              className="flex items-center gap-3 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border border-gray-200 rounded transition-colors text-sm"
            >
              <span className="flex items-center justify-center w-5 h-5 shrink-0">
                {getFurnitureIcon(item.id, 16)}
              </span>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}