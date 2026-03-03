import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export default function ElevationGallery({ walls = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);

  // Flatten all walls with elevation images into a single list
  const allElevations = useMemo(() => {
    return walls.filter(w => w.elevationImage).map(wall => ({
      id: wall.id,
      image: wall.elevationImage,
      type: wall.type,
      face: wall.face,
      label: `${wall.label || wall.type}`
    }));
  }, [walls]);

  if (allElevations.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-lg mb-2">No elevations yet</p>
          <p className="text-sm text-gray-400">Add walls with images to your design to view elevations</p>
        </div>
      </div>
    );
  }

  const current = allElevations[currentIndex];
  const hasNext = currentIndex < allElevations.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (hasPrev) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
      {/* Current elevation */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-white text-sm">{current.label}</p>
        <img src={current.image} alt={current.label} className="max-w-full max-h-[calc(100vh-120px)] object-contain" />
      </div>

      {/* Navigation */}
      <div className="absolute bottom-6 flex items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
        <p className="text-white text-sm min-w-20 text-center">
          {currentIndex + 1} / {allElevations.length}
        </p>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}