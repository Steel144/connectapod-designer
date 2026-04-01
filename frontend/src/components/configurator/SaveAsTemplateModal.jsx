import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "granny_flat", label: "Granny Flat" },
  { value: "minor_dwelling", label: "Minor Dwelling" },
  { value: "standalone_home", label: "Standalone Home" },
  { value: "studio", label: "Studio" },
  { value: "multi_unit", label: "Multi Unit" },
];

const USE_CASES = [
  { value: "rental_income", label: "Rental Income" },
  { value: "family", label: "Family" },
  { value: "home_office", label: "Home Office" },
  { value: "guest_accommodation", label: "Guest Accommodation" },
  { value: "multi_generational", label: "Multi-Generational" },
  { value: "bach", label: "Bach" },
];

const BUDGET_RANGES = [
  { value: "under_100k", label: "Under $100k" },
  { value: "100k-200k", label: "$100k – $200k" },
  { value: "200k-300k", label: "$200k – $300k" },
  { value: "300k-400k", label: "$300k – $400k" },
  { value: "400k+", label: "$400k+" },
];

export default function SaveAsTemplateModal({ open, onClose, placedModules, walls, furniture }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    categories: [],
    use_cases: [],
    build_type: ["modular", "turnkey"],
    budget_range: "",
    bedrooms: "",
    bathrooms: "",
    size_sqm: "",
    starting_price: "",
    is_featured: false,
    heroImage: "",
  });
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSuggest = async () => {
    setSuggesting(true);
    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
    const moduleList = placedModules.map(m => m.label || m.type).join(", ");
    try {
      console.log("🤖 Calling AI to generate description...");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping name and describe a modular home design for Connectapod (a New Zealand modular home builder).
Design details:
- Modules: ${moduleList || "none"}
- Total size: ${Math.round(totalSqm)}m²
- Bedrooms: ${form.bedrooms || "unknown"}
- Bathrooms: ${form.bathrooms || "unknown"}
- Categories: ${form.categories.join(", ") || "not selected"}
- Use cases: ${form.use_cases.join(", ") || "not selected"}

Generate a concise, appealing customer-facing name (e.g. "2 Bedroom Granny Flat 75m²") and a short 1-2 sentence description for a design card. Be specific and practical.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
        },
      });
      console.log("✅ AI result:", result);
      setForm(f => ({ ...f, name: result.name || f.name, description: result.description || f.description }));
      toast.success("AI suggestions applied!");
      console.log("✅ Toast should appear now");
    } catch (err) {
      console.error("❌ AI suggest failed:", err);
      toast.error(`AI suggest failed: ${err.message || 'Unknown error'}`);
    }
    setSuggesting(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("📤 Uploading image:", file.name);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiUrl = import.meta.env.VITE_BACKEND_URL || "";
      console.log("API URL:", apiUrl);
      const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", body: formData });
      const data = await res.json();
      console.log("📥 Upload response:", data);
      if (data.url) {
        setForm(f => ({ ...f, heroImage: data.url }));
        console.log("✅ Hero image set to:", data.url);
        toast.success("Image uploaded!");
      } else {
        console.error("❌ No URL in response");
        toast.error("Image upload failed: No URL returned");
      }
    } catch (err) {
      console.error("❌ Image upload error:", err);
      toast.error(`Image upload failed: ${err.message || 'Unknown error'}`);
    }
    setUploading(false);
  };

  if (!open) return null;

  const toggle = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Please enter a name"); return; }
    if (form.categories.length === 0) { toast.error("Please select at least one category"); return; }

    setSaving(true);
    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);

    console.log("💾 Saving design template...");
    console.log("Form data:", form);
    console.log("Hero Image in form:", form.heroImage);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        categories: form.categories,
        use_cases: form.use_cases,
        build_type: form.build_type,
        budget_range: form.budget_range || undefined,
        bedrooms: form.bedrooms !== "" ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms !== "" ? Number(form.bathrooms) : undefined,
        size_sqm: form.size_sqm !== "" ? Number(form.size_sqm) : (totalSqm > 0 ? Math.round(totalSqm) : undefined),
        starting_price: form.starting_price !== "" ? Number(form.starting_price) : undefined,
        is_featured: form.is_featured,
        heroImage: form.heroImage || undefined,
        template_payload: {
          modules: placedModules.map(m => m.type),
          layout: { grid: placedModules, walls, furniture },
        },
      };
      
      console.log("📤 Sending payload to API:", payload);
      
      const result = await base44.entities.DesignTemplate.create(payload);

      console.log("✅ Design template saved successfully:", result);
      console.log("✅ Saved hero image:", result.heroImage);
      alert("✅ SUCCESS! Design saved to database.\n\nName: " + result.name + "\nHero Image: " + (result.heroImage || "None"));
      toast.success("Saved to Design Template catalogue!");
      setSaving(false);
      onClose();
      setForm({ name: "", description: "", categories: [], use_cases: [], build_type: [], budget_range: "", bedrooms: "", bathrooms: "", size_sqm: "", starting_price: "", is_featured: false, heroImage: "" });
    } catch (error) {
      console.error("❌ Failed to save design template:", error);
      alert("❌ ERROR: Failed to save design\n\n" + (error.message || 'Unknown error'));
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-heading text-base font-bold text-gray-900">Save to Design Catalogue</h2>
            <p className="text-xs text-gray-400 mt-0.5">This will publish the design to the public landing page</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name + Description with AI suggest */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Name &amp; Description</span>
              <button
                onClick={handleSuggest}
                disabled={suggesting}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#F15A22] border border-[#F15A22] hover:bg-[#F15A22] hover:text-white transition-colors disabled:opacity-50"
              >
                <Sparkles size={11} /> {suggesting ? "Suggesting…" : "AI Suggest"}
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Design Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 2 Bedroom Granny Flat 75m²"
                className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown on the design card..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22] resize-none"
              />
            </div>
          </div>

          {/* Hero Image Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Hero Image</label>
            <div className="space-y-2">
              {form.heroImage && (
                <div className="relative w-full h-32 border border-gray-200 overflow-hidden group">
                  <img src={form.heroImage} alt="Hero" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setForm(f => ({ ...f, heroImage: "" }))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 cursor-pointer hover:border-[#F15A22] hover:text-[#F15A22] transition-colors text-sm">
                <Upload size={14} />
                {uploading ? "Uploading…" : form.heroImage ? "Change Image" : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
              <p className="text-xs text-gray-400">Optional. If not provided, the floor plan preview will be shown.</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Categories *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => toggle("categories", c.value)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    form.categories.includes(c.value)
                      ? "bg-[#F15A22] text-white border-[#F15A22]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Use Cases</label>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map(u => (
                <button
                  key={u.value}
                  onClick={() => toggle("use_cases", u.value)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    form.use_cases.includes(u.value)
                      ? "bg-[#F15A22] text-white border-[#F15A22]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Budget Range</label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setForm(f => ({ ...f, budget_range: f.budget_range === b.value ? "" : b.value }))}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    form.budget_range === b.value
                      ? "bg-[#F15A22] text-white border-[#F15A22]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specs row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Bedrooms</label>
              <input type="number" min="0" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} placeholder="e.g. 2" className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Bathrooms</label>
              <input type="number" min="0" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} placeholder="e.g. 1" className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Size (m²)</label>
              <input type="number" min="0" value={form.size_sqm} onChange={e => setForm(f => ({ ...f, size_sqm: e.target.value }))} placeholder={`Auto: ${Math.round(placedModules.reduce((s,m)=>s+(m.sqm||0),0))}m²`} className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Starting Price ($NZD)</label>
              <input type="number" min="0" value={form.starting_price} onChange={e => setForm(f => ({ ...f, starting_price: e.target.value }))} placeholder="e.g. 150000" className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
              className={`w-10 h-5 rounded-full transition-colors ${form.is_featured ? "bg-[#F15A22]" : "bg-gray-200"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_featured ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-xs text-gray-700 font-medium">Mark as featured / popular choice</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#F15A22] text-white hover:bg-[#d94e1a] disabled:opacity-50 transition-colors"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save to Catalogue"}
          </button>
        </div>
      </div>
    </div>
  );
}