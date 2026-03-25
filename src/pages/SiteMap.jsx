import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect as useMapEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FLOOR_PLAN_SCALE = 0.64; // Adjusted for proper overlay size

export default function SiteMap() {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [floorPlanOverlay, setFloorPlanOverlay] = useState(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  const [mapZoom, setMapZoom] = useState(21);
  const [siteBounds, setSiteBounds] = useState(null);
  const [boundaryInput, setBoundaryInput] = useState('');
  const [overlayRotation, setOverlayRotation] = useState(0);
  const [positionOffset, setPositionOffset] = useState({ lat: 0, lng: 0 });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Rotate position offset by negative rotation to account for map rotation
  const getAdjustedCenter = () => {
    if (!coordinates) return [0, 0];
    const rad = (-overlayRotation * Math.PI) / 180;
    const rotatedLat = positionOffset.lat * Math.cos(rad) - positionOffset.lng * Math.sin(rad);
    const rotatedLng = positionOffset.lat * Math.sin(rad) + positionOffset.lng * Math.cos(rad);
    return [coordinates[0] + rotatedLat, coordinates[1] + rotatedLng];
  };

  // Load address from print details on mount
  useEffect(() => {
    const savedDetails = localStorage.getItem('connectapod_print_details');
    if (savedDetails) {
      try {
        const details = JSON.parse(savedDetails);
        if (details.address) {
          setAddress(details.address);
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=nz&format=json&timeout=10`,
        {
          headers: {
            'User-Agent': 'Connectapod-App (connectapod.com)'
          }
        }
      );
      if (!response.ok) {
        alert('Geocoding service temporarily unavailable. Please try again.');
        return;
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates([parseFloat(lat), parseFloat(lon)]);
        setPositionOffset({ lat: 0, lng: 0 });
      } else {
        alert('Address not found. Try a more specific address (e.g., "123 Main St, City, NZ")');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      alert('Network error. Please check your internet connection and try again.');
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=nz&format=json&limit=5&timeout=10`,
        {
          headers: {
            'User-Agent': 'Connectapod-App (connectapod.com)'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data || []);
      }
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
      {/* Header with address input */}
      <div className="border-b border-gray-200 p-4 bg-gray-50 relative z-[9999]">
        <div className="max-w-2xl mx-auto">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Site Address</label>
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Enter site address (e.g., 123 Main St, City)"
                value={address}
                onChange={handleAddressChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1"
              />
              {address && (
                <button
                  onClick={clearAddress}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 border-b last:border-b-0"
                    >
                      {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={geocodeAddress}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
            </Button>
          </div>
          {coordinates && (
           <>
             <div className="mt-2 text-xs text-gray-600">
               📍 {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
             </div>
             <div className="mt-3">
               <label className="text-sm font-semibold text-gray-700 mb-2 block">Site Boundaries (Optional)</label>
               <div className="flex gap-2">
                 <Input
                   type="text"
                   placeholder="lat1,lng1,lat2,lng2"
                   value={boundaryInput}
                   onChange={(e) => setBoundaryInput(e.target.value)}
                   className="flex-1 text-sm"
                 />
                 <Button
                   onClick={setBoundary}
                   variant="outline"
                   size="sm"
                 >
                   Set
                 </Button>
               </div>
             </div>
           </>
          )}
        </div>
      </div>

      {/* Map and overlay */}
      <div className="flex-1 relative overflow-hidden">
        {coordinates ? (
          <>
            {/* Map behind - rotates and moves */}
            <div className="absolute inset-0" style={{
              transform: `scale(2) rotate(${overlayRotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out'
            }}>
              <MapContainer
                key={`${coordinates[0]}-${coordinates[1]}`}
                center={getAdjustedCenter()}
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
                    transform: `scale(${Math.pow(2, mapZoom - 20) * FLOOR_PLAN_SCALE})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <p>Enter an address to view the site map</p>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      {design && (
        <div className="absolute bottom-4 right-4 z-[9999] bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-xs">
          <div className="space-y-3">

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
            <div>
              <label className="text-xs font-semibold text-gray-600 block">Current Map Zoom:</label>
              <p className="text-sm font-bold text-[#F15A22]">{Math.round(mapZoom)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block">Plan Scale:</label>
              <p className="text-sm font-bold text-[#F15A22]">{(Math.pow(2, mapZoom - 20) * FLOOR_PLAN_SCALE).toFixed(3)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}