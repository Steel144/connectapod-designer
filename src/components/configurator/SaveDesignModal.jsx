import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";

export default function SaveDesignModal({ open, onClose, onConfirm, isSaving, lastSavedName = "", projectName = "" }) {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saveToCatalogue, setSaveToCatalogue] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSaveAs, setIsSaveAs] = useState(false);

  useEffect(() => {
    if (open && !isSaveAs) {
      // Use lastSavedName if available, otherwise use projectName from estimate form, otherwise empty
      const initialName = lastSavedName || projectName || "";
      setName(initialName);
      setOriginalName(initialName);
    }
  }, [open, lastSavedName, projectName, isSaveAs]);

  useEffect(() => {
    // Update name when projectName prop changes and modal is open (live sync from estimate form)
    if (open && projectName && !isSaveAs && name !== projectName) {
      setName(projectName);
      setOriginalName(projectName);
    }
  }, [projectName, open, isSaveAs, name]);

  useEffect(() => {
    if (!open) {
      setName("");
      setOriginalName("");
      setIsSaveAs(false);
      setSaveToCatalogue(false);
      setDescription("");
      setTags("");
    }
  }, [open]);

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
    setIsSaveAs(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-lg z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">
            {isSaveAs ? "Save Design As" : originalName ? "Update Design" : "Save Design"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          {originalName && !isSaveAs && (
            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
              Saving as: <span className="font-semibold text-slate-800">"{originalName}"</span>
            </div>
          )}
          <Input
            placeholder="e.g. My Dream Home"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !saveToCatalogue && handleConfirm(false)}
            className="rounded-xl border-slate-200 h-10"
            autoFocus
          />



          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              {originalName && !isSaveAs && (
                <Button
                  variant="outline"
                  onClick={() => setIsSaveAs(true)}
                  className="rounded-xl text-slate-600"
                >
                  Save As...
                </Button>
              )}
            </div>
            <Button
               onClick={() => handleConfirm(false)}
               disabled={!name.trim() || isSaving}
               className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white"
             >
               {isSaving ? "Saving..." : isSaveAs ? "Save As" : "Update"}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}