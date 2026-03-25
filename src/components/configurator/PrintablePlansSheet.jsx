import React, { useEffect, useRef } from "react";

const CELL_SIZE = 40; // pixels per grid cell in print

const PrintPage = ({ children, header, footer, isLast, paperSize = "a4" }) => {
  const contentRef = useRef(null);
  const innerRef = useRef(null);

  const pageDimensions = paperSize === "a3" 
    ? { width: "calc(420mm - 14mm)", height: "calc(297mm - 14mm)" }
    : { width: "calc(297mm - 14mm)", height: "calc(210mm - 14mm)" };

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
      justifyContent: "space-between",
      ...pageDimensions,
      pageBreakAfter: isLast ? "avoid" : "always",
      breakAfter: isLast ? "avoid" : "page",
      boxSizing: "border-box",
      overflow: "visible",
    }}>
      {header}
      <div ref={contentRef} style={{ flex: 1, overflow: "hidden", padding: "12px 24px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div ref={innerRef} style={{ display: "inline-block", transformOrigin: "center" }}>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
};

export default function PrintablePlansSheet({ placedModules, furniture = [], walls = [], onClose, printDetails = {}, paperSize = "a4", showLabels = true, showFurniture = true, showPhotoImages = true, showDimensions = true }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onClose]);

  const modules = placedModules || [];
  const totalSqm = modules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  const totalPrice = modules.reduce((sum, m) => sum + (m.price || 0), 0);

  // Calculate grid bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  modules.forEach(m => {
    minX = Math.min(minX, m.x);
    maxX = Math.max(maxX, m.x + m.w);
    minY = Math.min(minY, m.y);
    maxY = Math.max(maxY, m.y + m.h);
  });
  furniture.forEach(f => {
    const fWidthGridUnits = (f.width || 1.4) / 0.6;
    const fDepthGridUnits = (f.depth || 2.0) / 0.6;
    minX = Math.min(minX, f.x - fWidthGridUnits / 2);
    maxX = Math.max(maxX, f.x + fWidthGridUnits / 2);
    minY = Math.min(minY, f.y - fDepthGridUnits / 2);
    maxY = Math.max(maxY, f.y + fDepthGridUnits / 2);
  });
  walls.forEach(w => {
    minX = Math.min(minX, w.x);
    maxX = Math.max(maxX, w.x + (w.orientation === "horizontal" ? w.length : w.thickness));
    minY = Math.min(minY, w.y);
    maxY = Math.max(maxY, w.y + (w.orientation === "vertical" ? w.length : w.thickness));
  });

  if (modules.length === 0 && furniture.length === 0) {
    minX = 0; maxX = 10; minY = 0; maxY = 10;
  }

  const gridWidth = Math.max(maxX - minX, 0) + 2;
  const gridHeight = Math.max(maxY - minY, 0) + 2;
  const canvasWidth = gridWidth * CELL_SIZE;
  const canvasHeight = gridHeight * CELL_SIZE;

  const Header = ({ title }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 8px", borderBottom: "2px solid #F15A22", flexShrink: 0 }}>
      <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/201470147_ConnectapodArchLogo-01.png" alt="connectapod" style={{ height: "72px", width: "auto" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#F15A22", fontSize: "14px", fontWeight: "600" }}>www.connectapod.co.nz</div>
        <div style={{ color: "#888", fontSize: "12px" }}>hello@connectapod.co.nz · 022 396 2657</div>
      </div>
      <span style={{ color: "#888", fontSize: "20pt", fontWeight: "700" }}>{title}</span>
    </div>
  );

  const Footer = ({ printDetails = {} }) => (
    <div style={{ flexShrink: 0 }}>
      <div style={{ borderTop: "4px solid #F15A22", display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr", fontSize: "10px" }}>
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
          <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Date</p>
          <p style={{ marginTop: "2px", color: "#666" }}>{new Date().toLocaleDateString()}</p>
        </div>
        <div style={{ padding: "6px 16px" }}>
          <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22" }}>Scale</p>
          <p style={{ marginTop: "2px", color: "#666" }}>1:100</p>
          <p style={{ marginTop: "4px", color: "#000", fontSize: "9px", fontWeight: "600" }}>© {new Date().getFullYear()} Connectapod Ltd.</p>
        </div>
      </div>
    </div>
  );

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

      <PrintPage
        isLast={true}
        paperSize={paperSize}
        header={<Header title="Floor Plan" />}
        footer={<Footer printDetails={printDetails} />}
      >
            <svg
              width={canvasWidth}
              height={canvasHeight}
              style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block" }}
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={canvasWidth} height={canvasHeight} fill="white" />
              <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

              {/* Modules */}
              {modules.map((mod) => {
                const x = (mod.x - minX + 1) * CELL_SIZE;
                const y = (mod.y - minY + 1) * CELL_SIZE;
                const w = mod.w * CELL_SIZE;
                const h = mod.h * CELL_SIZE;

                return (
                  <g key={mod.id}>
                    {/* Module background */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="white"
                      stroke="#111"
                      strokeWidth="2"
                    />

                    {/* Floor plan image if available */}
                    {showPhotoImages && mod.floorPlanImage && (
                      <image
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        href={mod.floorPlanImage}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}

                    {/* Grid lines inside */}
                    {[...Array(mod.w)].map((_, i) => (
                      <line
                        key={`v-${i}`}
                        x1={x + (i + 1) * CELL_SIZE}
                        y1={y}
                        x2={x + (i + 1) * CELL_SIZE}
                        y2={y + h}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                        opacity="0.5"
                      />
                    ))}
                    {[...Array(mod.h)].map((_, i) => (
                      <line
                        key={`h-${i}`}
                        x1={x}
                        y1={y + (i + 1) * CELL_SIZE}
                        x2={x + w}
                        y2={y + (i + 1) * CELL_SIZE}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                        opacity="0.5"
                      />
                    ))}

                    {/* Dimensions */}


                  </g>
                );
              })}

              {/* Walls */}
              {walls.map((wall) => {
                const wallW = wall.orientation === "horizontal" ? wall.length * CELL_SIZE : wall.thickness * CELL_SIZE;
                const wallH = wall.orientation === "vertical" ? wall.length * CELL_SIZE : wall.thickness * CELL_SIZE;
                const wx = (wall.x - minX + 1) * CELL_SIZE;
                const wy = (wall.y - minY + 1) * CELL_SIZE;

                return (
                  <g key={wall.id}>
                    <rect
                      x={wx}
                      y={wy}
                      width={wallW}
                      height={wallH}
                      fill="#4B5563"
                      stroke="#2d3748"
                      strokeWidth="1"
                    />
                    {wall.elevationImage && (
                      <image
                        x={wx + 2}
                        y={wy + 2}
                        width={wallW - 4}
                        height={wallH - 4}
                        href={wall.elevationImage}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                  </g>
                );
              })}

              {/* Dimensions */}
              {showDimensions && modules.length > 0 && (() => {
                const minX = Math.min(...modules.map(m => m.x));
                const maxX = Math.max(...modules.map(m => m.x + m.w));
                const minY = Math.min(...modules.map(m => m.y));
                const maxY = Math.max(...modules.map(m => m.y + m.h));
                const widthM = (maxX - minX) * 0.6;
                const dimColor = '#94a3b8';

                // Detect pavilions dynamically
                const sortedYs = [...new Set(modules.map(m => m.y))].sort((a, b) => a - b);
                const groups = [];
                let currentGroup = [];
                for (const y of sortedYs) {
                  if (currentGroup.length === 0 || y - currentGroup[currentGroup.length - 1] <= 3) {
                    currentGroup.push(y);
                  } else {
                    groups.push(currentGroup);
                    currentGroup = [y];
                  }
                }
                if (currentGroup.length > 0) groups.push(currentGroup);

                const allGroupDimensions = groups.map((group, i) => {
                  const yMin = group[0];
                  const yMax = group[group.length - 1];
                  const modsInPav = modules.filter(m => m.y >= yMin && m.y <= yMax + 2);
                  if (modsInPav.length === 0) return null;
                  const pavMinX = Math.min(...modsInPav.map(m => m.x));
                  const pavMaxX = Math.max(...modsInPav.map(m => m.x + m.w));
                  const pavMinY = Math.min(...modsInPav.map(m => m.y));
                  const pavMaxY = Math.max(...modsInPav.map(m => m.y + m.h));
                  const isConnection = groups.length === 3 && i === 1;
                  return { name: isConnection ? 'Conn' : `P${i+1}`, isConnection, color: dimColor, minX: pavMinX, maxX: pavMaxX, pavMinY, pavMaxY };
                }).filter(Boolean);

                const pavilionDimensions = allGroupDimensions.filter(g => !g.isConnection);
                const connectionDimensions = allGroupDimensions.filter(g => g.isConnection);

                return (
                  <>
                    {/* Overall length dimension (horizontal) */}
                    <line
                      x1={(minX - 1) * CELL_SIZE}
                      y1={(minY - 2.5) * CELL_SIZE}
                      x2={(maxX + 1) * CELL_SIZE}
                      y2={(minY - 2.5) * CELL_SIZE}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <line x1={(minX - 1) * CELL_SIZE} y1={(minY - 2.5) * CELL_SIZE - 6} x2={(minX - 1) * CELL_SIZE} y2={(minY - 2.5) * CELL_SIZE + 6} stroke="#CBD5E1" strokeWidth="1.5" />
                    <line x1={(maxX + 1) * CELL_SIZE} y1={(minY - 2.5) * CELL_SIZE - 6} x2={(maxX + 1) * CELL_SIZE} y2={(minY - 2.5) * CELL_SIZE + 6} stroke="#CBD5E1" strokeWidth="1.5" />
                    <text
                      x={((minX - 1) * CELL_SIZE + (maxX + 1) * CELL_SIZE) / 2}
                      y={(minY - 2.5) * CELL_SIZE - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#64748b"
                    >
                      {widthM.toFixed(1)}m
                    </text>

                    {/* Pavilion depth dimensions */}
                    {pavilionDimensions.map(pav => {
                      const actualHeightCells = 5.2 / 0.6;
                      const pavCenterY = (pav.pavMinY + pav.pavMaxY) / 2;
                      const dimTop = pavCenterY - actualHeightCells / 2;
                      const dimLeft = (pav.minX - 2) * CELL_SIZE;
                      return (
                        <g key={pav.name}>
                          <line x1={dimLeft} y1={dimTop * CELL_SIZE} x2={dimLeft} y2={(dimTop + actualHeightCells) * CELL_SIZE} stroke={pav.color} strokeWidth="1.5" opacity="0.6" />
                          <line x1={dimLeft - 6} y1={dimTop * CELL_SIZE} x2={dimLeft + 4} y2={dimTop * CELL_SIZE} stroke={pav.color} strokeWidth="1.5" opacity="0.6" />
                          <line x1={dimLeft - 6} y1={(dimTop + actualHeightCells) * CELL_SIZE} x2={dimLeft + 4} y2={(dimTop + actualHeightCells) * CELL_SIZE} stroke={pav.color} strokeWidth="1.5" opacity="0.6" />
                          <text
                            x={dimLeft - 14}
                            y={(dimTop + actualHeightCells / 2) * CELL_SIZE}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill={pav.color}
                            transform={`rotate(-90 ${dimLeft - 14} ${(dimTop + actualHeightCells / 2) * CELL_SIZE})`}
                          >
                            5.2m
                          </text>
                        </g>
                      );
                    })}

                    {/* Pavilion 2 bottom length dimension */}
                    {pavilionDimensions.length >= 2 && (() => {
                      const pav2 = pavilionDimensions[pavilionDimensions.length - 1];
                      const pav2WidthM = (pav2.maxX - pav2.minX) * 0.6;
                      return (
                        <g key="pav2-bottom-dim">
                          <line
                            x1={pav2.minX * CELL_SIZE}
                            y1={(pav2.pavMaxY + 2.5) * CELL_SIZE}
                            x2={pav2.maxX * CELL_SIZE}
                            y2={(pav2.pavMaxY + 2.5) * CELL_SIZE}
                            stroke="#CBD5E1"
                            strokeWidth="1.5"
                          />
                          <line x1={pav2.minX * CELL_SIZE} y1={(pav2.pavMaxY + 2.5) * CELL_SIZE - 6} x2={pav2.minX * CELL_SIZE} y2={(pav2.pavMaxY + 2.5) * CELL_SIZE + 6} stroke="#CBD5E1" strokeWidth="1.5" />
                          <line x1={pav2.maxX * CELL_SIZE} y1={(pav2.pavMaxY + 2.5) * CELL_SIZE - 6} x2={pav2.maxX * CELL_SIZE} y2={(pav2.pavMaxY + 2.5) * CELL_SIZE + 6} stroke="#CBD5E1" strokeWidth="1.5" />
                          <text
                            x={(pav2.minX * CELL_SIZE + pav2.maxX * CELL_SIZE) / 2}
                            y={(pav2.pavMaxY + 2.5) * CELL_SIZE + 16}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill="#64748b"
                          >
                            {pav2WidthM.toFixed(1)}m
                          </text>
                        </g>
                      );
                    })()}

                    {/* Connection module depth dimensions */}
                    {connectionDimensions.map(conn => {
                      const actualHeightCells = conn.pavMaxY - conn.pavMinY;
                      const actualHeightM = (actualHeightCells * 0.6).toFixed(1);
                      const dimLeft = (conn.minX - 2) * CELL_SIZE;
                      return (
                        <g key={conn.name}>
                          <line x1={dimLeft} y1={conn.pavMinY * CELL_SIZE} x2={dimLeft} y2={conn.pavMaxY * CELL_SIZE} stroke={conn.color} strokeWidth="1.5" opacity="0.6" />
                          <line x1={dimLeft - 6} y1={conn.pavMinY * CELL_SIZE} x2={dimLeft + 4} y2={conn.pavMinY * CELL_SIZE} stroke={conn.color} strokeWidth="1.5" opacity="0.6" />
                          <line x1={dimLeft - 6} y1={conn.pavMaxY * CELL_SIZE} x2={dimLeft + 4} y2={conn.pavMaxY * CELL_SIZE} stroke={conn.color} strokeWidth="1.5" opacity="0.6" />
                          <text
                            x={dimLeft - 14}
                            y={(conn.pavMinY + actualHeightCells / 2) * CELL_SIZE}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill={conn.color}
                            transform={`rotate(-90 ${dimLeft - 14} ${(conn.pavMinY + actualHeightCells / 2) * CELL_SIZE})`}
                          >
                            {actualHeightM}m
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}

              {/* Furniture */}
              {showFurniture && furniture.map((f) => {
                const fWidth = (f.width || 1.4) * CELL_SIZE;
                const fDepth = (f.depth || 2.0) * CELL_SIZE;
                const fx = (f.x - minX + 1) * CELL_SIZE;
                const fy = (f.y - minY + 1) * CELL_SIZE;
                const rotation = f.rotation || 0;

                return (
                  <g key={f.id} transform={`translate(${fx + fWidth / 2}, ${fy + fDepth / 2}) rotate(${rotation}) translate(${-fWidth / 2}, ${-fDepth / 2})`}>
                    <rect
                       x={0}
                       y={0}
                       width={fWidth}
                       height={fDepth}
                       fill={f.image ? "white" : "#FFB3A8"}
                     />
                    {f.image && (
                      <image
                        x={2}
                        y={2}
                        width={fWidth - 4}
                        height={fDepth - 4}
                        href={f.image}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                    {!f.image && (
                      <text
                        x={fWidth / 2}
                        y={fDepth / 2 + 3}
                        textAnchor="middle"
                        fontSize="7"
                        fontWeight="bold"
                        fill="#666"
                      >
                        {f.label || f.type}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            </PrintPage>



      <style>{`
        @page { margin: 7mm; size: A4 landscape; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}