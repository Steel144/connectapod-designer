import React, { useState } from "react";
import { X } from "lucide-react";

const buildAutoName = (f) => {
  const parts = [];
  if (f.width) parts.push(`${f.width}mm`);
  parts.push("Wall");
  
  const descParts = f.description.split(",").map(s => s.trim()).filter(Boolean);
  if (descParts.includes("Blank Wall")) {
    parts.push("Blank");
    return parts.join(" ");
  }
  if (descParts.includes("Window")) parts.push("Window");
  if (descParts.includes("Door")) parts.push("Door");
  
  const winStyle = typeof f.windowStyle === "string" ? f.windowStyle.trim() : "";
  if (winStyle) parts.push(winStyle);
  const wh = f.windowHeight !== "" ? f.windowHeight : null;
  const ww = f.windowWidth !== "" ? f.windowWidth : null;
  if (wh || ww) parts.push(`${wh || "—"}×${ww || "—"}mm`);
  
  const dStyle = typeof f.doorStyle === "string" ? f.doorStyle.trim() : "";
  if (dStyle) parts.push(dStyle);
  const dh = f.doorHeight !== "" ? f.doorHeight : null;
  const dw = f.doorWidth !== "" ? f.doorWidth : null;
  if (dh || dw) parts.push(`${dh || "—"}×${dw || "—"}mm`);
  
  return parts.join(" ");
};

export default function EditWallModal({ wall, onSave, onClose }) {
  const [form, setForm] = useState({
    name: wall.name || "",
    code: wall.code || "",
    width: wall.width ?? 3000,
    description: wall.description || "",
    variants: (wall.variants || []).join("\n"),
    windowStyle: wall.windowStyle || "",
    openingPanes: wall.openingPanes ?? "",
    windowHeight: wall.windowHeight ?? "",
    windowWidth: wall.windowWidth ?? "",
    doorStyle: wall.doorStyle || "",
    doorHeight: wall.doorHeight ?? "",
    doorWidth: wall.doorWidth ?? "",
    price: wall.price ?? "",
  });

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    onSave({
      name: form.name,
      code: form.code,
      width: parseInt(form.width) || 3000,
      description: form.description,
      variants: form.variants.split("\n").map(s => s.trim()).filter(Boolean),
      windowStyle: form.windowStyle || undefined,
      openingPanes: form.openingPanes !== "" ? parseInt(form.openingPanes) : undefined,
      windowHeight: form.windowHeight !== "" ? parseInt(form.windowHeight) : undefined,
      windowWidth: form.windowWidth !== "" ? parseInt(form.windowWidth) : undefined,
      doorStyle: form.doorStyle || null,
      doorHeight: form.doorHeight !== "" ? parseInt(form.doorHeight) : undefined,
      doorWidth: form.doorWidth !== "" ? parseInt(form.doorWidth) : undefined,
      price: form.price !== "" ? parseFloat(form.price) : undefined,
    });
  };

  const field = (label, key, type = "text") => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Edit Wall</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</label>
              <div className="w-full border border-gray-200 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 min-h-[34px] flex items-center">
                {buildAutoName(form) || <span className="text-gray-400">Auto-generated</span>}
              </div>
            </div>
            {field("Code", "code")}
          </div>
          {field("Width (mm)", "width", "number")}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <div className="flex gap-2">
              {(() => {
                const parts = form.description.split(",").map(s => s.trim()).filter(Boolean);
                const isBlank = parts.includes("Blank Wall");
                const toggle = (opt) => {
                  if (opt === "Blank Wall") {
                    setForm(f => ({ ...f, description: isBlank ? "" : "Blank Wall" }));
                  } else {
                    if (isBlank) return;
                    const updated = parts.includes(opt) ? parts.filter(p => p !== opt) : [...parts, opt];
                    setForm(f => ({ ...f, description: updated.join(", ") }));
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Window Style</label>
                  <div className="flex flex-col gap-1">
                    {["Fixed", "Casement", "Awning"].map(style => (
                      <label key={style} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.windowStyle.split(",").map(s => s.trim()).includes(style)}
                          onChange={e => {
                            const current = form.windowStyle.split(",").map(s => s.trim()).filter(Boolean);
                            const updated = e.target.checked ? [...current, style] : current.filter(s => s !== style);
                            setForm(f => ({ ...f, windowStyle: updated.join(", ") }));
                          }}
                          className="accent-[#F15A22]"
                        />
                        {style}
                      </label>
                    ))}
                  </div>
                </div>
                {field("Opening Panes", "openingPanes", "number")}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Window Size (mm)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">H</span>
                    <input type="number" value={form.windowHeight} onChange={e => setForm(f => ({ ...f, windowHeight: e.target.value }))} placeholder="e.g. 1520" className="w-full border border-gray-200 pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">W</span>
                    <input type="number" value={form.windowWidth} onChange={e => setForm(f => ({ ...f, windowWidth: e.target.value }))} placeholder="e.g. 620" className="w-full border border-gray-200 pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                </div>
              </div>
            </>
          )}
          {form.description.split(",").map(s => s.trim()).includes("Door") && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Door Style</label>
                <div className="flex flex-col gap-1 mt-1">
                  {["Ranch Slider", "Stacker Slider", "French", "Bi-Fold"].map(style => (
                    <label key={style} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.doorStyle === style}
                        onChange={e => setForm(f => ({ ...f, doorStyle: e.target.checked ? style : "" }))}
                        className="accent-[#F15A22]"
                      />
                      {style}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Door Size (mm)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">H</span>
                    <input type="number" value={form.doorHeight} onChange={e => setForm(f => ({ ...f, doorHeight: e.target.value }))} placeholder="e.g. 2100" className="w-full border border-gray-200 pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">W</span>
                    <input type="number" value={form.doorWidth} onChange={e => setForm(f => ({ ...f, doorWidth: e.target.value }))} placeholder="e.g. 900" className="w-full border border-gray-200 pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]" />
                  </div>
                </div>
              </div>
            </>
          )}
          {field("Price ($)", "price", "number")}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Variants (one per line)</label>
            <textarea
              value={form.variants}
              onChange={e => setForm(f => ({ ...f, variants: e.target.value }))}
              rows={4}
              className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22] resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.code}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white hover:bg-[#d44e1c] disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}