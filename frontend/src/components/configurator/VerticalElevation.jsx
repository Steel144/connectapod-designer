import React, { memo } from "react";
import ElevationSlot from "./ElevationSlot";

const VerticalElevation = memo(function VerticalElevation({ 
  layers, 
  label, 
  color, 
  totalDepthCells,
  endElevationHPx,
  scale,
  CELL_M,
  PX_PER_M,
  WALL_H_M,
  slotOffsets = {},
  slotScales = {},
  labelMap = {}
}) {
  if (layers.length === 0) return null;

  // Determine max depth to identify connection modules (smaller depth = connection)
  const maxSlotDepth = Math.max(...layers.flatMap(l => l.slots.map(s => s.depthCells)));

  // Calculate total content width using cumulative 1.1x allocated widths
  let totalAllocatedWidth = 0;
  layers.forEach(layer => {
    layer.slots.forEach(slot => {
      totalAllocatedWidth += Math.round(scale * slot.depthCells * CELL_M * PX_PER_M * 1.1);
    });
  });

  const windowHeightM = 2.14;
  const windowHeightPx = Math.round(scale * windowHeightM * PX_PER_M);
  const foundationHeightM = (WALL_H_M - windowHeightM) / 2;
  const foundationHeightPx = Math.round(scale * foundationHeightM * PX_PER_M);

  return (
    <div style={{ display: "inline-block", verticalAlign: "top", marginRight: "16px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "black", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", width: "fit-content", marginLeft: "4px", marginBottom: "16px" }}>
        {label}
      </div>
      <div style={{ position: "relative", width: totalAllocatedWidth + 100, height: endElevationHPx, backgroundColor: "transparent", overflow: "hidden", paddingLeft: 50, paddingRight: 50, boxSizing: "border-box" }}>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 2 }} />

          {layers.map((layer) => {
             let cumulativeLeft = 0;
             const hasConnection = layer.slots.some(s => s.depthCells < maxSlotDepth);
             const closingOffsetPx = hasConnection ? Math.round(scale * 0.2 * PX_PER_M) : 0;
             
             return layer.slots.map((slot, si) => {
                const elevationNum = si + 1;
                const isConnection = slot.depthCells < maxSlotDepth;
                
                // Every slot gets a 1.1x allocation for spacing
                const allocatedWidthPx = Math.round(scale * slot.depthCells * CELL_M * PX_PER_M * 1.1);
                
                // Connection modules render at 1.0x, standard at 1.1x
                const renderWidthPx = isConnection 
                  ? Math.round(scale * slot.depthCells * CELL_M * PX_PER_M)
                  : allocatedWidthPx;
                
                // Center connection modules within their allocated space
                const centerOffset = isConnection ? Math.round((allocatedWidthPx - renderWidthPx) / 2) : 0;
                
                // Close white space: shift first pavilion right 200mm, last pavilion left 200mm
                let closeGapOffset = 0;
                if (hasConnection && !isConnection) {
                  const isBeforeConnection = layer.slots.slice(si + 1).some(s => s.depthCells < maxSlotDepth);
                  closeGapOffset = isBeforeConnection ? closingOffsetPx : -closingOffsetPx;
                }
                
                const leftPx = cumulativeLeft + centerOffset + closeGapOffset + 50;
                
                cumulativeLeft += allocatedWidthPx;

               const displayLabel = labelMap[elevationNum] || elevationNum;
               const topPx = Math.round(scale * 0.02 * PX_PER_M);
               return (
                 <ElevationSlot
                   key={`${layer.colX}-${si}`}
                   slot={slot}
                   leftPx={leftPx}
                   topPx={topPx}
                   widthPx={renderWidthPx}
                   heightPx={endElevationHPx}
                   labelNum={displayLabel}
                   objectFit="fill"
                   showLabel={false}
                 />
               );
             });
           })}
          </div>
          </div>
  );
});

export default VerticalElevation;