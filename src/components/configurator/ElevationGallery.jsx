import React from "react";

export default function ElevationGallery({ walls }) {
  const wallsWithElevations = walls.filter(w => w.elevationImage);

  if (wallsWithElevations.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p className="text-lg mb-2">No elevations uploaded</p>
          <p className="text-sm text-gray-400">Select a wall and upload an elevation image to view it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 overflow-auto p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallsWithElevations.map((wall) => (
          <div key={wall.id} className="bg-black rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="aspect-square overflow-hidden bg-gray-800 flex items-center justify-center">
              <img
                src={wall.elevationImage}
                alt={`Wall ${wall.type} - Face ${wall.face}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-gray-800">
              <p className="text-white font-semibold text-sm">{wall.label || wall.type}</p>
              <p className="text-gray-400 text-xs mt-1">Face: {wall.face || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}