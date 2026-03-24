import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const FURNITURE_ITEMS = [
  { id: "bed", label: "Bed", icon: "🛏️", width: 1.4, depth: 2.0 },
  { id: "sofa", label: "Sofa", icon: "🛋️", width: 2.5, depth: 1.0 },
  { id: "table", label: "Table", icon: "🪑", width: 1.2, depth: 1.2 },
  { id: "chair", label: "Chair", icon: "🪑", width: 0.8, depth: 0.8 },
  { id: "desk", label: "Desk", icon: "🖥️", width: 1.5, depth: 0.8 },
];

export default function FurniturePanel({ onDragStart, onDragEnd }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-gray-200 bg-white overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center justify-center w-5 h-5 shrink-0 text-lg">
          🪑
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
              className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-orange-50 border border-gray-200 rounded transition-colors text-sm"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}