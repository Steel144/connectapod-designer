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

  // Group walls by face and sort
  const wallsByFace = {
    W: [],
    Y: [],
    Z: [],
    X: []
  };
  
  wallsWithElevations.forEach((wall) => {
    if (wallsByFace[wall.face]) {
      wallsByFace[wall.face].push(wall);
    }
  });
  
  // Sort each face's walls by position
  Object.keys(wallsByFace).forEach((face) => {
    wallsByFace[face].sort((a, b) => {
      if (face === 'W' || face === 'Y') {
        // Front/back: sort by x
        return a.x - b.x;
      } else {
        // Side: sort by y
        return a.y - b.y;
      }
    });
  });

  return (
    <div className="w-full h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Front elevation (W) */}
        {wallsByFace.W.length > 0 && (
          <div className="mb-12">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Front Elevation (W)</h3>
            <div className="flex gap-1 bg-white p-1 rounded border border-gray-200">
              {wallsByFace.W.map((wall) => (
                <div key={wall.id} className="flex-1 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={wall.elevationImage}
                    alt={`Wall ${wall.type}`}
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side elevations (Z and X) */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          {wallsByFace.Z.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Left Elevation (Z)</h3>
              <div className="flex flex-col gap-1 bg-white p-1 rounded border border-gray-200">
                {wallsByFace.Z.map((wall) => (
                  <div key={wall.id} className="bg-gray-100 rounded overflow-hidden">
                    <img
                      src={wall.elevationImage}
                      alt={`Wall ${wall.type}`}
                      className="w-full h-auto object-contain max-h-64"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {wallsByFace.X.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Right Elevation (X)</h3>
              <div className="flex flex-col gap-1 bg-white p-1 rounded border border-gray-200">
                {wallsByFace.X.map((wall) => (
                  <div key={wall.id} className="bg-gray-100 rounded overflow-hidden">
                    <img
                      src={wall.elevationImage}
                      alt={`Wall ${wall.type}`}
                      className="w-full h-auto object-contain max-h-64"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back elevation (Y) */}
        {wallsByFace.Y.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Back Elevation (Y)</h3>
            <div className="flex gap-1 bg-white p-1 rounded border border-gray-200">
              {wallsByFace.Y.map((wall) => (
                <div key={wall.id} className="flex-1 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={wall.elevationImage}
                    alt={`Wall ${wall.type}`}
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}