import React from "react";
import { Layers, DollarSign, Maximize2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DesignSummary({ placedModules, onSave, onClear, isSaving }) {
  const totalSqm = placedModules.reduce((sum, m) => sum + m.sqm, 0);
  const totalPrice = placedModules.reduce((sum, m) => sum + m.price, 0);
  const moduleCount = placedModules.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Design Summary</p>
      
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <Layers size={16} className="text-indigo-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-indigo-700">{moduleCount}</p>
          <p className="text-xs text-indigo-400">Modules</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <Maximize2 size={16} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-700">{totalSqm}</p>
          <p className="text-xs text-emerald-400">m²</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <DollarSign size={16} className="text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-700">${(totalPrice / 1000).toFixed(0)}k</p>
          <p className="text-xs text-amber-400">Est. Cost</p>
        </div>
      </div>

      {placedModules.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {placedModules.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span>{m.icon}</span>
                <span className="text-slate-600">{m.label}</span>
              </span>
              <span className="text-slate-400">${(m.price / 1000).toFixed(0)}k</span>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-1.5 flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Total</span>
            <span className="text-slate-800">${totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={moduleCount === 0 || isSaving}
          className="flex-1 bg-slate-900 hover:bg-slate-700 text-white text-sm h-9 rounded-xl"
        >
          <Save size={14} className="mr-1.5" />
          {isSaving ? "Saving..." : "Save Design"}
        </Button>
        <Button
          onClick={onClear}
          disabled={moduleCount === 0}
          variant="outline"
          className="h-9 rounded-xl border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}