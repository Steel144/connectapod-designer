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
    <div className="w-full h-full bg-white overflow-auto p-3">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {wallsWithElevations.map((wall) => (
          <div key={wall.id} className="bg-white border border-gray-200 rounded overflow-hidden shadow hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={wall.elevationImage}
                alt={`Wall ${wall.type} - Face ${wall.face}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-2 bg-gray-50">
              <p className="text-gray-900 font-semibold text-xs truncate">{wall.label || wall.type}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Face: {wall.face || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}