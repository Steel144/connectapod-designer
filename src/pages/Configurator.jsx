import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { BookOpen, FolderOpen, Save, Trash2, ChevronLeft, ChevronRight, Undo2, Box, Grid2X2 } from "lucide-react";
import View3D from "@/components/configurator/View3D";

const generateId = () => `mod-${Math.random().toString(36).substr(2, 9)}`;
const generateWallId = () => `wall-${Math.random().toString(36).substr(2, 9)}`;

export default function Configurator() {
  const MAX_HISTORY = 10;
  const [history, setHistory] = useState([]); // stack of {placedModules, walls}
  const [placedModules, setPlacedModules] = useState([]);
  const [walls, setWalls] = useState([]);

  const pushHistory = useCallback((modules, w) => {
    setHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), { placedModules: modules, walls: w }]);
  }, []);
  const [draggingMod, setDraggingMod] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [viewMode, setViewMode] = useState("2d"); // "2d" | "3d"
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 16, y: 60 });
  const [draggingPanel, setDraggingPanel] = useState(null);
  const [summaryPos, setSummaryPos] = useState({ x: 16, y: 310 });
  const [draggingSummary, setDraggingSummary] = useState(null);
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

  const [isDraggingFromPanel, setIsDraggingFromPanel] = useState(false);
  const handleDragStart = (e, mod) => {
    setIsDraggingFromPanel(true);
    if (mod.orientation) {
      // Wall — wallType already set by ModulePanel
      return;
    }
    e.dataTransfer.setData("moduleType", mod.type);
    setDraggingMod(mod);
  };

  const handleDragEnd = () => {
    setIsDraggingFromPanel(false);
  };



  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop();
      setPlacedModules(last.placedModules);
      setWalls(last.walls);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo]);

  const handlePlace = (mod, x, y) => {
    pushHistory(placedModules, walls);
    setPlacedModules((prev) => [
      ...prev,
      { ...mod, id: generateId(), x, y },
    ]);
  };

  const handleRemove = (id) => {
    pushHistory(placedModules, walls);
    setPlacedModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMove = (id, x, y) => {
    pushHistory(placedModules, walls);
    setPlacedModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, x, y } : m))
    );
  };

  const handleRotate = (id) => {
    pushHistory(placedModules, walls);
    setPlacedModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const currentRotation = m.rotation || 0;
        const newRotation = (currentRotation + 90) % 360;
        const shouldSwap = newRotation === 90 || newRotation === 270;
        const baseW = m.baseW ?? m.w;
        const baseH = m.baseH ?? m.h;
        return {
          ...m,
          baseW,
          baseH,
          w: shouldSwap ? baseH : baseW,
          h: shouldSwap ? baseW : baseH,
          rotation: newRotation,
        };
      })
    );
  };

  const handleClear = () => {
    pushHistory(placedModules, walls);
    setPlacedModules([]);
    setWalls([]);
  };

  const handlePlaceWall = (wallData, x, y) => {
    pushHistory(placedModules, walls);
    setWalls((prev) => [
      ...prev,
      { ...wallData, id: generateWallId(), x, y },
    ]);
  };

  const handleRemoveWall = (id) => {
    pushHistory(placedModules, walls);
    setWalls((prev) => prev.filter((w) => w.id !== id));
  };

  const handleMoveWall = (id, x, y) => {
    pushHistory(placedModules, walls);
    setWalls((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w))
    );
  };

  const handleSave = (name) => {
    const totalSqm = placedModules.reduce((s, m) => s + m.sqm, 0);
    const estimatedPrice = placedModules.reduce((s, m) => s + m.price, 0);
    saveMutation.mutate({
      name,
      grid: placedModules,
      walls,
      totalSqm,
      estimatedPrice,
      moduleCount: placedModules.length,
    });
  };

  const handleLoad = (design) => {
    setPlacedModules(design.grid || []);
    setWalls(design.walls || []);
    setShowSaved(false);
    toast.success(`Loaded "${design.name}"`);
  };

  const handlePanelMouseDown = (e) => {
    if (e.target.closest("button")) return;
    const headerDiv = e.currentTarget.querySelector('[class*="border-b"]');
    if (!headerDiv || !headerDiv.contains(e.target)) return;
    setDraggingPanel({ startX: e.clientX, startY: e.clientY, panelX: panelPos.x, panelY: panelPos.y });
  };

  const handleMouseMove = (e) => {
    if (draggingPanel) {
      setPanelPos({
        x: draggingPanel.panelX + (e.clientX - draggingPanel.startX),
        y: draggingPanel.panelY + (e.clientY - draggingPanel.startY),
      });
    }
    if (draggingSummary) {
      handleSummaryMove(e);
    }
  };

  const handleMouseUp = () => {
    setDraggingPanel(null);
    setDraggingSummary(null);
  };

  const handleSummaryMouseDown = (e) => {
    if (e.target.closest("button")) return;
    const headerDiv = e.currentTarget.querySelector('[class*="border-b"]');
    if (!headerDiv || !headerDiv.contains(e.target)) return;
    setDraggingSummary({ startX: e.clientX, startY: e.clientY, summaryX: summaryPos.x, summaryY: summaryPos.y });
  };

  const handleSummaryMove = (e) => {
    if (!draggingSummary) return;
    setSummaryPos({
      x: draggingSummary.summaryX + (e.clientX - draggingSummary.startX),
      y: draggingSummary.summaryY + (e.clientY - draggingSummary.startY),
    });
  };

  return (
    <div 
      className="w-screen h-screen bg-[#F0EFEd] overflow-hidden relative flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur border-b border-gray-200">
        <div>
          <span className="text-base font-bold text-gray-900 tracking-tight">connectapod</span>
          <span className="ml-2 text-xs text-gray-400">Design Studio</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 2D / 3D toggle */}
          <div className="flex border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "2d" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`}
            >
              <Grid2X2 size={13} />
              2D
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${viewMode === "3d" ? "bg-[#F15A22] text-white" : "bg-white text-gray-600 hover:text-[#F15A22]"}`}
            >
              <Box size={13} />
              3D
            </button>
          </div>

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] disabled:opacity-30 transition-all"
          >
            <Undo2 size={13} />
            Undo {history.length > 0 && <span className="text-[10px] text-gray-400">({history.length})</span>}
          </button>
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
      <div className="flex-1 overflow-auto pt-12 relative">
        {viewMode === "3d" && (
          <div className="absolute inset-0 z-10">
            <View3D placedModules={placedModules} walls={walls} />
          </div>
        )}
        <ConfigGrid
          placedModules={placedModules}
          onPlace={handlePlace}
          onRemove={handleRemove}
          onMove={handleMove}
          onRotate={handleRotate}
          draggingMod={draggingMod}
          walls={walls}
          onPlaceWall={handlePlaceWall}
          onRemoveWall={handleRemoveWall}
          onMoveWall={handleMoveWall}
          hidden={viewMode === "3d"}
        />
      </div>

      {/* Floating left panel — Module picker */}
      <div
        className="absolute z-40 flex"
        style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px`, cursor: draggingPanel ? "grabbing" : "default" }}
      >
        <div
          className={`bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden transition-all duration-200 ${
            panelCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-64 opacity-100"
          }`}
          onMouseDown={handlePanelMouseDown}
        >
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 shrink-0 cursor-grab active:cursor-grabbing">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Module Library</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Expand a category · drag to place</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ModulePanel onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
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
           className="absolute z-20 w-60"
           style={{ left: `${summaryPos.x}px`, top: `${summaryPos.y}px`, cursor: draggingSummary ? "grabbing" : "default" }}
         >
           <div className="bg-white border border-gray-200 shadow-xl overflow-hidden" onMouseDown={handleSummaryMouseDown}>
             <div className="px-4 py-3 border-b border-gray-100 cursor-grab active:cursor-grabbing">
               <p className="text-xs font-semibold text-gray-800">Design Summary</p>
             </div>
             <div className="p-4">
               <DesignSummary
                 placedModules={placedModules}
                 onSave={() => setSaveModalOpen(true)}
                 onClear={handleClear}
                 isSaving={saveMutation.isPending}
               />
             </div>
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