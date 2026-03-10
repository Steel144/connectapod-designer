import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function AddModuleModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    width: 3.0,
    depth: 4.8,
    description: "",
    chassisCodes: [""],
    wallZ: false,
    wallW: false,
    wallY: false,
    wallX: false,
  });

  const sqm = parseFloat((Number(form.width) * Number(form.depth)).toFixed(1));

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setChassis = (i, v) => {
    const chassisCodes = [...form.chassisCodes];
    chassisCodes[i] = v;
    setForm(f => ({ ...f, chassisCodes }));
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    const sqm = parseFloat((Number(form.width) * Number(form.depth)).toFixed(1));
    onSave({
      category,
      code: form.code.trim(),
      name: form.name.trim(),
      width: Number(form.width),
      depth: Number(form.depth),
      sqm,
      description: form.description.trim(),
      chassisCodes: form.chassisCodes.filter(c => c.trim()),
      wallElevationZ: form.wallZ ? "Z" : undefined,
      wallElevationW: form.wallW ? "W" : undefined,
      wallElevationY: form.wallY ? "Y" : undefined,
      wallElevationX: form.wallX ? "X" : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Add Module</p>
            <p className="text-sm font-bold text-gray-800">{category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Code *</label>
              <input value={form.code} onChange={e => setField("code", e.target.value)} placeholder="e.g. 010" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Width (m)</label>
              <input type="number" step="0.6" value={form.width} onChange={e => setField("width", e.target.value)} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name *</label>
            <input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Open Module 3.0m" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={2} placeholder="e.g. Full-width standard open module" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#F15A22] resize-none" />
          </div>
          <div className="bg-gray-50 p-3 text-xs text-gray-500 border border-gray-200">
            <span className="font-semibold text-gray-700">{sqm.toFixed(1)} m²</span> — {form.width}m wide × {form.depth}m deep
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Chassis Codes</label>
              <button onClick={() => setForm(f => ({ ...f, chassisCodes: [...f.chassisCodes, ""] }))} className="text-[#F15A22] hover:opacity-70">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1.5">
              {form.chassisCodes.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input value={c} onChange={e => setChassis(i, e.target.value)} placeholder="e.g. MP-48-SF30" className="flex-1 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F15A22]" />
                  <button onClick={() => setForm(f => ({ ...f, chassisCodes: f.chassisCodes.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">Wall Elevations</label>
            <div className="flex gap-4">
              {[["wallZ", "Z"], ["wallW", "W"], ["wallY", "Y"], ["wallX", "X"]].map(([field, face]) => (
                <label key={face} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[field]}
                    onChange={e => setField(field, e.target.checked)}
                    className="accent-[#F15A22]"
                  />
                  <span className="text-sm font-semibold text-gray-700">{face}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 hover:border-gray-400 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.code.trim() || !form.name.trim()} className="px-4 py-2 text-sm bg-[#F15A22] text-white hover:bg-[#d94e1b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Add Module
          </button>
        </div>
      </div>
    </div>
  );
}