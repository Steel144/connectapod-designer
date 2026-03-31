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
  // Create cedar/timber texture for gable ends
  const createCedarTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base cedar color
    ctx.fillStyle = '#C19A6B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Vertical shiplap boards
    const boardWidth = 24;
    for (let x = 0; x < canvas.width; x += boardWidth) {
      // Vary board color slightly for cedar variation
      const colorVariation = Math.random() > 0.5 ? '#D4A574' : '#A8845C';
      ctx.fillStyle = colorVariation;
      ctx.fillRect(x, 0, boardWidth * 0.85, canvas.height);
      
      // Wood grain effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let i = 0; i < 3; i++) {
        const grainY = Math.random() * canvas.height;
        ctx.fillRect(x, grainY, boardWidth * 0.85, 1);
      }
      
      // Shiplap shadow line (right edge overlap)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + boardWidth * 0.88, 0);
      ctx.lineTo(x + boardWidth * 0.88, canvas.height);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    
    return texture;
  };
  
  const cedarTexture = createCedarTexture();
  
  return {
    // Cladding 1 - Vertical metal panels (used on most elevations)
    cladding1: new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.4,
    }),
    
    // Cladding 2 - Feature cladding/timber (darker or contrasting)
    cladding2: new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3,
    }),
    
    // Cedar/Timber for gable ends - natural wood with texture
    timber: new THREE.MeshStandardMaterial({
      map: cedarTexture,
      color: 0xC19A6B,
      roughness: 0.9,
      metalness: 0.0,
    }),
    
    // Glass for windows - more visible
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x88ccee,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      reflectivity: 0.95,
    }),
    
    // Dark metal roof - solid and opaque
    roof: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Darker for better visibility
      roughness: 0.4,
      metalness: 0.6,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1.0,
    }),
    
    // Dark window/door frames
    windowFrame: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.5,
    }),
  };
}

