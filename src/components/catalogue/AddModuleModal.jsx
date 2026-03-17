import React, { useState } from "react";
import { X } from "lucide-react";

const UNIT_TYPES = [
  { label: "Standard", value: "Standard", walls: ["W (Front)", "Y (Rear)"] },
  { label: "Deck", value: "Deck", walls: ["W (Front)", "Y (Rear)"] },
  { label: "Connection", value: "Connection", walls: ["W (Front)", "Z (Left)"] },
  { label: "End", value: "End", walls: ["W (Front)", "Y (Rear)"], note: "W + Y + one end wall (auto on grid)" },
];

export default function AddModuleModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    width: 3.0,
    depth: 4.8,
    description: "",
    price: "",
    categories: [],
    unitType: "",
    wallElevations: [],
  });

  const sqm = parseFloat((Number(form.width) * Number(form.depth)).toFixed(1));

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUnitTypeChange = (value) => {
    const unitDef = UNIT_TYPES.find(u => u.value === value);
    setForm(f => ({
      ...f,
      unitType: value,
      wallElevations: unitDef ? unitDef.walls : [],
    }));
  };

  const generateName = () => {
    const descriptions = form.description.split(",").map(s => s.trim()).filter(Boolean);
    const desc = descriptions.length > 0 ? descriptions.join(" + ") : "Module";
    const variant = form.unitType ? ` (${form.unitType})` : "";
    const size = ` ${form.width}m`;
    return `${desc}${variant}${size}`;
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    onSave({
      category,
      code: form.code.trim(),
      name: form.name.trim(),
      width: Number(form.width),
      depth: Number(form.depth),
      sqm,
      description: form.description.trim(),
      price: form.price !== "" ? parseFloat(form.price) : undefined,
      categories: form.categories,
      variants: form.unitType ? [form.unitType] : [],
      wallElevations_list: form.wallElevations,
    });
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setField(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Module</h2>
            <p className="text-xs text-gray-400 mt-0.5">{category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Name *</label>
              <button type="button" onClick={() => setField("name", generateName())} className="text-xs text-[#F15A22] hover:underline">
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
              placeholder="e.g. Open Module 3.0m"
              className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
            />
          </div>

          {field("Code *", "code", "text", "e.g. 010")}

          {/* Width + Depth */}
          <div className="grid grid-cols-2 gap-3">
            {field("Width (m)", "width", "number", "3.0")}
            {field("Depth (m)", "depth", "number", "4.8")}
          </div>

          {/* Area summary */}
          <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border border-gray-200">
            <span className="font-semibold text-gray-700">{sqm.toFixed(1)} m²</span> — {form.width}m wide × {form.depth}m deep
          </div>

          {field("Price ($)", "price", "number", "e.g. 25000")}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <div className="flex flex-wrap gap-2">
              {["Living", "Bedroom", "Bathroom", "Laundry", "Kitchen", "Connection Modules", "Soffit", "Deck"].map(opt => {
                const active = form.description.split(",").map(s => s.trim()).includes(opt);
                return (
                  <button key={opt} type="button"
                    onClick={() => {
                      const parts = form.description.split(",").map(s => s.trim()).filter(Boolean);
                      const updated = active ? parts.filter(p => p !== opt) : [...parts, opt];
                      setField("description", updated.join(", "));
                    }}
                    className={`px-3 py-1.5 text-xs border transition-colors ${active ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Also Show In */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Also Show In</label>
            <div className="flex flex-wrap gap-2">
              {["Living", "Bedroom", "Bathroom", "Laundry", "Kitchen", "Soffit", "Deck"].map(cat => {
                const active = form.categories.includes(cat);
                return (
                  <button key={cat} type="button"
                    onClick={() => {
                      const updated = active ? form.categories.filter(c => c !== cat) : [...form.categories, cat];
                      setField("categories", updated);
                    }}
                    className={`px-3 py-1.5 text-xs border transition-colors ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-600 hover:text-blue-600"}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit Type — sets wall elevations automatically */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unit Type & Wall Elevations</label>
            <div className="flex gap-2 flex-wrap">
              {UNIT_TYPES.map(ut => {
                const active = form.unitType === ut.value;
                return (
                  <button key={ut.value} type="button"
                    onClick={() => handleUnitTypeChange(ut.value)}
                    className={`px-3 py-2.5 text-xs border text-left transition-colors ${active ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
                  >
                    <div className="font-semibold">{ut.label}</div>
                    <div className={`text-[10px] mt-0.5 ${active ? "text-white/80" : "text-gray-400"}`}>
                      {ut.note || ut.walls.map(w => w.split(" ")[0]).join(" + ")}
                    </div>
                  </button>
                );
              })}
            </div>
            {form.wallElevations.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Wall elevations: {form.wallElevations.join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.code.trim() || !form.name.trim()}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white hover:bg-[#d44e1c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Module
          </button>
        </div>
      </div>
    </div>
  );
}