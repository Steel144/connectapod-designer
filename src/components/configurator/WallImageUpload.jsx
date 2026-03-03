import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function WallImageUpload({ wall, onImageAssigned }) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(wall?.elevationImage || null);
  const queryClient = useQueryClient();

  // Fetch saved image for this wall type
  const { data: savedImage } = useQuery({
    queryKey: ["wallImage", wall?.type],
    queryFn: async () => {
      if (!wall?.type) return null;
      const images = await base44.entities.WallImage.filter({ wallType: wall.type });
      return images[0]?.imageUrl || null;
    },
    enabled: !!wall?.type,
  });

  // Update local state if wall elevationImage or savedImage changes
  useEffect(() => {
    setImageUrl(wall?.elevationImage || savedImage || null);
  }, [wall?.elevationImage, savedImage]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = response?.data?.file_url || response?.file_url;
      if (!fileUrl) throw new Error("No file URL returned");
      
      setImageUrl(fileUrl);
      onImageAssigned(fileUrl);

      // Save to database for this wall type
      if (wall?.type) {
        const existing = await base44.entities.WallImage.filter({ wallType: wall.type });
        if (existing.length > 0) {
          await base44.entities.WallImage.update(existing[0].id, { imageUrl: fileUrl });
        } else {
          await base44.entities.WallImage.create({ wallType: wall.type, imageUrl: fileUrl });
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
      const existing = await base44.entities.WallImage.filter({ wallType: wall.type });
      if (existing.length > 0) {
        await base44.entities.WallImage.delete(existing[0].id);
        queryClient.invalidateQueries({ queryKey: ["wallImage", wall.type] });
        queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      }
    }
  };

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">Wall Texture</p>
      
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