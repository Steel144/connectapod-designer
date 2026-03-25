import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function EditTooltipModal({ isOpen, onClose, type, onSave }) {
  const [formData, setFormData] = useState({ type: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && type) {
      setFormData(type);
    }
  }, [isOpen, type]);

  const handleSave = async () => {
    if (!formData.type || !formData.description) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const key = type.key;
      
      // Try to find existing record
      const existing = await base44.entities.TooltipContent.filter({ key });
      
      if (existing.length > 0) {
        // Update existing
        await base44.entities.TooltipContent.update(existing[0].id, {
          type: formData.type,
          description: formData.description
        });
      } else {
        // Create new
        await base44.entities.TooltipContent.create({
          key,
          type: formData.type,
          description: formData.description
        });
      }
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving tooltip:", error);
      alert("Failed to save tooltip");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tooltip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="e.g., Standard Module"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter tooltip description"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}