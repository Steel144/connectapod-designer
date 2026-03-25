import React from "react";
import PrintablePlansSheet from "./PrintablePlansSheet";
import PrintableElevationsSheet from "./PrintableElevationsSheet";

export default function PrintRouter({ mode, walls, placedModules, furniture = [], onClose, customWalls = [], printDetails = {}, showLabels = true, showFurniture = true, showPhotoImages = true, showDimensions = true }) {
  if (mode === "plans") {
    return <PrintablePlansSheet placedModules={placedModules} furniture={furniture} walls={walls} onClose={onClose} printDetails={printDetails} showLabels={showLabels} showFurniture={showFurniture} showPhotoImages={showPhotoImages} showDimensions={showDimensions} />;
  }
  if (mode === "all-elevations") {
    return <PrintableElevationsSheet walls={walls} placedModules={placedModules} onClose={onClose} printDetails={printDetails} showLabels={showLabels} />;
  }
  return null;
}