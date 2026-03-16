import React, { useState } from "react";
import { X } from "lucide-react";

export default function EditModuleModal({ module: mod, onSave, onClose }) {
  const [form, setForm] = useState({
    name: mod.name || "",
    code: mod.code || "",
    width: mod.width ?? 3.0,
    depth: mod.depth ?? 4.8,
    description: mod.description || "",
    variants: mod.variants || [],
    wallElevations: mod.wallElevations_list || mod.wallElevations_arr || [],
  });

  const sqm = parseFloat((parseFloat(form.width || 3) * parseFloat(form.depth || 4.8)).toFixed(1));

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    onSave({
      name: form.name,
      code: form.code,
      width: parseFloat(form.width) || 3.0,
      depth: parseFloat(form.depth) || 4.8,
      sqm,
      description: form.description,
      variants: form.variants,
      wallElevations_list: form.wallElevations,
    });
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Edit Module</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            {field("Name", "name", "text", "e.g. Open Module 3.0m")}
            {field("Code", "code", "text", "e.g. 010")}
          </div>

          {/* Width + Depth */}
          <div className="grid grid-cols-2 gap-3">
            {field("Width (m)", "width", "number", "3.0")}
            {field("Depth (m)", "depth", "number", "4.8")}
          </div>

          {/* Area summary */}
          <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border border-gray-200">
            <span className="font-semibold text-gray-700">{sqm.toFixed(1)} m²</span> — {form.width}m wide × {form.depth}m deep
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <div className="flex flex-wrap gap-2">
              {["Living", "Bedroom", "Bathroom", "Laundry", "Kitchen", "Soffit", "Deck"].map(opt => {
                const active = form.description.split(",").map(s => s.trim()).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const parts = form.description.split(",").map(s => s.trim()).filter(Boolean);
                      const updated = active ? parts.filter(p => p !== opt) : [...parts, opt];
                      setForm(f => ({ ...f, description: updated.join(", ") }));
                    }}
                    className={`px-3 py-1.5 text-xs border transition-colors ${active ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wall Elevations */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Wall Elevations</label>
            <div className="flex flex-col gap-1 mt-1">
              {["W (Front)", "Y (Rear)", "Z (Left End)", "X (Right End)"].map(face => (
                <label key={face} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.wallElevations.includes(face)}
                    onChange={e => {
                      const updated = e.target.checked
                        ? [...form.wallElevations, face]
                        : form.wallElevations.filter(v => v !== face);
                      setForm(f => ({ ...f, wallElevations: updated }));
                    }}
                    className="accent-[#F15A22]"
                  />
                  {face}
                </label>
              ))}
            </div>
          </div>
        </div>

          {/* Variants */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Variants</label>
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
                      setForm(f => ({ ...f, variants: updated }));
                    }}
                    className="accent-[#F15A22]"
                  />
                  {variant}
                </label>
              ))}
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