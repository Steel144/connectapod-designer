import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil, Upload, X, Loader2, Plus, Trash2, Copy, Printer, Database } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AddModuleModal from "@/components/catalogue/AddModuleModal";
import EditModuleModal from "@/components/catalogue/EditModuleModal";
import PrintableCatalogue from "@/components/catalogue/PrintableCatalogue";
import BulkUploadModal from "@/components/catalogue/BulkUploadModal";
import { SEED_MODULES } from "@/data/modules";

// Category structure for organizing custom modules — all built-in modules hidden
const CATALOGUE = [
  { category: "Living", description: "Standard open modules with no internal partitions. Used for living, dining, sleeping areas.", modules: [] },
  { category: "Bedroom", description: "End-of-row modules with finished end walls. Available in left-hand (LF/LR) and right-hand (RF/RR) configurations.", modules: [] },
  { category: "Bathroom", description: "Standard bathroom module with shower, vanity, and toilet.", modules: [] },
  { category: "Laundry", description: "Modules with offset wall panels to create corner connections between perpendicular rows.", modules: [] },
  { category: "Kitchen", description: "End-of-row kitchen modules with finished end wall and full cabinetry layout.", modules: [] },
  { category: "Connection", description: "Modules that connect separate pavilions or buildings.", modules: [] },
  { category: "Soffit", description: "Soffit-only modules.", modules: [] },
  { category: "Deck", description: "Outdoor deck modules with wall panels and soffit options.", modules: [] },
];

const CATEGORY_COLORS = {
  "Living": "#E8F4FD",
  "Bedroom": "#F0FDF4",
  "Bathroom": "#F0F9FF",
  "Laundry": "#F5F3FF",
  "Kitchen": "#FFF1F2",
  "Soffit": "#F8FAFC",
  "Deck": "#F8FAFC",
};

