import React, { memo } from "react";
import ElevationSlot from "./ElevationSlot";

const PAVILION_COLORS = [
  "rgba(59, 130, 246, 0.07)",   // light blue - front pavilion
  "rgba(249, 115, 22, 0.07)",   // light orange - back pavilion
  "rgba(16, 185, 129, 0.07)",   // light green - third group
];

const HorizontalElevation = memo(function HorizontalElevation({ 
  layers, 
  label, 
  color, 
  totalWidthPx, 
  wallHPx,
  scale,
  CELL_M,
  PX_PER_M,
  flip = false
}) {
  if (layers.length === 0) return null;

  const multiLayer = layers.length > 1;

  return (
    <div style={{ display: "block", marginBottom: "40px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "black", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", width: "fit-content", marginLeft: "4px", marginBottom: "16px" }}>
        {label}
      </div>
      <div style={{ 
        position: "relative", 
        width: totalWidthPx, 
        height: wallHPx, 
        backgroundColor: "#f9fafb", 
        overflow: "hidden",
        transform: flip ? "scaleX(-1)" : undefined
      }}>
         {layers.map((layer, li) => {
           // Calculate layer bounds for background shading
           let layerMinLeft = Infinity, layerMaxRight = 0;
           layer.slots.forEach(slot => {
             const left = Math.round(scale * slot.xOffsetCells * CELL_M * PX_PER_M);
             const width = Math.round(scale * slot.widthCells * CELL_M * PX_PER_M);
             layerMinLeft = Math.min(layerMinLeft, left);
             layerMaxRight = Math.max(layerMaxRight, left + width);
           });

           return (
             <React.Fragment key={`layer-${li}`}>
               {/* Background shading for pavilion differentiation */}
               {multiLayer && (
                 <div style={{
                   position: "absolute",
                   left: layerMinLeft,
                   top: 0,
                   width: layerMaxRight - layerMinLeft,
                   height: "100%",
                   backgroundColor: PAVILION_COLORS[li % PAVILION_COLORS.length],
                   zIndex: 0,
                   borderLeft: li > 0 ? "1px dashed rgba(0,0,0,0.1)" : undefined,
                   borderRight: li < layers.length - 1 ? "1px dashed rgba(0,0,0,0.1)" : undefined,
                 }}>
                   <span style={{
                     position: "absolute",
                     top: 4,
                     left: flip ? undefined : 4,
                     right: flip ? 4 : undefined,
                     fontSize: "9px",
                     fontWeight: 600,
                     color: "rgba(0,0,0,0.25)",
                     transform: flip ? "scaleX(-1)" : undefined,
                   }}>P{li + 1}</span>
                 </div>
               )}
               {layer.slots.map((slot, si) => {
                 const leftPx = Math.round(scale * slot.xOffsetCells * CELL_M * PX_PER_M);
                 const widthPx = Math.round(scale * slot.widthCells * CELL_M * PX_PER_M);
                 
                 const modifiedSlot = {
                   ...slot,
                   wall: slot.wall ? {
                     ...slot.wall,
                     flipped: flip ? !(slot.wall.flipped || false) : (slot.wall.flipped || false)
                   } : null
                 };
                 
                 return (
                   <ElevationSlot
                     key={`${li}-${si}`}
                     slot={modifiedSlot}
                     leftPx={leftPx}
                     widthPx={widthPx}
                     heightPx={wallHPx}
                     objectFit="cover"
                     showLabel={false}
                   />
                 );
               })}
             </React.Fragment>
           );
         })}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151" }} />
      </div>
    </div>
  );
});

export default HorizontalElevation;