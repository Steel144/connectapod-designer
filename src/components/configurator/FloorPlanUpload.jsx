import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function FloorPlanUpload({ module, onImageAssigned }) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(module?.floorPlanImage || null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(data.file_url);
      onImageAssigned(data.file_url);
      toast.success("Floor plan uploaded");
    } catch (err) {
      toast.error("Failed to upload image");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    onImageAssigned(null);
  };

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">Floor Plan Image</p>
      
      {imageUrl ? (
        <div className="space-y-2">
          <img 
            src={module.floorPlanImage} 
            alt="Floor plan preview" 
            className="w-full h-24 object-cover rounded border border-slate-200"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveImage}
            className="w-full text-xs gap-1"
          >
            <X size={12} /> Remove Image
          </Button>
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={isLoading}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs gap-1 cursor-pointer"
            disabled={isLoading}
            asChild
          >
            <span>
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload size={12} /> Upload Image
                </>
              )}
            </span>
          </Button>
        </label>
      )}
    </div>
  );
}