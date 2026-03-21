import React from "react";
import { Layers, DollarSign, Maximize2, Save, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROUP_ICONS } from "./ModulePanel.jsx";

export default function DesignSummary({ placedModules, walls = [], onSave, onClear, isSaving, onQuote }) {
  const totalSqm = placedModules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const totalPrice = placedModules.reduce((sum, m) => sum + (m.price || 0), 0) + walls.reduce((sum, w) => sum + (w.price || 0), 0);
  const moduleCount = placedModules.length;
  const wallCount = walls.length;

  return (
    <div className="bg-white border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Summary</p>
      
      <div className="space-y-2 text-sm mb-5">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-gray-600">Modules:</span>
          <span className="font-semibold text-gray-800">{moduleCount}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-gray-600">Walls:</span>
          <span className="font-semibold text-gray-800">{wallCount}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-gray-600">Total Area:</span>
          <span className="font-semibold text-gray-800">{totalSqm.toFixed(1)} m²</span>
        </div>
        <div className="flex justify-between items-center pt-2 bg-gray-50 p-2 -mx-4 px-3">
          <span className="text-gray-700 font-semibold">Estimated Price:</span>
          <span className="text-lg font-bold text-[#F15A22]">${(totalPrice / 1000).toFixed(0)}k</span>
        </div>
      </div>

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