import React, { useEffect, useRef } from "react";
import { useElevationGeometry } from "@/hooks/useElevationGeometry";
import HorizontalElevation from "./HorizontalElevation";
import VerticalElevation from "./VerticalElevation";

const CELL_M = 0.6;
const PX_PER_M = 100;
const WALL_H_M = 4.2;
const PRINT_SCALE = 0.55;

const getModulePavilion = (mod) => {
  if (mod.y < 13 && mod.y + mod.h > 9) return 3;
  if (mod.y < 20 && mod.y + mod.h > 19) return 2;
  if (mod.y < 30 && mod.y + mod.h > 26) return 1;
  return null;
};

const PAV_LABELS = { 3: "Pavilion 1", 2: "Connection", 1: "Pavilion 2" };

const Header = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 8px", borderBottom: "2px solid #F15A22", flexShrink: 0 }}>
    <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/201470147_ConnectapodArchLogo-01.png" alt="connectapod" style={{ height: "72px", width: "auto" }} />
    <div style={{ textAlign: "center" }}>
      <div style={{ color: "#F15A22", fontSize: "14px", fontWeight: "600" }}>www.connectapod.co.nz</div>
      <div style={{ color: "#888", fontSize: "12px" }}>hello@connectapod.com · 022 396 2657</div>
    </div>
    <span style={{ color: "#888", fontSize: "20pt", fontWeight: "700" }}>{title}</span>
  </div>
);

