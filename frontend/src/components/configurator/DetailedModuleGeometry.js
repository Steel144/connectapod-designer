import * as THREE from 'three';

/**
 * Detailed module geometry with flashing, trims, and cedar boards
 * Extracted from standalone HTML prototype
 */

// Constants
const SEAM_WIDTH = 0.060;
const SEAM_DEPTH = 0.05;
const SEAM_SPACING = 0.6;
const CEDAR_BOARD_FACE = 0.12;
const CEDAR_THICKNESS = 0.02;
const CEDAR_GAP = 0.01;
const FLASH_OFFSET = 0.010;
const SLOPE_EXT = 0.0175;
const WALL_VERT_EXT = 0.0175 / 2;
const EXT_BOTTOM = 0.020;
const EXT_TOP = 0.015;
const WALL_TOP_EXT = 0.0175;
const TRIM_H = 0.060;
const TRIM_D = 0.015;
const RAKE_TRIM_DROP_Y = 0.300;
const RAKE_TRIM_WALL_DROP = 0.600;
const LEFT_BOTTOM_TRIM = 0.060;

// Materials
export function createDetailedMaterials() {
  return {
    skin: new THREE.MeshStandardMaterial({ 
      color: 0x555b62, 
      roughness: 0.82, 
      metalness: 0.08, 
      side: THREE.DoubleSide 
    }),
    seam: new THREE.MeshStandardMaterial({ 
      color: 0x555b62, 
      roughness: 0.72, 
      metalness: 0.16 
    }),
    cedar: new THREE.MeshStandardMaterial({ 
      color: 0x9b673e, 
      roughness: 0.88, 
      metalness: 0.04 
    }),
    flash: new THREE.MeshStandardMaterial({ 
      color: 0x555b62, 
      roughness: 0.58, 
      metalness: 0.26 
    }),
    trim: new THREE.MeshStandardMaterial({ 
      color: 0x555b62, 
      roughness: 0.58, 
      metalness: 0.26 
    }),
  };
}

