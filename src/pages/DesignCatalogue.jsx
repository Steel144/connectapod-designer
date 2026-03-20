import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Maximize2, Layers, Tag, Play } from "lucide-react";
import DesignMiniPreview from "@/components/configurator/DesignMiniPreview";

export default function DesignCatalogue() {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState("All");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["homeDesigns", "templates"],
    queryFn: async () => { try { const r = await base44.entities.HomeDesign.filter({ is_template: true }); return Array.isArray(r) ? r : []; } catch { return []; } },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: moduleEntries = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: async () => { try { const r = await base44.entities.ModuleEntry.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: floorPlanImageList = [] } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => { try { const r = await base44.entities.FloorPlanImage.list(); return Array.isArray(r) ? r : []; } catch { return []; } },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Build lookup: moduleType code -> imageUrl
  const floorPlanImages = useMemo(() =>
    Object.fromEntries((Array.isArray(floorPlanImageList) ? floorPlanImageList : []).map(img => [img.moduleType, img.imageUrl])),
    [floorPlanImageList]
  );

  // Build lookup: label -> imageUrl (via ModuleEntry name -> code -> image)
  const labelToImage = useMemo(() => {
    const map = {};
    for (const entry of (Array.isArray(moduleEntries) ? moduleEntries : [])) {
      const imgUrl = floorPlanImages[entry.code] || (entry.originalCode && floorPlanImages[entry.originalCode]);
      if (imgUrl) map[entry.name] = imgUrl;
    }
    return map;
  }, [moduleEntries, floorPlanImages]);

  // Enrich grid items with resolved images
  const enrichedTemplates = useMemo(() =>
    (Array.isArray(templates) ? templates : []).map(design => ({
      ...design,
      grid: (design.grid || []).map(m => {
        const type = m.type || m.moduleType;
        const imgUrl = (type && floorPlanImages[type]) || (m.label && labelToImage[m.label]);
        return { ...m, type, floorPlanImage: imgUrl || m.floorPlanImage || null };
      }),
      walls: (design.walls || []).map(w => ({
        ...w,
        code: w.type || w.mpCode || w.label || w.code,
      })),
    })),
    [templates, floorPlanImages, labelToImage]
  );

  // Collect all unique tags
  const allTags = ["All", ...new Set(enrichedTemplates.flatMap((t) => t.tags || []))];

  const filtered = selectedTag === "All"
    ? enrichedTemplates
    : enrichedTemplates.filter((t) => (t.tags || []).includes(selectedTag));

  const handleStartDesign = (designId) => {
    // Find the enriched design with images included
    const design = enrichedTemplates.find(d => d.id === designId);
    if (design) {
      sessionStorage.setItem("load_template", JSON.stringify(design));
      navigate("/Configurator");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link to="/Configurator" className="text-gray-400 hover:text-[#F15A22] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Design Catalogue</h1>
          <p className="text-sm text-gray-500">Start with a pre-designed layout and customise it</p>
        </div>
      </div>

      {/* Tag filters */}
      <div className="px-6 pt-6 pb-2 flex gap-2 flex-wrap">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 text-xs font-medium border transition-all ${
              selectedTag === tag
                ? "bg-[#F15A22] text-white border-[#F15A22]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#F15A22] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base">No designs in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((design) => (
              <div key={design.id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                {/* Mini grid preview */}
                <div className="bg-[#F5F5F3] h-48 relative overflow-hidden border-b border-gray-100">
                  <DesignMiniPreview grid={design.grid || []} walls={design.walls || []} />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{design.name}</h3>
                  {design.description && (
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{design.description}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                    {design.moduleCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Layers size={11} className="text-[#F15A22]" />
                        {design.moduleCount} modules
                      </span>
                    )}
                    {design.totalSqm > 0 && (
                      <span className="flex items-center gap-1">
                        <Maximize2 size={11} className="text-[#F15A22]" />
                        {Math.round(design.totalSqm)} m²
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {design.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {design.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleStartDesign(design.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#F15A22] text-white text-xs font-semibold hover:bg-[#d94e1a] transition-colors"
                  >
                    <Play size={11} />
                    Start with this design
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}