const Footer = ({ sheet, pageNum, totalPages, printDetails = {} }) => (
  <div style={{ flexShrink: 0 }}>
    <div style={{ borderTop: "4px solid #F15A22", display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr", fontSize: "10px" }}>
      <div style={{ borderRight: "1px solid #F15A22", padding: "6px 16px" }}>
        <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Project</p>
        <p style={{ marginTop: "2px", color: "#333", fontWeight: "600", fontSize: "15px" }}>{printDetails.projectName || "—"}</p>

      </div>
      <div style={{ borderRight: "1px solid #F15A22", padding: "6px 16px" }}>
        <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Client</p>
        <p style={{ marginTop: "2px", color: "#333" }}>{printDetails.clientName || "—"}</p>
        {printDetails.address && <p style={{ marginTop: "1px", color: "#666", fontSize: "9px" }}>{printDetails.address}</p>}
        {(printDetails.email || printDetails.phone) && (
          <p style={{ marginTop: "1px", color: "#888", fontSize: "9px" }}>{[printDetails.email, printDetails.phone].filter(Boolean).join(" · ")}</p>
        )}
      </div>
      <div style={{ borderRight: "1px solid #F15A22", padding: "6px 16px" }}>
        <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Sheet</p>
        <p style={{ marginTop: "2px", color: "#666" }}>{sheet}</p>
      </div>
      <div style={{ borderRight: "1px solid #F15A22", padding: "6px 16px" }}>
        <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Date</p>
        <p style={{ marginTop: "2px", color: "#666" }}>{new Date().toLocaleDateString()}</p>
      </div>
      <div style={{ padding: "6px 16px" }}>
        <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Page</p>
        <p style={{ marginTop: "2px", color: "#666" }}>{pageNum} / {totalPages}</p>
        <p style={{ marginTop: "4px", color: "#000", fontSize: "9px", fontWeight: "600" }}>© {new Date().getFullYear()} Connectapod Ltd.</p>
      </div>
    </div>
  </div>
);

const PrintPage = ({ children, header, footer, isLast }) => {
  const contentRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    const container = contentRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const fit = () => {
      inner.style.transform = "none";
      inner.style.transformOrigin = "top left";
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const iw = inner.scrollWidth;
      const ih = inner.scrollHeight;
      if (iw > cw || ih > ch) {
        const scaleX = cw / iw;
        const scaleY = ch / ih;
        const s = Math.min(scaleX, scaleY, 1);
        inner.style.transform = `scale(${s})`;
      }
    };

    // Run after images load
    const imgs = inner.querySelectorAll("img");
    let loaded = 0;
    if (imgs.length === 0) { fit(); return; }
    imgs.forEach(img => {
      if (img.complete) { loaded++; if (loaded === imgs.length) fit(); }
      else img.addEventListener("load", () => { loaded++; if (loaded === imgs.length) fit(); }, { once: true });
    });
    fit();
  }, []);

  return (
    <div style={{
      background: "white",
      display: "flex",
      flexDirection: "column",
      width: "calc(420mm - 14mm)",
      height: "calc(297mm - 14mm)",
      pageBreakAfter: isLast ? "avoid" : "always",
      breakAfter: isLast ? "avoid" : "page",
      boxSizing: "border-box",
      overflow: "visible",
    }}>
      {header}
      <div ref={contentRef} style={{ flex: 1, overflow: "hidden", padding: "12px 24px", position: "relative", minHeight: 0 }}>
        <div ref={innerRef} style={{ display: "inline-block", transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
};

export default function PrintableElevationsSheet({ walls = [], placedModules = [], onClose, printDetails = {} }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const scale = PRINT_SCALE;
  const wallHPx = Math.round(scale * WALL_H_M * PX_PER_M);
  const endElevationHPx = wallHPx;

  const { minX, maxX, allMinY, allMaxY, wElevation, yElevation, zElevation, xElevation } = useElevationGeometry(placedModules, walls);

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

  const imgHeight = Math.round(wallHPx * 1.2);

  const ElevationImage = ({ wall, label, face }) => {
    const wallWidthM = wall.width ?? (wall.length ? wall.length * CELL_M : CELL_M);
    const wallWidthPx = Math.round(scale * wallWidthM * 100);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
        <div style={{ height: `${imgHeight}px`, width: wall.elevationImage ? "auto" : `${wallWidthPx}px`, overflow: "hidden", border: "1px solid #e5e7eb", background: "white" }}>
          {wall.elevationImage ? (
            <img src={wall.elevationImage} alt={label} style={{ height: "100%", width: "auto", display: "block", transform: wall.flipped ? "scaleX(-1)" : undefined }} />
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

  return (
    <div className="bg-white relative">
      <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
        <button
          onClick={() => { setTimeout(() => window.print(), 300); }}
          className="bg-[#F15A22] text-white px-4 py-2 rounded text-sm font-bold"
        >
          Print Again
        </button>
        <button
          onClick={() => onClose?.()}
          className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold"
        >
          ← Back to Design
        </button>
      </div>

      {/* Page 1 — Building Elevations */}
      <PrintPage
        isLast={totalPages === 1}
        header={<Header title="Elevations — Building" />}
        footer={<Footer sheet="Building Elevations" pageNum={1} totalPages={totalPages} printDetails={printDetails} />}
      >
        <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
          Building Elevations
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <VerticalElevation
            layers={zElevation}
            label="Z — West Elevation"
            color="#f59e0b"
            totalDepthCells={totalDepthCells}
            endElevationHPx={endElevationHPx}
            scale={scale}
            CELL_M={CELL_M}
            PX_PER_M={PX_PER_M}
            WALL_H_M={WALL_H_M}
            slotOffsets={{ 1: slotOffset1Z, 2: slotOffset2Z, 3: slotOffset3Z }}
            labelMap={labelMapZ}
          />
          <VerticalElevation
            layers={xElevation}
            label="X — East Elevation"
            color="#ef4444"
            totalDepthCells={totalDepthCells}
            endElevationHPx={endElevationHPx}
            scale={scale}
            CELL_M={CELL_M}
            PX_PER_M={PX_PER_M}
            WALL_H_M={WALL_H_M}
            slotOffsets={{ 1: slotOffset1X, 2: slotOffset2X, 3: slotOffset3X }}
            slotScales={{ 3: slotScale3X }}
            labelMap={labelMapX}
          />
          <div>
            <HorizontalElevation
              layers={wElevation}
              label="W — North Elevation"
              color="#22c55e"
              totalWidthPx={totalWidthPx}
              wallHPx={wallHPx}
              scale={scale}
              CELL_M={CELL_M}
              PX_PER_M={PX_PER_M}
            />
            <HorizontalElevation
              layers={yElevation}
              label="Y — South Elevation"
              color="#3b82f6"
              totalWidthPx={totalWidthPx}
              wallHPx={wallHPx}
              scale={scale}
              CELL_M={CELL_M}
              PX_PER_M={PX_PER_M}
            />
          </div>
        </div>
      </PrintPage>

      {/* One page per pavilion */}
      {pavilionPages.map((pavNum, idx) => {
        const mods = pavilionModules[pavNum];
        const pageNum = idx + 2;
        const isLast = pageNum === totalPages;
        const label = PAV_LABELS[pavNum];
        return (
          <PrintPage
            key={pavNum}
            isLast={isLast}
            header={<Header title={`Elevations — ${label}`} />}
            footer={<Footer sheet={label} pageNum={pageNum} totalPages={totalPages} printDetails={printDetails} />}
          >
            <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              {label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {(pavNum === 2 ? ["Z", "X"] : ["Y", "W"]).map(face => {
                const hasAny = mods.some(mod => findWall(mod, face));
                if (!hasAny) return null;
                const faceLabels = { Y: "Y Face (Outside / Top)", W: "W Face (Outside / Bottom)", Z: "Z Face (West)", X: "X Face (East)" };
                return (
                  <div key={face}>
                    <div style={{ fontSize: "9px", color: "#888", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {faceLabels[face]}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap" }}>
                      {mods.map((mod, i) => {
                        const wall = findWall(mod, face);
                        return wall ? <ElevationImage key={i} wall={wall} label={`${face}${i + 1}`} face={face} /> : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </PrintPage>
        );
      })}

      <style>{`
        @page { margin: 7mm; size: A3 landscape; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}