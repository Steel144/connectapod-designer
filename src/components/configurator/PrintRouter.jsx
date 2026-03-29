import React from "react";
import PrintablePlansSheet from "./PrintablePlansSheet";
import PrintableElevationsSheet from "./PrintableElevationsSheet";
import PrintSiteMapModal from "./PrintSiteMapModal";

export default function PrintRouter({ mode, walls, placedModules, furniture = [], onClose, customWalls = [], printDetails = {}, showLabels = true, showFurniture = true, showPhotoImages = true, showDimensions = true, siteAddress = "", siteMapFloorPlanImage = null }) {
  if (mode === "plans") {
    return <PrintablePlansSheet placedModules={placedModules} furniture={furniture} walls={walls} onClose={onClose} printDetails={printDetails} paperSize="a3" showLabels={showLabels} showFurniture={showFurniture} showPhotoImages={showPhotoImages} showDimensions={showDimensions} />;
  }
  if (mode === "all-elevations") {
    return <PrintableElevationsSheet walls={walls} placedModules={placedModules} onClose={onClose} printDetails={printDetails} paperSize="a3" showLabels={showLabels} />;
  }
  if (mode === "site-plan") {
    const mapZoom = (() => {
      try { return JSON.parse(localStorage.getItem('sitemap_mapZoom')) ?? 21; } catch { return 21; }
    })();
    const coordinates = (() => {
      try { return JSON.parse(localStorage.getItem('sitemap_coordinates')) ?? null; } catch { return null; }
    })();
    const overlayRotation = (() => {
      try { return JSON.parse(localStorage.getItem('sitemap_rotation')) ?? 0; } catch { return 0; }
    })();
    const planScaleMultiplier = (() => {
      try { return JSON.parse(localStorage.getItem('sitemap_scale')) ?? 1; } catch { return 1; }
    })();
    const positionOffset = (() => {
      try { return JSON.parse(localStorage.getItem('sitemap_offset')) ?? { lat: 0, lng: 0 }; } catch { return { lat: 0, lng: 0 }; }
    })();

    return (
      <PrintSiteMapModal
        onClose={onClose}
        siteAddress={siteAddress}
        floorPlanImage={siteMapFloorPlanImage}
        coordinates={coordinates}
        mapZoom={mapZoom}
        overlayRotation={overlayRotation}
        planScaleMultiplier={planScaleMultiplier}
        positionOffset={positionOffset}
      />
    );
  }
  return null;
}