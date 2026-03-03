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

  // Sort walls by face order (W, Y, Z, X) then by position
  const faceOrder = { W: 0, Y: 1, Z: 2, X: 3 };
  const sortedWalls = [...wallsWithElevations].sort((a, b) => {
    const faceA = faceOrder[a.face] ?? 999;
    const faceB = faceOrder[b.face] ?? 999;
    if (faceA !== faceB) return faceA - faceB;
    // Sort by y then x position within same face
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return (
    <div className="w-full h-full bg-white overflow-auto p-3 flex items-center justify-center">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl">
        {sortedWalls.map((wall) => (
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
              <p className="text-gray-500 text-[10px] mt-0.5">Face {wall.face || 'N/A'} · {wall.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}