import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ZoomIn, ZoomOut, ArrowLeft, Home, Maximize2 } from "lucide-react";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import VerticalElevation from "@/components/configurator/VerticalElevation";
import HorizontalElevation from "@/components/configurator/HorizontalElevation";

const API_BASE = "/api";
const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 4.2;

export default function SharedDesign() {
  const { shareId } = useParams();
  const [activeTab, setActiveTab] = useState("floor-plan");
  const [zoom, setZoom] = useState(50);

  const { data: design, isLoading, error } = useQuery({
    queryKey: ["shared", shareId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/shared/${shareId}`);
      if (!res.ok) throw new Error("Design not found");
      return res.json();
    },
  });

  // Fetch wall images and floor plan images for rendering
  const { data: wallImagesList = [] } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/entities/WallImage`);
      return res.ok ? res.json() : [];
    },
  });
  const { data: floorPlanImagesList = [] } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/entities/FloorPlanImage`);
      return res.ok ? res.json() : [];
    },
  });
  const { data: customWalls = [] } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/entities/WallEntry`);
      return res.ok ? res.json() : [];
    },
  });

  const wallImages = useMemo(() => {
    const map = {};
    wallImagesList.forEach(w => { if (w.wallType && w.imageUrl) map[w.wallType] = w.imageUrl; });
    return map;
  }, [wallImagesList]);

  const floorPlanImages = useMemo(() => {
    const map = {};
    floorPlanImagesList.forEach(f => { if (f.moduleType && f.imageUrl) map[f.moduleType] = f.imageUrl; });
    return map;
  }, [floorPlanImagesList]);

  // Hydrate modules and walls with images
  const placedModules = useMemo(() => {
    if (!design?.grid) return [];
    return design.grid.map(m => ({
      ...m,
      floorPlanImage: m.floorPlanImage || floorPlanImages[m.type] || null,
    }));
  }, [design, floorPlanImages]);

  const walls = useMemo(() => {
    if (!design?.walls) return [];
    return design.walls.map(w => {
      const wallType = w.type || w.mpCode || w.label;
      return {
        ...w,
        elevationImage: w.elevationImage || (wallType ? wallImages[wallType] : null),
      };
    });
  }, [design, wallImages]);

  const furniture = design?.furniture || [];

  // Elevation geometry
  const { minX, maxX, allMinY, allMaxY, wElevation, yElevation, zElevation, xElevation } = useElevationGeometry(placedModules, walls);

  const scale = zoom / 100;
  const wallHPx = Math.round(scale * WALL_H_M * PX_PER_M);
  const endElevationHPx = wallHPx;
  const totalWidthCells = maxX - minX;
  const totalWidthPx = Math.round(scale * totalWidthCells * CELL_M * PX_PER_M);
  const totalDepthCells = allMaxY - allMinY;

  const labelMapZ = { 1: "P1", 2: "C", 3: "P2" };
  const labelMapX = { 1: "P2", 2: "C", 3: "P1" };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#F15A22] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Design Not Found</h1>
        <p className="text-gray-500">This shared design link may have expired or is invalid.</p>
        <Link to="/" className="px-4 py-2 bg-[#F15A22] text-white text-sm font-medium hover:bg-[#d94e1a] transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const totalSqm = design.totalSqm || placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
  const estimatedPrice = design.estimatedPrice || 0;

  const tabs = [
    { id: "floor-plan", label: "Floor Plan" },
    { id: "elevations", label: "Elevations" },
    { id: "summary", label: "Summary" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between" data-testid="shared-design-header">
        <div className="flex items-center gap-4">
          <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="Connectapod" style={{ height: "22px" }} />
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-base font-bold text-gray-800" data-testid="shared-design-name">{design.name}</h1>
            {design.clientFirstName && (
              <p className="text-xs text-gray-400">{design.clientFirstName} {design.clientFamilyName}</p>
            )}
          </div>
        </div>
        <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] border border-gray-200 hover:border-[#F15A22] transition-all" data-testid="shared-design-home-link">
          <Home size={13} /> Connectapod
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-0" data-testid="shared-design-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-testid={`shared-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-[#F15A22] text-[#F15A22]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "floor-plan" && (
          <FloorPlanView modules={placedModules} walls={walls} furniture={furniture} />
        )}
        {activeTab === "elevations" && (
          <ElevationsView
            placedModules={placedModules}
            walls={walls}
            customWalls={customWalls}
            zoom={zoom}
            setZoom={setZoom}
            scale={scale}
            wallHPx={wallHPx}
            endElevationHPx={endElevationHPx}
            totalWidthPx={totalWidthPx}
            totalDepthCells={totalDepthCells}
            wElevation={wElevation}
            yElevation={yElevation}
            zElevation={zElevation}
            xElevation={xElevation}
            labelMapZ={labelMapZ}
            labelMapX={labelMapX}
          />
        )}
        {activeTab === "summary" && (
          <SummaryView design={design} modules={placedModules} walls={walls} totalSqm={totalSqm} estimatedPrice={estimatedPrice} />
        )}
      </div>
    </div>
  );
}

/* ── Floor Plan View ── */
function FloorPlanView({ modules, walls, furniture }) {
  if (modules.length === 0) {
    return <div className="flex items-center justify-center h-96 text-gray-400">No modules in this design</div>;
  }

  const minX = Math.min(...modules.map(m => m.x));
  const maxX = Math.max(...modules.map(m => m.x + m.w));
  const minY = Math.min(...modules.map(m => m.y));
  const maxY = Math.max(...modules.map(m => m.y + m.h));
  const gridW = maxX - minX;
  const gridH = maxY - minY;
  const cellSize = Math.min(600 / gridW, 500 / gridH, 40);

  return (
    <div className="p-8 flex justify-center" data-testid="shared-floor-plan">
      <div className="bg-white shadow-sm border border-gray-200 p-8 inline-block">
        <div style={{ position: "relative", width: gridW * cellSize, height: gridH * cellSize }}>
          {modules.map((m, i) => (
            <div
              key={m.id || i}
              style={{
                position: "absolute",
                left: (m.x - minX) * cellSize,
                top: (m.y - minY) * cellSize,
                width: m.w * cellSize,
                height: m.h * cellSize,
                backgroundColor: m.color || "#FDF0EB",
                border: `2px solid ${m.border || "#F15A22"}`,
                overflow: "hidden",
              }}
            >
              {m.floorPlanImage && (
                <img src={m.floorPlanImage} alt="" className="w-full h-full object-fill" style={{ transform: m.flipped ? "scaleX(-1)" : m.rotation === 180 ? "rotate(180deg)" : undefined }} />
              )}
              {!m.floorPlanImage && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[8px] text-gray-400 text-center px-1 leading-tight">{m.label || m.type || ""}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Elevations View ── */
function ElevationsView({ placedModules, walls, customWalls, zoom, setZoom, scale, wallHPx, endElevationHPx, totalWidthPx, totalDepthCells, wElevation, yElevation, zElevation, xElevation, labelMapZ, labelMapX }) {
  const zoomLevels = [20, 25, 37, 50, 62, 75, 100];
  const adjustZoom = (delta) => {
    if (delta > 0) { const next = zoomLevels.find(z => z > zoom); if (next) setZoom(next); }
    else { const prev = [...zoomLevels].reverse().find(z => z < zoom); if (prev) setZoom(prev); }
  };

  if (placedModules.length === 0) {
    return <div className="flex items-center justify-center h-96 text-gray-400">No modules in this design</div>;
  }

  return (
    <div className="p-8" data-testid="shared-elevations">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Building Elevations</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => adjustZoom(-1)} className="p-1.5 rounded hover:bg-white text-gray-500 disabled:opacity-30" disabled={zoom <= zoomLevels[0]}><ZoomOut size={14} /></button>
          <span className="text-xs font-semibold text-gray-600 px-2">{zoom}%</span>
          <button onClick={() => adjustZoom(1)} className="p-1.5 rounded hover:bg-white text-gray-500 disabled:opacity-30" disabled={zoom >= zoomLevels[zoomLevels.length - 1]}><ZoomIn size={14} /></button>
        </div>
      </div>
      <div className="overflow-x-auto pb-8">
        <div style={{ display: "inline-block", minWidth: "max-content" }}>
          {/* Z & X */}
          <div style={{ display: "inline-block", marginBottom: 40, verticalAlign: "top" }}>
            <div style={{ display: "inline-block", marginRight: 16, verticalAlign: "top" }}>
              <VerticalElevation layers={zElevation} label="Z — West Elevation" color="#f59e0b" totalDepthCells={totalDepthCells} endElevationHPx={endElevationHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} WALL_H_M={WALL_H_M} slotOffsets={{ 1: 0, 2: 0, 3: 0 }} labelMap={labelMapZ} />
            </div>
            <div style={{ display: "inline-block", verticalAlign: "top" }}>
              <VerticalElevation layers={xElevation} label="X — East Elevation" color="#ef4444" totalDepthCells={totalDepthCells} endElevationHPx={endElevationHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} WALL_H_M={WALL_H_M} slotOffsets={{ 1: 0, 2: 0, 3: 0 }} labelMap={labelMapX} />
            </div>
          </div>
          {/* W & Y */}
          <HorizontalElevation layers={wElevation} label="W — North Elevation" color="#22c55e" totalWidthPx={totalWidthPx} wallHPx={wallHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} flip={true} />
          <HorizontalElevation layers={yElevation} label="Y — South Elevation" color="#3b82f6" totalWidthPx={totalWidthPx} wallHPx={wallHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} />
        </div>
      </div>
    </div>
  );
}

/* ── Summary View ── */
function SummaryView({ design, modules, walls, totalSqm, estimatedPrice }) {
  // Calculate deck vs internal
  const deckModules = modules.filter(m => {
    const label = (m.label || m.groupKey || m.type || "").toLowerCase();
    return label.includes("deck") || label.includes("soffit");
  });
  const internalModules = modules.filter(m => {
    const label = (m.label || m.groupKey || m.type || "").toLowerCase();
    return !label.includes("deck") && !label.includes("soffit");
  });
  const deckSqm = deckModules.reduce((s, m) => s + (m.sqm || 0), 0);
  const internalSqm = internalModules.reduce((s, m) => s + (m.sqm || 0), 0);

  const rows = [
    { label: "Modules", value: modules.length },
    { label: "Walls", value: walls.length },
    { label: "Internal Floor Area", value: `${internalSqm.toFixed(1)} m²` },
    { label: "Deck Area", value: `${deckSqm.toFixed(1)} m²` },
    { label: "Total Area", value: `${totalSqm.toFixed(1)} m²` },
  ];

  return (
    <div className="p-8 max-w-xl mx-auto" data-testid="shared-summary">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">Design Summary</h2>
      <div className="bg-white border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h3 className="text-lg font-bold text-gray-900">{design.name}</h3>
          {design.siteAddress && <p className="text-xs text-gray-400 mt-1">{design.siteAddress}</p>}
        </div>
        {rows.map(row => (
          <div key={row.label} className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">{row.label}</span>
            <span className="text-sm font-semibold text-gray-900">{row.value}</span>
          </div>
        ))}
        {estimatedPrice > 0 && (
          <div className="px-5 py-4 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Estimated Price</span>
            <span className="text-lg font-bold text-[#F15A22]">${(estimatedPrice / 1000).toFixed(0)}k</span>
          </div>
        )}
      </div>
      {/* Module breakdown */}
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-3">Module Breakdown</h3>
      <div className="bg-white border border-gray-200 shadow-sm divide-y divide-gray-100">
        {modules.map((m, i) => (
          <div key={m.id || i} className="px-5 py-2.5 flex items-center justify-between">
            <span className="text-xs text-gray-700">{m.label || m.type || `Module ${i + 1}`}</span>
            <span className="text-xs text-gray-500">{(m.sqm || 0).toFixed(1)} m²</span>
          </div>
        ))}
      </div>
    </div>
  );
}
