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
    <div style={{ display: "inline-block", verticalAlign: "top", marginRight: "16px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "black", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#fed7aa", padding: "8px 12px", borderRadius: "4px", width: "fit-content", marginLeft: "4px", marginBottom: "16px" }}>
        {label}
      </div>
      <div style={{ position: "relative", width: maxContentWidth + 100, height: endElevationHPx, backgroundColor: "transparent", overflow: "hidden", paddingLeft: 50, paddingRight: 50, boxSizing: "border-box" }}>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 2 }} />

          {layers.map((layer) => {
             return layer.slots.map((slot, si) => {
                const elevationNum = si + 1;
                const baseWidthPx = Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
                // Connection modules (smaller depth) get no multiplier; standard modules get 1.1x
                const isConnection = slot.depthCells < maxSlotDepth;
                const scaleMultiplier = isConnection ? 1.0 : (slotScales[elevationNum] || 1.1);
                const slotWidthPx = Math.round(baseWidthPx * scaleMultiplier);
                const baseLeftPx = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M);
                const extraOffsetPx = slotOffsets[elevationNum] ? Math.round(scale * slotOffsets[elevationNum] * PX_PER_M) : 0;
                const leftPx = baseLeftPx + extraOffsetPx + 50;

               const displayLabel = labelMap[elevationNum] || elevationNum;
               const topPx = Math.round(scale * 0.02 * PX_PER_M);
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