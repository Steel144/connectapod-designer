import React, { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export default function ElevationGallery({ walls }) {
  const [zoom, setZoom] = useState(100);
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
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Zoom controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-sm font-semibold text-gray-700">Elevations</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <div className="w-12 text-center text-xs font-medium text-gray-600 bg-gray-100 py-1 rounded">
            {zoom}%
          </div>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors text-gray-700 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto" onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setZoom(Math.max(50, Math.min(200, zoom + (e.deltaY > 0 ? -5 : 5))));
        }
      }}>
        <div className="p-6 flex justify-center items-center" style={{ minHeight: '100%' }}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
            {/* Front elevation (W) */}
            {wallsByFace.W.length > 0 && (
          <div className="mb-12">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Front Elevation (W)</h3>
            <div className="inline-block border border-gray-200 rounded overflow-hidden">
              <div className="flex bg-white">
                {wallsByFace.W.map((wall) => (
                  <div key={wall.id} className="bg-gray-100">
                    <img
                      src={wall.elevationImage}
                      alt={`Wall ${wall.type}`}
                      className="h-96 object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

            {/* Side elevations (Z and X) */}
            <div className="grid grid-cols-2 gap-6 mb-12">
          {wallsByFace.Z.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Left Elevation (Z)</h3>
              <div className="inline-block border border-gray-200 rounded overflow-hidden">
                <div className="flex flex-col bg-white">
                  {wallsByFace.Z.map((wall) => (
                    <div key={wall.id} className="bg-gray-100">
                      <img
                        src={wall.elevationImage}
                        alt={`Wall ${wall.type}`}
                        className="w-64 h-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {wallsByFace.X.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Right Elevation (X)</h3>
              <div className="inline-block border border-gray-200 rounded overflow-hidden">
                <div className="flex flex-col bg-white">
                  {wallsByFace.X.map((wall) => (
                    <div key={wall.id} className="bg-gray-100">
                      <img
                        src={wall.elevationImage}
                        alt={`Wall ${wall.type}`}
                        className="w-64 h-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
            </div>

            {/* Back elevation (Y) */}
            {wallsByFace.Y.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Back Elevation (Y)</h3>
            <div className="inline-block border border-gray-200 rounded overflow-hidden">
              <div className="flex bg-white">
                {wallsByFace.Y.map((wall) => (
                  <div key={wall.id} className="bg-gray-100">
                    <img
                      src={wall.elevationImage}
                      alt={`Wall ${wall.type}`}
                      className="h-96 object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}