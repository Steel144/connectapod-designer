import React, { useState, useEffect } from "react";
import PrintPDFModal from "./PrintPDFModal";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import HorizontalElevation from "./HorizontalElevation";
import VerticalElevation from "./VerticalElevation";

const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 4.2;
const PRINT_SCALE = 0.42;

const getModulePavilion = (mod) => {
  if (mod.y < 13 && mod.y + mod.h > 9) return 3;
  if (mod.y < 20 && mod.y + mod.h > 19) return 2;
  if (mod.y < 30 && mod.y + mod.h > 26) return 1;
  return null;
};

const PAV_LABELS = { 3: "Pavilion 1", 2: "Connection", 1: "Pavilion 2" };

async function toDataURL(url) {
  try {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Try no-cors as fallback — will return opaque response but at least won't throw
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}

export default function PrintableElevationsSheet({ walls = [], placedModules = [], onClose, printDetails = {}, showLabels = true }) {
  const [imageMap, setImageMap] = useState({});
  const [imagesReady, setImagesReady] = useState(false);

  // Pre-fetch all elevation images as base64
  useEffect(() => {
    const urls = [...new Set(walls.map(w => w.elevationImage).filter(Boolean))];
    if (urls.length === 0) { setImagesReady(true); return; }

    Promise.all(urls.map(async url => [url, await toDataURL(url)]))
      .then(entries => {
        const map = {};
        entries.forEach(([url, data]) => { if (data) map[url] = data; });
        setImageMap(map);
        setImagesReady(true);
      });
  }, []);

  const scale = PRINT_SCALE;
  const wallHPx = Math.round(scale * WALL_H_M * PX_PER_M);
  const endElevationHPx = wallHPx;

  const { minX, maxX, allMinY, allMaxY, wElevation: wElRaw, yElevation: yElRaw, zElevation, xElevation } = useElevationGeometry(placedModules, walls);

  // Re-resolve W/Y walls with a more tolerant lookup (connection modules shift wall positions)
  const tolerantFindWall = (face, mod) => {
    if (face === "W") {
      return walls.find(w =>
        w.face === "W" &&
        Math.abs(w.x - mod.x) < 0.6 &&
        w.y >= mod.y - 2 && w.y <= mod.y + 0.6
      ) || null;
    }
    if (face === "Y") {
      return walls.find(w =>
        w.face === "Y" &&
        Math.abs(w.x - mod.x) < 0.6 &&
        w.y >= mod.y + mod.h - 0.6 && w.y <= mod.y + mod.h + 0.6
      ) || null;
    }
    return null;
  };

  const wElevation = wElRaw.map(layer => ({
    ...layer,
    slots: layer.slots.map(slot => ({ ...slot, wall: tolerantFindWall("W", slot.mod) || slot.wall }))
  }));
  const yElevation = yElRaw.map(layer => ({
    ...layer,
    slots: layer.slots.map(slot => ({ ...slot, wall: tolerantFindWall("Y", slot.mod) || slot.wall }))
  }));

  const totalWidthCells = maxX - minX;
  const totalWidthPx = Math.round(scale * totalWidthCells * CELL_M * PX_PER_M);
  const totalDepthCells = allMaxY - allMinY;

  const slotOffset1Z = -0.02, slotOffset2Z = 0.14, slotOffset3Z = 0;
  const slotOffset1X = -0.02, slotOffset2X = 0.15, slotOffset3X = 0;
  const slotScale3X = 1.1;
  const labelMapZ = { 1: "P1", 2: "C", 3: "P2" };
  const labelMapX = { 1: "P2", 2: "C", 3: "P1" };

  const findWall = (mod, face) => {
    const WALL_OFFSET = 0.31;
    return walls.find(w => {
      if (w.face !== face) return false;
      if (face === "Y") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y + mod.h)) < 0.5;
      if (face === "W") return Math.abs(w.x - mod.x) < 0.5 && Math.abs(w.y - (mod.y - WALL_OFFSET)) < 0.5;
      if (face === "Z") return Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - mod.x) < 0.5;
      if (face === "X") return Math.abs(w.y - mod.y) < 0.5 && Math.abs(w.x - (mod.x + mod.w - WALL_OFFSET)) < 0.5;
      return false;
    }) || null;
  };

  const pavilionModules = {
    1: placedModules.filter(m => getModulePavilion(m) === 1),
    2: placedModules.filter(m => getModulePavilion(m) === 2),
    3: placedModules.filter(m => getModulePavilion(m) === 3),
  };

  const pavilionPages = [3, 2, 1].filter(p => pavilionModules[p]?.length > 0);
  const totalPages = 1 + pavilionPages.length;

  const imgHeight = Math.round(wallHPx * 1.04);

  const ElevationImage = ({ wall, label, face }) => {
    const wallWidthM = wall.width ?? (wall.length ? wall.length * CELL_M : CELL_M);
    const wallWidthPx = Math.round(scale * wallWidthM * 100);
    const imgSrc = wall.elevationImage ? (imageMap[wall.elevationImage] || wall.elevationImage) : null;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
        <div style={{ height: `${imgHeight}px`, width: imgSrc ? "auto" : `${wallWidthPx}px`, overflow: "hidden", border: "1px solid #e5e7eb", background: "white" }}>
          {imgSrc ? (
            <img src={imgSrc} alt={label} style={{ height: "100%", width: "auto", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 4px,#e5e7eb 4px,#e5e7eb 8px)", border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "8px", color: "#9ca3af" }}>No wall</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "#F15A22", color: "white", fontSize: "8px", fontWeight: "bold", padding: "1px 5px", borderRadius: "2px" }}>{face}</span>
        </div>
      </div>
    );
  };

  const page1Content = (
    <div>
      {showLabels && <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Building Elevations</div>}
      <div style={{ display: "flex", gap: "12px", flexWrap: "nowrap", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
          <VerticalElevation layers={zElevation} label="Z — West Elevation" color="#f59e0b" totalDepthCells={totalDepthCells} endElevationHPx={endElevationHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} WALL_H_M={WALL_H_M} slotOffsets={{ 1: slotOffset1Z, 2: slotOffset2Z, 3: slotOffset3Z }} labelMap={labelMapZ} imageMap={imageMap} />
          <VerticalElevation layers={xElevation} label="X — East Elevation" color="#ef4444" totalDepthCells={totalDepthCells} endElevationHPx={endElevationHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} WALL_H_M={WALL_H_M} slotOffsets={{ 1: slotOffset1X, 2: slotOffset2X, 3: slotOffset3X }} slotScales={{ 3: slotScale3X }} labelMap={labelMapX} imageMap={imageMap} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: 0 }}>
          <HorizontalElevation layers={wElevation} label="W — North Elevation" color="#22c55e" totalWidthPx={totalWidthPx} wallHPx={wallHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} imageMap={imageMap} />
          <HorizontalElevation layers={yElevation} label="Y — South Elevation" color="#3b82f6" totalWidthPx={totalWidthPx} wallHPx={wallHPx} scale={scale} CELL_M={CELL_M} PX_PER_M={PX_PER_M} imageMap={imageMap} />
        </div>
      </div>
    </div>
  );

  const faceLabels = { Y: "Y Face (Outside / Top)", W: "W Face (Outside / Bottom)", Z: "Z Face (West)", X: "X Face (East)" };

  const pavilionPageDefs = pavilionPages.map((pavNum, idx) => {
    const mods = pavilionModules[pavNum];
    const label = PAV_LABELS[pavNum];
    return {
      sheet: `Elevations — ${label}`,
      pageNum: idx + 2,
      totalPages,
      content: (
        <div>
          {showLabels && <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>{label}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {["W", "Y", "Z", "X"].map(face => {
              const hasAny = mods.some(mod => findWall(mod, face));
              if (!hasAny) return null;
              return (
                <div key={face}>
                  {showLabels && <div style={{ fontSize: "9px", color: "#888", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>{faceLabels[face]}</div>}
                  <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
                    {mods.map((mod, i) => {
                      const wall = findWall(mod, face);
                      return wall ? <ElevationImage key={i} wall={wall} label={`${face}${i + 1}`} face={showLabels ? face : ""} /> : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    };
  });

  const allPages = [
    { sheet: "Elevations — Building", pageNum: 1, totalPages, content: page1Content },
    ...pavilionPageDefs,
  ];

  if (!imagesReady) return null;

  return (
    <PrintPDFModal
      title="Elevations"
      printDetails={printDetails}
      onClose={onClose}
      pages={allPages}
    />
  );
}