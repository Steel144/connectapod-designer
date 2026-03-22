import React, { useMemo } from "react";
import { Layers, DollarSign, Maximize2, Save, Trash2, FileText, Bed, Bath, UtensilsCrossed, Sofa, Home, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GROUP_ICONS } from "./ModulePanel.jsx";

export default function DesignSummary({ placedModules, walls = [], onSave, onClear, isSaving, onQuote }) {
  const totalSqm = placedModules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const modulesPrice = placedModules.reduce((sum, m) => sum + (m.price || 0), 0);
  const wallsPrice = walls.reduce((sum, w) => sum + (w.price || 0), 0);
  const totalPrice = modulesPrice + wallsPrice;
  const moduleCount = placedModules.length;
  const wallCount = walls.length;

  // Calculate room counts by category
  const roomCounts = useMemo(() => {
    const counts = {
      bedroom: 0,
      bathroom: 0,
      kitchen: 0,
      living: 0,
      laundry: 0,
      deck: 0,
      connection: 0,
      other: 0,
    };
    
    placedModules.forEach(m => {
      const groupKey = (m.groupKey || "").toLowerCase();
      const label = (m.label || m.type || "").toLowerCase();
      
      if (groupKey === "bedroom" || label.includes("bedroom") || label.includes("bed")) {
        counts.bedroom++;
      } else if (groupKey === "bathroom" || label.includes("bathroom") || label.includes("bath") || label.includes("ensuite")) {
        counts.bathroom++;
      } else if (groupKey === "kitchen" || label.includes("kitchen")) {
        counts.kitchen++;
      } else if (groupKey === "living" || label.includes("living") || label.includes("lounge")) {
        counts.living++;
      } else if (groupKey === "laundry" || label.includes("laundry")) {
        counts.laundry++;
      } else if (groupKey === "deck" || label.includes("deck") || label.includes("soffit")) {
        counts.deck++;
      } else if (groupKey === "connectionmodules" || groupKey === "connection" || label.includes("connection")) {
        counts.connection++;
      } else {
        counts.other++;
      }
    });
    
    return counts;
  }, [placedModules]);

  // Calculate overall building dimensions
  const buildingDimensions = useMemo(() => {
    if (placedModules.length === 0) return null;
    
    const CELL_SIZE = 0.6;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    placedModules.forEach(m => {
      minX = Math.min(minX, m.x || 0);
      maxX = Math.max(maxX, (m.x || 0) + (m.w || 0));
      minY = Math.min(minY, m.y || 0);
      maxY = Math.max(maxY, (m.y || 0) + (m.h || 0));
    });
    
    return {
      width: ((maxX - minX) * CELL_SIZE).toFixed(1),
      depth: ((maxY - minY) * CELL_SIZE).toFixed(1),
    };
  }, [placedModules]);

  // Price per sqm
  const pricePerSqm = totalSqm > 0 ? (totalPrice / totalSqm).toFixed(0) : 0;

  return (
    <div className="bg-white border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Summary</p>
      
      {/* Room breakdown */}
      {moduleCount > 0 && (
        <div className="mb-4 pb-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Rooms</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {roomCounts.bedroom > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Bed size={12} className="text-[#F15A22]" />
                <span>{roomCounts.bedroom} Bed</span>
              </div>
            )}
            {roomCounts.bathroom > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Bath size={12} className="text-[#F15A22]" />
                <span>{roomCounts.bathroom} Bath</span>
              </div>
            )}
            {roomCounts.kitchen > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <UtensilsCrossed size={12} className="text-[#F15A22]" />
                <span>{roomCounts.kitchen} Kitchen</span>
              </div>
            )}
            {roomCounts.living > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Sofa size={12} className="text-[#F15A22]" />
                <span>{roomCounts.living} Living</span>
              </div>
            )}
            {roomCounts.laundry > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Home size={12} className="text-[#F15A22]" />
                <span>{roomCounts.laundry} Laundry</span>
              </div>
            )}
            {roomCounts.deck > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Grid2X2 size={12} className="text-[#F15A22]" />
                <span>{roomCounts.deck} Deck</span>
              </div>
            )}
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
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-gray-600">Total Area:</span>
          <span className="font-semibold text-gray-800">{totalSqm.toFixed(1)} m²</span>
        </div>
        {buildingDimensions && (
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-600">Footprint:</span>
            <span className="font-semibold text-gray-800">{buildingDimensions.width}m × {buildingDimensions.depth}m</span>
          </div>
        )}
        
        {/* Price breakdown */}
        <div className="pt-2 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Modules:</span>
            <span>${modulesPrice.toLocaleString()}</span>
          </div>
          {wallsPrice > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Walls:</span>
              <span>${wallsPrice.toLocaleString()}</span>
            </div>
          )}
          {totalSqm > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Price/m²:</span>
              <span>${pricePerSqm}/m²</span>
            </div>
          )}
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
