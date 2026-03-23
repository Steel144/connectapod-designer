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
  labelMap = {}
}) {
  if (layers.length === 0) return null;

  let maxContentWidth = Math.round(scale * totalDepthCells * CELL_M * PX_PER_M);
  layers.forEach(layer => {
    layer.slots.forEach(slot => {
      const slotRight = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M) + Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
      maxContentWidth = Math.max(maxContentWidth, slotRight);
    });
  });

  const windowHeightM = 2.14;
  const windowHeightPx = Math.round(scale * windowHeightM * PX_PER_M);
  const foundationHeightM = (WALL_H_M - windowHeightM) / 2;
  const foundationHeightPx = Math.round(scale * foundationHeightM * PX_PER_M);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "black", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", width: "fit-content", marginLeft: "4px" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>


        <div style={{ position: "relative", flex: 1, width: maxContentWidth, height: endElevationHPx, backgroundColor: "transparent", overflowY: "hidden", overflowX: "auto" }}>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 2 }} />

          {layers.map((layer) => {
             return layer.slots.map((slot, si) => {
               const slotWidthPx = Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
               const slotLeftPx = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M);
               const elevationNum = si + 1;
               const extraOffsetPx = slotOffsets[elevationNum] ? Math.round(scale * slotOffsets[elevationNum] * PX_PER_M) : 0;
               const leftPx = slotLeftPx + extraOffsetPx;

               const displayLabel = labelMap[elevationNum] || elevationNum;
               return (
                 <ElevationSlot
                   key={`${layer.colX}-${si}`}
                   slot={slot}
                   leftPx={leftPx}
                   widthPx={slotWidthPx}
                   heightPx={endElevationHPx}
                   labelNum={displayLabel}
                   objectFit="fill"
                   showLabel={true}
                 />
               );
             });
           })}
        </div>
      </div>
    </div>
  );
});

export default VerticalElevation;