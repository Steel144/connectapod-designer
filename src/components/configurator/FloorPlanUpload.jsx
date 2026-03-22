import React, { useState, useEffect } from "react";
import { FloorPlanImage, Storage } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function FloorPlanUpload({ module, onImageAssigned }) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(module?.floorPlanImage || null);
  const queryClient = useQueryClient();

  // Update local state if module prop changes
  useEffect(() => {
    if (module?.floorPlanImage) {
      setImageUrl(module.floorPlanImage);
    }
  }, [module?.id, module?.floorPlanImage]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate filename matches module code
    const fileNameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    if (fileNameWithoutExt !== module?.type) {
      toast.error(`File name must be "${module?.type}.png" (was "${file.name}")`);
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `floorplans/${module.type}-${Date.now()}.${file.name.split('.').pop()}`;
      const fileUrl = await Storage.uploadFile('images', fileName, file);
      
      setImageUrl(fileUrl);
      onImageAssigned(fileUrl);

      // Save to database for this module type
      if (module?.type) {
        const existing = await FloorPlanImage.filter({ module_type: module.type });
        if (existing.length > 0) {
          await FloorPlanImage.update(existing[0].id, { image_url: fileUrl });
        } else {
          await FloorPlanImage.create({ module_type: module.type, image_url: fileUrl });
        }
        queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
      }

      toast.success("Floor plan uploaded and saved");
    } catch (err) {
      toast.error("Failed to upload image");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    setImageUrl(null);
    onImageAssigned(null);

    // Remove from database
    if (module?.type) {
      const existing = await FloorPlanImage.filter({ module_type: module.type });
      if (existing.length > 0) {
        await FloorPlanImage.delete(existing[0].id);
        queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
      }
    }
  };

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">Floor Plan Image</p>
      <p className="text-[10px] text-slate-500 mb-2">File must be named: <code className="bg-slate-100 px-1 rounded">{module?.type}.png</code></p>
      
      {imageUrl ? (
        <div className="space-y-2">
          <img 
            src={imageUrl} 
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
