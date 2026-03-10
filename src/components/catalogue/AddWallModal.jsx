import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function AddWallModal({ groupKey, groupLabel, onSave, onClose }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    width: 3000,
    description: "",
    variants: [""],
    windowStyle: "",
    openingPanes: "",
    windowHeight: "",
    windowWidth: "",
    doorStyle: "",
    doorHeight: "",
    doorWidth: "",
    price: "",
  });

  const buildAutoName = (f) => {
    const parts = [];
    if (f.width) parts.push(`${f.width}mm`);
    parts.push("Wall");
    if (f.windowStyle) parts.push(f.windowStyle);
    if (f.windowHeight || f.windowWidth) parts.push(`${f.windowHeight || "—"}×${f.windowWidth || "—"}mm`);
    if (f.doorStyle) parts.push(f.doorStyle);
    if (f.doorHeight || f.doorWidth) parts.push(`${f.doorHeight || "—"}×${f.doorWidth || "—"}mm`);
    return parts.join(" ");
  };

  const setField = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    return { ...updated, name: buildAutoName(updated) };
  });

  const setVariant = (i, v) => {
    const variants = [...form.variants];
    variants[i] = v;
    setForm(f => ({ ...f, variants }));
  };

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, ""] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    onSave({
      groupKey,
      code: form.code.trim(),
      name: form.name.trim(),
      width: Number(form.width),
      description: form.description.trim(),
      variants: form.variants.filter(v => v.trim()),
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
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Code *</label>
            <input
              value={form.code}
              onChange={e => setField("code", e.target.value)}
              placeholder="e.g. W500/Y500"
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name *</label>
            <div className="w-full border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-700 min-h-[34px]">
              {form.name || <span className="text-gray-400">Auto-populated from fields below</span>}
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
              {(() => {
                const parts = form.description.split(",").map(s => s.trim()).filter(Boolean);
                const isBlank = parts.includes("Blank Wall");
                const toggle = (opt) => {
                  if (opt === "Blank Wall") {
                    setField("description", isBlank ? "" : "Blank Wall");
                  } else {
                    if (isBlank) return;
                    const updated = parts.includes(opt) ? parts.filter(p => p !== opt) : [...parts, opt];
                    setField("description", updated.join(", "));
                  }
                };
                return ["Blank Wall", "Window", "Door"].map(opt => {
                  const active = parts.includes(opt);
                  const disabled = opt !== "Blank Wall" && isBlank;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle(opt)}
                      disabled={disabled}
                      className={`px-3 py-1.5 text-xs border transition-colors ${active ? "bg-[#F15A22] text-white border-[#F15A22]" : disabled ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
                    >
                      {opt}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
          {form.description.split(",").map(s => s.trim()).includes("Window") && (
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
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">H</span>
                    <input type="number" value={form.windowHeight} onChange={e => setField("windowHeight", e.target.value)} placeholder="e.g. 1520" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">W</span>
                    <input type="number" value={form.windowWidth} onChange={e => setField("windowWidth", e.target.value)} placeholder="e.g. 620" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                </div>
              </div>
            </>
          )}
          {form.description.split(",").map(s => s.trim()).includes("Door") && (
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
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">H</span>
                    <input type="number" value={form.doorHeight} onChange={e => setField("doorHeight", e.target.value)} placeholder="e.g. 2100" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">W</span>
                    <input type="number" value={form.doorWidth} onChange={e => setField("doorWidth", e.target.value)} placeholder="e.g. 900" className="w-full border border-gray-200 pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Variants</label>
              <button onClick={addVariant} className="text-[#F15A22] hover:opacity-70 transition-opacity">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1.5">
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={v}
                    onChange={e => setVariant(i, e.target.value)}
                    placeholder="e.g. Standard (W500/Y500)"
                    className="flex-1 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
                  />
                  <button onClick={() => removeVariant(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
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
            disabled={!form.code.trim() || !form.name.trim()}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white hover:bg-[#d94e1b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Wall
          </button>
        </div>
      </div>
    </div>
  );
}