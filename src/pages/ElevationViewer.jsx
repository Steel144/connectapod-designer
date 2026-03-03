import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ElevationViewer() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    // Get image URL from query params
    const params = new URLSearchParams(window.location.search);
    const url = params.get("imageUrl");
    if (url) {
      setImageUrl(decodeURIComponent(url));
    }
  }, []);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center gap-2 text-white hover:text-gray-300 transition-colors z-10"
      >
        <ArrowLeft size={24} />
        Back
      </button>
      
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Elevation"
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <div className="text-center text-white">
          <p className="text-lg mb-2">No elevation image provided</p>
          <p className="text-sm text-gray-400">Upload an elevation image to a wall to view it here</p>
        </div>
      )}
    </div>
  );
}