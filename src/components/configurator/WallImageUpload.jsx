import React, { useState, useEffect } from "react";
import { WallImage, Storage } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function WallImageUpload({ wall, onImageAssigned }) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(wall?.elevationImage || null);
  const queryClient = useQueryClient();

  // Fetch saved image for this wall type (only if wall has a type)
  const { data: savedImage } = useQuery({
    queryKey: ["wallImage", wall?.type],
    queryFn: async () => {
      const images = await WallImage.filter({ wall_type: wall.type });
      return images[0]?.image_url || null;
    },
    enabled: !!wall?.type,
  });

  // Update local state if wall elevationImage or savedImage changes
  useEffect(() => {
    setImageUrl(wall?.elevationImage || savedImage || null);
  }, [wall?.id, wall?.elevationImage, savedImage]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate filename matches wall code
    const fileNameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    if (fileNameWithoutExt !== wall?.type) {
      toast.error(`File name must be "${wall?.type}.png" (was "${file.name}")`);
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `walls/${wall.type}-${Date.now()}.${file.name.split('.').pop()}`;
      const fileUrl = await Storage.uploadFile('images', fileName, file);
      
      setImageUrl(fileUrl);
      onImageAssigned(fileUrl);

      // Save to database for this wall type
      if (wall?.type) {
        const existing = await WallImage.filter({ wall_type: wall.type });
        if (existing.length > 0) {
          await WallImage.update(existing[0].id, { image_url: fileUrl });
        } else {
          await WallImage.create({ wall_type: wall.type, image_url: fileUrl });
        }
        queryClient.invalidateQueries({ queryKey: ["wallImage", wall.type] });
        queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      }

      toast.success("Wall image uploaded and saved");
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
    if (wall?.type) {
      const existing = await WallImage.filter({ wall_type: wall.type });
      if (existing.length > 0) {
        await WallImage.delete(existing[0].id);
        queryClient.invalidateQueries({ queryKey: ["wallImage", wall.type] });
        queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      }
    }
  };

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">Wall Texture</p>
      <p className="text-[10px] text-slate-500 mb-2">File must be named: <code className="bg-slate-100 px-1 rounded">{wall?.type}.png</code></p>
      
      {imageUrl ? (
        <div className="space-y-2">
          <img 
            src={imageUrl} 
            alt="Wall preview" 
            className="w-full h-24 object-cover rounded border border-slate-200"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const encoded = encodeURIComponent(imageUrl);
                window.open(createPageUrl(`ElevationViewer?imageUrl=${encoded}`), '_blank');
              }}
              className="flex-1 text-xs gap-1"
            >
              <Eye size={12} /> View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemoveImage}
              className="flex-1 text-xs gap-1"
            >
              <X size={12} /> Remove
            </Button>
          </div>
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
