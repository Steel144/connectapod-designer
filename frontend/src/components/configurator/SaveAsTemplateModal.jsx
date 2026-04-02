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
    
    // Use existing name if provided
    const existingName = form.name.trim();
    
    try {
      console.log("🤖 Calling AI to generate description...");
      
      let prompt;
      if (existingName) {
        // If name exists, only generate description using that name
        prompt = `You are helping write a description for a modular home design for Connectapod (a New Zealand modular home builder).

Design name: ${existingName}
Design details:
- Modules: ${moduleList || "none"}
- Total size: ${Math.round(totalSqm)}m²
- Bedrooms: ${form.bedrooms || "unknown"}
- Bathrooms: ${form.bathrooms || "unknown"}
- Categories: ${form.categories.join(", ") || "not selected"}
- Use cases: ${form.use_cases.join(", ") || "not selected"}

Write a short 1-2 sentence description for a design card that uses the name "${existingName}". Be specific, appealing, and practical.
Return ONLY the description text, no JSON.`;
      } else {
        // If no name, generate both
        prompt = `You are helping name and describe a modular home design for Connectapod (a New Zealand modular home builder).
Design details:
- Modules: ${moduleList || "none"}
- Total size: ${Math.round(totalSqm)}m²
- Bedrooms: ${form.bedrooms || "unknown"}
- Bathrooms: ${form.bathrooms || "unknown"}
- Categories: ${form.categories.join(", ") || "not selected"}
- Use cases: ${form.use_cases.join(", ") || "not selected"}

Generate a concise, appealing customer-facing name (e.g. "2 Bedroom Granny Flat 75m²") and a short 1-2 sentence description for a design card. Be specific and practical.
Return ONLY a JSON object with "name" and "description" fields, nothing else.`;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("AI API request failed");
      
      const data = await response.json();
      console.log("✅ AI raw response from backend:", JSON.stringify(data, null, 2));
      
      if (existingName) {
        // Only description was requested
        const descText = data.description.trim();
        setForm(f => ({ ...f, description: descText }));
        console.log("✅ Description updated:", descText);
      } else {
        // Both name and description requested
        let descText = data.description.trim();
        
        // Remove markdown code fences (```json ... ``` or ``` ... ```)
        descText = descText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        console.log("After removing markdown:", descText);
        
        let name = "";
        let description = "";
        
        // Check if it starts with { (JSON)
        if (descText.startsWith('{')) {
          try {
            const parsed = JSON.parse(descText);
            console.log("✅ Successfully parsed JSON:", parsed);
            name = parsed.name || "";
            description = parsed.description || "";
          } catch (e) {
            console.error("❌ Failed to parse JSON:", e);
            description = descText;
          }
        } else {
          description = descText;
        }
        
        setForm(f => ({ 
          ...f, 
          name: name || f.name, 
          description: description || f.description 
        }));
        console.log("✅ Name:", name, "Description:", description);
      }
      
      toast.success("✅ AI suggestions applied!");
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
      
      // Backend returns file_url not url
      const imageUrl = data.file_url || data.url;
      
      if (imageUrl) {
        setForm(f => ({ ...f, heroImage: imageUrl }));
        console.log("✅ Hero image set to:", imageUrl);
        toast.success("✅ Image uploaded successfully!");
      } else {
        console.error("❌ No URL in response:", data);
        toast.error("Image upload failed: No URL in response");
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
    // Strict validation - all important fields must be filled
    const validationErrors = [];
    if (!form.name.trim()) validationErrors.push("Design Name");
    if (!form.description.trim()) validationErrors.push("Description");
    if (form.categories.length === 0) validationErrors.push("At least one Category");
    if (form.use_cases.length === 0) validationErrors.push("At least one Use Case");
    if (!form.budget_range) validationErrors.push("Budget Range");
    if (form.bedrooms === "") validationErrors.push("Bedrooms");
    if (form.bathrooms === "") validationErrors.push("Bathrooms");
    if (form.starting_price === "") validationErrors.push("Starting Price");

    if (validationErrors.length > 0) {
      toast.error(`Missing required fields: ${validationErrors.join(", ")}`);
      return;
    }

    setSaving(true);
    
    // Calculate total and separated areas
    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
    
    // Calculate internal and deck areas using same logic as DesignSummary
    const internalSqm = placedModules.reduce((sum, m) => {
      const isDeck = 
        m.chassis === "DK" || 
        m.chassis === "SO" || 
        m.type?.includes("-D-") || 
        m.type?.includes("-SO-") ||
        m.label?.toLowerCase().includes("deck") || 
        m.label?.toLowerCase().includes("soffit");
      return isDeck ? sum : sum + (m.sqm || 0);
    }, 0);
    
    const deckSqm = placedModules.reduce((sum, m) => {
      const isDeck = 
        m.chassis === "DK" || 
        m.chassis === "SO" || 
        m.type?.includes("-D-") || 
        m.type?.includes("-SO-") ||
        m.label?.toLowerCase().includes("deck") || 
        m.label?.toLowerCase().includes("soffit");
      return isDeck ? sum + (m.sqm || 0) : sum;
    }, 0);

    console.log("💾 Saving design template...");
    console.log("Form data:", form);
    console.log("Hero Image in form:", form.heroImage);
    console.log("Area breakdown - Internal:", internalSqm, "Deck:", deckSqm, "Total:", totalSqm);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        categories: form.categories,
        use_cases: form.use_cases,
        build_type: form.build_type,
        budget_range: form.budget_range,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        size_sqm: form.size_sqm !== "" ? Number(form.size_sqm) : (totalSqm > 0 ? Math.round(totalSqm) : undefined),
        internal_sqm: internalSqm > 0 ? Math.round(internalSqm * 10) / 10 : undefined,
        deck_sqm: deckSqm > 0 ? Math.round(deckSqm * 10) / 10 : undefined,
        starting_price: Number(form.starting_price),
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
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Bedrooms *</label>
              <input type="number" min="0" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} placeholder="e.g. 2" className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Bathrooms *</label>
              <input type="number" min="0" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} placeholder="e.g. 1" className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Size (m²)</label>
              <input type="number" min="0" value={form.size_sqm} onChange={e => setForm(f => ({ ...f, size_sqm: e.target.value }))} placeholder={`Auto: ${Math.round(placedModules.reduce((s,m)=>s+(m.sqm||0),0))}m²`} className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest block mb-1.5">Starting Price ($NZD) *</label>
              <input type="number" min="0" value={form.starting_price} onChange={e => setForm(f => ({ ...f, starting_price: e.target.value }))} placeholder="e.g. 150000" className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#F15A22]" />
            </div>
          </div>
          
          {/* Area Breakdown Display */}
          {(() => {
            const internalSqm = placedModules.reduce((sum, m) => {
              const isDeck = 
                m.chassis === "DK" || m.chassis === "SO" || 
                m.type?.includes("-D-") || m.type?.includes("-SO-") ||
                m.label?.toLowerCase().includes("deck") || m.label?.toLowerCase().includes("soffit");
              return isDeck ? sum : sum + (m.sqm || 0);
            }, 0);
            const deckSqm = placedModules.reduce((sum, m) => {
              const isDeck = 
                m.chassis === "DK" || m.chassis === "SO" || 
                m.type?.includes("-D-") || m.type?.includes("-SO-") ||
                m.label?.toLowerCase().includes("deck") || m.label?.toLowerCase().includes("soffit");
              return isDeck ? sum + (m.sqm || 0) : sum;
            }, 0);
            
            if (internalSqm > 0 && deckSqm > 0) {
              return (
                <div className="bg-blue-50 border border-blue-200 p-3 text-xs">
                  <p className="font-semibold text-blue-900 mb-1.5">📊 Area Breakdown:</p>
                  <div className="space-y-1 text-blue-800">
                    <div className="flex justify-between">
                      <span>Internal Floor Area:</span>
                      <span className="font-semibold">{internalSqm.toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deck Area:</span>
                      <span className="font-semibold">{deckSqm.toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold">{(internalSqm + deckSqm).toFixed(1)} m²</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

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
        <div className="px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          {/* Validation warnings */}
          {(() => {
            const missing = [];
            if (!form.name.trim()) missing.push("Design Name");
            if (!form.description.trim()) missing.push("Description");
            if (form.categories.length === 0) missing.push("Category");
            if (form.use_cases.length === 0) missing.push("Use Case");
            if (!form.budget_range) missing.push("Budget Range");
            if (form.bedrooms === "") missing.push("Bedrooms");
            if (form.bathrooms === "") missing.push("Bathrooms");
            if (form.starting_price === "") missing.push("Starting Price");
            
            return missing.length > 0 ? (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
                <p className="font-semibold mb-1">⚠️ Required fields missing ({missing.length}):</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {missing.map(field => <li key={field}>{field}</li>)}
                </ul>
              </div>
            ) : null;
          })()}
          
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={
                saving || 
                !form.name.trim() || 
                !form.description.trim() || 
                form.categories.length === 0 || 
                form.use_cases.length === 0 || 
                !form.budget_range || 
                form.bedrooms === "" || 
                form.bathrooms === "" || 
                form.starting_price === ""
              }
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#F15A22] text-white hover:bg-[#d94e1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={
                !form.name.trim() || !form.description.trim() || form.categories.length === 0 || form.use_cases.length === 0 || !form.budget_range || form.bedrooms === "" || form.bathrooms === "" || form.starting_price === ""
                  ? "Please fill in all required fields" 
                  : ""
              }
            >
              <Save size={14} /> {saving ? "Saving…" : "Save to Catalogue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}