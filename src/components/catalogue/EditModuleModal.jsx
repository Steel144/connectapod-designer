import React, { useState } from "react";
import { X } from "lucide-react";

export default function EditModuleModal({ module: mod, onSave, onClose }) {
  const [form, setForm] = useState({
    name: mod.name || "",
    code: mod.code || "",
    width: mod.width ?? 3.0,
    depth: mod.depth ?? 4.8,
    description: mod.description || "",
    wallElevationZ: mod.wallElevations?.Z || mod.wallElevationZ || "",
    wallElevationW: mod.wallElevations?.W || mod.wallElevationW || "",
    wallElevationY: mod.wallElevations?.Y || mod.wallElevationY || "",
    wallElevationX: mod.wallElevations?.X || mod.wallElevationX || "",
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
      chassisCodes: form.chassisCodes,
      wallElevationZ: form.wallElevationZ || undefined,
      wallElevationW: form.wallElevationW || undefined,
      wallElevationY: form.wallElevationY || undefined,
      wallElevationX: form.wallElevationX || undefined,
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

  const toggleChassis = (code) => {
    setForm(f => ({
      ...f,
      chassisCodes: f.chassisCodes.includes(code)
        ? f.chassisCodes.filter(c => c !== code)
        : [...f.chassisCodes, code],
    }));
  };

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
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="e.g. Full-width standard open module"
              className="w-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22] resize-none"
            />
          </div>

          {/* Chassis Codes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Chassis Codes</label>
            <div className="space-y-2">
              {CHASSIS_OPTIONS.map(chassis => (
                <div key={chassis} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-gray-600 w-8">{chassis}</span>
                  <div className="flex gap-1 flex-wrap">
                    {WIDTH_OPTIONS.map(w => {
                      const code = buildChassisCode(chassis, w);
                      const active = form.chassisCodes.includes(code);
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => toggleChassis(code)}
                          className={`px-2 py-0.5 text-[11px] font-mono border transition-colors ${
                            active
                              ? "bg-[#F15A22] text-white border-[#F15A22]"
                              : "bg-white text-gray-500 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
                          }`}
                        >
                          {parseInt(w) * 60}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {form.chassisCodes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.chassisCodes.map(c => (
                  <span key={c} className="text-[10px] font-mono bg-orange-50 text-[#F15A22] px-1.5 py-0.5 border border-orange-200">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Wall Elevations */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wall Elevations</label>
            <div className="grid grid-cols-2 gap-2">
              {[["wallElevationW", "W (front)"], ["wallElevationY", "Y (rear)"], ["wallElevationZ", "Z (left end)"], ["wallElevationX", "X (right end)"]].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="e.g. W500 / N/A"
                    className="w-full border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-[#F15A22]"
                  />
                </div>
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