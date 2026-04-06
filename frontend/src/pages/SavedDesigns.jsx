import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Maximize2, Layers, Play, DollarSign, Trash2, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DesignMiniPreview from "@/components/configurator/DesignMiniPreview";
import { toast } from "sonner";

export default function SavedDesigns() {
  const qc = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["homeDesigns"],
    queryFn: () => base44.entities.HomeDesign.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeDesign.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["homeDesigns"] }); toast.success("Design deleted"); },
  });

  const handleOpen = (design) => {
    sessionStorage.setItem("load_template", JSON.stringify({
      grid: design.grid || [],
      walls: design.walls || [],
      furniture: design.furniture || [],
      name: design.name,
      id: design.id,
    }));
    window.location.href = "/Configurator";
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F8F7F5]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/Configurator" state={{ showChooser: true }} className="text-gray-400 hover:text-[#F15A22] transition-colors">
                  <ArrowLeft size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Back to Choose a Design</TooltipContent>
            </Tooltip>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Saved Designs</h1>
              <p className="text-sm text-gray-500">{designs.length} saved design{designs.length !== 1 ? "s" : ""} — pick one to continue editing</p>
            </div>
          </div>
        </div>

        {/* Design grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400 animate-pulse">Loading designs...</div>
          ) : designs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-base font-medium text-gray-500">No saved designs yet</p>
              <p className="text-sm mt-1">Start building in the Configurator and save your work</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designs.map((d) => (
                <div key={d.id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                  {/* Preview */}
                  <div className="bg-[#F5F5F3] h-48 relative overflow-hidden border-b border-gray-100">
                    {(d.grid || []).length > 0 ? (
                      <DesignMiniPreview grid={d.grid} walls={d.walls || []} furniture={d.furniture || []} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No preview</div>
                    )}
                    {/* Delete button */}
                    {confirmDeleteId === d.id ? (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 px-2 py-1 shadow-sm z-10">
                        <span className="text-xs text-gray-500 mr-1">Delete?</span>
                        <button onClick={() => { deleteMutation.mutate(d.id); setConfirmDeleteId(null); }} className="p-1.5 bg-white/90 hover:bg-white text-red-500 shadow-sm transition-colors" title="Confirm"><Check size={13} /></button>
                        <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 bg-white/90 hover:bg-white text-gray-400 shadow-sm transition-colors" title="Cancel"><X size={13} /></button>
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(d.id); }} className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 shadow-sm transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {/* Name */}
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-tight">{d.name}</h3>

                    {/* Client info as description if available */}
                    {(d.clientFirstName || d.siteAddress) && (
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        {[d.clientFirstName, d.clientFamilyName].filter(Boolean).join(" ")}
                        {d.siteAddress ? ` — ${d.siteAddress}` : ""}
                      </p>
                    )}

                    {/* Bottom info */}
                    <div className="mt-auto">
                      {/* Specs */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><Layers size={11} className="text-[#F15A22]" />{d.moduleCount || 0} modules</span>
                        <span className="flex items-center gap-1"><Maximize2 size={11} className="text-[#F15A22]" />{Number(d.totalSqm || 0).toFixed(1)}m²</span>
                      </div>

                      {/* Price */}
                      {(d.estimatedPrice || 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold mb-3">
                          <DollarSign size={11} className="text-[#F15A22]" />
                          From ${Number(d.estimatedPrice || 0).toLocaleString()} NZD
                        </div>
                      )}

                      <button
                        onClick={() => handleOpen(d)}
                        data-testid={`open-saved-${d.id}`}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#F15A22] text-white text-xs font-semibold hover:bg-[#d94e1a] transition-colors"
                      >
                        <Play size={11} />
                        Open in Configurator
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
