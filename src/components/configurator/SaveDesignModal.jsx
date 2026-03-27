import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";

export default function SaveDesignModal({ open, onClose, onConfirm, isSaving, lastSavedName = "", projectName = "", designs = [] }) {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saveToCatalogue, setSaveToCatalogue] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSaveAs, setIsSaveAs] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

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
      setShowDuplicateWarning(false);
    }
  }, [open]);

  const handleConfirm = (asCatalogue, forceKeepBoth = false) => {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    const extra = asCatalogue
      ? { is_template: true, description: description.trim() || undefined, tags: tags.split(",").map(t => t.trim()).filter(Boolean) }
      : {};

    if (!forceKeepBoth && isSaveAs) {
      // In "Save As" mode: check for duplicate and warn
      const isDuplicate = designs.some(d => d.name?.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        setShowDuplicateWarning(true);
        return;
      }
    }

    // Regular save: if same name exists, replace it (pass replace=true)
    const isReplace = !isSaveAs && !forceKeepBoth && designs.some(d => d.name?.toLowerCase() === trimmedName.toLowerCase());
    onConfirm(trimmedName, extra, isReplace);
    setName("");
    setDescription("");
    setTags("");
    setSaveToCatalogue(false);
    setIsSaveAs(false);
    setShowDuplicateWarning(false);
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
          {showDuplicateWarning ? (
            <>
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                A design named <span className="font-semibold">"{name.trim()}"</span> already exists. Replace it or keep both?
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDuplicateWarning(false)} className="rounded-xl">Back</Button>
                <Button variant="outline" onClick={() => { setShowDuplicateWarning(false); handleConfirm(false, true); }} className="rounded-xl text-slate-600">Keep Both</Button>
                <Button onClick={() => { setShowDuplicateWarning(false); onConfirm(name.trim(), {}, true); }} disabled={isSaving} className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white">Replace</Button>
              </div>
            </>
          ) : (
            <>
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
                  {!isSaveAs && (
                    <Button variant="outline" onClick={() => setIsSaveAs(true)} className="rounded-xl text-slate-600">
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}