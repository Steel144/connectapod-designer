import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["granny_flat", "minor_dwelling", "standalone_home", "studio", "multi_unit"];
const USE_CASES = ["rental_income", "family", "home_office", "guest_accommodation", "multi_generational", "bach"];
const BUDGET_RANGES = ["under_100k", "100k-200k", "200k-300k", "300k-400k", "400k+"];

const CATEGORY_LABELS = { granny_flat: "Granny Flat", minor_dwelling: "Minor Dwelling", standalone_home: "Standalone Home", studio: "Studio", multi_unit: "Multi Unit" };
const USE_CASE_LABELS = { rental_income: "Rental Income", family: "Family", home_office: "Home Office", guest_accommodation: "Guest Accommodation", multi_generational: "Multi-Generational", bach: "Bach" };

function Toggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-medium border transition-all ${active ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22]"}`}
    >
      {label}
    </button>
  );
}

export default function EditTemplateModal({ template, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: template.name || "",
    description: template.description || "",
    size_sqm: template.size_sqm || "",
    bedrooms: template.bedrooms ?? "",
    bathrooms: template.bathrooms ?? "",
    starting_price: template.starting_price || "",
    sort_order: template.sort_order ?? 0,
    is_featured: template.is_featured || false,
    categories: template.categories || [],
    use_cases: template.use_cases || [],
    budget_range: template.budget_range || "",
    heroImage: template.heroImage || "",
  });
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleArr = (key, val) => setForm(f => {
    const arr = f[key] || [];
    return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

  const handleSuggest = async () => {
    setSuggesting(true);
    const payload = template.template_payload || {};
    const grid = payload.layout?.grid || [];
    const totalSqm = grid.reduce((s, m) => s + (m.sqm || 0), 0);
    const moduleList = grid.map(m => m.label || m.type).join(", ");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping name and describe a modular home design for Connectapod (a New Zealand modular home builder).
Design details:
- Modules: ${moduleList || "none"}
- Total size: ${Math.round(totalSqm || form.size_sqm || 0)}m²
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
      setForm(f => ({ ...f, name: result.name || f.name, description: result.description || f.description }));
      toast.success("AI suggestions applied!");
    } catch (err) {
      toast.error("AI suggest failed");
    }
    setSuggesting(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiUrl = import.meta.env.VITE_BACKEND_URL || "";
      const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setForm(f => ({ ...f, heroImage: data.url }));
        toast.success("Image uploaded!");
      }
    } catch (err) {
      toast.error("Image upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.DesignTemplate.update(template.id, {
      ...form,
      size_sqm: form.size_sqm !== "" ? Number(form.size_sqm) : null,
      bedrooms: form.bedrooms !== "" ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms !== "" ? Number(form.bathrooms) : null,
      starting_price: form.starting_price !== "" ? Number(form.starting_price) : null,
      sort_order: Number(form.sort_order) || 0,
    });
    qc.invalidateQueries({ queryKey: ["designTemplates"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Design Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Name &amp; Description</Label>
              <button
                onClick={handleSuggest}
                disabled={suggesting}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#F15A22] border border-[#F15A22] hover:bg-[#F15A22] hover:text-white transition-colors disabled:opacity-50"
              >
                <Sparkles size={11} /> {suggesting ? "Suggesting…" : "AI Suggest"}
              </button>
            </div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} />
          </div>

          <div>
            <Label>Hero Image</Label>
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
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Size (m²)</Label>
              <Input type="number" value={form.size_sqm} onChange={e => set("size_sqm", e.target.value)} />
            </div>
            <div>
              <Label>Bedrooms</Label>
              <Input type="number" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input type="number" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} />
            </div>
          </div>
          
          {/* Area Breakdown Display */}
          {(() => {
            const grid = template.template_payload?.layout?.grid || [];
            const internalSqm = grid.reduce((sum, m) => {
              const isDeck = 
                m.chassis === "DK" || m.chassis === "SO" || 
                m.type?.includes("-D-") || m.type?.includes("-SO-") ||
                m.label?.toLowerCase().includes("deck") || m.label?.toLowerCase().includes("soffit");
              return isDeck ? sum : sum + (m.sqm || 0);
            }, 0);
            const deckSqm = grid.reduce((sum, m) => {
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starting Price (NZD)</Label>
              <Input type="number" value={form.starting_price} onChange={e => set("starting_price", e.target.value)} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => set("sort_order", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Budget Range</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {BUDGET_RANGES.map(b => (
                <Toggle key={b} label={b} active={form.budget_range === b} onClick={() => set("budget_range", form.budget_range === b ? "" : b)} />
              ))}
            </div>
          </div>

          <div>
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORIES.map(c => (
                <Toggle key={c} label={CATEGORY_LABELS[c]} active={form.categories.includes(c)} onClick={() => toggleArr("categories", c)} />
              ))}
            </div>
          </div>

          <div>
            <Label>Use Cases</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {USE_CASES.map(u => (
                <Toggle key={u} label={USE_CASE_LABELS[u]} active={form.use_cases.includes(u)} onClick={() => toggleArr("use_cases", u)} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} className="w-4 h-4 accent-[#F15A22]" />
            <Label htmlFor="featured">Featured design</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#F15A22] hover:bg-[#d94e1a] text-white">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}