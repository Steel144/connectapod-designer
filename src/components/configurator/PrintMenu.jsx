import React, { useState, useRef } from "react";
import { Save, ChevronDown } from "lucide-react";

export default function PrintMenu({ placedModules, walls, onPrint }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const handleClick = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.right - 160,
      });
    }
    setOpen(!open);
  };

  const options = [];

  if (placedModules.length > 0) {
    options.push({ label: "Floor Plans", value: "plans" });
    options.push({ label: "Building Elevations", value: "building-elevations" });
    options.push({ label: "Elevation Gallery", value: "elevation-gallery" });
  }

  if (walls.some(w => w.elevationImage)) {
    options.push({ label: "Elevations Sheet", value: "elevations" });
  }

  if (options.length === 0) return null;

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
        title="Print options"
      >
        <Save size={13} />
        Print
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="fixed w-40 bg-white border border-gray-200 shadow-lg rounded z-[9999]"
          style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onPrint(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}