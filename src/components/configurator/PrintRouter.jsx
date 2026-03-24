import React from "react";
import PrintablePlansSheet from "./PrintablePlansSheet";
import PrintableElevationsSheet from "./PrintableElevationsSheet";

export default function PrintRouter({ mode, walls, placedModules, onClose, customWalls = [] }) {
  if (mode === "plans") {
    return <PrintablePlansSheet placedModules={placedModules} onClose={onClose} />;
  }
  if (mode === "all-elevations") {
    return <PrintableElevationsSheet walls={walls} placedModules={placedModules} onClose={onClose} />;
  }
  return null;
}