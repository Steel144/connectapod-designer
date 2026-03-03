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

// Window configurations by wall series
const getWindowConfig = (wallCode) => {
  const code = wallCode?.toUpperCase() || '';
  
  // Map wall codes to window patterns by series number
  if (code.startsWith('W') || code.startsWith('Y')) {
    const series = parseInt(code.substring(1));
    
    // Standard 600mm walls (W000, W001, Y000, Y001)
    if (code.includes('000') || code.includes('001')) {
      return [{ x: 0.5, y: 0.5, w: 0.5, h: 0.7 }];
    }
    
    // 1800mm walls (W050, W051, Y050, Y051, YS050, Y051D)
    if (code.includes('050') || code.includes('051')) {
      return [{ x: 0.4, y: 0.5, w: 0.45, h: 0.7 }, { x: 1.2, y: 0.5, w: 0.45, h: 0.7 }];
    }
    
    // 2400mm walls (W200, W201, W202, Y200, Y201, Y202)
    if (code.includes('200') || code.includes('201') || code.includes('202')) {
      return [{ x: 0.3, y: 0.5, w: 0.45, h: 0.7 }, { x: 1.2, y: 0.5, w: 0.45, h: 0.7 }, { x: 2.1, y: 0.5, w: 0.45, h: 0.7 }];
    }
    
    // 3000mm walls series 500+ (W500-W518, Y500-Y518, W530-Y540, etc.)
    if (series >= 400) {
      return [{ x: 0.3, y: 0.5, w: 0.4, h: 0.7 }, { x: 1.2, y: 0.5, w: 0.4, h: 0.7 }, { x: 2.1, y: 0.5, w: 0.4, h: 0.7 }];
    }
  }
  
  // Gable/end walls (Z, X series)
  if (code.startsWith('Z') || code.startsWith('X')) {
    return [{ x: 1.8, y: 0.8, w: 0.6, h: 0.9 }];
  }
  
  return null;
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

// Create timber shiplap texture (vertical cedar boards with grain)
function createWeatherboardTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Base cedar color
  ctx.fillStyle = '#C19A6B';
  ctx.fillRect(0, 0, width, height);
  
  // Vertical shiplap boards
  const boardWidth = 24;
  for (let x = 0; x < width; x += boardWidth) {
    // Vary board color slightly for cedar variation
    const colorVariation = Math.random() > 0.5 ? '#D4A574' : '#A8845C';
    ctx.fillStyle = colorVariation;
    ctx.fillRect(x, 0, boardWidth * 0.85, height);
    
    // Wood grain effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let i = 0; i < 3; i++) {
      const grainY = Math.random() * height;
      ctx.fillRect(x, grainY, boardWidth * 0.85, 1);
    }
    
    // Shiplap shadow line (right edge overlap)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + boardWidth * 0.88, 0);
    ctx.lineTo(x + boardWidth * 0.88, height);
    ctx.stroke();
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
      
      // Gable end triangles with weatherboard texture
      // Scale gable UVs to continue texture from wall (v=0 at wall top, v=peakRatio at peak)
      const gablePeakRatio = roofPeakH / WALL_HEIGHT;
      const gableUVs = new Float32Array([
        0, 0, 1, 0, 0.5, gablePeakRatio,
        0, 0, 1, 0, 0.5, gablePeakRatio,
      ]);
      
      // Left gable
      const leftGableGeo = new THREE.BufferGeometry();
      leftGableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -wM/2, 0, -roofDepth/2,
        -wM/2, 0, roofDepth/2,
        -wM/2, roofPeakH, 0,
      ]), 3));
      leftGableGeo.setAttribute('uv', new THREE.BufferAttribute(gableUVs, 2));
      leftGableGeo.computeVertexNormals();
      
      const weatherboardTex = createWeatherboardTexture();
      const gableMat = new THREE.MeshLambertMaterial({ map: weatherboardTex, color: 0xffffff });
      const leftGable = new THREE.Mesh(leftGableGeo, gableMat);
      leftGable.castShadow = true;
      leftGable.receiveShadow = true;
      leftGable.position.copy(mesh.position);
      leftGable.position.y = MODULE_HEIGHT;
      scene.add(leftGable);
      
      // Right gable
      const rightGableGeo = new THREE.BufferGeometry();
      rightGableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        wM/2, 0, -roofDepth/2,
        wM/2, roofPeakH, 0,
        wM/2, 0, roofDepth/2,
      ]), 3));
      rightGableGeo.setAttribute('uv', new THREE.BufferAttribute(gableUVs, 2));
      rightGableGeo.computeVertexNormals();
      
      const rightGable = new THREE.Mesh(rightGableGeo, gableMat);
      rightGable.castShadow = true;
      rightGable.receiveShadow = true;
      rightGable.position.copy(mesh.position);
      rightGable.position.y = MODULE_HEIGHT;
      scene.add(rightGable);
    });

    // Place walls
    walls.forEach((wall) => {
      const thickness = wall.thickness * CELL_M;
      const wM = wall.orientation === "horizontal" ? wall.length * CELL_M : thickness;
      const hM = wall.orientation === "vertical" ? wall.length * CELL_M : thickness;

      // Use weatherboard for gable ends (Z, X faces), standing seam for others
      const isGableEnd = wall.face === 'Z' || wall.face === 'X';
      const texture = isGableEnd ? createWeatherboardTexture() : createStandingSeamTexture();
      const material = new THREE.MeshLambertMaterial({ map: texture, color: 0xffffff });

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
      
      // Add windows based on wall code
      const windowCode = wall.type?.split('/')[0];
      const windowSpecs = getWindowConfig(windowCode);
      
      if (windowSpecs && windowSpecs.length > 0) {
        const isHorizontal = wall.orientation === "horizontal";
        
        windowSpecs.forEach((spec) => {
          // For vertical walls, swap width/height to match orientation
          const winW = isHorizontal ? spec.w : spec.h;
          const winH = isHorizontal ? spec.h : spec.w;
          const winGeo = new THREE.BoxGeometry(winW, winH, 0.1);
          const winMat = new THREE.MeshPhongMaterial({ 
            color: 0x87CEEB,
            emissive: 0x4A90E2,
            emissiveIntensity: 0.4,
            shininess: 80
          });
          const window = new THREE.Mesh(winGeo, winMat);
          window.castShadow = true;
          window.receiveShadow = true;
          
          let winX, winY, winZ;
          if (isHorizontal) {
            winX = mesh.position.x - wM / 2 + spec.x;
            winY = mesh.position.y + spec.y;
            winZ = mesh.position.z + 0.05;
          } else {
            winX = mesh.position.x + 0.05;
            winY = mesh.position.y + spec.x;
            winZ = mesh.position.z - hM / 2 + spec.y;
          }
          
          window.position.set(winX, winY, winZ);
          scene.add(window);
        });
      }
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