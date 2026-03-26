import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Map as MapIcon, ChevronLeft, ZoomIn, ZoomOut, Settings, Eye, LayoutTemplate, FolderOpen, Grid2X2, Image, Save, Undo2, Check, FileText, Printer, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';

const CSS_SCALE = 2; // the scale(2) applied to the map wrapper div

function MapDisableDrag() {
  const map = useMap();
  useEffect(() => {
    map.dragging.disable();
  }, [map]);
  return null;
}

function MapSync({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  const prevZoom = useRef(null);
  useEffect(() => {
    if (!center) return;
    const centerChanged = !prevCenter.current ||
      Math.abs(prevCenter.current[0] - center[0]) > 1e-10 ||
      Math.abs(prevCenter.current[1] - center[1]) > 1e-10;
    const zoomChanged = prevZoom.current !== zoom;
    if (centerChanged || zoomChanged) {
      map.setView(center, zoom, { animate: false });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  });
  return null;
}

export default function SiteMap() {
  const { user } = useAuth();
  const [address, setAddress] = useState(() => {
    try { return localStorage.getItem('sitemap_address') ?? ''; } catch { return ''; }
  });
  const [coordinates, setCoordinates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_coordinates')) ?? null; } catch { return null; }
  });
  const [mapKey, setMapKey] = useState(() => localStorage.getItem('sitemap_mapkey') ?? 'default');
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [floorPlanOverlay, setFloorPlanOverlay] = useState(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  const [mapZoom, setMapZoom] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_mapZoom')) ?? 21; } catch { return 21; }
  });
  const [siteBounds, setSiteBounds] = useState(null);
  const [boundaryInput, setBoundaryInput] = useState('');
  const [overlayRotation, setOverlayRotation] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_rotation')) ?? 0; } catch { return 0; }
  });
  const [positionOffset, setPositionOffset] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_offset')) ?? { lat: 0, lng: 0 }; } catch { return { lat: 0, lng: 0 }; }
  });
  const [planScaleMultiplier, setPlanScaleMultiplier] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_scale')) ?? 1; } catch { return 1; }
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isDragging = useRef(false);
  const dragLast = useRef(null);
  const [showLabels, setShowLabels] = useState(true);

  const { data: designs = [] } = useQuery({
    queryKey: ["homeDesigns"],
    queryFn: async () => { try { const r = await base44.entities.HomeDesign.list("-created_date"); return Array.isArray(r) ? r : []; } catch { return []; } },
  });

  // Get map center with position offset applied directly
  const getAdjustedCenter = () => {
    if (!coordinates) return [0, 0];
    return [coordinates[0] + positionOffset.lat, coordinates[1] + positionOffset.lng];
  };



  // Persist map state to localStorage
  useEffect(() => { localStorage.setItem('sitemap_mapZoom', JSON.stringify(mapZoom)); }, [mapZoom]);
  useEffect(() => { localStorage.setItem('sitemap_rotation', JSON.stringify(overlayRotation)); }, [overlayRotation]);
  useEffect(() => {
    localStorage.setItem('sitemap_offset', JSON.stringify(positionOffset));
  }, [positionOffset]);
  useEffect(() => { localStorage.setItem('sitemap_scale', JSON.stringify(planScaleMultiplier)); }, [planScaleMultiplier]);
  useEffect(() => { if (coordinates) localStorage.setItem('sitemap_coordinates', JSON.stringify(coordinates)); }, [coordinates]);
  useEffect(() => { if (address) localStorage.setItem('sitemap_address', address); }, [address]);

  // Load address from print details on mount and auto-geocode (only if no saved coordinates)
  useEffect(() => {
    // If we already have coordinates from localStorage, skip geocoding
    const savedCoords = localStorage.getItem('sitemap_coordinates');
    if (savedCoords) return;

    const savedDetails = localStorage.getItem('connectapod_print_details');
    if (savedDetails) {
      try {
        const details = JSON.parse(savedDetails);
        if (details.address) {
          setAddress(details.address);
          setLoading(true);
          base44.functions.invoke('geocodeAddress', { query: details.address, limit: 1 })
            .then(response => {
              const data = response.data.results;
              if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setCoordinates([parseFloat(lat), parseFloat(lon)]);
              }
            })
            .catch(err => console.error('Auto-geocoding error:', err))
            .finally(() => setLoading(false));
        }
      } catch (err) {
        console.error('Failed to load saved address:', err);
      }
    }
  }, []);

  // Load most recent design
  useEffect(() => {
    const loadDesign = async () => {
      try {
        const designs = await base44.entities.HomeDesign.list('-updated_date', 1);
        if (designs.length > 0) {
          setDesign(designs[0]);
          if (coordinates) {
            setOverlayPos({ lat: coordinates[0], lng: coordinates[1] });
          }
        }
      } catch (err) {
        console.error('Failed to load design:', err);
      }
    };
    loadDesign();
  }, [coordinates]);

  const geocodeAddress = async () => {
    if (!address.trim()) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('geocodeAddress', {
        query: address,
        limit: 1
      });
      const data = response.data.results;
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords = [parseFloat(lat), parseFloat(lon)];
        setCoordinates(newCoords);
        setPositionOffset({ lat: 0, lng: 0 });
        const newKey = `${lat}-${lon}`;
        setMapKey(newKey);
        localStorage.setItem('sitemap_mapkey', newKey);
      } else {
        alert('Address not found. Try a more specific address (e.g., "123 Main St, City, NZ")');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      alert('Geocoding service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') geocodeAddress();
  };

  const fetchAddressSuggestions = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await base44.functions.invoke('geocodeAddress', {
        query: query,
        limit: 5
      });
      setSuggestions(response.data.results || []);
    } catch (err) {
      console.error('Autocomplete error:', err);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    fetchAddressSuggestions(value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion) => {
    setAddress(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const clearAddress = () => {
    setAddress('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const setBoundary = () => {
    if (!boundaryInput.trim()) return;
    try {
      // Parse input as "lat1,lng1,lat2,lng2" for rectangle bounds
      const parts = boundaryInput.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 4 && parts.every(p => !isNaN(p))) {
        setSiteBounds([[parts[0], parts[1]], [parts[2], parts[3]]]);
      } else {
        alert('Please enter bounds as: lat1,lng1,lat2,lng2');
      }
    } catch (err) {
      alert('Invalid bounds format');
    }
  };

  // Manual drag handlers on the outer wrapper.
  // Mouse deltas are in screen-space. The map div has scale(CSS_SCALE) and rotate(overlayRotation).
  // To convert screen px → map-north-up px: divide by CSS_SCALE, then un-rotate.
  const handleDragStart = (e) => {
    isDragging.current = true;
    dragLast.current = { x: e.clientX, y: e.clientY };
  };

  const handleDragMove = (e) => {
    if (!isDragging.current || !dragLast.current || !mapRef.current || !coordinates) return;

    const dx = e.clientX - dragLast.current.x;
    const dy = e.clientY - dragLast.current.y;
    dragLast.current = { x: e.clientX, y: e.clientY };

    // Un-scale: screen px → map container px
    const mx = dx / CSS_SCALE;
    const my = dy / CSS_SCALE;

    // Un-rotate: map container px → north-up map px
    const rad = (overlayRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const npx = mx * cos + my * sin;
    const npy = -mx * sin + my * cos;

    // Translate using Leaflet's project/unproject
    const map = mapRef.current;
    const center = map.getCenter();
    const centerPx = map.project(center, mapZoom);
    const newLatLng = map.unproject(
      L.point(centerPx.x - npx, centerPx.y - npy),
      mapZoom
    );

    setPositionOffset({
      lat: newLatLng.lat - coordinates[0],
      lng: newLatLng.lng - coordinates[1],
    });
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    dragLast.current = null;
  };



  // Calculate design dimensions in meters
  const getDesignDimensions = () => {
    if (!design || !design.grid || design.grid.length === 0) return null;
    const minX = Math.min(...design.grid.map(m => m.x));
    const maxX = Math.max(...design.grid.map(m => m.x + m.w));
    const minY = Math.min(...design.grid.map(m => m.y));
    const maxY = Math.max(...design.grid.map(m => m.y + m.h));
    return { width: maxX - minX, height: maxY - minY, minX, minY };
  };

  // Update zoom from map instance
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    // Set initial zoom from map
    setMapZoom(map._zoom);
    const handleZoom = () => {
      setMapZoom(map._zoom);
    };
    map.on('zoom', handleZoom);
    return () => map.off('zoom', handleZoom);
  }, [mapRef.current]);

  // Generate floor plan canvas overlay
  // Canvas is drawn at CANVAS_PX_PER_CELL pixels per grid cell so the image
  // has a known, fixed pixel-per-metre ratio we can use for geo-scaling.
  const CANVAS_PX_PER_CELL = 20; // pixels per grid cell (1 cell = 0.6 m)
  const CELL_M = 0.6; // metres per grid cell

  useEffect(() => {
    if (!design || !design.grid || design.grid.length === 0) return;

    const minX = Math.min(...design.grid.map(m => m.x));
    const maxX = Math.max(...design.grid.map(m => m.x + m.w));
    const minY = Math.min(...design.grid.map(m => m.y));
    const maxY = Math.max(...design.grid.map(m => m.y + m.h));

    const gridCellsW = maxX - minX;
    const gridCellsH = maxY - minY;

    const canvas = document.createElement('canvas');
    canvas.width = gridCellsW * CANVAS_PX_PER_CELL;
    canvas.height = gridCellsH * CANVAS_PX_PER_CELL;
    const ctx = canvas.getContext('2d');

    const drawModule = (mod, img) => {
      const x = (mod.x - minX) * CANVAS_PX_PER_CELL;
      const y = (mod.y - minY) * CANVAS_PX_PER_CELL;
      const w = mod.w * CANVAS_PX_PER_CELL;
      const h = mod.h * CANVAS_PX_PER_CELL;

      ctx.fillStyle = mod.color || '#FDF0EB';
      ctx.fillRect(x, y, w, h);

      if (img) {
        ctx.drawImage(img, x, y, w, h);
      }

      ctx.strokeStyle = mod.border || '#F15A22';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
    };

    const loadImageForMod = (mod) => new Promise((resolve) => {
      if (!mod.floorPlanImage) { resolve({ mod, img: null }); return; }
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ mod, img });
      img.onerror = () => resolve({ mod, img: null });
      img.src = mod.floorPlanImage;
    });

    Promise.all(design.grid.map(loadImageForMod)).then((results) => {
      // Draw walls first (background layer)
       if (design.walls && design.walls.length > 0) {
         design.walls.forEach(wall => {
           // Use wall position if available, otherwise estimate from orientation/length
           const hasCoords = wall.x !== undefined && wall.y !== undefined;
           if (!hasCoords) return;

           const x = (wall.x - minX) * CANVAS_PX_PER_CELL;
           const y = (wall.y - minY) * CANVAS_PX_PER_CELL;

           // Calculate width and height based on orientation and dimensions
           let w, h;
           if (wall.orientation === 'horizontal') {
             w = (wall.length || wall.width / 1000 || 1) * CANVAS_PX_PER_CELL;
             h = (wall.thickness || 0.15) * CANVAS_PX_PER_CELL;
           } else {
             w = (wall.thickness || 0.15) * CANVAS_PX_PER_CELL;
             h = (wall.length || wall.height / 1000 || 1) * CANVAS_PX_PER_CELL;
           }

           ctx.save();
           ctx.translate(x + w / 2, y + h / 2);
           if (wall.rotation) ctx.rotate((wall.rotation * Math.PI) / 180);
           if (wall.flipped) ctx.scale(-1, 1);
           ctx.translate(-w / 2, -h / 2);

           ctx.fillStyle = '#A0A0A0';
           ctx.fillRect(0, 0, w, h);
           ctx.strokeStyle = '#666666';
           ctx.lineWidth = 0.5;
           ctx.strokeRect(0, 0, w, h);

           ctx.restore();
         });
       }
      
      // Draw modules (foreground layer)
      results.forEach(({ mod, img }) => {
        const x = (mod.x - minX) * CANVAS_PX_PER_CELL;
        const y = (mod.y - minY) * CANVAS_PX_PER_CELL;
        const w = mod.w * CANVAS_PX_PER_CELL;
        const h = mod.h * CANVAS_PX_PER_CELL;

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        if (mod.rotation) ctx.rotate((mod.rotation * Math.PI) / 180);
        if (mod.flipped) ctx.scale(-1, 1);
        ctx.translate(-w / 2, -h / 2);

        ctx.fillStyle = mod.color || '#FDF0EB';
        ctx.fillRect(0, 0, w, h);
        if (img) ctx.drawImage(img, 0, 0, w, h);

        ctx.restore();
      });

      // Draw furniture (top layer)
      if (design.furniture && design.furniture.length > 0) {
        design.furniture.forEach(furn => {
          if (!furn.x || !furn.y || !furn.width || !furn.depth) return;

          const x = (furn.x - minX) * CANVAS_PX_PER_CELL;
          const y = (furn.y - minY) * CANVAS_PX_PER_CELL;
          const w = furn.width * CANVAS_PX_PER_CELL;
          const h = furn.depth * CANVAS_PX_PER_CELL;

          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          if (furn.rotation) ctx.rotate((furn.rotation * Math.PI) / 180);
          ctx.translate(-w / 2, -h / 2);

          ctx.fillStyle = '#8B6F47';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#5D4E37';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(0, 0, w, h);

          ctx.restore();
        });
      }
      
      setFloorPlanOverlay(canvas.toDataURL());
    });
  }, [design]);

  // Calculate overlay bounds based on design dimensions
  const getOverlayBounds = () => {
    if (!coordinates || !design) return null;
    const dims = getDesignDimensions();
    if (!dims) return null;
    
    // Convert meters to approximate degrees (rough conversion for display)
    // 1 degree ≈ 111 km at equator
    const latDelta = (dims.height / 1000) / 111;
    const lngDelta = (dims.width / 1000) / 111;
    
    const lat = coordinates[0];
    const lng = coordinates[1];
    
    return [
      [lat + latDelta / 2, lng - lngDelta / 2],
      [lat - latDelta / 2, lng + lngDelta / 2]
    ];
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* ── TOP BAR ── */}
      <div className="flex items-center px-4 py-4 bg-white border-b border-gray-200 overflow-x-auto gap-4 min-w-0 z-30">
        <div className="shrink-0 flex flex-col gap-0.5">
          <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" style={{ height: "25px", width: "auto" }} />
          <span className="text-[10px] text-gray-400 tracking-widest uppercase">Site Map</span>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Design Catalogue dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#F15A22] text-white hover:bg-[#d94e1a] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" }}>
                <LayoutTemplate size={13} /> Design Catalogue
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link to="/DesignCatalogue" className="flex items-center gap-2 cursor-pointer">
                  <LayoutTemplate size={13} /> Starter Designs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button className="w-full text-left flex items-center gap-2 cursor-pointer">
                  <FolderOpen size={13} /> My Designs {designs.length > 0 && `(${designs.length})`}
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2D / Elevations / Save / Estimate / Print buttons */}
          <div className="flex border border-gray-200 overflow-hidden">
            <Link to="/Configurator" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 hover:text-[#F15A22] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              <Grid2X2 size={13} /> 2D
            </Link>
            <Link to="/Configurator" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 hover:text-[#F15A22] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              <Image size={13} /> Elevations
            </Link>
            <Link to="/Configurator" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              <Save size={13} /> Save
            </Link>
            <Link to="/Configurator" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              Get Estimate
            </Link>
            <Link to="/Configurator" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)" }}>
              <Printer size={13} /> Print
            </Link>
          </div>

          {/* Site Map (current) */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 border border-gray-200 border-[#F15A22] text-[#F15A22] transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" }}>
            <MapIcon size={13} /> Site Map
          </button>

          {/* Undo button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] disabled:opacity-30 transition-all" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" }}>
            <Undo2 size={13} /> Undo
          </button>

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] border border-gray-200 bg-white hover:border-[#F15A22] transition-all">
                <Settings size={13} /> Settings
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowLabels(v => !v)} className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2"><Eye size={13} /> Show Labels</span>
                {showLabels && <Check size={12} className="text-[#F15A22]" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Zoom controls */}
          <div className="flex border border-gray-200 overflow-hidden">
            <button onClick={() => setMapZoom(z => Math.max(10, z - 1))} title="Zoom out" className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] transition-all">
              <ZoomOut size={13} />
            </button>
            <button onClick={() => setMapZoom(21)} title="Reset zoom" className="px-2 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#F15A22] transition-all min-w-12">
              100%
            </button>
            <button onClick={() => setMapZoom(z => Math.min(22, z + 1))} title="Zoom in" className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#F15A22] transition-all">
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Admin dropdown */}
          {user?.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 border border-red-700 transition-all">
                  ⚙ Admin
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/Catalogue" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen size={13} /> Floor Catalogue
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/WallCatalogue" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen size={13} /> Wall Catalogue
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        </div>
      </div>



      {/* Map and overlay */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {coordinates ? (
        <>
          {/* Map behind - rotates and moves */}
          <div className="absolute inset-0" style={{
            transform: `scale(2) rotate(${overlayRotation}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}>
            <MapContainer
              key={mapKey}
              center={getAdjustedCenter()}
              zoom={mapZoom}
              className="w-full h-full"
              ref={mapRef}
            >
              <MapSync center={getAdjustedCenter()} zoom={mapZoom} />
              <MapDisableDrag />
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; Esri, DigitalGlobe, Earthstar Geographics'
                  maxZoom={22}
                />
                <Marker position={coordinates}>
                  <Popup>Site Location</Popup>
                </Marker>

                {siteBounds && (
                  <Rectangle
                    bounds={siteBounds}
                    pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, fill: true, fillOpacity: 0.1 }}
                  />
                )}
              </MapContainer>
            </div>

            {/* Floor plan fixed in center - on top */}
            {floorPlanOverlay && design?.grid?.length > 0 && (() => {
              // Physical size of the design in metres
              const minX = Math.min(...design.grid.map(m => m.x));
              const maxX = Math.max(...design.grid.map(m => m.x + m.w));
              const minY = Math.min(...design.grid.map(m => m.y));
              const maxY = Math.max(...design.grid.map(m => m.y + m.h));
              const designMetresW = (maxX - minX) * CELL_M;
              const designMetresH = (maxY - minY) * CELL_M;

              // At Leaflet zoom Z, 1 metre = 2^Z / (111320 * cos(lat)) pixels
              // Simplified: at zoom 20 at ~45° lat, 1m ≈ 0.268px. We use equator approx.
              const METRES_PER_PX_AT_ZOOM0 = 78271.52; // metres per pixel at zoom 0 (equator), halved to account for CSS_SCALE=2 map wrapper
              const lat = coordinates ? coordinates[0] : 0;
              const metresToPx = Math.pow(2, mapZoom) / (METRES_PER_PX_AT_ZOOM0 * Math.cos(lat * Math.PI / 180));

              // The canvas was drawn at CANVAS_PX_PER_CELL / CELL_M px per metre
              // We need to scale it so 1 canvas px = metresToPx screen px / (CANVAS_PX_PER_CELL / CELL_M)
              const canvasPxPerMetre = CANVAS_PX_PER_CELL / CELL_M;
              const cssScale = (metresToPx / canvasPxPerMetre) * planScaleMultiplier;

              return (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <img
                    src={floorPlanOverlay}
                    alt="Floor Plan"
                    style={{
                      width: `${(maxX - minX) * CANVAS_PX_PER_CELL}px`,
                      height: `${(maxY - minY) * CANVAS_PX_PER_CELL}px`,
                      transform: `scale(${cssScale})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.1s ease-out',
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>
              );
            })()}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <p>Enter a site address in the panel to view the map</p>
          </div>
        )}
      </div>

      {/* Floating Config Panel */}
      {design && (
        <div className="absolute bottom-4 right-4 z-[9999] bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-xs space-y-4">
          {/* Address Section */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Site Address</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Enter site address"
                  value={address}
                  onChange={handleAddressChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowSuggestions(true)}
                  className="text-xs"
                />
                {address && (
                  <button
                    onClick={clearAddress}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 text-xs text-gray-700 border-b last:border-b-0"
                      >
                        {suggestion.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={geocodeAddress}
                disabled={loading}
                className="px-2 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
              </button>
            </div>
            {coordinates && (
              <p className="text-xs text-gray-600 mt-1">
                📍 {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
              </p>
            )}
          </div>

          {/* Boundaries Section */}
          {coordinates && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">Site Boundaries</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="lat1,lng1,lat2,lng2"
                  value={boundaryInput}
                  onChange={(e) => setBoundaryInput(e.target.value)}
                  className="flex-1 text-xs"
                />
                <button
                  onClick={setBoundary}
                  className="px-2 py-1.5 text-xs border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all rounded"
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {/* Rotation Section */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Rotation</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={overlayRotation}
                onChange={(e) => setOverlayRotation(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-8 text-right">{overlayRotation}°</span>
            </div>
          </div>

          {/* Plan Scale Section */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Plan Scale</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={planScaleMultiplier}
                onChange={(e) => setPlanScaleMultiplier(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-10 text-right">{planScaleMultiplier.toFixed(1)}x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}