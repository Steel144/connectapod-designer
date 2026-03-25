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

export default function PrintablePlansSheet({ placedModules, furniture = [], onClose, printDetails = {}, paperSize = "a4" }) {
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
        <div style={{ color: "#888", fontSize: "12px" }}>hello@connectapod.com · 022 396 2657</div>
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
                    {mod.floorPlanImage && (
                      <image
                        x={x + 4}
                        y={y + 4}
                        width={w - 8}
                        height={h - 24}
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


                  </g>
                );
              })}

              {/* Furniture */}
              {furniture.map((f) => {
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