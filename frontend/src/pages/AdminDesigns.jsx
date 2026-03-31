import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Upload, Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDesigns() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["designTemplates"],
    queryFn: async () => {
      try {
        const r = await base44.entities.DesignTemplate.list("sort_order");
        return Array.isArray(r) ? r : [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.DesignTemplate.update(id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["designTemplates"] });
      toast.success("Design updated");
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.DesignTemplate.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["designTemplates"] });
      toast.success("Design deleted");
      setConfirmDeleteId(null);
    },
  });

  const startEdit = (design) => {
    setEditingId(design.id);
    setEditForm({
      name: design.name || "",
      description: design.description || "",
      size_sqm: design.size_sqm || "",
      bedrooms: design.bedrooms ?? "",
      bathrooms: design.bathrooms ?? "",
      starting_price: design.starting_price || "",
      heroImage: design.heroImage || "",
    });
  };

  const saveEdit = () => {
    const data = {
      ...editForm,
      size_sqm: editForm.size_sqm !== "" ? Number(editForm.size_sqm) : null,
      bedrooms: editForm.bedrooms !== "" ? Number(editForm.bedrooms) : null,
      bathrooms: editForm.bathrooms !== "" ? Number(editForm.bathrooms) : null,
      starting_price: editForm.starting_price !== "" ? Number(editForm.starting_price) : null,
    };
    updateMutation.mutate({ id: editingId, data });
  };

  const handleImageUpload = async (e, designId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await base44.entities.DesignTemplate.update(designId, { heroImage: reader.result });
      qc.invalidateQueries({ queryKey: ["designTemplates"] });
      setUploading(false);
      toast.success("Image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const deleteImage = async (designId) => {
    await base44.entities.DesignTemplate.update(designId, { heroImage: null });
    qc.invalidateQueries({ queryKey: ["designTemplates"] });
    toast.success("Image deleted");
  };

  const generateDescription = async () => {
    setGeneratingDescription(true);
    try {
      const design = designs.find(d => d.id === editingId);
      const prompt = `Write a compelling, concise 1-2 sentence marketing description for a modular home design called "${editForm.name || design?.name}". 
Details: ${editForm.size_sqm || design?.size_sqm}m², ${editForm.bedrooms ?? design?.bedrooms ?? 0} bedrooms, ${editForm.bathrooms ?? design?.bathrooms ?? 0} bathrooms, starting at $${editForm.starting_price || design?.starting_price || 0}.
Keep it professional, highlight the key benefits, and make it sound appealing to potential buyers. No bullet points, just flowing text.`;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to generate");
      
      const data = await response.json();
      setEditForm({ ...editForm, description: data.description });
      toast.success("Description generated!");
    } catch (error) {
      toast.error("Failed to generate description");
      console.error(error);
    } finally {
      setGeneratingDescription(false);
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
          <h1 className="text-xl font-bold text-gray-900">Manage Starter Designs</h1>
          <p className="text-sm text-gray-500">Edit text, images, and details for design catalogue</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#F15A22] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No designs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {designs.map((design) => (
              <div key={design.id} className="bg-white border border-gray-200 p-6">
                {editingId === design.id ? (
                  // EDIT MODE
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Editing: {design.name}</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X size={14} className="mr-1" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          disabled={updateMutation.isPending}
                          className="bg-[#F15A22] hover:bg-[#d94e1a]"
                        >
                          <Check size={14} className="mr-1" /> Save
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Design Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Size (m²)</Label>
                        <Input
                          type="number"
                          value={editForm.size_sqm}
                          onChange={(e) => setEditForm({ ...editForm, size_sqm: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Bedrooms</Label>
                        <Input
                          type="number"
                          value={editForm.bedrooms}
                          onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Bathrooms</Label>
                        <Input
                          type="number"
                          value={editForm.bathrooms}
                          onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Starting Price (NZD)</Label>
                        <Input
                          type="number"
                          value={editForm.starting_price}
                          onChange={(e) => setEditForm({ ...editForm, starting_price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Hero Image URL</Label>
                        <Input
                          value={editForm.heroImage}
                          onChange={(e) => setEditForm({ ...editForm, heroImage: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Description</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateDescription}
                          disabled={generatingDescription}
                          className="h-7 text-xs gap-1"
                        >
                          {generatingDescription ? (
                            <>
                              <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              ✨ AI Generate
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-64 h-48 flex-shrink-0 bg-gray-100 relative group overflow-hidden">
                      {design.heroImage ? (
                        <>
                          <img src={design.heroImage} alt={design.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="p-2 bg-white hover:bg-gray-100 cursor-pointer transition-colors">
                              <Upload size={16} />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, design.id)}
                                disabled={uploading}
                              />
                            </label>
                            <button
                              onClick={() => deleteImage(design.id)}
                              className="p-2 bg-white hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                          <Upload size={24} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, design.id)}
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{design.name}</h3>
                          <p className="text-sm text-gray-600">{design.description || "No description"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(design)}
                            className="p-2 text-gray-600 hover:text-[#F15A22] hover:bg-orange-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          {confirmDeleteId === design.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 mr-1">Delete?</span>
                              <button
                                onClick={() => deleteMutation.mutate(design.id)}
                                className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                                title="Confirm"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-2 text-gray-400 hover:bg-gray-100 transition-colors"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(design.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Size</p>
                          <p className="font-semibold">{design.size_sqm || "—"}m²</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Bedrooms</p>
                          <p className="font-semibold">
                            {design.bedrooms === 0 ? "Studio" : design.bedrooms ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Bathrooms</p>
                          <p className="font-semibold">{design.bathrooms ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Price</p>
                          <p className="font-semibold">${(design.starting_price || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Sort Order</p>
                          <p className="font-semibold">{design.sort_order ?? 0}</p>
                        </div>
                      </div>

                      {(design.categories?.length > 0 || design.use_cases?.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {design.categories?.map((cat) => (
                            <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700">
                              {cat}
                            </span>
                          ))}
                          {design.use_cases?.map((uc) => (
                            <span key={uc} className="px-2 py-1 bg-orange-50 text-[#F15A22]">
                              {uc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
