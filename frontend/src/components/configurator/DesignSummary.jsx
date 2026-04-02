import React from "react";
import { Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROUP_ICONS } from "./ModulePanel.jsx";
import DesignMiniPreview from "./DesignMiniPreview.jsx";

export default function DesignSummary({ placedModules, walls = [], furniture = [], onClear, onQuote }) {
  // Separate internal and deck areas
  const internalSqm = placedModules.reduce((sum, m) => {
    const isDeck = m.chassis === "DK" || m.chassis === "SO";
    return isDeck ? sum : sum + (m.sqm || 0);
  }, 0);
  
  const deckSqm = placedModules.reduce((sum, m) => {
    const isDeck = m.chassis === "DK" || m.chassis === "SO";
    return isDeck ? sum + (m.sqm || 0) : sum;
  }, 0);
  
  const totalSqm = internalSqm + deckSqm;
  const totalPrice = placedModules.reduce((sum, m) => sum + (m.price || 0), 0) + walls.reduce((sum, w) => sum + (w.price || 0), 0);
  const moduleCount = placedModules.length;
  const wallCount = walls.length;

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-4">

      {placedModules.length > 0 && (
        <div className="mb-4">
          <div className="h-32 mb-3 border border-gray-100 bg-gray-50 overflow-hidden">
            <DesignMiniPreview grid={placedModules} walls={walls} furniture={furniture} />
          </div>
          <div className="text-center pb-3 border-b border-gray-100">
            <p className="text-[11px] text-gray-600 mb-1">Total Estimate (incl. taxes)</p>
            <span className="text-lg font-bold text-[#F15A22]">${((totalPrice * 1.15) / 1000).toFixed(0)}k</span>
          </div>
        </div>
      )}
      
      <div className="space-y-2 text-sm mb-5">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-gray-600">Modules:</span>
          <span className="font-semibold text-gray-800">{moduleCount}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-gray-600">Walls:</span>
          <span className="font-semibold text-gray-800">{wallCount}</span>
        </div>
        
        {/* Internal Floor Area */}
        {internalSqm > 0 && (
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-600">Internal Floor Area:</span>
            <span className="font-semibold text-gray-800">{internalSqm.toFixed(1)} m²</span>
          </div>
        )}
        
        {/* Deck Area */}
        {deckSqm > 0 && (
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-600">Deck Area:</span>
            <span className="font-semibold text-gray-800">{deckSqm.toFixed(1)} m²</span>
          </div>
        )}
        
        {/* Total Area (only show if both exist, otherwise redundant) */}
        {internalSqm > 0 && deckSqm > 0 && (
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-600">Total Area:</span>
            <span className="font-semibold text-gray-800">{totalSqm.toFixed(1)} m²</span>
          </div>
        )}
        
        {/* If only one type exists, show as Total Area */}
        {(internalSqm === 0 || deckSqm === 0) && totalSqm > 0 && (
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-600">Total Area:</span>
            <span className="font-semibold text-gray-800">{totalSqm.toFixed(1)} m²</span>
          </div>
        )}
        <div className="flex justify-between items-center pb-2">
          <span className="text-gray-600">Base Price:</span>
          <span className="font-semibold text-gray-800">${(totalPrice / 1000).toFixed(0)}k</span>
        </div>
        <div className="flex justify-between items-center pb-2">
          <span className="text-gray-600">Tax & Fees (15%):</span>
          <span className="font-semibold text-gray-800">${((totalPrice * 0.15) / 1000).toFixed(0)}k</span>
        </div>
        <div className="flex justify-between items-center pt-2 bg-gray-50 p-2 -mx-4 px-3">
          <span className="text-gray-700 font-semibold">Total Estimate:</span>
          <span className="text-lg font-bold text-[#F15A22]">${((totalPrice * 1.15) / 1000).toFixed(0)}k</span>
        </div>
      </div>

      <div className="flex gap-2 flex-col">
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
    </div>
  );
}