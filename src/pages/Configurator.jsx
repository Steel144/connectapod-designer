import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ModulePanel, { MODULE_TYPES } from "@/components/configurator/ModulePanel";
import ConfigGrid from "@/components/configurator/ConfigGrid";
import DesignSummary from "@/components/configurator/DesignSummary";
import SavedDesigns from "@/components/configurator/SavedDesigns";
import SaveDesignModal from "@/components/configurator/SaveDesignModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

let idCounter = 1;

export default function Configurator() {
  const [placedModules, setPlacedModules] = useState([]);
  const [draggingMod, setDraggingMod] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("configure");
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
    setActiveTab("configure");
    toast.success(`Loaded "${design.name}"`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">connectapod</h1>
            <p className="text-xs text-gray-500">Design your modular home</p>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 rounded-none h-9">
            <TabsTrigger value="configure" className="rounded-none text-xs h-7 px-4 data-[state=active]:bg-[#F15A22] data-[state=active]:text-white">Configurator</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-none text-xs h-7 px-4 data-[state=active]:bg-[#F15A22] data-[state=active]:text-white">
              My Designs {designs.length > 0 && <span className="ml-1.5 bg-gray-300 text-gray-700 rounded-full px-1.5 text-[10px]">{designs.length}</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "configure" && (
        <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-73px)]">
          {/* Left: Module Panel */}
          <div className="lg:w-64 shrink-0 bg-white border-r border-slate-100 overflow-y-auto p-4">
            <ModulePanel onDragStart={handleDragStart} />
          </div>

          {/* Center: Grid */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <ConfigGrid
              placedModules={placedModules}
              onPlace={handlePlace}
              onRemove={handleRemove}
              onMove={handleMove}
              draggingMod={draggingMod}
            />
          </div>

          {/* Right: Summary */}
          <div className="lg:w-64 shrink-0 bg-white border-l border-slate-100 p-4 overflow-y-auto">
            <DesignSummary
              placedModules={placedModules}
              onSave={() => setSaveModalOpen(true)}
              onClear={handleClear}
              isSaving={saveMutation.isPending}
            />
          </div>
        </div>
      )}

      {activeTab === "saved" && (
        <div className="p-6 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-6">My Saved Designs</h2>
          <SavedDesigns
            designs={designs}
            onLoad={handleLoad}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
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