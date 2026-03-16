import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

const buildAutoName = (f) => {
  let name = `${f.width}mm Wall`;
  
  const descParts = f.description.split(",").map(s => s.trim()).filter(Boolean);
  if (descParts.includes("Blank Wall")) {
    return `${name} Blank`;
  }
  
  // Window section
  if (descParts.includes("Window")) {
    const winStyle = typeof f.windowStyle === "string" ? f.windowStyle.trim() : "";
    const wh = f.windowHeight !== "" ? f.windowHeight : null;
    const ww = f.windowWidth !== "" ? f.windowWidth : null;
    const sizeStr = (wh || ww) ? ` ${wh || "—"}×${ww || "—"}mm` : "";
    if (winStyle) {
      name += `, Window - ${winStyle}${sizeStr}`;
    } else if (sizeStr) {
      name += `, Window${sizeStr}`;
    }
  }
  
  // Door section
  if (descParts.includes("Door")) {
    const dStyle = typeof f.doorStyle === "string" ? f.doorStyle.trim() : "";
    const dh = f.doorHeight !== "" ? f.doorHeight : null;
    const dw = f.doorWidth !== "" ? f.doorWidth : null;
    const sizeStr = (dh || dw) ? ` ${dh || "—"}×${dw || "—"}mm` : "";
    if (dStyle) {
      name += `, Door - ${dStyle}${sizeStr}`;
    } else if (sizeStr) {
      name += `, Door${sizeStr}`;
    }
  }
  
  return name;
};

const DEFAULTS = {
  width: 3000,
  description: "",
  variants: [],
  windowStyle: "",
  openingPanes: "",
  windowHeight: "",
  windowWidth: "",
  doorStyle: "",
  doorHeight: "",
  doorWidth: "",
  price: "",
};

