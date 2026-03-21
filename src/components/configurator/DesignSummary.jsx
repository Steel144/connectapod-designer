import React from "react";
import { Layers, DollarSign, Maximize2, Save, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROUP_ICONS } from "./ModulePanel.jsx";

export default function DesignSummary({ placedModules, walls = [], onSave, onClear, isSaving, onQuote }) {
  const totalSqm = placedModules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const totalPrice = placedModules.reduce((sum, m) => sum + (m.price || 0), 0) + walls.reduce((sum, w) => sum + (w.price || 0), 0);
  const moduleCount = placedModules.length;

  return (
    <div className="bg-white border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Design Summary</p>
      
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 border border-gray-100 p-3 text-center">
          <Layers size={16} className="text-[#F15A22] mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-800">{moduleCount}</p>
          <p className="text-xs text-gray-400">Modules</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 p-3 text-center">
          <Maximize2 size={16} className="text-[#F15A22] mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-800">{totalSqm}</p>
          <p className="text-xs text-gray-400">m²</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 p-3 text-center">
          <DollarSign size={16} className="text-[#F15A22] mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-800">${(totalPrice / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-400">Est. Cost</p>
        </div>
      </div>

      {placedModules.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {placedModules.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4" style={{transform:'scale(0.75)'}}>{GROUP_ICONS[m.groupKey]}</span>
                <span className="text-gray-600">{m.label}</span>
              </span>
              <span className="text-gray-400">${(m.price / 1000).toFixed(0)}k</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-1.5 flex justify-between text-xs font-semibold">
            <span className="text-gray-600">Total</span>
            <span className="text-gray-800">${totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-col">
        <div className="flex gap-2">
          <Button
            onClick={onSave}
            disabled={moduleCount === 0 || isSaving}
            className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white text-sm h-9 rounded-none"
          >
            <Save size={14} className="mr-1.5" />
            {isSaving ? "Saving..." : "Save Design"}
          </Button>
          <Button
            onClick={onClear}
            disabled={moduleCount === 0}
            variant="outline"
            className="h-9 rounded-none border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200"
          >
            <Trash2 size={14} />
          </Button>
        </div>
        <Button
          onClick={onQuote}
          disabled={moduleCount === 0}
          variant="outline"
          className="w-full h-9 rounded-none border-gray-200 text-gray-600 hover:border-[#F15A22] hover:text-[#F15A22] text-sm"
        >
          <FileText size={14} className="mr-1.5" />
          Get Estimate PDF
        </Button>
      </div>
    </div>
  );
}