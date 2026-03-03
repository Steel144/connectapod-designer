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

  if (!imageUrl) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={24} />
          Back
        </button>
        <p className="text-white text-lg">No image provided</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center gap-2 text-white hover:text-gray-300 transition-colors z-10"
      >
        <ArrowLeft size={24} />
        Back
      </button>
      <img
        src={imageUrl}
        alt="Elevation"
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}