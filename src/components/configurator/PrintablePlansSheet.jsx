import React from "react";
import FloorPlanSVG from "./FloorPlanSVG";

export default function PrintablePlansSheet({ placedModules }) {
  const modules = placedModules.filter(m => m.floorPlanImage || m.type);

  React.useEffect(() => {
    window.print();
  }, []);

  const totalSqm = modules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const totalPrice = modules.reduce((sum, m) => sum + (m.price || 0), 0);

  return (
    <div className="p-12 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Floor Plans</h1>
      <p className="text-sm text-gray-500 mb-8">connectapod Design - Floor Plan Layout</p>

      <div className="grid grid-cols-2 gap-12 mb-12">
        {modules.map((mod) => (
          <div key={mod.id} className="page-break">
            <div className="border border-gray-300 p-6 bg-white">
              {/* Header */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">{mod.label || mod.type}</h2>
                <p className="text-xs text-gray-500 mt-1">Code: {mod.type}</p>
              </div>

              {/* Floor Plan Image */}
              {mod.floorPlanImage ? (
                <img
                  src={mod.floorPlanImage}
                  alt={mod.label}
                  className="w-full h-48 object-contain mb-4 bg-gray-50 border border-gray-200 p-2"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 border border-gray-300 flex items-center justify-center mb-4">
                  <FloorPlanSVG code={mod.type} />
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Width</p>
                  <p className="font-semibold text-gray-900">{mod.widthCode || mod.w}m</p>
                </div>
                <div>
                  <p className="text-gray-500">Area</p>
                  <p className="font-semibold text-gray-900">{mod.sqm?.toFixed(1) || "N/A"} sqm</p>
                </div>
                <div>
                  <p className="text-gray-500">Price</p>
                  <p className="font-semibold text-gray-900">${mod.price?.toLocaleString() || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Chassis</p>
                  <p className="font-semibold text-gray-900">{mod.chassis || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t-2 border-gray-900 pt-8 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Modules</p>
            <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Area</p>
            <p className="text-2xl font-bold text-gray-900">{totalSqm.toFixed(1)} sqm</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Price</p>
            <p className="text-2xl font-bold text-gray-900">${totalPrice.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}