import React from "react";
import PrintablePlansSheet from "./PrintablePlansSheet";
import PrintableElevationsSheet from "./PrintableElevationsSheet";
import PrintableBuildingElevations from "./PrintableBuildingElevations";
import PrintableElevationGallery from "./PrintableElevationGallery";

export default function PrintRouter({ mode, walls, placedModules, onClose }) {
  if (mode === "plans") {
    return <PrintablePlansSheet placedModules={placedModules} onClose={onClose} />;
  }
  if (mode === "elevations") {
    return <PrintableElevationsSheet walls={walls} onClose={onClose} />;
  }
  if (mode === "building-elevations") {
    return <PrintableBuildingElevations walls={walls} placedModules={placedModules} onClose={onClose} />;
  }
  if (mode === "elevation-gallery") {
    return <PrintableElevationGallery walls={walls} placedModules={placedModules} onClose={onClose} />;
  }
  return null;
}