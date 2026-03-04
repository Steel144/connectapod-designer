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
    <div className="bg-white">
      {/* Title Block - Page 1 */}
      <div className="h-screen flex flex-col p-0" style={{ pageBreakAfter: "always" }}>
        {/* Main content area */}
        <div className="flex-1 flex flex-col p-16 justify-center">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">connectapod</h1>
            <p className="text-2xl text-gray-600">FLOOR PLANS</p>
          </div>

          {/* Grid of floor plans */}
          <div className="grid grid-cols-2 gap-16 mb-16">
            {modules.map((mod) => (
              <div key={mod.id} className="flex flex-col">
                {/* Floor Plan */}
                <div className="border-2 border-gray-900 bg-gray-50 aspect-square flex items-center justify-center mb-4">
                  {mod.floorPlanImage ? (
                    <img
                      src={mod.floorPlanImage}
                      alt={mod.label}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <FloorPlanSVG code={mod.type} />
                  )}
                </div>

                {/* Plan label and dimensions */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{mod.label || mod.type}</h3>
                  <p className="text-sm text-gray-600 mt-1">Code: {mod.type}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-xs border-t border-gray-300 pt-3">
                    <div>
                      <p className="text-gray-500 text-[10px]">WIDTH</p>
                      <p className="font-bold text-gray-900">{mod.widthCode || mod.w}m</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px]">AREA</p>
                      <p className="font-bold text-gray-900">{mod.sqm?.toFixed(1)} sqm</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px]">PRICE</p>
                      <p className="font-bold text-gray-900">${mod.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary box */}
          <div className="border-2 border-gray-900 p-8 bg-gray-50 mt-auto">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">PROJECT SUMMARY</p>
            <div className="grid grid-cols-3 gap-12">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Modules</p>
                <p className="text-4xl font-bold text-gray-900">{modules.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Total Area</p>
                <p className="text-4xl font-bold text-gray-900">{totalSqm.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">sqm</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Est. Price</p>
                <p className="text-3xl font-bold text-gray-900">${(totalPrice / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>
        </div>

        {/* Title block footer */}
        <div className="border-t-2 border-gray-900 grid grid-cols-4 text-[10px] text-gray-600">
          <div className="border-r border-gray-900 p-4">
            <p className="uppercase font-bold text-gray-900">Project</p>
            <p className="mt-1">connectapod Design</p>
          </div>
          <div className="border-r border-gray-900 p-4">
            <p className="uppercase font-bold text-gray-900">Sheet</p>
            <p className="mt-1">Floor Plans</p>
          </div>
          <div className="border-r border-gray-900 p-4">
            <p className="uppercase font-bold text-gray-900">Date</p>
            <p className="mt-1">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="p-4">
            <p className="uppercase font-bold text-gray-900">Scale</p>
            <p className="mt-1">As Noted</p>
          </div>
        </div>
      </div>

      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}