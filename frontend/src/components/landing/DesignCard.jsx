import React, { useState } from "react";
import { Maximize2, BedDouble, Bath, ArrowRight, Pencil, Trash2, Upload } from "lucide-react";
import DesignMiniPreview from "@/components/configurator/DesignMiniPreview";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

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
  guest_accommodation: "Guest Accommodation",
  multi_generational: "Multi-Generational",
  bach: "Bach",
};

export default function DesignCard({ design, onSelect, isFeatured, isAdmin = false }) {
  const qc = useQueryClient();
  const primaryCategory = design.categories?.[0];
  const heroImage = design.heroImage;
  const grid = design.template_payload?.layout?.grid || [];
  const walls = design.template_payload?.layout?.walls || [];
  const furniture = design.template_payload?.layout?.furniture || [];
  const hasPlanPreview = grid.length > 0;

  // Editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [uploading, setUploading] = useState(false);

  const startEdit = (e, field, currentValue) => {
    if (!isAdmin) return;
    e.stopPropagation();
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const saveEdit = async (e, field) => {
    e.stopPropagation();
    if (editValue === (design[field] || "")) {
      setEditingField(null);
      return;
    }
    
    const update = {};
    if (field === "bedrooms" || field === "bathrooms" || field === "size_sqm" || field === "starting_price") {
      update[field] = editValue !== "" ? Number(editValue) : null;
    } else {
      update[field] = editValue;
    }
    
    await base44.entities.DesignTemplate.update(design.id, update);
    qc.invalidateQueries({ queryKey: ["designTemplates"] });
    setEditingField(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingField(null);
  };

  const handleImageUpload = async (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    // For now, just use a placeholder URL
    // In production, upload to your CDN/storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      await base44.entities.DesignTemplate.update(design.id, { 
        heroImage: reader.result 
      });
      qc.invalidateQueries({ queryKey: ["designTemplates"] });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const deleteHeroImage = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete hero image?")) return;
    await base44.entities.DesignTemplate.update(design.id, { heroImage: null });
    qc.invalidateQueries({ queryKey: ["designTemplates"] });
  };

  return (
    <div
      className={`bg-white border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col ${
        isFeatured ? "border-[#F15A22] shadow-md" : "border-gray-200"
      }`}
      onClick={() => onSelect(design)}
    >
      {/* Preview */}
      <div className="relative h-64 overflow-hidden bg-[#F5F5F3] flex-shrink-0 group/preview">
        {hasPlanPreview ? (
          <DesignMiniPreview grid={grid} walls={walls} furniture={furniture} />
        ) : heroImage ? (
          <>
            <img
              src={heroImage}
              alt={design.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                <label className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-[#F15A22] shadow-sm cursor-pointer transition-colors">
                  <Upload size={13} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                <button
                  onClick={deleteHeroImage}
                  className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 shadow-sm transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            {isAdmin ? (
              <label className="flex flex-col items-center gap-2 cursor-pointer hover:text-[#F15A22] transition-colors">
                <Upload size={24} />
                <span>Upload hero image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            ) : (
              "No preview"
            )}
          </div>
        )}
        {isFeatured && (
          <div className="absolute top-0 left-0 right-0 bg-[#F15A22] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 text-center">
            Popular Choice
          </div>
        )}
        {primaryCategory && (
          <span className={`absolute left-3 bg-white/90 text-gray-700 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 ${isFeatured ? "top-8" : "top-3"}`}>
            {CATEGORY_LABELS[primaryCategory] || primaryCategory}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Editable name */}
        {editingField === "name" ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={(e) => saveEdit(e, "name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit(e, "name");
              if (e.key === "Escape") cancelEdit(e);
            }}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-gray-900 text-base mb-1 leading-tight border border-[#F15A22] px-2 py-1 focus:outline-none"
          />
        ) : (
          <h3 
            className={`font-bold text-gray-900 text-base mb-1 leading-tight ${isAdmin ? "cursor-pointer hover:bg-yellow-50 px-2 py-1 -mx-2 -my-1" : ""}`}
            onClick={(e) => startEdit(e, "name", design.name)}
          >
            {design.name}
            {isAdmin && <Pencil size={11} className="inline ml-1 opacity-0 group-hover:opacity-100 text-[#F15A22]" />}
          </h3>
        )}
        
        {/* Editable description */}
        {editingField === "description" ? (
          <textarea
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={(e) => saveEdit(e, "description")}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelEdit(e);
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-500 mb-4 leading-relaxed border border-[#F15A22] px-2 py-1 focus:outline-none resize-none"
            rows={3}
          />
        ) : design.description ? (
          <p 
            className={`text-xs text-gray-500 mb-4 leading-relaxed ${isAdmin ? "cursor-pointer hover:bg-yellow-50 px-2 py-1 -mx-2 -my-1" : ""}`}
            onClick={(e) => startEdit(e, "description", design.description)}
          >
            {design.description}
            {isAdmin && <Pencil size={10} className="inline ml-1 opacity-0 group-hover:opacity-100 text-[#F15A22]" />}
          </p>
        ) : isAdmin ? (
          <p 
            className="text-xs text-gray-400 italic mb-4 cursor-pointer hover:bg-yellow-50 px-2 py-1 -mx-2 -my-1"
            onClick={(e) => startEdit(e, "description", "")}
          >
            + Add description
          </p>
        ) : null}

        {/* Bottom section pushed to end */}
        <div className="mt-auto">
          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            {(design.size_sqm || editingField === "size_sqm" || isAdmin) && (
              editingField === "size_sqm" ? (
                <span className="flex items-center gap-1.5">
                  <Maximize2 size={13} className="text-[#F15A22]" />
                  <input
                    autoFocus
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) => saveEdit(e, "size_sqm")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(e, "size_sqm");
                      if (e.key === "Escape") cancelEdit(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 border border-[#F15A22] px-1 focus:outline-none"
                  />
                  m²
                </span>
              ) : (
                <span 
                  className={`flex items-center gap-1.5 ${isAdmin ? "cursor-pointer hover:bg-yellow-50 px-1 -mx-1" : ""}`}
                  onClick={(e) => startEdit(e, "size_sqm", design.size_sqm)}
                >
                  <Maximize2 size={13} className="text-[#F15A22]" />
                  {design.size_sqm || (isAdmin ? "+" : "")}m²
                  {isAdmin && <Pencil size={9} className="opacity-0 group-hover:opacity-100 text-[#F15A22]" />}
                </span>
              )
            )}
            {(design.bedrooms != null || editingField === "bedrooms" || isAdmin) && (
              editingField === "bedrooms" ? (
                <span className="flex items-center gap-1.5">
                  <BedDouble size={13} className="text-[#F15A22]" />
                  <input
                    autoFocus
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) => saveEdit(e, "bedrooms")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(e, "bedrooms");
                      if (e.key === "Escape") cancelEdit(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-12 border border-[#F15A22] px-1 focus:outline-none"
                  />
                  bed
                </span>
              ) : (
                <span 
                  className={`flex items-center gap-1.5 ${isAdmin ? "cursor-pointer hover:bg-yellow-50 px-1 -mx-1" : ""}`}
                  onClick={(e) => startEdit(e, "bedrooms", design.bedrooms ?? "")}
                >
                  <BedDouble size={13} className="text-[#F15A22]" />
                  {design.bedrooms === 0 ? "Studio" : design.bedrooms != null ? `${design.bedrooms} bed` : isAdmin ? "+ bed" : ""}
                  {isAdmin && <Pencil size={9} className="opacity-0 group-hover:opacity-100 text-[#F15A22]" />}
                </span>
              )
            )}
            {(design.bathrooms != null || editingField === "bathrooms" || isAdmin) && (
              editingField === "bathrooms" ? (
                <span className="flex items-center gap-1.5">
                  <Bath size={13} className="text-[#F15A22]" />
                  <input
                    autoFocus
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) => saveEdit(e, "bathrooms")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(e, "bathrooms");
                      if (e.key === "Escape") cancelEdit(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-12 border border-[#F15A22] px-1 focus:outline-none"
                  />
                  bath
                </span>
              ) : (
                <span 
                  className={`flex items-center gap-1.5 ${isAdmin ? "cursor-pointer hover:bg-yellow-50 px-1 -mx-1" : ""}`}
                  onClick={(e) => startEdit(e, "bathrooms", design.bathrooms ?? "")}
                >
                  <Bath size={13} className="text-[#F15A22]" />
                  {design.bathrooms != null ? `${design.bathrooms} bath` : isAdmin ? "+ bath" : ""}
                  {isAdmin && <Pencil size={9} className="opacity-0 group-hover:opacity-100 text-[#F15A22]" />}
                </span>
              )
            )}
          </div>

          {/* Use cases */}
          {design.use_cases?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {design.use_cases.slice(0, 3).map((uc) => (
                <span key={uc} className="px-2 py-0.5 bg-orange-50 text-[#F15A22] text-[10px] font-medium">
                  {USE_CASE_LABELS[uc] || uc}
                </span>
              ))}
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Starting from</p>
              {editingField === "starting_price" ? (
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900">$</span>
                  <input
                    autoFocus
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={(e) => saveEdit(e, "starting_price")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(e, "starting_price");
                      if (e.key === "Escape") cancelEdit(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 text-lg font-bold border border-[#F15A22] px-1 focus:outline-none"
                  />
                </div>
              ) : (
                <p 
                  className={`text-lg font-bold text-gray-900 ${isAdmin ? "cursor-pointer hover:bg-yellow-50 px-1 -mx-1" : ""}`}
                  onClick={(e) => startEdit(e, "starting_price", design.starting_price)}
                >
                  ${((design.starting_price || 0)).toLocaleString()}
                  {isAdmin && <Pencil size={10} className="inline ml-1 opacity-0 group-hover:opacity-100 text-[#F15A22]" />}
                </p>
              )}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#F15A22] text-white text-xs font-semibold hover:bg-[#d94e1a] transition-colors group-hover:gap-3">
              View Design <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}