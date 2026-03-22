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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: color, padding: "2px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
      </div>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", position: "relative", height: endElevationHPx, justifyContent: "space-between", alignItems: "flex-end", minWidth: 50, paddingRight: 8, borderRight: "1px solid #d1d5db" }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#4b5563", textAlign: "right", lineHeight: "1.2" }}>
            <div>{WALL_H_M}m</div>
            <div style={{ fontSize: 7, color: "#9ca3af" }}>Top</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#3b82f6", textAlign: "right", lineHeight: "1.2" }}>
            <div>{windowHeightM}m</div>
            <div style={{ fontSize: 7, color: "#9ca3af" }}>Window</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#4b5563", textAlign: "right", lineHeight: "1.2" }}>
            <div>0m</div>
            <div style={{ fontSize: 7, color: "#9ca3af" }}>Ground</div>
          </div>
        </div>

        <div style={{ position: "relative", flex: 1, width: maxContentWidth, height: endElevationHPx, border: "1px solid #e5e7eb", backgroundColor: "transparent", overflowY: "hidden", overflowX: "auto" }}>
          <div style={{
            position: "absolute",
            top: foundationHeightPx,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: "transparent",
            borderTop: "2px dashed rgba(59, 130, 246, 0.6)",
            zIndex: 2,
          }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#374151", zIndex: 2 }} />

          {layers.map((layer) =>
            layer.slots.map((slot, si) => {
              const compressionPx = Math.round(scale * 0.6 * PX_PER_M);
              const baseLeftPx = Math.round(scale * slot.yOffsetCells * CELL_M * PX_PER_M) - (si > 0 ? compressionPx : 0);
              const offsetPx = slotOffsets[si + 1] || 0;
              const leftPx = baseLeftPx + offsetPx;
              const slotWidthPx = Math.round(scale * slot.depthCells * CELL_M * PX_PER_M);
              const elevationNum = si + 1;

              return (
                <ElevationSlot
                  key={`${layer.colX}-${si}`}
                  slot={slot}
                  leftPx={leftPx}
                  widthPx={slotWidthPx}
                  heightPx={endElevationHPx}
                  labelNum={elevationNum}
                  objectFit="fill"
                  showLabel={true}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default VerticalElevation;