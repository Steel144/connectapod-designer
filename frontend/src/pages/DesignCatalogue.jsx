import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Maximize2, Layers, Play, HelpCircle, BedDouble, Bath, DollarSign, Star, Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DesignMiniPreview from "@/components/configurator/DesignMiniPreview";
import InstructionsModal from "@/components/InstructionsModal";
import EditTemplateModal from "@/components/catalogue/EditTemplateModal";
import { useAuth } from "@/lib/AuthContext";

const CATEGORY_LABELS = {
  granny_flat: "Granny Flat",
  minor_dwelling: "Minor Dwelling",
  standalone_home: "Standalone Home",
  studio: "Studio",
  multi_unit: "Multi Unit",
};

const USE_CASE_LABELS = {
  rental_income: "Rental Income",
  family: "Family",
  home_office: "Home Office",
  guest_accommodation: "Guest",
  multi_generational: "Multi-Gen",
  bach: "Bach",
};

const CELL_M = 0.6;

const isDeckModule = (m) =>
  m.chassis === "DK" || 
  m.chassis === "SO" || 
  m.type?.includes("-D-") || 
  m.type?.includes("-SO-") ||
  m.label?.toLowerCase().includes("deck") || 
  m.label?.toLowerCase().includes("soffit");

export default function DesignCatalogue() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showInstructions, setShowInstructions] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  
  const isAdmin = user?.role === 'admin';

  const { data: designTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["designTemplates"],
    queryFn: async () => { try { const r = await base44.entities.DesignTemplate.list("sort_order"); return Array.isArray(r) ? r : []; } catch { return []; } },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: floorPlanImageList = [] } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => { try { const r = await base44.entities.FloorPlanImage.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
    staleTime: 0,
  });

  const { data: wallImageList = [] } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => { try { const r = await base44.entities.WallImage.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
    staleTime: 0,
  });

  const floorPlanImages = useMemo(() =>
    Object.fromEntries((Array.isArray(floorPlanImageList) ? floorPlanImageList : []).map(img => [img.moduleType, img.imageUrl])),
    [floorPlanImageList]
  );

  const wallImages = useMemo(() =>
    Object.fromEntries((Array.isArray(wallImageList) ? wallImageList : []).map(img => [img.wallType, img.imageUrl])),
    [wallImageList]
  );

  const enrichedTemplates = useMemo(() =>
    designTemplates.map(t => {
      const payload = t.template_payload || {};
      const grid = (payload.layout?.grid || []).map(m => {
        const img = floorPlanImages[m.type] || floorPlanImages[m.type?.toLowerCase()] || m.floorPlanImage || null;
        return { ...m, floorPlanImage: img };
      });
      const walls = (payload.layout?.walls || []).map(w => {
        const wallCode = w.type || w.mpCode || w.label || null;
        const img = wallCode ? (wallImages[wallCode] || null) : null;
        return { ...w, elevationImage: img || w.elevationImage || null };
      });
      
      // Dynamically calculate internal/deck sqm from grid modules
      let internal_sqm = t.internal_sqm;
      let deck_sqm = t.deck_sqm;
      if (internal_sqm == null || deck_sqm == null) {
        const rawGrid = payload.layout?.grid || [];
        let calcInternal = 0;
        let calcDeck = 0;
        rawGrid.forEach(m => {
          const area = m.sqm || (m.w * m.h * CELL_M * CELL_M);
          if (isDeckModule(m)) {
            calcDeck += area;
          } else {
            calcInternal += area;
          }
        });
        if (internal_sqm == null) internal_sqm = calcInternal;
        if (deck_sqm == null) deck_sqm = calcDeck;
      }
      
      return { ...t, _grid: grid, _walls: walls, internal_sqm, deck_sqm };
    }),
    [designTemplates, floorPlanImages, wallImages]
  );

  // Compute categories from raw templates to avoid waiting for enrichment
  const allCategories = useMemo(
    () => ["All", ...new Set(designTemplates.flatMap(t => t.categories || []))],
    [designTemplates]
  );

  // Filter enriched templates by selected category
  const filtered = useMemo(() => {
    if (selectedCategory === "All") return enrichedTemplates;
    return enrichedTemplates.filter(t => (t.categories || []).includes(selectedCategory));
  }, [selectedCategory, enrichedTemplates]);

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    await base44.entities.DesignTemplate.delete(template.id);
    qc.invalidateQueries({ queryKey: ["designTemplates"] });
  };

  const handleStartDesign = (template) => {
    const payload = template.template_payload || {};
    const design = {
      name: template.name,
      grid: template._grid,
      walls: template._walls,
      furniture: payload.layout?.furniture || [],
    };
    sessionStorage.setItem("load_template", JSON.stringify(design));
    navigate("/Configurator");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F8F7F5]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/Configurator" className="text-gray-400 hover:text-[#F15A22] transition-colors">
                  <ArrowLeft size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Back to Configurator</TooltipContent>
            </Tooltip>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Design Catalogue</h1>
              <p className="text-sm text-gray-500">Start with a pre-designed layout and customise it</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowInstructions(true)} className="p-2 text-gray-400 hover:text-[#F15A22] transition-colors">
                <HelpCircle size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>View instructions</TooltipContent>
          </Tooltip>
        </div>

        {/* Category filters */}
        <div className="px-6 pt-6 pb-2 flex gap-2 flex-wrap">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                selectedCategory === cat
                  ? "bg-[#F15A22] text-white border-[#F15A22]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
              }`}
            >
              {cat === "All" ? "All" : (CATEGORY_LABELS[cat] || cat)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="px-6 py-6">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#F15A22] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-base">No designs in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((template) => (
                <div key={template.id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                  {/* Mini grid preview */}
                  <div 
                    className="bg-[#F5F5F3] h-48 relative overflow-hidden border-b border-gray-100"
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                  >
                    {isAdmin && (
                      <div className="absolute top-2 left-2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); }}
                          className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-[#F15A22] shadow-sm transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(template); }}
                          className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 shadow-sm transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    
                    {/* Show hero image if exists, otherwise floor plan */}
                    {template.heroImage ? (
                      <img src={template.heroImage} alt={template.name} className="w-full h-full object-cover" />
                    ) : template._grid.length > 0 ? (
                      <DesignMiniPreview grid={template._grid} walls={template._walls} furniture={template.template_payload?.layout?.furniture || []} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No preview</div>
                    )}

                    {/* Hover popup: show floor plan if hero image exists */}
                    {hoveredTemplate === template.id && template.heroImage && template._grid.length > 0 && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                        <div className="w-full h-full border-2 border-[#F15A22] overflow-hidden">
                          <DesignMiniPreview grid={template._grid} walls={template._walls} furniture={template.template_payload?.layout?.furniture || []} />
                        </div>
                      </div>
                    )}

                    {template.is_featured && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#F15A22] text-white text-[10px] font-bold px-2 py-0.5">
                        <Star size={9} /> Featured
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {/* Name */}
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-tight">{template.name}</h3>

                    {/* Description */}
                    {template.description && (
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{template.description}</p>
                    )}

                    {/* Bottom info — pushed to end */}
                    <div className="mt-auto">
                      {/* Specs */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-600">
                        {template.bedrooms > 0 && (
                          <span className="flex items-center gap-1"><BedDouble size={11} className="text-[#F15A22]" />{template.bedrooms} bed</span>
                        )}
                        {template.bathrooms > 0 && (
                          <span className="flex items-center gap-1"><Bath size={11} className="text-[#F15A22]" />{template.bathrooms} bath</span>
                        )}
                        
                        {/* Area display - show separated if both exist, otherwise total */}
                        {template.internal_sqm > 0 && template.deck_sqm > 0 ? (
                          <>
                            <span className="flex items-center gap-1" title="Internal Floor Area">
                              <Maximize2 size={11} className="text-[#F15A22]" />
                              {Number(template.internal_sqm).toFixed(1)}m² int
                            </span>
                            <span className="flex items-center gap-1" title="Deck Area">
                              <Layers size={11} className="text-[#F15A22]" />
                              {Number(template.deck_sqm).toFixed(1)}m² deck
                            </span>
                            <span className="flex items-center gap-1 text-gray-400" title="Total Area">
                              {(Number(template.internal_sqm) + Number(template.deck_sqm)).toFixed(1)}m² total
                            </span>
                          </>
                        ) : template.internal_sqm > 0 ? (
                          <span className="flex items-center gap-1">
                            <Maximize2 size={11} className="text-[#F15A22]" />
                            {Number(template.internal_sqm).toFixed(1)}m²
                          </span>
                        ) : template.size_sqm > 0 && (
                          <span className="flex items-center gap-1">
                            <Maximize2 size={11} className="text-[#F15A22]" />
                            {template.size_sqm}m²
                          </span>
                        )}
                      </div>

                      {/* Use cases */}
                      {template.use_cases?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.use_cases.map(uc => (
                            <span key={uc} className="px-2 py-0.5 bg-orange-50 text-[#F15A22] text-[10px] border border-orange-100">
                              {USE_CASE_LABELS[uc] || uc}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Categories */}
                      {template.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.categories.map(c => (
                            <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px]">
                              {CATEGORY_LABELS[c] || c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      {template.starting_price > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold mb-3">
                          <DollarSign size={11} className="text-[#F15A22]" />
                          From ${template.starting_price.toLocaleString()} NZD
                        </div>
                      )}

                      <button
                        onClick={() => handleStartDesign(template)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#F15A22] text-white text-xs font-semibold hover:bg-[#d94e1a] transition-colors"
                      >
                        <Play size={11} />
                        Start with this design
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
        {editingTemplate && <EditTemplateModal template={editingTemplate} onClose={() => setEditingTemplate(null)} />}
      </div>
    </TooltipProvider>
  );
}