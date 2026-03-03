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
    <div className="w-full h-full bg-black flex flex-col">
      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-900">
        <button
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <div className="w-12 text-center text-xs font-medium text-gray-400 bg-gray-800 py-1 rounded">
          {zoom}%
        </div>
        <button
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom(100)}
          className="ml-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300 font-medium"
        >
          Reset
        </button>
      </div>

      {/* Current elevation */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center gap-3" onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setZoom(Math.max(50, Math.min(200, zoom + (e.deltaY > 0 ? -5 : 5))));
        }
      }}>
        <p className="text-white text-sm">{current.label}</p>
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
          <img src={current.image} alt={current.label} className="max-w-full max-h-[calc(100vh-200px)] object-contain" />
        </div>
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