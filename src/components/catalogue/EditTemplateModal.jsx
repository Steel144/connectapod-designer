import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleArr = (key, val) => setForm(f => {
    const arr = f[key] || [];
    return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

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
            <Label>Name</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} />
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