// Build auto code: {face}{widthCode}-{content}-{version}
// face: WY for horizontal (width < 4800mm), ZX for gable/end (width >= 4800mm)
// widthCode: width in mm / 100, zero-padded to 2 digits (3000 → 30, 4800 → 48)
// content: D=Door, W=Window, B=Blank
// version: auto-incremented 3-digit zero-padded
const buildAutoCode = (widthMm, descParts, existingWalls) => {
  const face = widthMm >= 4800 ? "ZX" : "WY";
  const widthCode = String(Math.round(widthMm / 100)).padStart(2, "0");
  const hasDoor = descParts.includes("Door");
  const hasWindow = descParts.includes("Window");
  const content = hasDoor ? "D" : hasWindow ? "W" : "B";
  const prefix = `${face}${widthCode}-${content}-`;
  const existing = (existingWalls || []).filter(w => w.code && w.code.startsWith(prefix));
  const maxVersion = existing.reduce((max, w) => {
    const m = w.code.match(/-(\d+)$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  return `${prefix}${String(maxVersion + 1).padStart(3, "0")}`;
};

export default function AddWallModal({ groupKey, groupLabel, onSave, onClose, existingWalls = [] }) {
  const [form, setForm] = useState({ ...DEFAULTS });

  const autoName = buildAutoName(form);
  const descParts = form.description.split(",").map(s => s.trim()).filter(Boolean);
  const autoCode = buildAutoCode(Number(form.width), descParts, existingWalls);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!autoName) return;
    onSave({
      groupKey,
      code: autoCode,
      name: autoName,
      width: Number(form.width),
      description: form.description.trim(),
      variants: form.variants,
      windowStyle: form.windowStyle.trim() || undefined,
      openingPanes: form.openingPanes !== "" ? parseInt(form.openingPanes) : undefined,
      windowHeight: form.windowHeight !== "" ? parseInt(form.windowHeight) : undefined,
      windowWidth: form.windowWidth !== "" ? parseInt(form.windowWidth) : undefined,
      doorStyle: form.doorStyle.trim() || undefined,
      doorHeight: form.doorHeight !== "" ? parseInt(form.doorHeight) : undefined,
      doorWidth: form.doorWidth !== "" ? parseInt(form.doorWidth) : undefined,
      price: form.price !== "" ? parseFloat(form.price) : undefined,
    });
  };

  const isBlank = descParts.includes("Blank Wall");
  const hasWindow = descParts.includes("Window");
  const hasDoor = descParts.includes("Door");


  const toggleDesc = (opt) => {
    if (opt === "Blank Wall") {
      setField("description", isBlank ? "" : "Blank Wall");
    } else {
      if (isBlank) return;
      const updated = descParts.includes(opt) ? descParts.filter(p => p !== opt) : [...descParts, opt];
      setField("description", updated.join(", "));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Add Wall</p>
            <p className="text-sm font-bold text-gray-800">{groupLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Code (auto)</label>
              <div className="w-full border border-gray-100 px-3 py-2 text-sm bg-gray-50 text-[#F15A22] font-mono min-h-[34px]">
                {autoCode}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name (auto)</label>
              <div className="w-full border border-gray-100 px-3 py-2 text-sm bg-gray-50 text-gray-700 min-h-[34px] truncate">
                {autoName || <span className="text-gray-400">–</span>}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Width (mm)</label>
            <input
              type="number"
              value={form.width}
              onChange={e => setField("width", e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description</label>
            <div className="flex gap-2">
              {["Blank Wall", "Window", "Door"].map(opt => {
                const active = descParts.includes(opt);
                const disabled = opt !== "Blank Wall" && isBlank;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleDesc(opt)}
                    disabled={disabled}
                    className={`px-3 py-1.5 text-xs border transition-colors ${active ? "bg-[#F15A22] text-white border-[#F15A22]" : disabled ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {hasWindow && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Window Style</label>
                  <div className="flex flex-col gap-1 mt-1">
                    {["Fixed", "Casement", "Awning"].map(style => (
                      <label key={style} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.windowStyle.split(",").map(s => s.trim()).includes(style)}
                          onChange={e => {
                            const current = form.windowStyle.split(",").map(s => s.trim()).filter(Boolean);
                            const updated = e.target.checked ? [...current, style] : current.filter(s => s !== style);
                            setField("windowStyle", updated.join(", "));
                          }}
                          className="accent-[#F15A22]"
                        />
                        {style}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Opening Panes</label>
                  <input
                    type="number"
                    value={form.openingPanes}
                    onChange={e => setField("openingPanes", e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Window Size (mm)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">W</span>
                    <input type="number" value={form.windowWidth} onChange={e => setField("windowWidth", e.target.value)} placeholder="e.g. 620" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">H</span>
                    <input type="number" value={form.windowHeight} onChange={e => setField("windowHeight", e.target.value)} placeholder="e.g. 1520" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                </div>
              </div>
            </>
          )}

          {hasDoor && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Door Style</label>
                <div className="flex flex-col gap-1 mt-1">
                  {["Ranch Slider", "Stacker Slider", "French", "Bi-Fold"].map(style => (
                    <label key={style} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.doorStyle === style}
                        onChange={e => setField("doorStyle", e.target.checked ? style : "")}
                        className="accent-[#F15A22]"
                      />
                      {style}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Door Size (mm)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">W</span>
                    <input type="number" value={form.doorWidth} onChange={e => setField("doorWidth", e.target.value)} placeholder="e.g. 900" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">H</span>
                    <input type="number" value={form.doorHeight} onChange={e => setField("doorHeight", e.target.value)} placeholder="e.g. 2100" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Price ($)</label>
            <input
              type="number"
              value={form.price}
              onChange={e => setField("price", e.target.value)}
              placeholder="e.g. 1200"
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Variants</label>
            <div className="flex flex-col gap-1 mt-1">
              {["Standard", "End", "Deck"].map(variant => (
                <label key={variant} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.variants.includes(variant)}
                    onChange={e => {
                      const updated = e.target.checked
                        ? [...form.variants, variant]
                        : form.variants.filter(v => v !== variant);
                      setField("variants", updated);
                    }}
                    className="accent-[#F15A22]"
                  />
                  {variant}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 hover:border-gray-400 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!autoName}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white hover:bg-[#d94e1b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Wall
          </button>
        </div>
      </div>
    </div>
  );
}