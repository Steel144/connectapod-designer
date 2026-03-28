import React from "react";
import PrintablePlansSheet from "./PrintablePlansSheet";
import PrintableElevationsSheet from "./PrintableElevationsSheet";
import PrintSiteMapModal from "./PrintSiteMapModal";

export default function PrintRouter({ mode, walls, placedModules, furniture = [], onClose, customWalls = [], printDetails = {}, showLabels = true, showFurniture = true, showPhotoImages = true, showDimensions = true, siteAddress = "" }) {
  if (mode === "plans") {
    return <PrintablePlansSheet placedModules={placedModules} furniture={furniture} walls={walls} onClose={onClose} printDetails={printDetails} paperSize="a3" showLabels={showLabels} showFurniture={showFurniture} showPhotoImages={showPhotoImages} showDimensions={showDimensions} />;
  }
  if (mode === "all-elevations") {
    return <PrintableElevationsSheet walls={walls} placedModules={placedModules} onClose={onClose} printDetails={printDetails} paperSize="a3" showLabels={showLabels} />;
  }
  if (mode === "site-plan") {
    return <PrintSiteMapModal onClose={onClose} placedModules={placedModules} walls={walls} siteAddress={siteAddress} />;
  }
  return null;
}