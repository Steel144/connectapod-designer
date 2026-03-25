import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RotateCw, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SiteMap() {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [floorPlanOverlay, setFloorPlanOverlay] = useState(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  // Overlay state
  const [overlayPos, setOverlayPos] = useState({ lat: 0, lng: 0 });
  const [overlayRotation, setOverlayRotation] = useState(0);
  const [overlayScale, setOverlayScale] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [mapZoom, setMapZoom] = useState(16);

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
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=nz&format=json`,
        {
          headers: {
            'User-Agent': 'Connectapod-App (connectapod.com)'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates([parseFloat(lat), parseFloat(lon)]);
        setOverlayPos({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert('Address not found. Try a more specific address (e.g., "123 Main St, City, Country")');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      alert('Failed to geocode address');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') geocodeAddress();
  };

  const handleOverlayMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart || !mapRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Simple drag: move overlay slightly (would need proper lat/lng conversion for real map drag)
    setOverlayPos(prev => ({
      lat: prev.lat + (deltaY * 0.00001),
      lng: prev.lng + (deltaX * 0.00001)
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Generate floor plan canvas overlay
  useEffect(() => {
    if (!design) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header with address input */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Site Address</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter site address (e.g., 123 Main St, City)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={geocodeAddress}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
            </Button>
          </div>
          {coordinates && (
            <div className="mt-2 text-xs text-gray-600">
              📍 {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
            </div>
          )}
        </div>
      </div>

      {/* Map and overlay */}
      <div className="flex-1 relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {coordinates ? (
          <MapContainer
            center={coordinates}
            zoom={16}
            className="w-full h-full"
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              maxZoom={18}
            />
            <Marker position={coordinates}>
              <Popup>Site Location</Popup>
            </Marker>

            {/* Floor plan overlay */}
            {floorPlanOverlay && (
              <div
                ref={overlayRef}
                onMouseDown={handleOverlayMouseDown}
                className="absolute z-40 cursor-grab active:cursor-grabbing"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${overlayRotation}deg) scale(${overlayScale})`,
                  transformOrigin: 'center',
                }}
              >
                <img
                  src={floorPlanOverlay}
                  alt="Floor Plan"
                  className="w-96 h-72 border-2 border-orange-500 rounded shadow-lg pointer-events-none"
                />
              </div>
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <p>Enter an address to view the site map</p>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      {design && (
        <div className="absolute bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-xs">
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
              <label className="text-xs font-semibold text-gray-600 block mb-2">Scale</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={overlayScale}
                  onChange={(e) => setOverlayScale(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-600 w-10 text-right">{(overlayScale * 100).toFixed(0)}%</span>
              </div>
            </div>
            <Button
              onClick={() => setOverlayRotation(0)}
              variant="outline"
              size="sm"
              className="w-full"
              title="Reset rotation"
            >
              <RotateCw className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}