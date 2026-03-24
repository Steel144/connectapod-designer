import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const FURNITURE_ITEMS = [
  { id: "bed_king", label: "King Bed", width: 1.67, depth: 2.03, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/6bd723cbe_bed_king.png" },
  { id: "bed_queen", label: "Queen Bed", width: 1.6, depth: 2.0, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/482865291_bed_queen.png" },
  { id: "sofa_1", label: "1-Seater Sofa", width: 0.9, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/5534b8119_sofa_1_seater.png" },
  { id: "sofa_2", label: "2-Seater Sofa", width: 1.6, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/2d25663fc_sofa_2_seater.png" },
  { id: "sofa_3", label: "3-Seater Sofa", width: 2.5, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/50d1084f1_sofa_3_seater.png" },
  { id: "dining_4", label: "Dining Table (4-Seater)", width: 1.2, depth: 1.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/a2527031a_dining_4_seater.png" },
  { id: "couch_1", label: "2-Seater Couch", width: 2.0, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/c290e2922_couch_1.png" },
  { id: "couch_2", label: "3-Seater Couch", width: 2.8, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/b2370d879_couch_2.png" },
  { id: "couch_3", label: "2-Seater Couch Compact", width: 1.8, depth: 0.85, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/8a57ed025_couch_3.png" },
  { id: "couch_4", label: "3-Seater L-Shaped", width: 2.5, depth: 2.0, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/9c3da5784_couch_4.png" },
  { id: "couch_5", label: "U-Shaped Sectional", width: 3.0, depth: 2.5, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/7b2377810_couch_5.png" },
  { id: "couch_6", label: "Chaise Lounge", width: 2.2, depth: 1.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/f9aa6aed7_couch_6.png" },
  { id: "couch_7", label: "Curved Couch", width: 2.4, depth: 2.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/812bc0914_couch_7.png" },
  { id: "couch_8", label: "2-Seater with Coffee Table", width: 2.0, depth: 1.5, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/9854b70c0_couch_8.png" },
  { id: "couch_9", label: "Modular Sectional", width: 2.8, depth: 2.0, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/9d18dd3aa_couch_9.png" },
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
  return icons[id] || icons.sofa;
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
          {getFurnitureIcon("sofa", 18)}
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-800">Furniture</span>
        <span className="text-gray-400 shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 max-h-64 overflow-y-auto p-2 space-y-1">
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
              <div className="w-12 h-12 shrink-0 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.label} className="w-full h-full object-contain" />
                ) : (
                  getFurnitureIcon(item.id, 16)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-gray-700 font-medium text-xs leading-tight">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.width.toFixed(2)}×{item.depth.toFixed(2)}m</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}