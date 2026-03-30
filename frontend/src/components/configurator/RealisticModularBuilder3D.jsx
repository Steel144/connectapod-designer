import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Module specifications
const MODULE_WIDTH = 3.0;
const MODULE_DEPTH = 5.2;
const MODULE_STUD_HEIGHT = 2.4;
const WALL_THICKNESS = 0.15;
const ROOF_PITCH = 25 * Math.PI / 180;

function createRealisticMaterials() {
  return {
    // Cladding 1 - Vertical metal panels (used on most elevations)
    cladding1: new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3,
    }),
    
    // Cladding 2 - Feature cladding/timber (darker or contrasting)
    cladding2: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2,
    }),
    
    // Timber for gable ends
    timber: new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.9,
      metalness: 0.0,
    }),
    
    // Glass for windows - more visible
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x4a90c8,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      reflectivity: 0.9,
    }),
    
    // Dark metal roof
    roof: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.4,
      metalness: 0.6,
    }),
    
    // Dark window/door frames
    windowFrame: new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.3,
      metalness: 0.4,
    }),
  };
}

function buildSingleModule(materials, position = { x: 0, y: 0, z: 0 }) {
  const group = new THREE.Group();
  
  // Floor/base
  const floorGeo = new THREE.BoxGeometry(MODULE_WIDTH, 0.2, MODULE_DEPTH);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = 0.1;
  floor.castShadow = true;
  floor.receiveShadow = true;
  group.add(floor);
  
  const wallHeight = MODULE_STUD_HEIGHT;
  
  // Helper function to create window with frame
  const createWindow = (width, height, xPos, yPos, zPos, rotation = 0) => {
    const windowGroup = new THREE.Group();
    
    // Glass
    const glassGeo = new THREE.PlaneGeometry(width, height);
    const glass = new THREE.Mesh(glassGeo, materials.glass);
    glass.position.set(0, 0, 0.02);
    windowGroup.add(glass);
    
    // Frame - outer border
    const frameThickness = 0.08;
    const frameDepth = 0.12;
    
    // Top frame
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, frameDepth),
      materials.windowFrame
    );
    topFrame.position.set(0, height / 2 + frameThickness / 2, 0);
    windowGroup.add(topFrame);
    
    // Bottom frame
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, frameDepth),
      materials.windowFrame
    );
    bottomFrame.position.set(0, -height / 2 - frameThickness / 2, 0);
    windowGroup.add(bottomFrame);
    
    // Left frame
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, height, frameDepth),
      materials.windowFrame
    );
    leftFrame.position.set(-width / 2 - frameThickness / 2, 0, 0);
    windowGroup.add(leftFrame);
    
    // Right frame
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, height, frameDepth),
      materials.windowFrame
    );
    rightFrame.position.set(width / 2 + frameThickness / 2, 0, 0);
    windowGroup.add(rightFrame);
    
    windowGroup.position.set(xPos, yPos, zPos);
    windowGroup.rotation.y = rotation;
    return windowGroup;
  };
  
  // Y-FACE (East) - Feature side with large ED002 window (3.02m × 2.2m)
  const yFaceZ = MODULE_DEPTH / 2;
  
  // Wall sections around the large window
  const ed002Width = 3.02;
  const ed002Height = 2.2;
  
  // Left wall section
  const yLeftWall = new THREE.Mesh(
    new THREE.BoxGeometry((MODULE_WIDTH - ed002Width) / 2 - 0.1, wallHeight, WALL_THICKNESS),
    materials.cladding1
  );
  yLeftWall.position.set(
    -MODULE_WIDTH / 2 + (MODULE_WIDTH - ed002Width) / 4,
    wallHeight / 2,
    yFaceZ
  );
  yLeftWall.castShadow = true;
  group.add(yLeftWall);
  
  // Right wall section
  const yRightWall = new THREE.Mesh(
    new THREE.BoxGeometry((MODULE_WIDTH - ed002Width) / 2 - 0.1, wallHeight, WALL_THICKNESS),
    materials.cladding1
  );
  yRightWall.position.set(
    MODULE_WIDTH / 2 - (MODULE_WIDTH - ed002Width) / 4,
    wallHeight / 2,
    yFaceZ
  );
  yRightWall.castShadow = true;
  group.add(yRightWall);
  
  // Top wall section above window
  const yTopWall = new THREE.Mesh(
    new THREE.BoxGeometry(ed002Width, wallHeight - ed002Height - 0.1, WALL_THICKNESS),
    materials.cladding1
  );
  yTopWall.position.set(
    0,
    wallHeight - (wallHeight - ed002Height) / 2,
    yFaceZ
  );
  yTopWall.castShadow = true;
  group.add(yTopWall);
  
  // Large ED002 window (3.02m × 2.2m) - floor to near-ceiling
  const ed002Window = createWindow(
    ed002Width,
    ed002Height,
    0,
    ed002Height / 2 + 0.1,
    yFaceZ + 0.02
  );
  group.add(ed002Window);
  
  // W-FACE (West) - Simple side with Cladding 2
  const wFaceZ = -MODULE_DEPTH / 2;
  const wWall = new THREE.Mesh(
    new THREE.BoxGeometry(MODULE_WIDTH, wallHeight, WALL_THICKNESS),
    materials.cladding2  // Different cladding type
  );
  wWall.position.set(0, wallHeight / 2, wFaceZ);
  wWall.castShadow = true;
  group.add(wWall);
  
  // Z-FACE (South) - Service side with windows
  const zFaceX = -MODULE_WIDTH / 2;
  
  // EW001 window (2.45m × 1.12m) - bedroom window
  const ew001Window = createWindow(
    1.12,  // rotated, so swap dimensions
    2.45,
    zFaceX - 0.02,
    wallHeight / 2,
    -MODULE_DEPTH / 4,
    Math.PI / 2
  );
  group.add(ew001Window);
  
  // Wall sections around window
  const zTopWall = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_THICKNESS, wallHeight, MODULE_DEPTH / 2),
    materials.cladding1
  );
  zTopWall.position.set(zFaceX, wallHeight / 2, MODULE_DEPTH / 4);
  zTopWall.castShadow = true;
  group.add(zTopWall);
  
  const zBottomWall = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_THICKNESS, wallHeight, MODULE_DEPTH / 3),
    materials.cladding1
  );
  zBottomWall.position.set(zFaceX, wallHeight / 2, -MODULE_DEPTH / 2.5);
  zBottomWall.castShadow = true;
  group.add(zBottomWall);
  
  // X-FACE (North) - Street side with windows
  const xFaceX = MODULE_WIDTH / 2;
  
  // EW017 window (1.22m × 1.12m) - smaller window
  const ew017Window = createWindow(
    1.12,  // rotated
    1.22,
    xFaceX + 0.02,
    wallHeight - 0.8,
    MODULE_DEPTH / 4,
    -Math.PI / 2
  );
  group.add(ew017Window);
  
  // Wall sections
  const xTopWall = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_THICKNESS, wallHeight, MODULE_DEPTH / 2),
    materials.cladding1
  );
  xTopWall.position.set(xFaceX, wallHeight / 2, -MODULE_DEPTH / 4);
  xTopWall.castShadow = true;
  group.add(xTopWall);
  
  const xBottomWall = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_THICKNESS, wallHeight, MODULE_DEPTH / 3),
    materials.cladding1
  );
  xBottomWall.position.set(xFaceX, wallHeight / 2, MODULE_DEPTH / 3);
  xBottomWall.castShadow = true;
  group.add(xBottomWall);
  
  // Gable roof at 25°
  const roofPeakHeight = (MODULE_WIDTH / 2) * Math.tan(ROOF_PITCH);
  const roofOverhang = 0.3;
  
  // Create roof geometry manually
  const roofVerts = new Float32Array([
    // Front slope
    -(MODULE_WIDTH/2 + roofOverhang), 0, -(MODULE_DEPTH/2 + roofOverhang),
    (MODULE_WIDTH/2 + roofOverhang), 0, -(MODULE_DEPTH/2 + roofOverhang),
    -(MODULE_WIDTH/2 + roofOverhang), roofPeakHeight, 0,
    (MODULE_WIDTH/2 + roofOverhang), roofPeakHeight, 0,
    
    // Back slope
    -(MODULE_WIDTH/2 + roofOverhang), 0, (MODULE_DEPTH/2 + roofOverhang),
    (MODULE_WIDTH/2 + roofOverhang), 0, (MODULE_DEPTH/2 + roofOverhang),
  ]);
  
  const roofIndices = new Uint32Array([
    0, 2, 1, 1, 2, 3, // front slope
    4, 5, 6, 5, 7, 6, // back slope
  ]);
  
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute("position", new THREE.BufferAttribute(roofVerts, 3));
  roofGeo.setIndex(new THREE.BufferAttribute(roofIndices, 1));
  roofGeo.computeVertexNormals();
  
  const roof = new THREE.Mesh(roofGeo, materials.roof);
  roof.position.y = MODULE_STUD_HEIGHT;
  roof.castShadow = true;
  group.add(roof);
  
  // Gable end caps (timber)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-MODULE_WIDTH/2, 0);
  gableShape.lineTo(0, roofPeakHeight);
  gableShape.lineTo(MODULE_WIDTH/2, 0);
  gableShape.lineTo(-MODULE_WIDTH/2, 0);
  
  const gableGeo = new THREE.ShapeGeometry(gableShape);
  
  // Front gable
  const frontGable = new THREE.Mesh(gableGeo, materials.timber);
  frontGable.position.set(0, MODULE_STUD_HEIGHT, -MODULE_DEPTH/2 - 0.01);
  frontGable.castShadow = true;
  group.add(frontGable);
  
  // Back gable  
  const backGable = new THREE.Mesh(gableGeo, materials.timber);
  backGable.position.set(0, MODULE_STUD_HEIGHT, MODULE_DEPTH/2 + 0.01);
  backGable.rotation.y = Math.PI;
  backGable.castShadow = true;
  group.add(backGable);
  
  group.position.set(position.x, position.y, position.z);
  
  return group;
}