// Helper: create triangle mesh
function triMesh(points, material) {
  const verts = [];
  for (const p of points) verts.push(p.x, p.y, p.z);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Create a seam segment between two points
function makeSeamSegment(p1, p2, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geom = new THREE.BoxGeometry(SEAM_WIDTH, len, SEAM_DEPTH);
  const mesh = new THREE.Mesh(geom, material);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  mesh.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// Add continuous seam along a Z plane
function addContinuousSeam(z, xL, xR, yS, yR, material, group) {
  const p0 = new THREE.Vector3(xL, 0, z);
  const p1 = new THREE.Vector3(xL, yS, z);
  const p2 = new THREE.Vector3(0, yR, z);
  const p3 = new THREE.Vector3(xR, yS, z);
  const p4 = new THREE.Vector3(xR, 0, z);

  function extSeg(a, b, e) {
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    return [
      a.clone().addScaledVector(dir, -e),
      b.clone().addScaledVector(dir, e)
    ];
  }

  [
    extSeg(p0, p1, WALL_VERT_EXT),
    extSeg(p1, p2, SLOPE_EXT),
    extSeg(p2, p3, SLOPE_EXT),
    extSeg(p3, p4, WALL_VERT_EXT)
  ].forEach(([a, b]) => group.add(makeSeamSegment(a, b, material)));
}

// Add cedar boards to gable end
function addCedarToGableEnd(zPos, outwardSign, xL, xR, yS, rise, width, material, group) {
  const yMaxAtX = (x) => yS + Math.max(0, rise * (1 - Math.abs(x) / (width / 2)));
  
  for (let x = xL + CEDAR_BOARD_FACE / 2; x <= xR - CEDAR_BOARD_FACE / 2 + 1e-6; x += CEDAR_BOARD_FACE) {
    const h = yMaxAtX(x);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(CEDAR_BOARD_FACE - CEDAR_GAP, h, CEDAR_THICKNESS),
      material
    );
    board.position.set(x, h / 2, zPos + outwardSign * (CEDAR_THICKNESS / 2 + 0.002));
    board.castShadow = board.receiveShadow = true;
    group.add(board);
  }
}

// Create wall flashing
function makeWallFlash(xPos, zPos, outwardSign, wallHeight, material, extraTop = 0) {
  const face = 0.265;
  const ret = 0.065;
  const h = wallHeight + extraTop;
  const geo = new THREE.BoxGeometry(face, h, ret);
  const mesh = new THREE.Mesh(geo, material);
  const offsetAlongZ = outwardSign * (CEDAR_THICKNESS + SEAM_DEPTH / 2) + FLASH_OFFSET;
  mesh.position.set(xPos, h / 2, zPos + offsetAlongZ);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// Create rake flashing
function makeRakeFlash(xStart, yStart, xEnd, yEnd, zPos, normX, normY, material) {
  const face = 0.065;
  const ret = 0.265;
  const dx = xEnd - xStart;
  const dy = yEnd - yStart;
  const origLen = Math.sqrt(dx * dx + dy * dy);
  const len = origLen + EXT_BOTTOM + EXT_TOP;
  const dirX = dx / origLen;
  const dirY = dy / origLen;
  const shift = (EXT_BOTTOM - EXT_TOP) / 2;
  const cx = (xStart + xEnd) / 2 + dirX * shift;
  const cy = (yStart + yEnd) / 2 + dirY * shift;
  const nudge = (0.265 / 2) - 0.030;
  
  const geo = new THREE.BoxGeometry(ret, len, face);
  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.z = -Math.atan2(dx, dy);
  mesh.position.set(
    cx + normX * nudge,
    cy + normY * nudge,
    zPos + CEDAR_THICKNESS + SEAM_DEPTH / 2 + FLASH_OFFSET
  );
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// Create mitered rake trimmer
function makeMiteredRakeTrimmer(x0, y0, x1, y1, nX, nY, dropY, bottomTrim, trimZ, material) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const sLen = Math.sqrt(dx * dx + dy * dy);
  const dX = dx / sLen;
  const dY = dy / sLen;
  const hw = TRIM_H / 2;
  const bx = x0 + dX * bottomTrim;
  const by = y0 + dY * bottomTrim;
  const topY = y1 - dropY;
  const b0x = bx - nX * hw;
  const b0y = by - nY * hw;
  const b1x = bx + nX * hw;
  const b1y = by + nY * hw;
  const t0 = dY !== 0 ? (topY - b0y) / dY : sLen;
  const t1x = b0x + dX * t0;
  const t1y = b0y + dY * t0;
  const t2 = dY !== 0 ? (topY - b1y) / dY : sLen;
  const t2x = b1x + dX * t2;
  const t2y = b1y + dY * t2;

  const zF2 = trimZ + TRIM_D / 2;
  const zB2 = trimZ - TRIM_D / 2;
  
  const verts = new Float32Array([
    // Front face (2 triangles)
    b0x, b0y, zF2, b1x, b1y, zF2, t2x, t2y, zF2,
    b0x, b0y, zF2, t2x, t2y, zF2, t1x, t1y, zF2,
    // Back face
    b1x, b1y, zB2, b0x, b0y, zB2, t1x, t1y, zB2,
    b1x, b1y, zB2, t1x, t1y, zB2, t2x, t2y, zB2,
    // Bottom cap
    b0x, b0y, zB2, b1x, b1y, zB2, b1x, b1y, zF2,
    b0x, b0y, zB2, b1x, b1y, zF2, b0x, b0y, zF2,
    // Top cap
    t1x, t1y, zF2, t2x, t2y, zF2, t2x, t2y, zB2,
    t1x, t1y, zF2, t2x, t2y, zB2, t1x, t1y, zB2,
    // Inner side
    b0x, b0y, zF2, t1x, t1y, zF2, t1x, t1y, zB2,
    b0x, b0y, zF2, t1x, t1y, zB2, b0x, b0y, zB2,
    // Outer side
    b1x, b1y, zB2, t2x, t2y, zB2, t2x, t2y, zF2,
    b1x, b1y, zB2, t2x, t2y, zF2, b1x, b1y, zF2,
  ]);
  
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/**
 * Create a detailed module with flashing, trims, cedar boards, and roof seams
 * @param {Object} params - Module parameters
 * @param {number} params.width - Module width
 * @param {number} params.length - Module depth
 * @param {number} params.wallHeight - Wall height
 * @param {number} params.pitch - Roof pitch in radians
 * @param {Object} params.position - Position {x, y, z}
 * @param {Object} materials - Material definitions
 * @returns {THREE.Group} - Complete module group
 */
export function createDetailedModule(params, materials) {
  const { width, length, wallHeight, pitch, position } = params;
  const group = new THREE.Group();
  
  const rise = Math.tan(pitch) * (width / 2);
  const xL = -width / 2;
  const xR = width / 2;
  const zF = length / 2;
  const zB = -length / 2;
  const yS = wallHeight;
  const yR = wallHeight + rise;
  
  const leftFlashInnerX = xL + 0.10 + 0.265 / 2;
  const rightFlashInnerX = xR - 0.10 - 0.265 / 2;
  
  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, wallHeight, length),
    materials.skin
  );
  body.position.y = wallHeight / 2;
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  
  // Roof triangles
  const ridgeFront = { x: 0, y: yR, z: zF };
  const ridgeBack = { x: 0, y: yR, z: zB };
  const frontLeft = { x: xL, y: yS, z: zF };
  const frontRight = { x: xR, y: yS, z: zF };
  const backLeft = { x: xL, y: yS, z: zB };
  const backRight = { x: xR, y: yS, z: zB };
  
  group.add(triMesh([frontLeft, ridgeFront, backLeft], materials.skin));
  group.add(triMesh([ridgeFront, ridgeBack, backLeft], materials.skin));
  group.add(triMesh([ridgeFront, frontRight, backRight], materials.skin));
  group.add(triMesh([ridgeFront, backRight, ridgeBack], materials.skin));
  group.add(triMesh([frontLeft, frontRight, ridgeFront], materials.skin));
  group.add(triMesh([backRight, backLeft, ridgeBack], materials.skin));
  
  // Roof seams
  for (let z = zB; z <= zF + 0.0001; z += SEAM_SPACING) {
    if (z <= zF) {
      addContinuousSeam(z, xL, xR, yS, yR, materials.seam, group);
    }
  }
  
  // Cedar boards on gable ends
  addCedarToGableEnd(zF, 1, xL, xR, yS, rise, width, materials.cedar, group);
  addCedarToGableEnd(zB, -1, xL, xR, yS, rise, width, materials.cedar, group);
  
  // Wall flashing
  group.add(makeWallFlash(xL + 0.10, zF, 1, wallHeight, materials.flash, WALL_TOP_EXT));
  group.add(makeWallFlash(xR - 0.10, zF, 1, wallHeight, materials.flash, WALL_TOP_EXT));
  
  // Rake flashing
  const slopeLen = Math.sqrt(2.6 * 2.6 + rise * rise);
  const normLeftX = rise / slopeLen;
  const normLeftY = -2.6 / slopeLen;
  const normRightX = -rise / slopeLen;
  const normRightY = -2.6 / slopeLen;
  
  group.add(makeRakeFlash(xL, yS, 0, yR, zF, normLeftX, normLeftY, materials.flash));
  group.add(makeRakeFlash(0, yR, xR, yS, zF, normRightX, normRightY, materials.flash));
  
  // Trim flashing
  const trimZ = zF + (CEDAR_THICKNESS + TRIM_D / 2);
  
  // Wall trims
  const lMesh = new THREE.Mesh(
    new THREE.BoxGeometry(TRIM_H, wallHeight, TRIM_D),
    materials.trim
  );
  lMesh.position.set(leftFlashInnerX + TRIM_H / 2, wallHeight / 2, trimZ);
  lMesh.castShadow = lMesh.receiveShadow = true;
  group.add(lMesh);
  
  const rMesh = new THREE.Mesh(
    new THREE.BoxGeometry(TRIM_H, wallHeight, TRIM_D),
    materials.trim
  );
  rMesh.position.set(rightFlashInnerX - TRIM_H / 2, wallHeight / 2, trimZ);
  rMesh.castShadow = rMesh.receiveShadow = true;
  group.add(rMesh);
  
  // Rake trimmers
  group.add(makeMiteredRakeTrimmer(
    leftFlashInnerX, yS - RAKE_TRIM_WALL_DROP, 0, yR,
    normLeftX, normLeftY,
    RAKE_TRIM_DROP_Y, LEFT_BOTTOM_TRIM,
    trimZ, materials.trim
  ));
  
  group.add(makeMiteredRakeTrimmer(
    0, yR, rightFlashInnerX, yS - RAKE_TRIM_WALL_DROP,
    -normRightX, -normRightY,
    RAKE_TRIM_DROP_Y, 0,
    trimZ, materials.trim
  ));
  
  // Position the group
  group.position.set(position.x, position.y, position.z);
  
  return group;
}
