import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

function createOrbitControls(camera, domElement) {
  let isPointerDown = false;
  let isPanning = false;
  let lastX = 0, lastY = 0;
  let spherical = { theta: -Math.PI / 6, phi: Math.PI / 3.5, radius: 14 };
  let target = new THREE.Vector3(0, 0, 0);

  const updateCamera = () => {
    camera.position.set(
      target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
      target.y + spherical.radius * Math.cos(spherical.phi),
      target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
    );
    camera.lookAt(target);
  };
  updateCamera();

  const onPointerDown = (e) => {
    isPointerDown = true;
    isPanning = e.button === 2 || e.altKey;
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerMove = (e) => {
    if (!isPointerDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (isPanning) {
      const right = new THREE.Vector3();
      right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), new THREE.Vector3(0,1,0)).normalize();
      target.addScaledVector(right, -dx * 0.02);
      target.y += dy * 0.02;
    } else {
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.008));
    }
    updateCamera();
  };
  const onPointerUp = () => { isPointerDown = false; };
  const onWheel = (e) => {
    spherical.radius = Math.max(3, Math.min(60, spherical.radius + e.deltaY * 0.02));
    updateCamera();
  };
  const onContextMenu = (e) => e.preventDefault();

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: true });
  domElement.addEventListener("contextmenu", onContextMenu);

  return () => {
    domElement.removeEventListener("pointerdown", onPointerDown);
    domElement.removeEventListener("pointermove", onPointerMove);
    domElement.removeEventListener("pointerup", onPointerUp);
    domElement.removeEventListener("wheel", onWheel);
    domElement.removeEventListener("contextmenu", onContextMenu);
  };
}

function createStandingSeamTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(0, 0, 512, 512);
  const seamW = 3;
  const seamSpacing = 512 / 8;
  ctx.fillStyle = "#1a1a1a";
  for (let x = seamSpacing / 2; x < 512; x += seamSpacing) {
    ctx.fillRect(x - seamW / 2, 0, seamW, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createWeatherboardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#C19A6B";
  ctx.fillRect(0, 0, 256, 512);
  const boardW = 24;
  for (let x = 0; x < 256; x += boardW) {
    ctx.fillStyle = Math.random() > 0.5 ? "#D4A574" : "#A8845C";
    ctx.fillRect(x, 0, boardW * 0.88, 512);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + boardW * 0.9, 0); ctx.lineTo(x + boardW * 0.9, 512); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Derive which walls to use for each face from the walls array
function getElevationWalls(walls) {
  const withImage = walls.filter(w => w.elevationImage);

  const horizontal = withImage.filter(w => w.face === "W" || w.face === "Y" || w.orientation === "horizontal");
  const vertical = withImage.filter(w => w.face === "Z" || w.face === "X" || w.orientation === "vertical");

  const ys = horizontal.map(w => w.y);
  const midY = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
  const getFace = (w) => {
    if (w.face) return w.face;
    return w.y <= midY ? "W" : "Y";
  };

  const wWalls = horizontal.filter(w => getFace(w) === "W").sort((a, b) => a.x - b.x);
  const yWalls = horizontal.filter(w => getFace(w) === "Y").sort((a, b) => a.x - b.x);

  const vertXs = vertical.map(w => w.x);
  const midX = vertXs.length > 0 ? (Math.min(...vertXs) + Math.max(...vertXs)) / 2 : 0;
  const zWall = vertical.find(w => w.face === "Z" || (!w.face && w.x <= midX)) || null;
  const xWall = vertical.find(w => w.face === "X" || (!w.face && w.x > midX)) || null;

  return { wWalls, yWalls, zWall, xWall };
}

export default function View3DFromElevations({ walls = [] }) {
  const mountRef = useRef(null);

  const { wWalls, yWalls, zWall, xWall } = useMemo(() => getElevationWalls(walls), [walls]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0efed);
    scene.fog = new THREE.Fog(0xf0efed, 40, 120);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshLambertMaterial({ color: 0xe8e6e0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(80, 80, 0xcccccc, 0xdddddd);
    scene.add(gridHelper);

    const loader = new THREE.TextureLoader();

    // Derive building dimensions from wall lengths
    // W/Y walls are long face (width), Z/X are end face (depth)
    const wWallLength = wWalls.length > 0 ? wWalls.reduce((s, w) => s + (w.length || 5), 0) * 0.6 : (yWalls.length > 0 ? yWalls.reduce((s, w) => s + (w.length || 5), 0) * 0.6 : 9);
    const endWallLength = (zWall || xWall) ? ((zWall?.length || xWall?.length || 8) * 0.6) : 4.8;

    // The elevation images include the roof — use a fixed aspect ratio to size the panels.
    // Long face: use a 3:1 width:height ratio (typical for these elevations)
    // End face:  use a 1:1 ratio (square-ish gable end)
    const longFaceH = wWallLength / 3;
    const endFaceH = endWallLength * 0.9;

    // Building dimensions
    const bW = wWallLength;  // building width (X axis)
    const bD = endWallLength; // building depth (Z axis)
    // Spouting line sits at ~60% of the total elevation image height
    const spoutingFraction = 0.60;
    const bH = longFaceH * spoutingFraction; // wall height up to spouting

    // Center at origin
    const ox = -bW / 2;
    const oz = -bD / 2;

    // ── Wall faces ─────────────────────────────────────────────────────────

    const makeFaceMesh = (imgUrl, width, height, flipped = false) => {
      const geo = new THREE.PlaneGeometry(width, height);
      if (imgUrl) {
        const tex = loader.load(imgUrl);
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        if (flipped) tex.repeat.set(-1, 1);
        if (flipped) tex.offset.set(1, 0);
        const mat = new THREE.MeshLambertMaterial({ map: tex, color: 0xffffff });
        return new THREE.Mesh(geo, mat);
      }
      const fallbackTex = createWeatherboardTexture();
      fallbackTex.repeat.set(width / 1.5, 1);
      return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: fallbackTex, color: 0xffffff }));
    };

    // W face — front (negative Z, facing -Z)
    // Composite multiple panels side by side if needed
    const makeCompositeWallFace = (wallArr, totalW, faceZ, rotY, flippedOverride = false) => {
      if (wallArr.length === 0) return;
      if (wallArr.length === 1) {
        const wall = wallArr[0];
        const mesh = makeFaceMesh(wall.elevationImage, totalW, bH, flippedOverride ? !wall.flipped : wall.flipped);
        mesh.position.set(0, bH / 2, faceZ);
        mesh.rotation.y = rotY;
        mesh.castShadow = true;
        scene.add(mesh);
        return;
      }
      // Multiple panels — lay them side by side
      const panelW = totalW / wallArr.length;
      wallArr.forEach((wall, i) => {
        const mesh = makeFaceMesh(wall.elevationImage, panelW, bH, flippedOverride ? !wall.flipped : wall.flipped);
        const startX = -totalW / 2 + panelW * (i + 0.5);
        mesh.position.set(startX, bH / 2, faceZ);
        mesh.rotation.y = rotY;
        mesh.castShadow = true;
        scene.add(mesh);
      });
    };

    // W = front face (min Z)
    makeCompositeWallFace(wWalls, bW, oz, 0);

    // Y = back face (max Z) — mirror X so it reads correctly from outside
    makeCompositeWallFace(yWalls, bW, oz + bD, Math.PI, true);

    // Z = left end face (min X, facing -X)
    if (zWall) {
      const mesh = makeFaceMesh(zWall.elevationImage, bD, bH, zWall.flipped);
      mesh.position.set(ox, bH / 2, 0);
      mesh.rotation.y = -Math.PI / 2;
      mesh.castShadow = true;
      scene.add(mesh);
    }

    // X = right end face (max X, facing +X)
    if (xWall) {
      const mesh = makeFaceMesh(xWall.elevationImage, bD, bH, xWall.flipped);
      mesh.position.set(ox + bW, bH / 2, 0);
      mesh.rotation.y = Math.PI / 2;
      mesh.castShadow = true;
      scene.add(mesh);
    }

    // ── Gable triangles on ends ─────────────────────────────────────────────

    const makeGableTriangle = (xPos, facingLeft) => {
      const verts = new Float32Array([
        0, 0, -bD / 2,
        0, 0,  bD / 2,
        0, roofPeak, 0,
      ]);
      const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geo.setIndex([0, 2, 1]);
      geo.computeVertexNormals();
      const wbTex = createWeatherboardTexture();
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: wbTex, color: 0xffffff, side: THREE.DoubleSide }));
      mesh.position.set(xPos, bH, 0);
      scene.add(mesh);
    };

    makeGableTriangle(ox, true);
    makeGableTriangle(ox + bW, false);

    // ── Pitched roof ────────────────────────────────────────────────────────
    const roofVerts = new Float32Array([
      -roofW/2, 0, -roofD/2,
       roofW/2, 0, -roofD/2,
       roofW/2, 0,  roofD/2,
      -roofW/2, 0,  roofD/2,
      -roofW/2, roofPeak, 0,
       roofW/2, roofPeak, 0,
    ]);
    const roofIndices = new Uint32Array([
      0, 5, 4, 0, 1, 5, // front slope
      3, 4, 5, 3, 5, 2, // back slope
    ]);
    const roofUVs = new Float32Array([
      0, 0, 1, 0, 1, 1, 0, 1, 0, 0.5, 1, 0.5
    ]);
    const roofGeo = new THREE.BufferGeometry();
    roofGeo.setAttribute("position", new THREE.BufferAttribute(roofVerts, 3));
    roofGeo.setAttribute("uv", new THREE.BufferAttribute(roofUVs, 2));
    roofGeo.setIndex(new THREE.BufferAttribute(roofIndices, 1));
    roofGeo.computeVertexNormals();

    const roofTex = createStandingSeamTexture();
    roofTex.repeat.set(bW / 0.6, 1);
    const roofMesh = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ map: roofTex, color: 0xffffff }));
    roofMesh.castShadow = true;
    roofMesh.position.set(0, bH, 0);
    scene.add(roofMesh);

    // ── Face labels on ground ───────────────────────────────────────────────
    const makeLabel = (text, x, z) => {
      const c = document.createElement("canvas");
      c.width = 128; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 64, 64);
      const planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.8),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true })
      );
      planeMesh.rotation.x = -Math.PI / 2;
      planeMesh.position.set(x, 0.01, z);
      scene.add(planeMesh);
    };

    makeLabel("W", 0, oz - 0.8);
    makeLabel("Y", 0, oz + bD + 0.8);
    makeLabel("Z", ox - 0.8, 0);
    makeLabel("X", ox + bW + 0.8, 0);

    // Orbit controls & resize
    const cleanupControls = createOrbitControls(camera, el);
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    let animId;
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      cleanupControls();
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [walls]);

  const hasAny = walls.some(w => w.elevationImage);

  if (!hasAny) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400 max-w-xs">
          <p className="text-base font-medium text-gray-500 mb-1">No elevation images</p>
          <p className="text-sm text-gray-400">Upload elevation images to walls to see the 3D render</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mountRef} className="w-full h-full" style={{ touchAction: "none" }}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/70 px-3 py-1 rounded pointer-events-none select-none">
        Left drag: orbit · Right drag / Alt+drag: pan · Scroll: zoom
      </div>
    </div>
  );
}