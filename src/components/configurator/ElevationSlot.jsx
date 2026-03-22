import React, { memo } from "react";

const ElevationSlot = memo(function ElevationSlot({ 
  slot, 
  leftPx, 
  widthPx, 
  heightPx, 
  labelNum,
  objectFit = "cover",
  showLabel = true 
}) {
  const wall = slot.wall;

  return (
    <div
      style={{
        position: "absolute",
        left: leftPx,
        top: 0,
        width: widthPx,
        height: heightPx,
        overflow: "hidden",
      }}
    >
      {wall?.elevationImage ? (
        <img
          src={wall.elevationImage}
          alt={wall.label || wall.type || slot.face}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
            display: "block",
            transform: wall.flipped ? "scaleX(-1)" : undefined,
          }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          background: "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 9, color: "#9ca3af" }}>{slot.face}</span>
        </div>
      )}
      {showLabel && labelNum && (
        <div style={{
          position: "absolute",
          top: 8,
          left: 8,
          backgroundColor: "#000",
          color: "#fff",
          width: 28,
          height: 28,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          zIndex: 50,
          boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
        }}>
          {labelNum}
        </div>
      )}
    </div>
  );
});

export default ElevationSlot;