import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function PrintDetailsModal({ open, onClose, onConfirm, printMode }) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");

  const handleConfirm = () => {
    onConfirm({ projectName, clientName, address });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-none">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Print {printMode === "plans" ? "Floor Plan" : "Elevations"}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-2">These details will appear in the title block.</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600">Project / Design Name</Label>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Beach House" className="mt-1 rounded-none text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Client Name</Label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Jane Smith" className="mt-1 rounded-none text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Site Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Main St, Auckland" className="mt-1 rounded-none text-sm h-9" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-none border-gray-200 text-gray-500 h-9">
            <X size={14} className="mr-1.5" /> Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9">
            <Printer size={14} className="mr-1.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}