export default function Catalogue() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [addingToCategory, setAddingToCategory] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [pendingUploadCode, setPendingUploadCode] = useState(null);

  const { data: customModules = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: () => base44.entities.ModuleEntry.list(),
  });

  const { data: deletedModules = [] } = useQuery({
    queryKey: ["deletedModules"],
    queryFn: () => base44.entities.DeletedModule.list(),
  });
  const deletedCodes = new Set(deletedModules.map(d => d.moduleCode));

  const handleAddModule = async (data) => {
    await base44.entities.ModuleEntry.create(data);
    queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
    setAddingToCategory(null);
    toast.success("Module added");
  };

  const handleSeedModules = async () => {
    setSeeding(true);
    try {
      const existingCodes = new Set(customModules.map(m => m.code));
      const modulesToAdd = SEED_MODULES.filter(m => !existingCodes.has(m.code));
      
      if (modulesToAdd.length === 0) {
        toast.info("All modules already exist in the catalogue");
        setSeeding(false);
        return;
      }
      
      let added = 0;
      for (const mod of modulesToAdd) {
        await base44.entities.ModuleEntry.create(mod);
        added++;
      }
      
      queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
      toast.success(`Added ${added} modules to the catalogue`);
    } catch (error) {
      toast.error("Failed to seed modules: " + (error.message || "Unknown error"));
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteModule = async (entryId) => {
    try {
      await base44.entities.ModuleEntry.delete(entryId);
      queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
      toast.success("Module removed");
    } catch (error) {
      toast.error("Failed to remove module");
    }
  };

  const handleDeleteBuiltinModule = async (code) => {
    await base44.entities.DeletedModule.create({ moduleCode: code });
    queryClient.invalidateQueries({ queryKey: ["deletedModules"] });
    toast.success("Module hidden");
  };

  const handleRestoreModule = async (code) => {
    const entry = deletedModules.find(d => d.moduleCode === code);
    if (entry) {
      await base44.entities.DeletedModule.delete(entry.id);
      queryClient.invalidateQueries({ queryKey: ["deletedModules"] });
      toast.success("Module restored");
    }
  };

  const handlePermanentlyDeleteModule = async (code) => {
    try {
      // If it's a custom module, delete the ModuleEntry entirely
      const customModule = customModules.find(m => m.code === code);
      if (customModule) {
        await base44.entities.ModuleEntry.delete(customModule.id);
      }
      
      // Remove associated DeletedModule record if it exists
      const deleted = await base44.entities.DeletedModule.filter({ moduleCode: code });
      if (deleted.length > 0) {
        await base44.entities.DeletedModule.delete(deleted[0].id);
      }
      
      // Always remove images
      const images = await base44.entities.FloorPlanImage.filter({ moduleType: code });
      for (const img of images) {
        await base44.entities.FloorPlanImage.delete(img.id);
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["moduleEntries"] }),
        queryClient.invalidateQueries({ queryKey: ["deletedModules"] }),
        queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] })
      ]);
      toast.success("Module purged forever");
    } catch (error) {
      console.error("Purge failed:", error);
      toast.error("Failed to purge module");
    }
  };

  const handleEditModule = async (data) => {
    // If code changed, migrate any associated image to the new code
    if (editingModule.code !== data.code) {
      const oldImage = await base44.entities.FloorPlanImage.filter({ moduleType: editingModule.code });
      if (oldImage.length > 0) {
        await base44.entities.FloorPlanImage.update(oldImage[0].id, { moduleType: data.code });
      }
    }

    // For Connection modules, ensure category is set to "Connection"
    let finalData = { ...data };
    const isConnection = data.variants && data.variants.includes("Connection");
    if (isConnection) {
      finalData.category = "Connection";
    }

    // Get the full module from customModules to preserve all fields
    const fullModule = editingModule._custom 
      ? customModules.find(m => m.id === editingModule._id)
      : customModules.find(c => c.originalCode === editingModule.code);

    if (editingModule._custom && fullModule) {
      // For custom modules, update directly
      await base44.entities.ModuleEntry.update(editingModule._id, {
        ...finalData,
        originalCode: editingModule.originalCode || undefined,
      });
    } else {
      // For builtin modules, we need to create/update an override
      const existingOverride = customModules.find(c => c.originalCode === editingModule.code);
      if (existingOverride) {
        // Update existing override
        await base44.entities.ModuleEntry.update(existingOverride.id, {
          ...finalData,
          categories: existingOverride.categories || [],
          originalCode: editingModule.code,
        });
      } else {
        // Create new override and hide the builtin
        await Promise.all([
          base44.entities.DeletedModule.create({ moduleCode: editingModule.code }),
          base44.entities.ModuleEntry.create({
            ...finalData,
            categories: [],
            originalCode: editingModule.code,
          }),
        ]);
      }
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["moduleEntries"] }),
      queryClient.invalidateQueries({ queryKey: ["deletedModules"] }),
      queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] }),
    ]);
    setEditingModule(null);
    toast.success("Module updated");
  };

  const { data: floorPlanImages = {} } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => {
      const images = await base44.entities.FloorPlanImage.list();
      return Object.fromEntries(images.map(img => [img.moduleType, img.imageUrl]));
    },
  });

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
    const existing = await base44.entities.FloorPlanImage.filter({ moduleType: pendingUploadCode });
    if (existing.length > 0) {
      await base44.entities.FloorPlanImage.update(existing[0].id, { imageUrl: file_url });
    } else {
      await base44.entities.FloorPlanImage.create({ moduleType: pendingUploadCode, imageUrl: file_url });
    }
    queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
    setUploading(null);
    toast.success("Image updated");
  };

  const handleRemoveImage = async (code) => {
    const existing = await base44.entities.FloorPlanImage.filter({ moduleType: code });
    if (existing.length > 0) {
      await base44.entities.FloorPlanImage.delete(existing[0].id);
      queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
      toast.success("Image removed");
    }
  };

  const handleDuplicateModule = async (mod, category) => {
    // Generate a new code with suffix
    const baseCodes = customModules.filter(m => m.code.startsWith(mod.code)).map(m => m.code);
    const nextSuffix = baseCodes.length > 0 ? String.fromCharCode(97 + baseCodes.length) : "a"; // a, b, c...
    const newCode = `${mod.code}${nextSuffix}`;

    // Find the full module data to preserve all fields
    const fullMod = customModules.find(m => m.code === mod.code);
    const newModule = {
      category,
      code: newCode,
      name: mod.name,
      width: mod.width,
      depth: mod.depth,
      description: mod.description,
      price: mod.price,
      variants: fullMod?.variants || mod.variants || [],
      wallElevations_list: fullMod?.wallElevations_list || mod.wallElevations_list || [],
      categories: fullMod?.categories || [],
    };

    await base44.entities.ModuleEntry.create(newModule);
    queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
    toast.success(`Duplicated as ${newCode}`);
  };

  const validCategories = Array.from(new Set([...CATALOGUE.map(c => c.category), "Connection"]));
  const categories = ["All", ...validCategories, "Uncategorized"];

  // Codes that have a custom override via originalCode
  const overriddenModuleCodes = new Set(customModules.filter(c => c.originalCode).map(c => c.originalCode));

  const moduleCodeNum = (code) => {
    const m = String(code).match(/\d+/);
    return m ? parseInt(m[0], 10) : 9999;
  };

  // Merge hardcoded + custom modules per category, combining duplicate categories
  const catalogueByCategory = CATALOGUE.reduce((acc, cat) => {
    const existing = acc.find(c => c.category === cat.category);
    if (existing) {
      existing.modules = [...existing.modules, ...cat.modules];
      existing.description = existing.description || cat.description;
    } else {
      acc.push({ ...cat });
    }
    return acc;
  }, []);

  // Add Uncategorized section for custom modules without matching descriptions
  const uncategorizedCustoms = customModules.filter(c => {
    const descriptions = (c.description || "").split(",").map(s => s.trim()).filter(Boolean);
    return descriptions.length === 0 || !descriptions.some(d => validCategories.includes(d));
  });
  if (uncategorizedCustoms.length > 0) {
    catalogueByCategory.push({
      category: "Uncategorized",
      description: "Modules without category assignments",
      modules: []
    });
  }

  const allCatalogue = catalogueByCategory.map(cat => {
    let customs = [];

    if (cat.category === "Uncategorized") {
      // For uncategorized, get modules without valid category assignments
      customs = uncategorizedCustoms.map(c => ({
        code: c.code, name: c.name, width: c.width || 3.0, depth: c.depth || 4.8,
        sqm: c.sqm || parseFloat(((c.width || 3.0) * (c.depth || 4.8)).toFixed(1)),
        description: c.description || "",
        chassisCodes: c.chassisCodes || [],
        variants: c.variants || [],
        wallElevations_list: c.wallElevations_list || [],
        wallElevations: { Z: c.wallElevationZ || "N/A", W: c.wallElevationW || "", Y: c.wallElevationY || "", X: c.wallElevationX || "N/A" },
        originalCode: c.originalCode || undefined,
        _custom: true, _id: c.id, _deleted: false,
      }));
    } else {
      // For other categories, get custom modules via description or categories field
      customs = customModules.filter(c => {
        const descriptions = (c.description || "").split(",").map(s => s.trim()).filter(Boolean);
        const categories = Array.isArray(c.categories) ? c.categories : [];
        const variants = Array.isArray(c.variants) ? c.variants.map(v => v.toLowerCase()) : [];
        const isConnection = variants.some(v => v.includes("connection"));

        if (cat.category === "Connection") {
          return isConnection || c.category === "Connection" || descriptions.includes("Connection");
        }

        return descriptions.includes(cat.category) || c.category === cat.category || categories.includes(cat.category);
      }).map(c => ({
          code: c.code, name: c.name, width: c.width || 3.0, depth: c.depth || 4.8,
          sqm: c.sqm || parseFloat(((c.width || 3.0) * (c.depth || 4.8)).toFixed(1)),
          description: c.description || "",
          chassisCodes: c.chassisCodes || [],
          variants: c.variants || [],
          wallElevations_list: c.wallElevations_list || [],
          wallElevations: { Z: c.wallElevationZ || "N/A", W: c.wallElevationW || "", Y: c.wallElevationY || "", X: c.wallElevationX || "N/A" },
          originalCode: c.originalCode || undefined,
          _custom: true, _id: c.id, _deleted: false,
        }));
    }

    const builtins = cat.category !== "Uncategorized" ? cat.modules
      .filter(m => {
        if (overriddenModuleCodes.has(m.code)) return false;
        if (!deletedCodes.has(m.code)) return true;
        return editMode; // Only show deleted modules in edit mode
      })
      .map(m => ({ ...m, _custom: false, _deleted: deletedCodes.has(m.code) })) : [];

    const merged = [...builtins, ...customs];
    merged.sort((a, b) => moduleCodeNum(a.originalCode || a.code) - moduleCodeNum(b.originalCode || b.code));
    return { ...cat, modules: merged };
  });

  const totalModules = allCatalogue.reduce((s, c) => s + c.modules.length, 0);

  const filtered = allCatalogue
    .filter(cat => activeCategory === "All" || cat.category === activeCategory)
    .map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || "").toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.modules.length > 0 || editMode);

  if (printMode) {
    const printCategories = filtered.map(cat => ({
      name: cat.category,
      description: cat.description,
      items: cat.modules.map(m => ({
        code: m.code,
        name: m.name,
        specs: `${m.width}m × ${m.depth}m (${m.sqm.toFixed(1)} m²)`,
        description: m.description || "—",
        variants: m.variants || [],
        imageUrl: floorPlanImages[m.code] || floorPlanImages[m.originalCode] || null,
      })),
    }));

    return (
      <PrintableCatalogue
        title="Module Catalogue"
        categories={printCategories}
        onClose={() => setPrintMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="shrink-0 flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" className="h-8 w-auto" />
            <span className="text-xs text-gray-400">Module Catalogue</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleSeedModules}
              disabled={seeding}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all disabled:opacity-50"
              title="Add all standard modules to catalogue"
            >
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              {seeding ? "Seeding..." : "Seed Modules"}
            </button>
            <button
              onClick={() => setBulkUploadOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
              title="Bulk upload floor plan images"
            >
              <Upload size={14} />
              Bulk Upload
            </button>
            <button
              onClick={() => setPrintMode(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
              title="Print catalogue as PDF"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border transition-all ${editMode ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              <Pencil size={13} />
              {editMode ? "Done Editing" : "Edit Catalogue"}
            </button>
            <button
              onClick={() => navigate("/Configurator")}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
            >
              <ChevronLeft size={16} />
              Exit
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search + Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search modules by name, code or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F15A22]"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2.5">
            <span className="font-bold text-gray-800">{totalModules}</span> module layouts across
            <span className="font-bold text-gray-800">{categories.length - 1}</span> categories
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${activeCategory === cat ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {bulkUploadOpen && (
          <BulkUploadModal
            existingModules={allCatalogue.flatMap(c => c.modules)}
            onClose={() => setBulkUploadOpen(false)}
            onDone={() => {
              queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
              queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
              setBulkUploadOpen(false);
              toast.success("Bulk upload complete");
            }}
          />
        )}

        {editingModule && (
          <EditModuleModal
            module={editingModule}
            onSave={handleEditModule}
            onClose={() => setEditingModule(null)}
          />
        )}

        {addingToCategory && (
          <AddModuleModal
            category={addingToCategory.category}
            onSave={handleAddModule}
            onClose={() => setAddingToCategory(null)}
          />
        )}

        {/* Catalogue Sections */}
        <div className="space-y-10">
          {filtered.map(cat => (
            <div key={cat.category}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{cat.category}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
                </div>
                {editMode && (
                  <button
                    onClick={() => setAddingToCategory(cat)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-[#F15A22] border border-[#F15A22] hover:bg-[#F15A22] hover:text-white transition-colors"
                  >
                    <Plus size={11} /> Add Module
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.modules.map((mod, idx) => (
                    <div
                      key={`${mod.code}-${idx}`}
                      className={`bg-white border p-4 transition-all group relative ${mod._deleted ? "border-red-200 opacity-50" : "border-gray-200 hover:shadow-md hover:border-[#F15A22]"}`}
                    >
                    {editMode && (
                       <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                         {mod._deleted ? (
                           <>
                             <button
                               onClick={() => handleRestoreModule(mod.code)}
                               className="text-xs text-green-600 hover:underline"
                             >Restore</button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handlePermanentlyDeleteModule(mod.code);
                               }}
                               className="text-xs text-red-600 hover:underline"
                             >Purge</button>
                           </>
                         ) : (
                           <>
                             <button
                               onClick={() => handleDuplicateModule(mod, cat.category)}
                               className="text-gray-300 hover:text-blue-500 transition-colors"
                               title="Duplicate module"
                             >
                               <Copy size={13} />
                             </button>
                             <button
                               onClick={() => {
                                 const fullMod = customModules.find(m => m.code === mod.code) || mod;
                                 setEditingModule({ ...fullMod, category: cat.category });
                               }}
                               className="text-gray-300 hover:text-[#F15A22] transition-colors"
                               title="Edit module"
                             >
                               <Pencil size={13} />
                             </button>
                             <button
                               onClick={() => mod._custom ? handleDeleteModule(mod._id) : handleDeleteBuiltinModule(mod.code)}
                               className="text-gray-300 hover:text-red-500 transition-colors"
                               title="Remove module"
                             >
                               <Trash2 size={13} />
                             </button>
                           </>
                         )}
                       </div>
                     )}

                    {/* Visual preview */}
                     <div
                       className="w-full mb-3 relative flex items-center justify-center border border-gray-100"
                       style={{ height: "240px", backgroundColor: CATEGORY_COLORS[cat.category] || "#F5F5F3" }}
                     >
                       {uploading === mod.code ? (
                         <Loader2 size={20} className="animate-spin text-[#F15A22]" />
                       ) : (floorPlanImages[mod.code] || floorPlanImages[mod.originalCode]) ? (
                         <>
                           <img src={floorPlanImages[mod.code] || floorPlanImages[mod.originalCode]} alt={mod.name} className="w-auto h-full object-contain" style={{ backgroundColor: 'white' }} />
                           {floorPlanImages[mod.code] && (
                             <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                               <span>✓</span> Matched
                             </div>
                           )}
                           {!floorPlanImages[mod.code] && floorPlanImages[mod.originalCode] && (
                             <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1" title="Using original code image">
                               <span>⚠</span> Original
                             </div>
                           )}
                         </>
                      ) : (
                        <div
                          className="bg-white border-2 border-gray-300 group-hover:border-[#F15A22] transition-colors flex items-center justify-center"
                          style={{ width: `${(mod.width / 3) * 60}%`, height: "80%" }}
                        >
                          <span className="text-xs font-mono text-gray-400 group-hover:text-[#F15A22]">
                            {mod.width}×{mod.depth}
                          </span>
                        </div>
                      )}
                       {editMode && uploading !== mod.code && (
                        <div className="absolute inset-0 bg-black/40 items-center justify-center gap-2 hidden group-hover:flex pointer-events-none">
                          <button
                            onClick={() => handleUploadClick(mod.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-white text-gray-800 text-xs font-medium hover:bg-[#F15A22] hover:text-white transition-colors pointer-events-auto"
                          >
                            <Upload size={11} /> Upload
                          </button>
                          {(floorPlanImages[mod.code] || floorPlanImages[mod.originalCode]) && (
                            <button
                              onClick={() => handleRemoveImage(mod.code)}
                              className="flex items-center gap-1 px-2 py-1 bg-white text-red-600 text-xs font-medium hover:bg-red-600 hover:text-white transition-colors pointer-events-auto"
                            >
                              <X size={11} /> Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800 leading-tight">{mod.name}</h3>
                      <span className="text-xs font-mono text-[#F15A22] bg-orange-50 px-1.5 py-0.5 shrink-0">{mod.code}</span>
                    </div>
                    {mod.description && <p className="text-xs text-gray-500 leading-relaxed mb-2">{mod.description}</p>}
                    {editMode && (
                      <button
                        onClick={() => {
                          const fullMod = customModules.find(m => m.code === mod.code) || mod;
                          setEditingModule({ ...fullMod, category: cat.category });
                        }}
                        className="text-xs text-gray-400 hover:text-[#F15A22] mb-2 transition-colors flex items-center gap-1"
                        title="Edit module details"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    )}

                    <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5 mb-3">
                      <span><span className="font-semibold text-gray-700">{mod.width}m</span> wide</span>
                      <span><span className="font-semibold text-gray-700">{mod.depth}m</span> deep</span>
                      <span><span className="font-semibold text-gray-700">{mod.sqm.toFixed(1)}</span> m²</span>
                    </div>


                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-medium">No modules found for "{search}"</p>
          </div>
        )}
      </div>
      <div className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white mt-4">
        © {new Date().getFullYear()} connectapod. All rights reserved.
      </div>
    </div>
  );
}
