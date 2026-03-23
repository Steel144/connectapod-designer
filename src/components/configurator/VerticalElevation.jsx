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
    <div style={{ display: "block", width: "100%", overflowX: "auto" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "black", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", width: "fit-content", marginLeft: "4px", marginBottom: "16px" }}>
        {label}
      </div>
      <div style={{ position: "relative", width: "100%", minWidth: maxContentWidth + 100, height: endElevationHPx, backgroundColor: "transparent", overflow: "hidden", paddingLeft: 50, paddingRight: 50, boxSizing: "border-box" }}>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 2 }} />

          {layers.map((layer) => {
             return layer.slots.map((slot, si) => {
                const elevationNum = si + 1;
                const baseWidthPx = Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
                const scaleMultiplier = slotScales[elevationNum] || (si === 0 ? 1.1 : 1);
                const slotWidthPx = Math.round(baseWidthPx * scaleMultiplier);
                const baseLeftPx = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M);
                const scaledOffsetAdjustment = si === 0 && !slotScales[elevationNum] ? Math.round(scale * -0.14 * PX_PER_M) : 0;
                const slotLeftPx = baseLeftPx + scaledOffsetAdjustment;
                const extraOffsetPx = slotOffsets[elevationNum] ? Math.round(scale * slotOffsets[elevationNum] * PX_PER_M) : 0;
                const leftPx = slotLeftPx + extraOffsetPx + 50;

               const displayLabel = labelMap[elevationNum] || elevationNum;
               const topPx = si === 0 ? Math.round(scale * 0.02 * PX_PER_M) : 0;
               return (
                 <ElevationSlot
                   key={`${layer.colX}-${si}`}
                   slot={slot}
                   leftPx={leftPx}
                   topPx={topPx}
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
  );
});

export default VerticalElevation;