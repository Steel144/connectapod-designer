import React, { memo } from "react";
import ElevationSlot from "./ElevationSlot";

const HorizontalElevation = memo(function HorizontalElevation({ 
  layers, 
  label, 
  color, 
  totalWidthPx, 
  wallHPx,
  scale,
  CELL_M,
  PX_PER_M
}) {
  if (layers.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: color, padding: "2px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
      </div>
      <div style={{ position: "relative", width: totalWidthPx, height: wallHPx, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", overflow: "hidden" }}>
         {layers.map((layer, li) => {
           let moduleNum = 0;
           return layer.slots.map((slot, si) => {
             moduleNum++;
             const leftPx = Math.round(scale * slot.xOffsetCells * CELL_M * PX_PER_M);
             const widthPx = Math.round(scale * slot.widthCells * CELL_M * PX_PER_M);
             return (
               <ElevationSlot
                 key={`${li}-${si}`}
                 slot={slot}
                 leftPx={leftPx}
                 widthPx={widthPx}
                 heightPx={wallHPx}
                 objectFit="cover"
                 showLabel={false}
               />
             );
           });
         })}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151" }} />
      </div>
    </div>
  );
});

export default HorizontalElevation;