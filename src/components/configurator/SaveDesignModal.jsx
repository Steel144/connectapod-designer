import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SaveDesignModal({ open, onClose, onConfirm, isSaving }) {
  const [name, setName] = useState("");

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name.trim());
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">Name your design</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <Input
            placeholder="e.g. My Dream Home"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            className="rounded-xl border-slate-200 h-10"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleConfirm}
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