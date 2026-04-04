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
  PX_PER_M,
  flip = false  // Add flip prop
}) {
  if (layers.length === 0) return null;

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
      }}>
         {layers.map((layer, li) => {
           let moduleNum = 0;
           
           return layer.slots.map((slot, si) => {
             moduleNum++;
             let leftPx = Math.round(scale * slot.xOffsetCells * CELL_M * PX_PER_M);
             const widthPx = Math.round(scale * slot.widthCells * CELL_M * PX_PER_M);
             
             // If flipped, mirror the position (right to left)
             if (flip) {
               leftPx = totalWidthPx - leftPx - widthPx;
             }
             
             return (
               <ElevationSlot
                 key={`${li}-${si}`}
                 slot={{
                   ...slot,
                   wall: slot.wall ? {
                     ...slot.wall,
                     flipped: flip ? true : (slot.wall.flipped || false)  // Force flip when mirroring
                   } : slot.wall
                 }}
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