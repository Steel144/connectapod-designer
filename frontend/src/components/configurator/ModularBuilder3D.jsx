import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Standard module height
const MODULE_HEIGHT = 2.7; // meters
const GRID_UNIT = 0.6; // meters per grid cell

function createOrbitControls(camera, domElement) {
  let isPointerDown = false;
  let isPanning = false;
  let lastX = 0, lastY = 0;
  let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 20 };
  let target = new THREE.Vector3(0, 1, 0);

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
    isPanning = e.button === 2;
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
      const right = new THREE.Vector3();
      right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), new THREE.Vector3(0, 1, 0)).normalize();
      target.addScaledVector(right, -dx * 0.02);
      target.y += dy * 0.02;
    } else {
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, spherical.phi - dy * 0.008));
    }
    updateCamera();
  };

  const onPointerUp = () => { isPointerDown = false; };
  const onWheel = (e) => {
    spherical.radius = Math.max(5, Math.min(80, spherical.radius + e.deltaY * 0.02));
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

export default function ModularBuilder3D({ placedModules = [], walls = [] }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || placedModules.length === 0) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8f4f8);
    scene.fog = new THREE.Fog(0xe8f4f8, 50, 150);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sunLight.position.set(20, 30, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.3);
    scene.add(hemiLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xd4e8d4 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(100, 100, 0xaaaaaa, 0xcccccc);
    scene.add(gridHelper);

    const textureLoader = new THREE.TextureLoader();

    // Calculate building bounds from modules
    const bounds = {
      minX: Math.min(...placedModules.map(m => m.x)),
      maxX: Math.max(...placedModules.map(m => m.x + m.w)),
      minY: Math.min(...placedModules.map(m => m.y)),
      maxY: Math.max(...placedModules.map(m => m.y + m.h))
    };

    const buildingWidth = (bounds.maxX - bounds.minX) * GRID_UNIT;
    const buildingDepth = (bounds.maxY - bounds.minY) * GRID_UNIT;
    const centerX = ((bounds.minX + bounds.maxX) / 2) * GRID_UNIT;
    const centerZ = ((bounds.minY + bounds.maxY) / 2) * GRID_UNIT;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: BUILD MODULES AS 3D BOXES
    // ═══════════════════════════════════════════════════════════
    
    const moduleGroup = new THREE.Group();
    
    placedModules.forEach((module) => {
      const modWidth = module.w * GRID_UNIT;
      const modDepth = module.h * GRID_UNIT;
      const modX = module.x * GRID_UNIT - centerX;
      const modZ = module.y * GRID_UNIT - centerZ;

      // Module structure (simple box frame - not filled, just edges)
      const moduleBoxGeo = new THREE.BoxGeometry(modWidth, MODULE_HEIGHT, modDepth);
      const moduleEdges = new THREE.EdgesGeometry(moduleBoxGeo);
      const moduleFrame = new THREE.LineSegments(
        moduleEdges,
        new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 })
      );
      moduleFrame.position.set(
        modX + modWidth / 2,
        MODULE_HEIGHT / 2,
        modZ + modDepth / 2
      );
      moduleGroup.add(moduleFrame);

      // Optional: Add transparent interior volume to show module space
      const interiorMat = new THREE.MeshBasicMaterial({
        color: 0xccddff,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      });
      const interiorBox = new THREE.Mesh(moduleBoxGeo, interiorMat);
      interiorBox.position.copy(moduleFrame.position);
      moduleGroup.add(interiorBox);
    });

    scene.add(moduleGroup);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: WRAP WITH WALL PANELS
    // ═══════════════════════════════════════════════════════════

    const wallGroup = new THREE.Group();

    // Group walls by face
    const wallsByFace = {
      W: walls.filter(w => w.face === "W").sort((a, b) => a.x - b.x),
      Y: walls.filter(w => w.face === "Y").sort((a, b) => a.x - b.x),
      Z: walls.filter(w => w.face === "Z"),
      X: walls.filter(w => w.face === "X")
    };

    // Helper: Create wall panel with elevation texture
    const createWallPanel = (width, height, elevationImage, flipped = false) => {
      const geo = new THREE.PlaneGeometry(width, height);
      
      if (elevationImage) {
        const texture = textureLoader.load(elevationImage);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        
        if (flipped) {
          texture.repeat.set(-1, 1);
          texture.offset.set(1, 0);
        }
        
        return new THREE.Mesh(
          geo,
          new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.FrontSide
          })
        );
      }
      
      // Fallback: simple colored material
      return new THREE.Mesh(
        geo,
        new THREE.MeshLambertMaterial({ color: 0xd4c5b0 })
      );
    };

    // W Face (Front - min Z)
    if (wallsByFace.W.length > 0) {
      const panelWidth = buildingWidth / wallsByFace.W.length;
      wallsByFace.W.forEach((wall, i) => {
        const wallHeight = MODULE_HEIGHT * 1.4; // Include some roof overlap
        const panel = createWallPanel(panelWidth, wallHeight, wall.elevationImage, wall.flipped);
        
        const xPos = -buildingWidth / 2 + panelWidth * (i + 0.5);
        panel.position.set(xPos, wallHeight / 2, -buildingDepth / 2 - 0.01);
        panel.castShadow = true;
        panel.receiveShadow = true;
        wallGroup.add(panel);
      });
    }

    // Y Face (Back - max Z)
    if (wallsByFace.Y.length > 0) {
      const panelWidth = buildingWidth / wallsByFace.Y.length;
      wallsByFace.Y.forEach((wall, i) => {
        const wallHeight = MODULE_HEIGHT * 1.4;
        const panel = createWallPanel(panelWidth, wallHeight, wall.elevationImage, !wall.flipped);
        
        const xPos = -buildingWidth / 2 + panelWidth * (i + 0.5);
        panel.position.set(xPos, wallHeight / 2, buildingDepth / 2 + 0.01);
        panel.rotation.y = Math.PI;
        panel.castShadow = true;
        panel.receiveShadow = true;
        wallGroup.add(panel);
      });
    }

    // Z Face (Left - min X)
    if (wallsByFace.Z.length > 0) {
      const wall = wallsByFace.Z[0];
      const wallHeight = MODULE_HEIGHT * 1.4;
      const panel = createWallPanel(buildingDepth, wallHeight, wall.elevationImage, wall.flipped);
      
      panel.position.set(-buildingWidth / 2 - 0.01, wallHeight / 2, 0);
      panel.rotation.y = -Math.PI / 2;
      panel.castShadow = true;
      panel.receiveShadow = true;
      wallGroup.add(panel);
    }

    // X Face (Right - max X)
    if (wallsByFace.X.length > 0) {
      const wall = wallsByFace.X[0];
      const wallHeight = MODULE_HEIGHT * 1.4;
      const panel = createWallPanel(buildingDepth, wallHeight, wall.elevationImage, wall.flipped);
      
      panel.position.set(buildingWidth / 2 + 0.01, wallHeight / 2, 0);
      panel.rotation.y = Math.PI / 2;
      panel.castShadow = true;
      panel.receiveShadow = true;
      wallGroup.add(panel);
    }

    scene.add(wallGroup);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: ADD CONTINUOUS PITCHED ROOF
    // ═══════════════════════════════════════════════════════════

    const roofPitch = 18 * Math.PI / 180; // 18 degree pitch
    const roofPeakHeight = (buildingWidth / 2) * Math.tan(roofPitch);
    const roofOverhang = 0.3; // 30cm overhang

    const roofWidth = buildingWidth + roofOverhang * 2;
    const roofDepth = buildingDepth + roofOverhang * 2;

    // Create roof geometry
    const roofVerts = new Float32Array([
      // Front slope
      -roofWidth/2, 0, -roofDepth/2,
       roofWidth/2, 0, -roofDepth/2,
      -roofWidth/2, roofPeakHeight, 0,
       roofWidth/2, roofPeakHeight, 0,
      // Back slope
      -roofWidth/2, 0, roofDepth/2,
       roofWidth/2, 0, roofDepth/2,
    ]);

    const roofIndices = new Uint32Array([
      0, 2, 1, 1, 2, 3, // front slope
      4, 5, 6, 5, 7, 6, // back slope
    ]);

    const roofUVs = new Float32Array([
      0, 0, 1, 0, 0, 1, 1, 1,
      0, 0, 1, 0, 0, 1, 1, 1,
    ]);

    const roofGeo = new THREE.BufferGeometry();
    roofGeo.setAttribute("position", new THREE.BufferAttribute(roofVerts, 3));
    roofGeo.setAttribute("uv", new THREE.BufferAttribute(roofUVs, 2));
    roofGeo.setIndex(new THREE.BufferAttribute(roofIndices, 1));
    roofGeo.computeVertexNormals();

    // Simple corrugated metal roof texture
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: THREE.DoubleSide });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = MODULE_HEIGHT;
    roofMesh.castShadow = true;
    scene.add(roofMesh);

    // Controls
    const cleanupControls = createOrbitControls(camera, el);

    // Resize observer
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      cleanupControls();
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [placedModules, walls]);

  if (placedModules.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <p className="text-gray-600 text-lg font-medium">No modules placed yet</p>
          <p className="text-gray-400 text-sm mt-2">Add modules in 2D view to build in 3D</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mountRef} className="w-full h-full relative" style={{ touchAction: "none" }}>
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 shadow-lg text-sm">
        <div className="font-semibold text-gray-800">{placedModules.length} Modules</div>
        <div className="text-xs text-gray-500">Modular Construction View</div>
      </div>
      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur px-3 py-2 text-white text-xs">
        <div>🖱️ Left drag: Rotate</div>
        <div>⚙️ Right drag: Pan</div>
        <div>🔍 Scroll: Zoom</div>
      </div>
    </div>
  );
}
