import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Simple orbit controls implementation (no import needed)
function createOrbitControls(camera, domElement) {
  let isPointerDown = false;
  let isPanning = false;
  let lastX = 0, lastY = 0;
  let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 40 };
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
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onPointerMove = (e) => {
    if (!isPointerDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    if (isPanning) {
      const panSpeed = 0.05;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), up).normalize();
      target.addScaledVector(right, -dx * panSpeed);
      target.y += dy * panSpeed;
    } else {
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.008));
    }
    updateCamera();
  };

  const onPointerUp = () => { isPointerDown = false; };

  const onWheel = (e) => {
    spherical.radius = Math.max(5, Math.min(150, spherical.radius + e.deltaY * 0.05));
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

const CELL_M = 0.6; // each cell = 0.6 metres
const MODULE_HEIGHT = 2.4; // metres tall
const WALL_HEIGHT = 2.4;
const GABLE_HEIGHT = 1.2; // gable roof peak height

const GROUP_COLORS = {
  general: 0xf5dcc8,
  kitchen: 0xd4ecd4,
  bathroom: 0xc8ddf5,
  combined: 0xe8d4f5,
  deck: 0xf5f0c8,
};

// Create standing seam metal texture (vertical 40mm seams at 600mm spacing, centred)
function createStandingSeamTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Base dark gray
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, width, height);
  
  // Vertical seams only: 40mm wide at 600mm spacing, centred on surface
  const seamPixelWidth = Math.max(1, Math.round(width * 0.04 / 3.0)); // 40mm seam width (3m module width)
  const seamSpacingPixels = Math.round(width * 0.6 / 3.0); // 600mm spacing for 3m width = 6 seams
  const startOffset = (width - (Math.floor(width / seamSpacingPixels) * seamSpacingPixels)) / 2; // Centre seams
  
  ctx.fillStyle = '#1a1a1a';
  for (let x = startOffset; x < width; x += seamSpacingPixels) {
    ctx.fillRect(x - seamPixelWidth / 2, 0, seamPixelWidth, height);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export default function View3D({ placedModules, walls }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0efed);
    scene.fog = new THREE.Fog(0xf0efed, 80, 200);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
    camera.position.set(20, 30, 30);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    scene.add(sun);

    // Grid / ground
    const gridHelper = new THREE.GridHelper(200, 200, 0xcccccc, 0xdddddd);
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f3 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Place modules
    placedModules.forEach((mod) => {
      const wM = mod.w * CELL_M;
      const hM = mod.h * CELL_M;
      const color = GROUP_COLORS[mod.groupKey] ?? 0xf5dcc8;

      const geo = new THREE.BoxGeometry(wM, MODULE_HEIGHT, hM);
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Centre of module in world coords (grid origin at 0,0)
      mesh.position.set(
        mod.x * CELL_M + wM / 2,
        MODULE_HEIGHT / 2,
        mod.y * CELL_M + hM / 2
      );
      scene.add(mesh);

      // Outline
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xF15A22, linewidth: 1 }));
      line.position.copy(mesh.position);
      scene.add(line);

      // Label plane (small flat box on top)
      const topGeo = new THREE.PlaneGeometry(wM - 0.05, hM - 0.05);
      const topMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.rotation.x = -Math.PI / 2;
      top.position.set(mesh.position.x, MODULE_HEIGHT + 0.01, mesh.position.z);
      scene.add(top);

      // Pitched gable roof over module (ridge along width, 25 degree pitch)
      const roofDepth = hM + 0.37; // 3m + 370mm
      const pitchAngle = 25 * Math.PI / 180;
      const roofPeakH = (roofDepth / 2) * Math.tan(pitchAngle);
      const roofVertices = new Float32Array([
        // Rectangle base
        -wM/2, 0, -roofDepth/2,          // 0: front-left
        wM/2, 0, -roofDepth/2,           // 1: front-right
        wM/2, 0, roofDepth/2,            // 2: back-right
        -wM/2, 0, roofDepth/2,           // 3: back-left
        // Peak ridge (center along width)
        -wM/2, roofPeakH, 0,             // 4: left-center-peak
        wM/2, roofPeakH, 0,              // 5: right-center-peak
      ]);
      
      const roofIndices = new Uint32Array([
        // Bottom
        0, 2, 1, 0, 3, 2,
        // Front sloped face
        0, 4, 5, 0, 5, 1,
        // Back sloped face
        3, 2, 5, 3, 5, 4,
        // Left triangle
        0, 3, 4,
        // Right triangle
        1, 5, 2,
      ]);
      
      const roofGeo = new THREE.BufferGeometry();
      roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
      
      // UV coordinates for texture mapping
      const roofUVs = new Float32Array([
        0, 0,    // 0
        1, 0,    // 1
        1, 1,    // 2
        0, 1,    // 3
        0, 0.5,  // 4
        1, 0.5,  // 5
      ]);
      roofGeo.setAttribute('uv', new THREE.BufferAttribute(roofUVs, 2));
      roofGeo.setIndex(new THREE.BufferAttribute(roofIndices, 1));
      roofGeo.computeVertexNormals();
      
      const roofTexture = createStandingSeamTexture();
      const roofMat = new THREE.MeshLambertMaterial({ map: roofTexture, color: 0xffffff });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.castShadow = true;
      roof.receiveShadow = true;
      roof.position.copy(mesh.position);
      roof.position.y = MODULE_HEIGHT;
      scene.add(roof);
    });

    // Place walls
    walls.forEach((wall) => {
      const thickness = wall.thickness * CELL_M;
      const wM = wall.orientation === "horizontal" ? wall.length * CELL_M : thickness;
      const hM = wall.orientation === "vertical" ? wall.length * CELL_M : thickness;

      let material;

      if (wall.elevationImage) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(wall.elevationImage, (texture) => {
          material.map = texture;
          material.needsUpdate = true;
        });
        material = new THREE.MeshLambertMaterial({ color: 0xffffff });
      } else {
        const seamTexture = createStandingSeamTexture();
        material = new THREE.MeshLambertMaterial({ map: seamTexture, color: 0xffffff });
      }

      const geo = new THREE.BoxGeometry(wM, WALL_HEIGHT, hM);
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(
        wall.x * CELL_M + wM / 2,
        WALL_HEIGHT / 2,
        wall.y * CELL_M + hM / 2
      );
      scene.add(mesh);
    });

    // Centre camera on design
    if (placedModules.length > 0) {
      const xs = placedModules.map((m) => m.x + m.w / 2);
      const ys = placedModules.map((m) => m.y + m.h / 2);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2 * CELL_M;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2 * CELL_M;
      camera.position.set(cx + 20, 30, cy + 30);
      camera.lookAt(cx, 0, cy);
    }

    // Orbit controls
    const cleanupControls = createOrbitControls(camera, el);

    // Resize observer
    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(el);

    // Animate
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      cleanupControls();
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [placedModules, walls]);

  return (
    <div ref={mountRef} className="w-full h-full" style={{ touchAction: "none" }}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/70 px-3 py-1 rounded pointer-events-none select-none">
        Left drag: orbit · Right drag / Alt+drag: pan · Scroll: zoom
      </div>
    </div>
  );
}