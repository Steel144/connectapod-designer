import React, { useState, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

export default function ElevationGallery({ walls = [] }) {
  const [zoom, setZoom] = useState(100);

  const allElevations = useMemo(() => {
    return walls.filter(w => w.elevationImage).map(wall => ({
      id: wall.id,
      image: wall.elevationImage,
      type: wall.type,
      face: wall.face,
      label: wall.label || wall.type || "Wall",
    }));
  }, [walls]);

  const zoomLevels = [50, 75, 100, 125, 150, 200, 300];

  const adjustZoom = (delta) => {
    const idx = zoomLevels.findIndex(z => z >= zoom);
    if (delta > 0) {
      const next = zoomLevels.find(z => z > zoom);
      if (next) setZoom(next);
    } else {
      const prev = [...zoomLevels].reverse().find(z => z < zoom);
      if (prev) setZoom(prev);
    }
  };

  if (allElevations.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400 max-w-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Maximize2 size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-medium text-gray-500 mb-1">No elevations yet</p>
          <p className="text-sm text-gray-400">Upload elevation images to walls in your design to view them here</p>
        </div>
      </div>
    );
  }

  const imgHeight = Math.round((zoom / 100) * 480);

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-2">Elevations</span>
          <span className="text-xs text-gray-400">{allElevations.length} wall{allElevations.length !== 1 ? "s" : ""}</span>
        </div>
        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => adjustZoom(-1)}
            disabled={zoom <= zoomLevels[0]}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="min-w-[52px] text-center text-xs font-semibold text-gray-600 hover:text-[#F15A22] py-1 px-2 rounded hover:bg-white transition-all"
            title="Reset zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={() => adjustZoom(1)}
            disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      {/* Elevations scroll area */}
      <div
        className="flex-1 overflow-auto p-8"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            adjustZoom(e.deltaY < 0 ? 1 : -1);
          }
        }}
      >
        <div className="flex items-end gap-10" style={{ width: "max-content", minHeight: "100%" }}>
          {allElevations.map((elev, idx) => (
            <div key={elev.id} className="flex flex-col items-center gap-3">
              {/* Image */}
              <div
                className="bg-white border border-gray-200 shadow-sm overflow-hidden"
                style={{ height: `${imgHeight}px` }}
              >
                <img
                  src={elev.image}
                  alt={elev.label}
                  style={{ height: "100%", width: "auto", display: "block" }}
                />
              </div>
              {/* Label */}
              <div className="text-center">
                {elev.face && (
                  <span className="inline-block bg-[#F15A22] text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                    {elev.face}
                  </span>
                )}
                <p className="text-xs font-medium text-gray-600">{elev.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}