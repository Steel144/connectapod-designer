import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect as useMapEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Map as MapIcon, ChevronLeft, ZoomIn, ZoomOut, Settings, Eye, LayoutTemplate, FolderOpen, Grid2X2, Image, Save, Undo2, Check, FileText, Printer, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';

const FLOOR_PLAN_SCALE = 0.32; // Adjusted for proper overlay size

export default function SiteMap() {
  const { user } = useAuth();
  const [address, setAddress] = useState(() => {
    try { return localStorage.getItem('sitemap_address') ?? ''; } catch { return ''; }
  });
  const [coordinates, setCoordinates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_coordinates')) ?? null; } catch { return null; }
  });
  // mapCenter is the actual center we pass to leaflet — bakes in the offset
  const [mapCenter, setMapCenter] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_mapCenter')) ?? null; } catch { return null; }
  });
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

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
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

  // Sync mapCenter whenever coordinates or offset change, and persist it
  useEffect(() => {
    if (!coordinates) return;
    const center = [coordinates[0] + positionOffset.lat, coordinates[1] + positionOffset.lng];
    setMapCenter(center);
    localStorage.setItem('sitemap_mapCenter', JSON.stringify(center));
  }, [coordinates, positionOffset]);

  // Persist map state to localStorage
  useEffect(() => { localStorage.setItem('sitemap_mapZoom', JSON.stringify(mapZoom)); }, [mapZoom]);
  useEffect(() => { localStorage.setItem('sitemap_rotation', JSON.stringify(overlayRotation)); }, [overlayRotation]);
  useEffect(() => { localStorage.setItem('sitemap_offset', JSON.stringify(positionOffset)); }, [positionOffset]);
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
        setCoordinates([parseFloat(lat), parseFloat(lon)]);
        setPositionOffset({ lat: 0, lng: 0 });
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

  const handleMapMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMapMouseMove = (e) => {
    if (!isDragging || !dragStart) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Rotate the mouse delta by the map rotation so dragging always
    // moves the map in the direction the mouse moves on screen.
    const rad = (overlayRotation * Math.PI) / 180;
    // At zoom 21, 1 degree ≈ ~74000px on screen. We want ~1px mouse = ~1px map movement.
    // degrees per pixel ≈ 360 / (256 * 2^zoom) = 360 / (256 * 2097152) ≈ 6.7e-9 at zoom 21
    // But we also have scale(2) CSS, so halve it.
    const metersPerPixel = 156543.03392 * Math.cos((coordinates?.[0] ?? 0) * Math.PI / 180) / Math.pow(2, mapZoom);
    const degreesPerPixel = metersPerPixel / 111320;
    const movementScale = degreesPerPixel / 2; // /2 for the CSS scale(2)
    const rotatedDeltaLat = (deltaY * Math.cos(-rad) + deltaX * Math.sin(-rad)) * movementScale;
    const rotatedDeltaLng = (-deltaX * Math.cos(-rad) + deltaY * Math.sin(-rad)) * movementScale;

    setPositionOffset(prev => ({
      lat: prev.lat + rotatedDeltaLat,
      lng: prev.lng + rotatedDeltaLng
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
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
  useEffect(() => {
    if (!design) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Draw simple grid and modules
    if (design.grid && design.grid.length > 0) {
      const minX = Math.min(...design.grid.map(m => m.x));
      const maxX = Math.max(...design.grid.map(m => m.x + m.w));
      const minY = Math.min(...design.grid.map(m => m.y));
      const maxY = Math.max(...design.grid.map(m => m.y + m.h));

      const gridW = maxX - minX;
      const gridH = maxY - minY;
      const scale = Math.min(canvas.width / gridW, canvas.height / gridH) * 0.9;
      const offsetX = (canvas.width - gridW * scale) / 2;
      const offsetY = (canvas.height - gridH * scale) / 2;

      // Draw grid modules
      design.grid.forEach(mod => {
        const x = (mod.x - minX) * scale + offsetX;
        const y = (mod.y - minY) * scale + offsetY;
        const w = mod.w * scale;
        const h = mod.h * scale;

        ctx.fillStyle = mod.color || '#FDF0EB';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = mod.border || '#F15A22';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Module label
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mod.label || mod.type, x + w / 2, y + h / 2);
      });
    }

    setFloorPlanOverlay(canvas.toDataURL());
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
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
      >
        {(coordinates || mapCenter) ? (
        <>
          {/* Map behind - rotates and moves */}
          <div className="absolute inset-0" style={{
            transform: `scale(2) rotate(${overlayRotation}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}>
            <MapContainer
              key={`${(mapCenter || getAdjustedCenter())[0]}-${(mapCenter || getAdjustedCenter())[1]}`}
              center={mapCenter || getAdjustedCenter()}
              zoom={mapZoom}
                className="w-full h-full"
                ref={mapRef}
              >
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
            {floorPlanOverlay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <img 
                  src={floorPlanOverlay} 
                  alt="Floor Plan"
                  style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    objectFit: 'contain',
                    // At zoom 20, ~50m visible width. Scale by zoom level relative to base.
                    transform: `scale(${Math.pow(2, mapZoom - 20) * FLOOR_PLAN_SCALE * planScaleMultiplier})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </div>
            )}
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