export default function RealisticModularBuilder3D({ placedModules = [], walls = [] }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, 120);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // Lighting - realistic outdoor
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    sunLight.position.set(15, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x5a8f5a, 0.4);
    scene.add(hemiLight);

    // Ground - grass
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x5a8f5a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Create materials
    const materials = createRealisticMaterials();

    // Calculate building center
    let buildingCenterX = 0;
    let buildingCenterZ = 0;

    // Build modules
    if (placedModules.length > 0) {
      placedModules.forEach(module => {
        const modX = module.x * MODULE_WIDTH;
        const modZ = module.y * MODULE_DEPTH;
        const moduleObj = buildSingleModule(materials, { x: modX, y: 0, z: modZ });
        scene.add(moduleObj);
      });
      
      // Calculate center of all modules
      buildingCenterX = placedModules.reduce((sum, m) => sum + m.x, 0) / placedModules.length * MODULE_WIDTH + MODULE_WIDTH / 2;
      buildingCenterZ = placedModules.reduce((sum, m) => sum + m.y, 0) / placedModules.length * MODULE_DEPTH + MODULE_DEPTH / 2;
    } else {
      // Single test module at origin
      const testModule = buildSingleModule(materials, { x: 0, y: 0, z: 0 });
      scene.add(testModule);
      buildingCenterX = MODULE_WIDTH / 2;
      buildingCenterZ = MODULE_DEPTH / 2;
    }

    // Position camera to look at building center
    const distance = 12;
    const angle = Math.PI / 4;
    camera.position.set(
      buildingCenterX + distance * Math.cos(angle),
      6,
      buildingCenterZ + distance * Math.sin(angle)
    );
    camera.lookAt(buildingCenterX, MODULE_STUD_HEIGHT / 2, buildingCenterZ);

    // Controls with proper target
    const controls = new OrbitControls(camera, el);
    controls.target.set(buildingCenterX, MODULE_STUD_HEIGHT / 2, buildingCenterZ);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.update();

    // Resize
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    // Animation
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      controls.dispose();
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [placedModules, walls]);

  return (
    <div ref={mountRef} className="w-full h-full relative" style={{ touchAction: "none" }}>
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-3 shadow-lg text-sm border border-gray-200">
        <div className="font-semibold text-gray-800">
          {placedModules.length || 1} Module{(placedModules.length || 1) !== 1 ? 's' : ''}
        </div>
        <div className="text-xs text-gray-500">3m × 5.2m × 2.4m</div>
        <div className="text-xs text-gray-500">Realistic materials</div>
      </div>
      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur px-3 py-2 text-white text-xs space-y-1">
        <div>🖱️ Left drag: Rotate</div>
        <div>⚙️ Right drag: Pan</div>
        <div>🔍 Scroll: Zoom</div>
      </div>
    </div>
  );
}
