import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";

export default function SaveDesignModal({ open, onClose, onConfirm, isSaving, lastSavedName = "" }) {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saveToCatalogue, setSaveToCatalogue] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSaveAs, setIsSaveAs] = useState(false);

  const handleConfirm = (asCatalogue) => {
    if (!name.trim()) return;
    const extra = asCatalogue
      ? { is_template: true, description: description.trim() || undefined, tags: tags.split(",").map(t => t.trim()).filter(Boolean) }
      : {};
    onConfirm(name.trim(), extra);
    setName("");
    setDescription("");
    setTags("");
    setSaveToCatalogue(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">Save Design</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <Input
            placeholder="e.g. My Dream Home"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !saveToCatalogue && handleConfirm(false)}
            className="rounded-xl border-slate-200 h-10"
            autoFocus
          />

          {/* Catalogue toggle */}
          <button
            type="button"
            onClick={() => setSaveToCatalogue(c => !c)}
            className={`w-full flex items-center gap-2 px-3 py-2 border text-xs transition-all rounded-lg ${
              saveToCatalogue ? "border-[#F15A22] bg-orange-50 text-[#F15A22]" : "border-gray-200 text-gray-500 hover:border-[#F15A22] hover:text-[#F15A22]"
            }`}
          >
            <LayoutTemplate size={13} />
            {saveToCatalogue ? "Will appear in Design Catalogue ✓" : "Also save to Design Catalogue"}
          </button>

          {saveToCatalogue && (
            <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
              <Input
                placeholder="Short description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border-slate-200 h-9 text-sm"
              />
              <Input
                placeholder="Tags, comma-separated (e.g. 2 bed, compact)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="rounded-lg border-slate-200 h-9 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => handleConfirm(saveToCatalogue)}
              disabled={!name.trim() || isSaving}
              className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}