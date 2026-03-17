import React, { useState } from "react";
import { X } from "lucide-react";

const UNIT_TYPES = [
  { label: "Standard", value: "Standard", walls: ["W (Front)", "Y (Rear)"] },
  { label: "Deck", value: "Deck", walls: ["W (Front)", "Y (Rear)"] },
  { label: "End", value: "End", walls: ["W (Front)", "Y (Rear)"], note: "W + Y + one end wall (auto on grid)" },
  { label: "Connection", value: "Connection", walls: ["X (Right)", "Z (Left)"], note: "X + Z wall elevations" },
];

// Infer unit type from saved variants array
const inferUnitType = (variants) => {
  if (!Array.isArray(variants)) return "";
  if (variants.includes("End Left") || variants.includes("End Right") || variants.includes("End")) return "End";
  if (variants.includes("Deck")) return "Deck";
  if (variants.includes("Connection")) return "Connection";
  if (variants.includes("Standard")) return "Standard";
  return "";
};

export default function EditModuleModal({ module: mod, onSave, onClose }) {
  const [form, setForm] = useState({
    name: mod.name || "",
    code: mod.code || "",
    width: mod.width ?? 3.0,
    depth: mod.depth ?? 4.8,
    description: mod.description || "",
    price: mod.price ?? "",
    categories: Array.isArray(mod.categories) ? mod.categories : [],
    unitType: inferUnitType(mod.variants),
    wallElevations: Array.isArray(mod.wallElevations_list) ? mod.wallElevations_list : [],
  });

  const sqm = parseFloat((parseFloat(form.width || 3) * parseFloat(form.depth || 4.8)).toFixed(1));

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

  const generateCode = () => {
    const widthNum = Math.round(parseFloat(form.width) * 10);
    const suffix = form.unitType === "Connection" ? "C" : form.unitType === "Deck" ? "D" : form.unitType === "End" ? "E" : "";
    return `${widthNum}${suffix}`;
  };

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    const descriptionCategories = form.description.split(",").map(s => s.trim()).filter(Boolean);
    onSave({
      name: form.name,
      code: form.code,
      width: parseFloat(form.width) || 3.0,
      depth: parseFloat(form.depth) || 4.8,
      sqm,
      description: form.description,
      price: form.price !== "" ? parseFloat(form.price) : undefined,
      categories: descriptionCategories,
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
          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, name: generateName() }))} className="text-xs text-[#F15A22] hover:underline">
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Open Module 3.0m"
              className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, code: generateCode() }))} className="text-xs text-[#F15A22] hover:underline">
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="e.g. 30C (3m Connection)"
              className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]"
            />
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

          {field("Price ($)", "price", "number", "e.g. 25000")}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <div className="flex flex-wrap gap-2">
              {["Living", "Bedroom", "Bathroom", "Laundry", "Kitchen", "Soffit", "Deck", "Connection"].map(opt => {
                const active = form.description.split(",").map(s => s.trim()).includes(opt);
                return (
                  <button key={opt} type="button"
                   onClick={(e) => {
                     e.stopPropagation();
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
                Wall elevations: {form.wallElevations.map(w => w.split(" ")[0]).join(", ")}
              </p>
            )}
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