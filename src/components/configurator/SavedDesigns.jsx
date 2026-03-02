import React from "react";
import { Layers, Maximize2, DollarSign, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SavedDesigns({ designs, onLoad, onDelete }) {
  if (designs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-4xl mb-3">🏡</p>
        <p className="font-medium text-slate-500">No saved designs yet</p>
        <p className="text-sm mt-1">Start building in the Configurator tab</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {designs.map((d) => (
        <div
          key={d.id}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-base leading-tight">{d.name}</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
              onClick={() => onDelete(d.id)}
            >
              <Trash2 size={13} />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 rounded-xl p-2 text-center">
              <Layers size={12} className="text-slate-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-slate-700">{d.moduleCount || 0}</p>
              <p className="text-xs text-slate-400">Modules</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 text-center">
              <Maximize2 size={12} className="text-slate-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-slate-700">{d.totalSqm || 0}</p>
              <p className="text-xs text-slate-400">m²</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 text-center">
              <DollarSign size={12} className="text-slate-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-slate-700">${((d.estimatedPrice || 0) / 1000).toFixed(0)}k</p>
              <p className="text-xs text-slate-400">Est.</p>
            </div>
          </div>

          <Button
            onClick={() => onLoad(d)}
            variant="outline"
            className="w-full h-8 text-xs rounded-xl border-slate-200 hover:border-indigo-300 hover:text-indigo-600 group/btn"
          >
            Open in Configurator
            <ArrowRight size={12} className="ml-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      ))}
    </div>
  );
}