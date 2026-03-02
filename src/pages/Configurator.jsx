import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ModulePanel, { MODULE_TYPES } from "@/components/configurator/ModulePanel";
import ConfigGrid from "@/components/configurator/ConfigGrid";
import DesignSummary from "@/components/configurator/DesignSummary";
import SavedDesigns from "@/components/configurator/SavedDesigns";
import SaveDesignModal from "@/components/configurator/SaveDesignModal";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, FolderOpen, Save, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

let idCounter = 1;

export default function Configurator() {
  const [placedModules, setPlacedModules] = useState([]);
  const [draggingMod, setDraggingMod] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data: designs = [] } = useQuery({
    queryKey: ["homeDesigns"],
    queryFn: () => base44.entities.HomeDesign.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeDesign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
      toast.success("Design saved!");
      setSaveModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeDesign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeDesigns"] });
      toast.success("Design deleted");
    },
  });

  const handleDragStart = (e, mod) => {
    e.dataTransfer.setData("moduleType", mod.type);
    setDraggingMod(mod);
  };

  const handlePlace = (mod, x, y) => {
    setPlacedModules((prev) => [
      ...prev,
      { ...mod, id: `mod-${idCounter++}`, x, y },
    ]);
  };

  const handleRemove = (id) => {
    setPlacedModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMove = (id, x, y) => {
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, x, y } : m))
    );
  };

  const handleClear = () => setPlacedModules([]);

  const handleSave = (name) => {
    const totalSqm = placedModules.reduce((s, m) => s + m.sqm, 0);
    const estimatedPrice = placedModules.reduce((s, m) => s + m.price, 0);
    saveMutation.mutate({
      name,
      grid: placedModules,
      totalSqm,
      estimatedPrice,
      moduleCount: placedModules.length,
    });
  };

  const handleLoad = (design) => {
    setPlacedModules(design.grid || []);
    setShowSaved(false);
    toast.success(`Loaded "${design.name}"`);
  };

  return (
    <div className="w-screen h-screen bg-[#F0EFEd] overflow-hidden relative flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur border-b border-gray-200">
        <div>
          <span className="text-base font-bold text-gray-900 tracking-tight">connectapod</span>
          <span className="ml-2 text-xs text-gray-400">Design Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={createPageUrl("Catalogue")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] border border-gray-200 bg-white hover:border-[#F15A22] transition-all"
          >
            <BookOpen size={13} />
            Catalogue
          </Link>
          <button
            onClick={() => setShowSaved(!showSaved)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all ${
              showSaved ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 bg-white border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
            }`}
          >
            <FolderOpen size={13} />
            My Designs
            {designs.length > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${showSaved ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"}`}>
                {designs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            disabled={placedModules.length === 0 || saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#F15A22] text-white hover:bg-[#d94e1a] disabled:opacity-40 transition-all"
          >
            <Save size={13} />
            {saveMutation.isPending ? "Saving…" : "Save Design"}
          </button>
          {placedModules.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-white border border-gray-200 hover:border-red-300 hover:text-red-500 transition-all"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-auto pt-12">
        <ConfigGrid
          placedModules={placedModules}
          onPlace={handlePlace}
          onRemove={handleRemove}
          onMove={handleMove}
          draggingMod={draggingMod}
        />
      </div>

      {/* Floating left panel — Module picker */}
      <div
        className="absolute left-4 z-20 flex"
        style={{ top: "60px", bottom: "16px" }}
      >
        <div
          className={`bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden transition-all duration-200 ${
            panelCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-64 opacity-100"
          }`}
        >
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Module Library</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Expand a category · drag to place</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ModulePanel onDragStart={handleDragStart} />
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className="self-start mt-3 ml-1 bg-white border border-gray-200 shadow-md p-1 hover:border-[#F15A22] hover:text-[#F15A22] text-gray-400 transition-all"
        >
          {panelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Floating right panel — Design summary */}
      {placedModules.length > 0 && (
        <div
          className="absolute right-4 z-20 w-60"
          style={{ top: "60px" }}
        >
          <div className="bg-white border border-gray-200 shadow-xl overflow-hidden">
            <DesignSummary
              placedModules={placedModules}
              onSave={() => setSaveModalOpen(true)}
              onClear={handleClear}
              isSaving={saveMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Saved Designs overlay panel */}
      {showSaved && (
        <div className="absolute inset-0 z-40 bg-black/30 flex items-start justify-center pt-16" onClick={() => setShowSaved(false)}>
          <div
            className="bg-white border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">My Saved Designs</h2>
              <button onClick={() => setShowSaved(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <SavedDesigns
                designs={designs}
                onLoad={handleLoad}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </div>
          </div>
        </div>
      )}

      <SaveDesignModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={handleSave}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}