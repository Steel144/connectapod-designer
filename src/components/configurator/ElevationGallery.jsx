import React, { useState, useMemo } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export default function ElevationGallery({ walls = [] }) {
  const [zoom, setZoom] = useState(150);

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
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No elevations yet</p>
          <p className="text-sm text-gray-400">Add walls with images to your design to view elevations</p>
        </div>
      </div>
    );
  }

  const imgHeight = zoom * 5;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => setZoom(z => Math.max(50, z - 25))}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-800"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <div className="w-14 text-center text-xs font-medium text-gray-600 bg-gray-100 py-1 rounded">
          {zoom}%
        </div>
        <button
          onClick={() => setZoom(z => Math.min(400, z + 25))}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-800"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom(150)}
          className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-600 font-medium"
        >
          Reset
        </button>
      </div>

      {/* All elevations joined side by side */}
      <div
        className="flex-1 overflow-auto bg-white p-4"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom(z => Math.max(50, Math.min(400, z + (e.deltaY > 0 ? -10 : 10))));
          }
        }}
      >
        <div className="flex items-start gap-8" style={{ width: 'max-content' }}>
          {allElevations.map((elev) => (
            <img
              key={elev.id}
              src={elev.image}
              alt={elev.label}
              style={{ display: 'block', height: `${imgHeight}px`, width: 'auto' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}