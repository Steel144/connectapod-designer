import React, { useState } from "react";
import { X } from "lucide-react";

export default function EditWallModal({ wall, onSave, onClose }) {
  const [form, setForm] = useState({
    name: wall.name || "",
    code: wall.code || "",
    width: wall.width ?? 3000,
    description: wall.description || "",
    variants: (wall.variants || []).join("\n"),
    windowStyle: wall.windowStyle || "",
    openingPanes: wall.openingPanes ?? "",
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
            {field("Name", "name")}
            {field("Code", "code")}
          </div>
          {field("Width (mm)", "width", "number")}
          {field("Description", "description")}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Window Style</label>
              <div className="flex flex-col gap-1">
                {["Casement", "Fixed", "Awning"].map(style => (
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