import { useMemo } from "react";

const THRESH = 0.6;

export function useElevationGeometry(placedModules, walls) {
  return useMemo(() => {
    if (placedModules.length === 0) {
      return { minX: 0, maxX: 0, allMinY: 0, allMaxY: 0, wElevation: [], yElevation: [], zElevation: [], xElevation: [] };
    }

    const allMinX = Math.min(...placedModules.map(m => m.x));
    const allMaxX = Math.max(...placedModules.map(m => m.x + m.w));
    const allMinY = Math.min(...placedModules.map(m => m.y));
    const allMaxY = Math.max(...placedModules.map(m => m.y + m.h));

    const findWall = (face, mod) => {
      if (face === "W") {
        return walls.find(w =>
          w.face === "W" &&
          Math.abs(w.x - mod.x) < THRESH &&
          w.y >= mod.y - 2 && w.y <= mod.y + THRESH
        ) || null;
      }
      if (face === "Y") {
        return walls.find(w =>
          w.face === "Y" &&
          Math.abs(w.x - mod.x) < THRESH &&
          w.y >= mod.y + mod.h - THRESH && w.y <= mod.y + mod.h + THRESH
        ) || null;
      }
      return null;
    };

    // W (North) elevation
    const exteriorW = placedModules.filter(m =>
      !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y + o.h === m.y)
    );
    const wByY = {};
    exteriorW.forEach(m => { if (!wByY[m.y]) wByY[m.y] = []; wByY[m.y].push(m); });
    const wRowsSorted = Object.keys(wByY).map(Number).sort((a, b) => b - a);
    const wElevation = wRowsSorted.map(rowY => ({
      rowY,
      slots: [...wByY[rowY]].sort((a, b) => a.x - b.x).map(mod => ({
        mod, face: "W",
        wall: findWall("W", mod),
        xOffsetCells: mod.x - allMinX,
        widthCells: mod.w,
      })),
    }));

    // Y (South) elevation
    const exteriorY = placedModules.filter(m =>
      !placedModules.some(o => o.x < m.x + m.w && o.x + o.w > m.x && o.y === m.y + m.h)
    );
    const yByY = {};
    exteriorY.forEach(m => { if (!yByY[m.y]) yByY[m.y] = []; yByY[m.y].push(m); });
    const yRowsSorted = Object.keys(yByY).map(Number).sort((a, b) => a - b);
    const yElevation = yRowsSorted.map(rowY => ({
      rowY,
      slots: [...yByY[rowY]].sort((a, b) => a.x - b.x).map(mod => ({
        mod, face: "Y",
        wall: findWall("Y", mod),
        xOffsetCells: mod.x - allMinX,
        widthCells: mod.w,
      })),
    }));

    // Z & X elevations
    const bestWallForMod = (mod, face) => {
      const candidates = walls.filter(w => {
        if (w.face !== face) return false;
        if (face === "Z") {
          const nearLeft = Math.abs(w.x - mod.x) < 2;
          const nearRight = Math.abs(w.x - (mod.x + mod.w)) < 2;
          return (nearLeft || nearRight) && w.y >= mod.y - 1 && w.y < mod.y + mod.h + 1;
        }
        if (face === "X") {
          const nearRight = Math.abs(w.x - (mod.x + mod.w)) < 2;
          const nearLeft = Math.abs(w.x - mod.x) < 2;
          return (nearRight || nearLeft) && w.y >= mod.y - 1 && w.y < mod.y + mod.h + 1;
        }
        return false;
      });
      if (candidates.length === 0) return null;
      const expectedX = face === "Z" ? mod.x : mod.x + mod.w;
      return candidates.sort((a, b) => Math.abs(a.x - expectedX) - Math.abs(b.x - expectedX))[0];
    };

    const exteriorZ = placedModules.filter(m =>
      !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x + o.w === m.x)
    );
    const zByY = {};
    exteriorZ.forEach(m => {
      const key = `${m.y}-${m.y + m.h}`;
      if (!zByY[key] || m.x < zByY[key].x) zByY[key] = m;
    });
    const zSlots = [];
    Object.values(zByY).forEach(m => {
      zSlots.push({ mod: m, wall: bestWallForMod(m, "Z"), yOffsetCells: m.y - allMinY, depthCells: m.h, face: "Z" });
    });
    zSlots.sort((a, b) => a.yOffsetCells - b.yOffsetCells);
    const zElevation = zSlots.length > 0 ? [{ colX: 0, slots: zSlots }] : [];

    const exteriorX = placedModules.filter(m =>
      !placedModules.some(o => o.y < m.y + m.h && o.y + o.h > m.y && o.x === m.x + m.w)
    );
    const xByY = {};
    exteriorX.forEach(m => {
      const key = `${m.y}-${m.y + m.h}`;
      if (!xByY[key] || (m.x + m.w) > (xByY[key].x + xByY[key].w)) xByY[key] = m;
    });
    const xSlots = [];
    Object.values(xByY).forEach(m => {
      xSlots.push({ mod: m, wall: bestWallForMod(m, "X"), yOffsetCells: m.y - allMinY, depthCells: m.h, face: "X" });
    });
    xSlots.sort((a, b) => a.yOffsetCells - b.yOffsetCells);
    const xElevation = xSlots.length > 0 ? [{ colX: 0, slots: xSlots }] : [];

    return { minX: allMinX, maxX: allMaxX, allMinY, allMaxY, wElevation, yElevation, zElevation, xElevation };
  }, [placedModules, walls]);
}