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
    // Spouting line sits at ~30% of the total elevation image height
    const spoutingFraction = 0.30;
    const bH = longFaceH * spoutingFraction; // wall height up to spouting
    const roofPitch = 20 * Math.PI / 180;
    const roofPeak = (bW / 2) * Math.tan(roofPitch);

    // Center at origin
    const ox = -bW / 2;
    const oz = -bD / 2;

    // ── Wall faces ─────────────────────────────────────────────────────────

    // Each elevation image already includes the roof — render the full image
    // with its bottom edge at y=0 (ground) so the spouting line aligns at bH.
    const makeFaceMesh = (imgUrl, width, height, flipped = false) => {
      const geo = new THREE.PlaneGeometry(width, height);
      if (imgUrl) {
        const tex = loader.load(imgUrl);
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        if (flipped) { tex.repeat.set(-1, 1); tex.offset.set(1, 0); }
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, color: 0xffffff, transparent: true }));
      }
      const fallbackTex = createWeatherboardTexture();
      fallbackTex.repeat.set(width / 1.5, 1);
      return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: fallbackTex }));
    };

    // Long faces: full image height so roof in image sits above bH naturally
    const makeCompositeWallFace = (wallArr, totalW, faceH, faceZ, rotY, flippedOverride = false) => {
      if (wallArr.length === 0) return;
      const panelW = totalW / wallArr.length;
      wallArr.forEach((wall, i) => {
        const isFlipped = flippedOverride ? !wall.flipped : wall.flipped;
        const mesh = makeFaceMesh(wall.elevationImage, panelW, faceH, isFlipped);
        const startX = -totalW / 2 + panelW * (i + 0.5);
        // position: bottom of image at y=0, so centre is at faceH/2
        mesh.position.set(startX, faceH / 2, faceZ);
        mesh.rotation.y = rotY;
        scene.add(mesh);
      });
    };

    // W = front face (min Z)
    makeCompositeWallFace(wWalls, bW, longFaceH, oz, 0);

    // Y = back face (max Z) — mirror X so it reads correctly from outside
    makeCompositeWallFace(yWalls, bW, longFaceH, oz + bD, Math.PI, true);

    // Z = left end face (min X, facing -X)
    if (zWall) {
      const mesh = makeFaceMesh(zWall.elevationImage, bD, endFaceH, zWall.flipped);
      // bottom of image at y=0
      mesh.position.set(ox, endFaceH / 2, 0);
      mesh.rotation.y = -Math.PI / 2;
      scene.add(mesh);
    }

    // X = right end face (max X, facing +X)
    if (xWall) {
      const isFlipped = xWall.flipped;
      const mesh = makeFaceMesh(xWall.elevationImage, bD, endFaceH, isFlipped);
      mesh.position.set(ox + bW, endFaceH / 2, 0);
      mesh.rotation.y = Math.PI / 2;
      scene.add(mesh);
    }

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