function buildSingleModule(materials, position = { x: 0, y: 0, z: 0 }, customWidth = 3.0, customDepth = 5.2) {
  const group = new THREE.Group();
  
  // Dimensions - use custom if provided, otherwise defaults
  const width = customWidth;
  const depth = customDepth;
  const wallHeight = 2.4;
  const roofPitch = 25 * Math.PI / 180;
  const peakHeight = (depth / 2) * Math.tan(roofPitch);
  
  // Create single unified geometry
  const geo = new THREE.BufferGeometry();
  
  // All vertices for the building
  const vertices = new Float32Array([
    // Base/walls (box) - 8 vertices
    // Bottom 4 corners
    -width/2, 0, -depth/2,        // 0
    width/2, 0, -depth/2,         // 1
    width/2, 0, depth/2,          // 2
    -width/2, 0, depth/2,         // 3
    
    // Top 4 corners (at wall height)
    -width/2, wallHeight, -depth/2,  // 4
    width/2, wallHeight, -depth/2,   // 5
    width/2, wallHeight, depth/2,    // 6
    -width/2, wallHeight, depth/2,   // 7
    
    // Roof ridge (2 vertices at peak)
    -width/2, wallHeight + peakHeight, 0,  // 8
    width/2, wallHeight + peakHeight, 0,   // 9
  ]);
  
  // Triangles for all faces
  const indices = new Uint32Array([
    // Bottom
    0, 2, 1,
    0, 3, 2,
    
    // Front wall
    0, 1, 5,
    0, 5, 4,
    
    // Right wall
    1, 2, 6,
    1, 6, 5,
    
    // Back wall
    2, 3, 7,
    2, 7, 6,
    
    // Left wall
    3, 0, 4,
    3, 4, 7,
    
    // Front roof slope
    4, 5, 9,
    4, 9, 8,
    
    // Back roof slope
    7, 8, 9,
    7, 9, 6,
    
    // Left gable end
    7, 4, 8,
    
    // Right gable end
    5, 6, 9,
  ]);
  
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  
  // Create walls with tray roofing (RIGHT and LEFT walls only)
  const metalWallIndices = new Uint32Array([
    // Bottom
    0, 2, 1,
    0, 3, 2,
    
    // Right wall (metal tray)
    1, 2, 6,
    1, 6, 5,
    
    // Left wall (metal tray)
    3, 0, 4,
    3, 4, 7,
  ]);
  
  const wallsGeo = new THREE.BufferGeometry();
  wallsGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  wallsGeo.setIndex(new THREE.BufferAttribute(metalWallIndices, 1));
  wallsGeo.computeVertexNormals();
  
  const wallsMesh = new THREE.Mesh(wallsGeo, materials.cladding1);
  wallsMesh.castShadow = true;
  wallsMesh.receiveShadow = true;
  group.add(wallsMesh);
  
  // Create FRONT and BACK walls with cedar (entire walls including gables)
  const cedarWallIndices = new Uint32Array([
    // Front wall (cedar)
    0, 1, 5,
    0, 5, 4,
    
    // Back wall (cedar)
    2, 3, 7,
    2, 7, 6,
  ]);
  
  const cedarWallsGeo = new THREE.BufferGeometry();
  cedarWallsGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  cedarWallsGeo.setIndex(new THREE.BufferAttribute(cedarWallIndices, 1));
  cedarWallsGeo.computeVertexNormals();
  
  const cedarWallsMesh = new THREE.Mesh(cedarWallsGeo, materials.timber);
  cedarWallsMesh.castShadow = true;
  cedarWallsMesh.receiveShadow = true;
  group.add(cedarWallsMesh);
  
  // Create roof with metal material
  const roofIndices = new Uint32Array([
    // Front roof slope
    4, 5, 9,
    4, 9, 8,
    
    // Back roof slope
    7, 8, 9,
    7, 9, 6,
  ]);
  
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  roofGeo.setIndex(new THREE.BufferAttribute(roofIndices, 1));
  roofGeo.computeVertexNormals();
  
  const roofMesh = new THREE.Mesh(roofGeo, materials.roof);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);
  
  // Create gable triangles with cedar
  // Left gable end (triangle)
  const leftGableGeo = new THREE.BufferGeometry();
  const leftGableVerts = new Float32Array([
    vertices[21], vertices[22], vertices[23], // vertex 7
    vertices[12], vertices[13], vertices[14], // vertex 4
    vertices[24], vertices[25], vertices[26], // vertex 8
  ]);
  leftGableGeo.setAttribute('position', new THREE.BufferAttribute(leftGableVerts, 3));
  leftGableGeo.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 1, 2]), 1));
  leftGableGeo.computeVertexNormals();
  const leftGable = new THREE.Mesh(leftGableGeo, materials.timber);
  leftGable.castShadow = true;
  leftGable.receiveShadow = true;
  group.add(leftGable);
  
  // Right gable end
  const rightGableGeo = new THREE.BufferGeometry();
  const rightGableVerts = new Float32Array([
    vertices[15], vertices[16], vertices[17], // vertex 5
    vertices[18], vertices[19], vertices[20], // vertex 6
    vertices[27], vertices[28], vertices[29], // vertex 9
  ]);
  rightGableGeo.setAttribute('position', new THREE.BufferAttribute(rightGableVerts, 3));
  rightGableGeo.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 1, 2]), 1));
  rightGableGeo.computeVertexNormals();
  const rightGable = new THREE.Mesh(rightGableGeo, materials.timber);
  rightGable.castShadow = true;
  rightGable.receiveShadow = true;
  group.add(rightGable);
  
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

    // Lighting - brighter so materials are visible
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.4
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2); // Increased from 1.8
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

    // Create tray roofing texture with HIGH CONTRAST for visibility
    const createTrayRoofingTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Background - medium grey (visible base)
      ctx.fillStyle = '#707070';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Vertical trays with HIGH CONTRAST
      const trayWidth = canvas.width / 8;
      
      for (let i = 0; i < 8; i++) {
        const x = i * trayWidth;
        
        // Tray center - light grey (very visible)
        ctx.fillStyle = '#909090';
        ctx.fillRect(x + trayWidth * 0.25, 0, trayWidth * 0.5, canvas.height);
        
        // Left edge (shadow) - dark but not black
        ctx.fillStyle = '#404040';
        ctx.fillRect(x, 0, trayWidth * 0.25, canvas.height);
        
        // Right edge (highlight) - bright
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(x + trayWidth * 0.75, 0, trayWidth * 0.25, canvas.height);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 2);
      
      console.log('✅ Created high-contrast tray texture');
      return texture;
    };
    
    const trayTexture = createTrayRoofingTexture();
    
    // Create a SECOND texture specifically for the roof with horizontal orientation
    const createRoofTrayTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Background - medium grey
      ctx.fillStyle = '#707070';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // HORIZONTAL trays for roof (already oriented correctly)
      const trayHeight = canvas.height / 12; // More trays for roof
      
      for (let i = 0; i < 12; i++) {
        const y = i * trayHeight;
        
        // Tray center - very light
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(0, y + trayHeight * 0.25, canvas.width, trayHeight * 0.5);
        
        // Top edge (shadow)
        ctx.fillStyle = '#505050';
        ctx.fillRect(0, y, canvas.width, trayHeight * 0.25);
        
        // Bottom edge (highlight)
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(0, y + trayHeight * 0.75, canvas.width, trayHeight * 0.25);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 3); // More repeat for roof coverage
      
      console.log('✅ Created horizontal roof tray texture');
      return texture;
    };
    
    const roofTrayTexture = createRoofTrayTexture();

    // Create materials
    const materials = createRealisticMaterials();
    
    // Roof uses horizontal tray texture (pre-oriented)
    materials.roof = new THREE.MeshStandardMaterial({
      map: roofTrayTexture,
      color: 0x909090, // Even lighter for roof visibility
      roughness: 0.4,
      metalness: 0.2,
      side: THREE.DoubleSide,
      emissive: 0x303030, // More emissive for roof
      emissiveIntensity: 0.3,
    });
    
    // Walls use vertical tray texture
    materials.cladding1 = new THREE.MeshStandardMaterial({
      map: trayTexture,
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.3,
      side: THREE.DoubleSide,
      emissive: 0x202020,
      emissiveIntensity: 0.2,
    });

    // Calculate building center
    let buildingCenterX = 0;
    let buildingCenterZ = 0;

    // Build modules - position them correctly to connect
    if (placedModules.length > 0) {
      console.log('🔧 NEW CODE LOADED - Building', placedModules.length, 'modules with FIXED positioning');
      
      placedModules.forEach((module, idx) => {
        // FIXED: Use module's actual grid position (x, y) converted using 0.6m cell size
        // Each grid cell = 0.6m (not 3m!)
        // Module dimensions in grid cells: w (width) × h (height/depth)
        const GRID_CELL_SIZE = 0.6; // meters per grid cell
        
        // Convert grid position to world position
        // Position at module's corner, then add half the actual module size for centering
        const moduleWorldWidth = module.w * GRID_CELL_SIZE;
        const moduleWorldDepth = module.h * GRID_CELL_SIZE;
        
        const modX = module.x * GRID_CELL_SIZE + moduleWorldWidth / 2;
        const modZ = module.y * GRID_CELL_SIZE + moduleWorldDepth / 2;
        
        console.log(`✅ Module ${idx} FIXED POSITIONING:`, { 
          gridX: module.x, 
          gridY: module.y,
          gridW: module.w,
          gridH: module.h,
          worldX: modX, 
          worldZ: modZ,
          worldWidth: moduleWorldWidth,
          worldDepth: moduleWorldDepth,
          boxExtends: `(${modX-moduleWorldWidth/2}, ${modZ-moduleWorldDepth/2}) to (${modX+moduleWorldWidth/2}, ${modZ+moduleWorldDepth/2})`
        });
        
        // Use the actual module size for building, not hardcoded 3m
        const moduleObj = buildSingleModule(materials, { x: modX, y: 0, z: modZ }, moduleWorldWidth, moduleWorldDepth);
        scene.add(moduleObj);
      });
      
      // Render standalone walls with tray roofing cladding (reuse trayTexture from above)
      console.log(`🏗️ Rendering ${walls.length} walls with 600mm tray roofing`);
      
      walls.forEach((wall, idx) => {
        const GRID_CELL_SIZE = 0.6;
        const WALL_HEIGHT = 2.4;
        const WALL_THICKNESS = 0.05;
        
        // Convert grid position to world position
        const wallWorldX = wall.x * GRID_CELL_SIZE;
        const wallWorldZ = wall.y * GRID_CELL_SIZE;
        
        // Determine wall dimensions based on orientation
        let wallWidth, wallDepth;
        if (wall.orientation === 'horizontal' || wall.face === 'W' || wall.face === 'Y') {
          // Horizontal wall (runs along X axis)
          wallWidth = 3.0; // Width of one module
          wallDepth = WALL_THICKNESS;
        } else {
          // Vertical wall (runs along Z axis)
          wallWidth = WALL_THICKNESS;
          wallDepth = 5.2; // Depth of one module
        }
        
        // Create wall geometry
        const wallGeometry = new THREE.BoxGeometry(wallWidth, WALL_HEIGHT, wallDepth);
        
        // Apply tray roofing material
        const wallMaterial = new THREE.MeshStandardMaterial({
          map: trayTexture,
          color: 0x3a3a3a, // Dark grey metal
          roughness: 0.6,
          metalness: 0.5,
        });
        
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        
        // Position wall - centered at grid position + half dimensions
        wallMesh.position.set(
          wallWorldX + wallWidth / 2,
          WALL_HEIGHT / 2,
          wallWorldZ + wallDepth / 2
        );
        
        scene.add(wallMesh);
        
        console.log(`📍 Tray wall ${idx}:`, {
          type: wall.type,
          face: wall.face,
          gridPos: { x: wall.x, y: wall.y },
          worldPos: { x: wallWorldX, z: wallWorldZ },
          dimensions: { w: wallWidth, h: WALL_HEIGHT, d: wallDepth }
        });
      });
      
      // Calculate center of all modules for camera - use new coordinate system
      const GRID_CELL_SIZE = 0.6;
      
      // Average grid position
      const avgGridX = placedModules.reduce((sum, m) => sum + m.x + m.w/2, 0) / placedModules.length;
      const avgGridY = placedModules.reduce((sum, m) => sum + m.y + m.h/2, 0) / placedModules.length;
      
      // Convert to world coordinates
      buildingCenterX = avgGridX * GRID_CELL_SIZE;
      buildingCenterZ = avgGridY * GRID_CELL_SIZE;
      
      console.log('Building center:', { 
        x: buildingCenterX, 
        z: buildingCenterZ,
        avgGridX,
        avgGridY 
      });
    } else {
      // Test with 3 adjacent modules to demonstrate joining
      console.log('No modules in placedModules, showing 3 test modules');
      
      // Module 1 at grid (0, 0) → world center at (1.5, 0, 2.6)
      const testModule1 = buildSingleModule(materials, { x: MODULE_WIDTH / 2, y: 0, z: MODULE_DEPTH / 2 });
      scene.add(testModule1);
      
      // Module 2 at grid (1, 0) → world center at (4.5, 0, 2.6) - joins to the right
      const testModule2 = buildSingleModule(materials, { x: MODULE_WIDTH + MODULE_WIDTH / 2, y: 0, z: MODULE_DEPTH / 2 });
      scene.add(testModule2);
      
      // Module 3 at grid (0, 1) → world center at (1.5, 0, 7.8) - joins to the back
      const testModule3 = buildSingleModule(materials, { x: MODULE_WIDTH / 2, y: 0, z: MODULE_DEPTH + MODULE_DEPTH / 2 });
      scene.add(testModule3);
      
      buildingCenterX = MODULE_WIDTH;
      buildingCenterZ = MODULE_DEPTH;
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
