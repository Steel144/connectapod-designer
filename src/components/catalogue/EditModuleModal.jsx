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
    wallElevationZ: !!(mod.wallElevations?.Z || mod.wallElevationZ),
    wallElevationW: !!(mod.wallElevations?.W || mod.wallElevationW),
    wallElevationY: !!(mod.wallElevations?.Y || mod.wallElevationY),
    wallElevationX: !!(mod.wallElevations?.X || mod.wallElevationX),
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
      wallElevationZ: form.wallElevationZ ? "Z" : undefined,
      wallElevationW: form.wallElevationW ? "W" : undefined,
      wallElevationY: form.wallElevationY ? "Y" : undefined,
      wallElevationX: form.wallElevationX ? "X" : undefined,
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
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Edit Module</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("Name", "name")}
            {field("Code", "code")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Width (m)", "width", "number")}
            {field("Depth (m)", "depth", "number")}
          </div>
          {field("Description", "description")}
          <div className="bg-gray-50 p-3 text-xs text-gray-500 border border-gray-200">
            <span className="font-semibold text-gray-700">{sqm.toFixed(1)} m²</span> — {form.width}m wide × {form.depth}m deep
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Variants</p>
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
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wall Elevations</p>
            <div className="flex gap-4">
              {[["wallElevationW", "W side"], ["wallElevationX", "X end"], ["wallElevationY", "Y side"], ["wallElevationZ", "Z end"]].map(([key, face]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="accent-[#F15A22]"
                  />
                  <span className="text-sm font-semibold text-gray-700">{face}</span>
                </label>
              ))}
            </div>
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