import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ZoomIn, ZoomOut, Home, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import VerticalElevation from "@/components/configurator/VerticalElevation";
import HorizontalElevation from "@/components/configurator/HorizontalElevation";

const API_BASE = "/api";
const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 4.2;
const LOGO_URL = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png";

export default function SharedDesign() {
  const { shareId } = useParams();
  const [activeTab, setActiveTab] = useState("title");
  const [zoom, setZoom] = useState(50);

  const { data: design, isLoading, error } = useQuery({
    queryKey: ["shared", shareId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/shared/${shareId}`);
      if (!res.ok) throw new Error("Design not found");
      return res.json();
    },
  });

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
    { id: "title", label: "Overview" },
    { id: "floor-plan", label: "Floor Plan" },
    { id: "elevations", label: "Elevations" },
    { id: "summary", label: "Pricing & Summary" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between" data-testid="shared-design-header">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="Connectapod" style={{ height: "22px" }} />
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
        {activeTab === "title" && (
          <TitlePage design={design} modules={placedModules} walls={walls} totalSqm={totalSqm} estimatedPrice={estimatedPrice} />
        )}
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

/* ── Title / Overview Page ── */
function TitlePage({ design, modules, walls, totalSqm, estimatedPrice }) {
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
  const fullClientName = [design.clientFirstName, design.clientFamilyName].filter(Boolean).join(" ");
  const dateStr = design.created_date ? new Date(design.created_date).toLocaleDateString("en-NZ", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="flex items-center justify-center py-12 px-4" data-testid="shared-title-page">
      <div className="bg-white shadow-lg border border-gray-200 w-full max-w-2xl">
        {/* Brand header bar */}
        <div className="bg-[#F15A22] px-8 py-1.5" />
        <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-gray-100">
          <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="Connectapod" style={{ height: "30px" }} />
          <div className="text-right">
            <p className="text-[10px] text-[#F15A22] font-semibold">www.connectapod.co.nz</p>
            <p className="text-[10px] text-gray-400">hello@connectapod.co.nz &middot; 022 396 2657</p>
          </div>
        </div>

        {/* Title */}
        <div className="px-8 py-10 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Design Proposal</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-1" data-testid="title-design-name">{design.projectName || design.name}</h2>
          {fullClientName && <p className="text-sm text-gray-500">Prepared for {fullClientName}</p>}
          <p className="text-xs text-gray-400 mt-2">{dateStr}</p>
        </div>

        {/* Key details grid */}
        <div className="px-8 py-6 grid grid-cols-2 gap-x-8 gap-y-4 border-b border-gray-100">
          {design.siteAddress && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Site Address</p>
              <p className="text-sm text-gray-700" data-testid="title-site-address">{design.siteAddress}</p>
            </div>
          )}
          {fullClientName && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Client</p>
              <p className="text-sm text-gray-700">{fullClientName}</p>
              {design.email && <p className="text-xs text-gray-400">{design.email}</p>}
              {design.phone && <p className="text-xs text-gray-400">{design.phone}</p>}
            </div>
          )}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Modules</p>
            <p className="text-sm text-gray-700">{modules.length} modules</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Wall Panels</p>
            <p className="text-sm text-gray-700">{walls.length} panels</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Internal Floor Area</p>
            <p className="text-sm text-gray-700">{internalSqm.toFixed(1)} m&sup2;</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Deck Area</p>
            <p className="text-sm text-gray-700">{deckSqm.toFixed(1)} m&sup2;</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Area</p>
            <p className="text-sm font-semibold text-gray-900">{totalSqm.toFixed(1)} m&sup2;</p>
          </div>
          {estimatedPrice > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Building Estimate</p>
              <p className="text-lg font-bold text-[#F15A22]">${estimatedPrice.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-8 py-4 bg-gray-50">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            This document is indicative only and subject to final confirmation and site inspection to the satisfaction of connectapod.
            &copy; {new Date().getFullYear()} Connectapod Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Floor Plan View ── */
function FloorPlanView({ modules, walls, furniture }) {
  if (modules.length === 0) {
    return <div className="flex items-center justify-center h-96 text-gray-400">No modules in this design</div>;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  modules.forEach(m => {
    minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x + m.w);
    minY = Math.min(minY, m.y); maxY = Math.max(maxY, m.y + m.h);
  });
  walls.forEach(w => {
    minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x + (w.orientation === "horizontal" ? w.length : w.thickness || 0.5));
    minY = Math.min(minY, w.y); maxY = Math.max(maxY, w.y + (w.orientation === "vertical" ? w.length : w.thickness || 0.5));
  });
  furniture.forEach(f => {
    const fw = (f.width || 1.4) / CELL_M;
    const fd = (f.depth || 2.0) / CELL_M;
    minX = Math.min(minX, f.x - fw / 2); maxX = Math.max(maxX, f.x + fw / 2);
    minY = Math.min(minY, f.y - fd / 2); maxY = Math.max(maxY, f.y + fd / 2);
  });

  const pad = 2;
  const gridW = maxX - minX + pad * 2;
  const gridH = maxY - minY + pad * 2;
  const cellSize = Math.min(800 / gridW, 600 / gridH, 50);
  const svgW = gridW * cellSize;
  const svgH = gridH * cellSize;
  const ox = pad;
  const oy = pad;

  return (
    <div className="p-8 flex flex-col items-center gap-4" data-testid="shared-floor-plan">
      <div className="bg-white shadow-sm border border-gray-200 p-4 inline-block overflow-auto">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: "100%" }}>
          {/* Grid */}
          <defs>
            <pattern id="shared-grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
              <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={svgW} height={svgH} fill="white" />
          <rect width={svgW} height={svgH} fill="url(#shared-grid)" />

          {/* Walls */}
          {walls.map((wall) => {
            const wallW = wall.orientation === "horizontal" ? wall.length * cellSize : (wall.thickness || 0.5) * cellSize;
            const wallH = wall.orientation === "vertical" ? wall.length * cellSize : (wall.thickness || 0.5) * cellSize;
            const wx = (wall.x - minX + ox) * cellSize;
            const wy = (wall.y - minY + oy) * cellSize;
            return (
              <g key={wall.id}>
                <rect x={wx} y={wy} width={wallW} height={wallH} fill="#4B5563" stroke="#2d3748" strokeWidth="1" />
                {wall.elevationImage && <image x={wx + 1} y={wy + 1} width={wallW - 2} height={wallH - 2} href={wall.elevationImage} preserveAspectRatio="xMidYMid slice" />}
              </g>
            );
          })}

          {/* Modules */}
          {modules.map((mod) => {
            const x = (mod.x - minX + ox) * cellSize;
            const y = (mod.y - minY + oy) * cellSize;
            const w = mod.w * cellSize;
            const h = mod.h * cellSize;
            const rotation = mod.rotation || 0;
            const t = [`translate(${x + w / 2}, ${y + h / 2})`, `rotate(${rotation})`, mod.flipped ? "scale(-1, 1)" : "", `translate(${-w / 2}, ${-h / 2})`].filter(Boolean).join(" ");
            return (
              <g key={mod.id}>
                <g transform={t}>
                  <rect x={0} y={0} width={w} height={h} fill="white" stroke="#111" strokeWidth="2" />
                  {mod.floorPlanImage && (
                    <image x={0} y={0} width={w} height={h} href={mod.floorPlanImage} preserveAspectRatio="xMidYMid slice" />
                  )}
                  {!mod.floorPlanImage && (
                    <text x={w / 2} y={h / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#999">{mod.label || mod.type || ""}</text>
                  )}
                </g>
              </g>
            );
          })}

          {/* Furniture */}
          {furniture.map((f) => {
            const fw = ((f.width || 1.4) / CELL_M) * cellSize;
            const fd = ((f.depth || 2.0) / CELL_M) * cellSize;
            const fx = (f.x - minX + ox) * cellSize;
            const fy = (f.y - minY + oy) * cellSize;
            const t = [`translate(${fx + fw / 2}, ${fy + fd / 2})`, `rotate(${f.rotation || 0})`, f.flipped ? "scale(-1, 1)" : "", `translate(${-fw / 2}, ${-fd / 2})`].filter(Boolean).join(" ");
            return (
              <g key={f.id} transform={t}>
                {f.image ? (
                  <image x={0} y={0} width={fw} height={fd} href={f.image} preserveAspectRatio="xMidYMid meet" />
                ) : (
                  <>
                    <rect x={0} y={0} width={fw} height={fd} fill="#FFE4DB" fillOpacity="0.6" stroke="#F15A22" strokeWidth="0.5" strokeDasharray="2,2" />
                    <text x={fw / 2} y={fd / 2 + 3} textAnchor="middle" fontSize="7" fill="#F15A22">{f.label || f.type}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Dimension annotations for modules */}
          {modules.map((mod) => {
            const x = (mod.x - minX + ox) * cellSize;
            const y = (mod.y - minY + oy) * cellSize;
            const w = mod.w * cellSize;
            const h = mod.h * cellSize;
            const widthM = (mod.w * CELL_M).toFixed(1);
            const depthM = (mod.h * CELL_M).toFixed(1);
            return (
              <g key={`dim-${mod.id}`}>
                {/* Width dimension - top */}
                <line x1={x} y1={y - 6} x2={x + w} y2={y - 6} stroke="#999" strokeWidth="0.6" />
                <line x1={x} y1={y - 10} x2={x} y2={y - 2} stroke="#999" strokeWidth="0.4" />
                <line x1={x + w} y1={y - 10} x2={x + w} y2={y - 2} stroke="#999" strokeWidth="0.4" />
                <text x={x + w / 2} y={y - 8} textAnchor="middle" fontSize="7" fill="#666" fontWeight="500">{widthM}m</text>
                {/* Depth dimension - left */}
                <line x1={x - 6} y1={y} x2={x - 6} y2={y + h} stroke="#999" strokeWidth="0.6" />
                <line x1={x - 10} y1={y} x2={x - 2} y2={y} stroke="#999" strokeWidth="0.4" />
                <line x1={x - 10} y1={y + h} x2={x - 2} y2={y + h} stroke="#999" strokeWidth="0.4" />
                <text x={x - 8} y={y + h / 2 + 2} textAnchor="middle" fontSize="7" fill="#666" fontWeight="500" transform={`rotate(-90, ${x - 8}, ${y + h / 2 + 2})`}>{depthM}m</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[10px] text-gray-400">Scale: 1 cell = {CELL_M}m &middot; Dimensions shown in metres</p>
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
          <div style={{ display: "inline-block", marginBottom: 40, verticalAlign: "top" }}>
            <div style={{ display: "inline-block", marginRight: 16, verticalAlign: "top" }}>
              <VerticalElevation layers={zElevation} label="Z — West Elevation" color="#f59e0b" totalDepthCells={totalDepthCells} endElevationHPx={endElevationHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} WALL_H_M={WALL_H_M} slotOffsets={{ 1: 0, 2: 0, 3: 0 }} labelMap={labelMapZ} />
            </div>
            <div style={{ display: "inline-block", verticalAlign: "top" }}>
              <VerticalElevation layers={xElevation} label="X — East Elevation" color="#ef4444" totalDepthCells={totalDepthCells} endElevationHPx={endElevationHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} WALL_H_M={WALL_H_M} slotOffsets={{ 1: 0, 2: 0, 3: 0 }} labelMap={labelMapX} />
            </div>
          </div>
          <HorizontalElevation layers={wElevation} label="W — North Elevation" color="#22c55e" totalWidthPx={totalWidthPx} wallHPx={wallHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} flip={true} />
          <HorizontalElevation layers={yElevation} label="Y — South Elevation" color="#3b82f6" totalWidthPx={totalWidthPx} wallHPx={wallHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} />
        </div>
      </div>
    </div>
  );
}

/* ── Summary / Pricing View ── */
function SummaryView({ design, modules, walls, totalSqm, estimatedPrice }) {
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

  const modulesTotal = modules.reduce((s, m) => s + (m.price || 0), 0);
  const wallsTotal = walls.reduce((s, w) => s + (w.price || 0), 0);
  const buildingSubtotal = modulesTotal + wallsTotal;

  const moduleGroups = {};
  modules.forEach(mod => {
    const k = mod.label || mod.type;
    if (!moduleGroups[k]) moduleGroups[k] = { label: k, sqm: mod.sqm || 0, price: mod.price || 0, count: 0 };
    moduleGroups[k].count += 1;
  });

  const wallGroups = {};
  walls.forEach(w => {
    const k = w.label || w.type;
    if (!wallGroups[k]) wallGroups[k] = { label: k, face: w.face || "-", price: w.price || 0, count: 0 };
    wallGroups[k].count += 1;
  });

  const fullClientName = [design.clientFirstName, design.clientFamilyName].filter(Boolean).join(" ");

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6" data-testid="shared-summary">
      {/* Project info banner */}
      <div className="bg-white border border-gray-200 shadow-sm px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900" data-testid="summary-design-name">{design.projectName || design.name}</h2>
            {fullClientName && <p className="text-sm text-gray-500 mt-0.5">{fullClientName}</p>}
          </div>
          {estimatedPrice > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Building Estimate</p>
              <p className="text-xl font-bold text-[#F15A22]">${estimatedPrice.toLocaleString()}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
          {design.siteAddress && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Site Address</p>
              <p className="text-xs text-gray-700 mt-0.5" data-testid="summary-site-address">{design.siteAddress}</p>
            </div>
          )}
          {design.email && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Email</p>
              <p className="text-xs text-gray-700 mt-0.5">{design.email}</p>
            </div>
          )}
          {design.phone && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Phone</p>
              <p className="text-xs text-gray-700 mt-0.5">{design.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Area Summary */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Area Summary</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Internal Floor Area</span>
            <span className="text-sm font-semibold text-gray-900">{internalSqm.toFixed(1)} m&sup2;</span>
          </div>
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Deck Area</span>
            <span className="text-sm font-semibold text-gray-900">{deckSqm.toFixed(1)} m&sup2;</span>
          </div>
          <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Total Area</span>
            <span className="text-sm font-bold text-gray-900">{totalSqm.toFixed(1)} m&sup2;</span>
          </div>
        </div>
      </div>

      {/* Module Breakdown */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modules ({modules.length})</p>
          <p className="text-xs font-bold text-gray-500">${modulesTotal.toLocaleString()}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.values(moduleGroups).map(g => (
            <div key={g.label} className="px-5 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-700">{g.count > 1 ? `${g.label} x${g.count}` : g.label}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">{(g.sqm * g.count).toFixed(1)} m&sup2;</span>
                <span className="text-xs font-medium text-gray-700 w-20 text-right">${(g.price * g.count).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wall Breakdown */}
      {walls.length > 0 && (
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wall Panels ({walls.length})</p>
            <p className="text-xs font-bold text-gray-500">${wallsTotal.toLocaleString()}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.values(wallGroups).map(g => (
              <div key={g.label} className="px-5 py-2.5 flex items-center justify-between">
                <span className="text-xs text-gray-700">{g.count > 1 ? `${g.label} x${g.count}` : g.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">{g.face}</span>
                  <span className="text-xs font-medium text-gray-700 w-20 text-right">${(g.price * g.count).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Building Total</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Modules Subtotal</span>
            <span className="text-sm text-gray-700">${modulesTotal.toLocaleString()}</span>
          </div>
          {wallsTotal > 0 && (
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Wall Panels Subtotal</span>
              <span className="text-sm text-gray-700">${wallsTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="px-5 py-4 flex items-center justify-between bg-[#FDF5F0]">
            <span className="text-sm font-bold text-gray-900">Building Estimate (excl. site costs)</span>
            <span className="text-lg font-bold text-[#F15A22]">${buildingSubtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-400 leading-relaxed px-2">
        This estimate is for the building components only (modules and wall panels). Site preparation, delivery, installation, and GST are not included and will be calculated separately based on site conditions and location. This estimate is indicative only and subject to final confirmation and site inspection to the satisfaction of connectapod. &copy; {new Date().getFullYear()} Connectapod Ltd.
      </p>
    </div>
  );
}
