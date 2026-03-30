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
  
  // Simple box: 3m wide × 5.2m deep × 2.4m tall
  const boxGeo = new THREE.BoxGeometry(3.0, 2.4, 5.2);
  const box = new THREE.Mesh(boxGeo, materials.cladding1);
  box.position.set(0, 2.4 / 2, 0); // Center at ground level
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);
  
  // GABLE ROOF - 25° pitch, 3m ridge (along the 3m width)
  // Roof slopes along the 5.2m depth dimension
  const roofPitch = 25 * Math.PI / 180;
  const ridgeLength = 3.0; // width of building
  const roofDepth = 5.2; // depth of building
  
  // Peak height calculation: half-width × tan(25°)
  const halfWidth = ridgeLength / 2;
  const peakHeight = halfWidth * Math.tan(roofPitch); // ~0.7m
  
  const overhang = 0.4; // 40cm overhang
  const totalDepth = roofDepth + overhang * 2;
  const totalWidth = ridgeLength + overhang * 2;
  
  // Front roof slope (left side when viewed from front)
  const frontSlopeGeo = new THREE.BufferGeometry();
  const frontVerts = new Float32Array([
    // Bottom edge
    -totalWidth/2, 0, -totalDepth/2,
    -totalWidth/2, 0, totalDepth/2,
    // Ridge (top center)
    0, peakHeight, -totalDepth/2,
    0, peakHeight, totalDepth/2,
  ]);
  
  const frontIndices = new Uint32Array([
    0, 2, 1,
    1, 2, 3
  ]);
  
  frontSlopeGeo.setAttribute('position', new THREE.BufferAttribute(frontVerts, 3));
  frontSlopeGeo.setIndex(new THREE.BufferAttribute(frontIndices, 1));
  frontSlopeGeo.computeVertexNormals();
  
  const frontSlope = new THREE.Mesh(frontSlopeGeo, materials.roof);
  frontSlope.position.y = 2.4; // Top of walls
  frontSlope.castShadow = true;
  group.add(frontSlope);
  
  // Back roof slope (right side when viewed from front)
  const backSlopeGeo = new THREE.BufferGeometry();
  const backVerts = new Float32Array([
    // Bottom edge
    totalWidth/2, 0, -totalDepth/2,
    totalWidth/2, 0, totalDepth/2,
    // Ridge (top center)
    0, peakHeight, -totalDepth/2,
    0, peakHeight, totalDepth/2,
  ]);
  
  const backIndices = new Uint32Array([
    0, 1, 2,
    1, 3, 2
  ]);
  
  backSlopeGeo.setAttribute('position', new THREE.BufferAttribute(backVerts, 3));
  backSlopeGeo.setIndex(new THREE.BufferAttribute(backIndices, 1));
  backSlopeGeo.computeVertexNormals();
  
  const backSlope = new THREE.Mesh(backSlopeGeo, materials.roof);
  backSlope.position.y = 2.4; // Top of walls
  backSlope.castShadow = true;
  group.add(backSlope);
  
  // Gable end triangles (front and back)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-ridgeLength/2, 0);
  gableShape.lineTo(0, peakHeight);
  gableShape.lineTo(ridgeLength/2, 0);
  gableShape.lineTo(-ridgeLength/2, 0);
  
  const gableGeo = new THREE.ShapeGeometry(gableShape);
  
  // Front gable end
  const frontGable = new THREE.Mesh(gableGeo, materials.timber);
  frontGable.position.set(0, 2.4, -roofDepth/2);
  frontGable.castShadow = true;
  group.add(frontGable);
  
  // Back gable end
  const backGable = new THREE.Mesh(gableGeo, materials.timber);
  backGable.position.set(0, 2.4, roofDepth/2);
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
