import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Convert module placement to 3D representation
function Module3D({ module, position }) {
  const width = module.width || 3.0;
  const depth = module.depth || 3.0;
  const height = 2.7; // Standard ceiling height in meters
  
  // Color coding by module type
  const colorMap = {
    Living: '#FFA726',
    Bedroom: '#66BB6A',
    Bathroom: '#42A5F5',
    Kitchen: '#EF5350',
    Connection: '#AB47BC',
    Deck: '#8D6E63',
    Laundry: '#26C6DA',
  };
  
  const color = colorMap[module.category] || '#9E9E9E';
  
  return (
    <group position={position}>
      {/* Main structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      
      {/* Outline edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#1a1a1a" linewidth={2} />
      </lineSegments>
      
      {/* Label (simplified) */}
      <mesh position={[0, height / 2 + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.8, depth * 0.8]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>
    </group>
  );
}

function Ground() {
  return (
    <>
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d9d9d"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  );
}

export default function Viewer3D({ placedModules }) {
  // Convert 2D grid positions to 3D world coordinates
  const modules3D = useMemo(() => {
    if (!placedModules || placedModules.length === 0) return [];
    
    return placedModules.map((module) => {
      // Assuming grid units are in meters
      const x = (module.x || 0) + (module.width || 3) / 2;
      const z = (module.y || 0) + (module.depth || 3) / 2;
      const y = (2.7) / 2; // Half height to center vertically
      
      return {
        module,
        position: [x, y, z]
      };
    });
  }, [placedModules]);

  const totalArea = useMemo(() => {
    return placedModules.reduce((sum, m) => sum + (m.sqm || 0), 0);
  }, [placedModules]);

  if (placedModules.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <p className="text-gray-600 text-lg font-medium">No modules placed yet</p>
          <p className="text-gray-400 text-sm mt-2">Add modules in 2D view to see them in 3D</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-100 to-gray-200">
      {/* Info overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-3 shadow-lg border border-gray-200">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">3D View</div>
        <div className="text-sm font-semibold text-gray-800">
          {placedModules.length} Module{placedModules.length !== 1 ? 's' : ''} • {totalArea.toFixed(1)}m²
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-sm px-3 py-2 text-white text-xs">
        <div>🖱️ Left-click + drag: Rotate</div>
        <div>⚙️ Right-click + drag: Pan</div>
        <div>🔍 Scroll: Zoom</div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <hemisphereLight intensity={0.3} groundColor="#444444" />

        {/* Environment */}
        <Environment preset="city" />
        
        {/* Ground grid */}
        <Ground />
        
        {/* Render all modules */}
        {modules3D.map((item, idx) => (
          <Module3D key={idx} module={item.module} position={item.position} />
        ))}
        
        {/* Camera controls */}
        <OrbitControls
          makeDefault
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
