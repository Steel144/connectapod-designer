import React, { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Pencil, Upload, X, Loader2, Plus, Trash2, Printer, Copy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AddWallModal from "@/components/catalogue/AddWallModal";
import EditWallModal from "@/components/catalogue/EditWallModal";
import PrintableCatalogue from "@/components/catalogue/PrintableCatalogue";
import BulkUploadWallModal from "@/components/catalogue/BulkUploadWallModal";

const widthColors = {
  600: "bg-purple-100 text-purple-700",
  1200: "bg-blue-100 text-blue-700",
  1800: "bg-cyan-100 text-cyan-700",
  2400: "bg-teal-100 text-teal-700",
  3000: "bg-orange-100 text-orange-700",
  4800: "bg-red-100 text-red-700",
  5200: "bg-rose-100 text-rose-700",
};

export default function WallCatalogue() {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [addingToGroup, setAddingToGroup] = useState(null);
  const [editingWall, setEditingWall] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [pendingUploadCode, setPendingUploadCode] = useState(null);

  const { data: wallImages = {} } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => {
      const images = await base44.entities.WallImage.list();
      return Object.fromEntries(images.map(img => [img.wallType, img.imageUrl]));
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch ALL walls from database
  const { data: allWalls = [], isLoading } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: () => base44.entities.WallEntry.list(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: deletedWalls = [] } = useQuery({
    queryKey: ["deletedWalls"],
    queryFn: () => base44.entities.DeletedWall.list(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const deletedCodes = new Set(deletedWalls.map(d => d.wallCode));

  // Dynamically group walls by width
  const wallGroups = useMemo(() => {
    if (!allWalls.length) return [];

    // Filter out deleted walls
    const activeWalls = allWalls.filter(wall => !deletedCodes.has(wall.code));

    // Group by width
    const grouped = new Map();
    activeWalls.forEach(wall => {
      const width = wall.width || 3000;
      if (!grouped.has(width)) {
        grouped.set(width, []);
      }
      grouped.get(width).push({
        ...wall,
        _custom: true,
        _id: wall.id,
        _deleted: false,
        _groupKey: `width-${width}`,
      });
    });

    // Convert to array and sort groups by width
    const groups = Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([width, walls]) => {
        // Sort walls within group by code
        walls.sort((a, b) => {
          const codeA = String(a.code).toLowerCase();
          const codeB = String(b.code).toLowerCase();
          return codeA.localeCompare(codeB);
        });

        // Generate group label
        let label = `${(width / 1000).toFixed(1)}m Module Walls`;
        if (width === 5200) label = "5.2m Gable Walls";
        else if (width === 4800) label = "4.8m Walls";

        return {
          key: `width-${width}`,
          label,
          width,
          walls,
        };
      });

    return groups;
  }, [allWalls, deletedCodes]);

  const handleDeleteBuiltinWall = async (code) => {
    await base44.entities.DeletedWall.create({ wallCode: code });
    queryClient.invalidateQueries({ queryKey: ["deletedWalls"] });
    toast.success("Wall hidden");
  };

  const handlePermanentlyDeleteWall = async (code) => {
    const entry = deletedWalls.find(d => d.wallCode === code);
    if (entry) {
      await base44.entities.DeletedWall.delete(entry.id);
      queryClient.invalidateQueries({ queryKey: ["deletedWalls"] });
      toast.success("Wall permanently deleted");
    }
  };

  const handleAddWall = async (data) => {
    await base44.entities.WallEntry.create(data);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    setAddingToGroup(null);
    toast.success("Wall added");
  };

  const handleDeleteWall = async (entryId) => {
    await base44.entities.WallEntry.delete(entryId);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    toast.success("Wall removed");
  };

  const handleDuplicateWall = async (wall, groupKey) => {
    const baseCodes = allWalls.filter(w => w.code.startsWith(wall.code)).map(w => w.code);
    const nextSuffix = baseCodes.length > 0 ? String.fromCharCode(97 + baseCodes.length) : "a";
    const newCode = `${wall.code}${nextSuffix}`;
    await base44.entities.WallEntry.create({
      groupKey,
      code: newCode,
      name: wall.name,
      width: wall.width,
      description: wall.description || "",
      variants: wall.variants || [],
      windowStyle: wall.windowStyle,
      openingPanes: wall.openingPanes != null ? wall.openingPanes : undefined,
      windowHeight: wall.windowHeight != null ? wall.windowHeight : undefined,
      windowWidth: wall.windowWidth != null ? wall.windowWidth : undefined,
      doorStyle: wall.doorStyle || null,
      doorHeight: wall.doorHeight != null ? wall.doorHeight : undefined,
      doorWidth: wall.doorWidth != null ? wall.doorWidth : undefined,
      price: wall.price,
    });
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    toast.success(`Duplicated as ${newCode}`);
  };

  const handleEditWall = async (data) => {
    await base44.entities.WallEntry.update(editingWall._id, data);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    setEditingWall(null);
    toast.success("Wall updated");
  };

  const handleUploadClick = (code) => {
    setPendingUploadCode(code);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingUploadCode) return;
    e.target.value = "";
    setUploading(pendingUploadCode);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = await base44.entities.WallImage.filter({ wallType: pendingUploadCode });
    if (existing.length > 0) {
      await base44.entities.WallImage.update(existing[0].id, { imageUrl: file_url });
    } else {
      await base44.entities.WallImage.create({ wallType: pendingUploadCode, imageUrl: file_url });
    }
    queryClient.invalidateQueries({ queryKey: ["wallImages"] });
    setUploading(null);
    toast.success("Image updated");
  };

  const handleRemoveImage = async (code) => {
    const existing = await base44.entities.WallImage.filter({ wallType: code });
    if (existing.length > 0) {
      await base44.entities.WallImage.delete(existing[0].id);
      queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      toast.success("Image removed");
    }
  };

  const filtered = wallGroups
    .filter(g => activeGroup === "all" || g.key === activeGroup)
    .map(g => ({
      ...g,
      walls: g.walls.filter(w =>
        search === "" ||
        w.code.toLowerCase().includes(search.toLowerCase()) ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.description || "").toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter(g => g.walls.length > 0 || editMode);

  const totalWalls = wallGroups.reduce((s, g) => s + g.walls.length, 0);

  if (printMode) {
    const printCategories = filtered.map(group => ({
      name: group.label,
      description: `${(group.width / 1000).toFixed(1)}m walls`,
      items: group.walls.map(w => ({
        code: w.code,
        name: w.name,
        specs: `${(w.width / 1000).toFixed(1)}m`,
        description: w.description || "—",
        variants: w.variants || [],
        imageUrl: wallImages[w.code] || wallImages[w.originalCode] || null,
      })),
    }));

    return (
      <PrintableCatalogue
        title="Wall Catalogue"
        categories={printCategories}
        onClose={() => setPrintMode(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#F15A22]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="shrink-0 flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" className="h-8 w-auto" />
            <span className="text-xs text-gray-400">Wall Catalogue</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-[#F15A22] hover:bg-[#D14A1A] transition-all"
              title="Bulk upload wall elevation images"
            >
              <Upload size={14} />
              Bulk Upload
            </button>
            <button
              type="button"
              onClick={() => setPrintMode(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
              title="Print catalogue as PDF"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              type="button"
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border transition-all ${editMode ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              <Pencil size={13} />
              {editMode ? "Done Editing" : "Edit Catalogue"}
            </button>
            <Link to="/Configurator" className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all">
              <ChevronLeft size={16} />
              Exit
            </Link>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-0">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by code or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F15A22]"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2.5">
            <span className="font-bold text-gray-800">{totalWalls}</span> wall panels across
            <span className="font-bold text-gray-800">{wallGroups.length}</span> series
          </div>
        </form>
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveGroup("all")}
            className={`px-3 py-1.5 text-xs font-medium border transition-all ${activeGroup === "all" ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
          >
            All Series
          </button>
          {wallGroups.map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => setActiveGroup(g.key)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${activeGroup === g.key ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              {g.label.split("–")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {editingWall && (
        <EditWallModal
          wall={editingWall}
          onSave={handleEditWall}
          onClose={() => setEditingWall(null)}
        />
      )}

      {addingToGroup && (
        <AddWallModal
          groupKey={addingToGroup.key}
          groupLabel={addingToGroup.label}
          onSave={handleAddWall}
          onClose={() => setAddingToGroup(null)}
          existingWalls={allWalls}
        />
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8 space-y-10">
        {filtered.map(group => (
          <div key={group.key}>
            <div className="mb-4 pb-2 border-b border-gray-200 flex items-baseline gap-3">
              <h2 className="text-base font-bold text-gray-800">{group.label}</h2>
              <span className="text-xs text-gray-400 font-mono">{(group.width / 1000).toFixed(1)}m width</span>
              <span className="ml-auto text-xs text-gray-400">{group.walls.length} panels</span>
              {editMode && (
                <button
                  type="button"
                  onClick={() => setAddingToGroup(group)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#F15A22] border border-[#F15A22] hover:bg-[#F15A22] hover:text-white transition-colors"
                >
                  <Plus size={11} /> Add Wall
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.walls.map(wall => (
                <div key={wall._id} className={`bg-white border p-4 transition-colors group relative ${wall._deleted ? "border-red-200 opacity-50" : "border-gray-200 hover:border-[#F15A22]"}`}>
                  {/* Width badge + delete */}
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${widthColors[wall.width] || "bg-gray-100 text-gray-600"}`}>
                      {(wall.width / 1000).toFixed(1)}m
                    </span>
                    {editMode && !wall._deleted && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateWall(wall, group.key)}
                          className="text-gray-300 hover:text-blue-500 transition-colors"
                          title="Duplicate wall"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingWall(wall)}
                          className="text-gray-300 hover:text-[#F15A22] transition-colors"
                          title="Edit this wall"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWall(wall._id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Remove this wall"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Wall image */}
                   <div className="w-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 relative" style={{ height: "240px" }}>
                     {uploading === wall.code ? (
                       <Loader2 size={20} className="animate-spin text-[#F15A22]" />
                     ) : wallImages[wall.code] ? (
                       <>
                         <img src={wallImages[wall.code]} alt={wall.name} className="w-auto h-full object-contain" style={{ backgroundColor: 'white' }} />
                         <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                           <span>✓</span> Matched
                         </div>
                       </>
                     ) : (
                       <div
                         className="bg-white border border-gray-300"
                         style={{ width: `${(wall.width / 3000) * 60}%`, height: "80%" }}
                       />
                     )}
                    {editMode && uploading !== wall.code && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUploadClick(wall.code)}
                          className="flex items-center gap-1 px-2 py-1 bg-white text-gray-800 text-xs font-medium hover:bg-[#F15A22] hover:text-white transition-colors"
                        >
                          <Upload size={11} /> Upload
                        </button>
                        {wallImages[wall.code] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(wall.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-white text-red-600 text-xs font-medium hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <X size={11} /> Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-800 leading-tight mb-1 group-hover:text-[#F15A22] transition-colors">{wall.name}</p>
                  <p className="text-[10px] font-mono text-gray-400 mb-2">{wall.code}</p>
                  <p className="text-[10px] text-gray-500 mb-2">{wall.description || "—"}</p>

                  {/* Variants */}
                  <div className="space-y-0.5">
                    {(wall.variants || []).map(v => (
                      <div key={v} className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {v}
                      </div>
                    ))}
                  </div>

                  {wall.price && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-700 font-semibold">${wall.price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No walls found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      <div className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white mt-8">
        © {new Date().getFullYear()} connectapod. All rights reserved. · {totalWalls} wall panels across {wallGroups.length} series
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadWallModal
          onClose={() => setShowBulkUpload(false)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ["wallImages"] });
            queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
            toast.success("Wall images uploaded successfully!");
          }}
        />
      )}
    </div>
  );
}
