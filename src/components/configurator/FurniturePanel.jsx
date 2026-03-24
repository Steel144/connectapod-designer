import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const FURNITURE_ITEMS = [
  { id: "bed_king", label: "King Bed", width: 1.67, depth: 2.03, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/273f5e755_bed_king_1670x2030-01.png" },
  { id: "bed_queen", label: "Queen Bed", width: 1.53, depth: 2.03, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/31a3e7315_bed_queen_1530x2030-01.png" },
  { id: "bed_single", label: "Single Bed", width: 0.92, depth: 1.88, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/15a6d51af_bed_single_920x1880-01.png" },
  { id: "sofa_1", label: "1-Seater Sofa", width: 0.9, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/afaf2eee8_sofa_1_seater-01.png" },
  { id: "sofa_2", label: "2-Seater Sofa", width: 1.6, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/d02306e1d_sofa_2_seater-01.png" },
  { id: "sofa_3", label: "3-Seater Sofa", width: 2.5, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/f1888e620_sofa_3_seater-01.png" },
  { id: "sofa_chaise_left", label: "Chaise Lounge Left", width: 2.2, depth: 1.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/e0b83bbc4_sofa_chaise_left-01.png" },
  { id: "sofa_chaise_right", label: "Chaise Lounge Right", width: 2.2, depth: 1.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/86e5f9663_sofa_chaise_right-01.png" },
  { id: "dining_rect_4", label: "Dining Table Rect 4-Seater", width: 1.2, depth: 1.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/b9e008a82_dining_rect_4_seater-01.png" },
  { id: "dining_rect_6", label: "Dining Table Rect 6-Seater", width: 1.8, depth: 1.0, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/d039c2080_dining_rect_6_seater-01.png" },
  { id: "dining_round_4", label: "Dining Table Round 4-Seater", width: 1.0, depth: 1.0, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/015e6a804_dining_round_4_seater-01.png" },
  { id: "dining_round_6", label: "Dining Table Round 6-Seater", width: 1.2, depth: 1.2, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/2cb8cd3ce_dining_round_6_seater-01.png" },
  { id: "coffee_table_rect", label: "Coffee Table Rect", width: 1.2, depth: 0.6, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/8d9041fd5_coffee_table_rect_1200x600-01.png" },
  { id: "coffee_table_round", label: "Coffee Table Round", width: 0.9, depth: 0.9, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/732d1a4e2_coffee_table_round_900-01.png" },
  { id: "desk", label: "Desk", width: 1.2, depth: 0.6, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/3419d3a54_desk_1200x600-01.png" },
  { id: "ottoman", label: "Ottoman", width: 0.5, depth: 0.5, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/f9049e560_ottoman_500-01.png" },
  { id: "side_table", label: "Side Table", width: 0.45, depth: 0.45, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/5d6bf96ae_side_table_450-01.png" },
  { id: "wardrobe_sq", label: "Wardrobe 0.6m", width: 0.6, depth: 0.6, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/73a3b1911_Wardrobe_600x600-01.png" },
  { id: "wardrobe_rect", label: "Wardrobe 1.8m", width: 1.8, depth: 0.6, image: "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/df63759da_wardrobe_1800x600-01.png" },
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
                e.dataTransfer.setData("furnitureData", JSON.stringify(item));
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