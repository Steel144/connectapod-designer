import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.wms';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import html2canvas from 'html2canvas';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const CSS_SCALE = 2;
const CANVAS_PX_PER_CELL = 20;
const CELL_M = 0.6;

// Component to add WMS layers to the map
function WMSLayer({ url, layers, format = 'image/png', transparent = true, opacity = 0.7, attribution = 'LINZ' }) {
  const map = useMap();
  
  useEffect(() => {
    const wmsLayer = L.tileLayer.wms(url, {
      layers: layers,
      format: format,
      transparent: transparent,
      opacity: opacity,
      attribution: attribution,
      version: '1.1.1',
      maxZoom: 21,
    });
    
    wmsLayer.addTo(map);
    
    return () => {
      map.removeLayer(wmsLayer);
    };
  }, [map, url, layers, format, transparent, opacity, attribution]);
  
  return null;
}

function MapControlHandler({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    map.dragging.disable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on('zoom', handleZoom);
    return () => map.off('zoom', handleZoom);
  }, [map, onZoomChange]);
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

function MapRefCapture({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map]);
  return null;
}

export default function SiteMapView({ design, siteAddress, setSiteAddress, coordinates, setCoordinates, saveDetails, setSaveDetails, onFloorPlanRendered, onScreenshotReady }) {
  const [mapKey, setMapKey] = useState(() => localStorage.getItem('sitemap_mapkey') ?? 'default');
  const [loading, setLoading] = useState(false);
  const [floorPlanOverlay, setFloorPlanOverlay] = useState(null);
  const floorPlanOverlayRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  
  // Layer toggles
  const [showBoundaries, setShowBoundaries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_showBoundaries')) ?? true; } catch { return true; }
  });
  const [showParcels, setShowParcels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_showParcels')) ?? false; } catch { return false; }
  });
  
  // Property boundary from LINZ
  const [propertyBoundary, setPropertyBoundary] = useState(null);
  const [boundaryLoading, setBoundaryLoading] = useState(false);

  const [mapZoom, setMapZoom] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_mapZoom')) ?? 21; } catch { return 21; }
  });
  const [overlayRotation, setOverlayRotation] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_rotation')) ?? 0; } catch { return 0; }
  });
  const [positionOffset, setPositionOffset] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_offset')) ?? { lat: 0, lng: 0 }; } catch { return { lat: 0, lng: 0 }; }
  });
  const [planScaleMultiplier] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_scale')) ?? 1; } catch { return 1; }
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isDragging = useRef(false);
  const dragLast = useRef(null);
  const panelDragging = useRef(false);
  const panelDragLast = useRef(null);
  const [panelPosition, setPanelPosition] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sitemap_panelPos')) ?? { top: 'auto', right: 16, bottom: 16, left: 'auto' }; } catch { return { top: 'auto', right: 16, bottom: 16, left: 'auto' }; }
  });

  // Persist state
  useEffect(() => { localStorage.setItem('sitemap_mapZoom', JSON.stringify(mapZoom)); }, [mapZoom]);
  useEffect(() => { localStorage.setItem('sitemap_rotation', JSON.stringify(overlayRotation)); }, [overlayRotation]);
  useEffect(() => { localStorage.setItem('sitemap_offset', JSON.stringify(positionOffset)); }, [positionOffset]);
  useEffect(() => { if (coordinates) localStorage.setItem('sitemap_coordinates', JSON.stringify(coordinates)); }, [coordinates]);
  useEffect(() => { if (siteAddress) localStorage.setItem('sitemap_address', siteAddress); }, [siteAddress]);
  useEffect(() => { localStorage.setItem('sitemap_panelPos', JSON.stringify(panelPosition)); }, [panelPosition]);
  useEffect(() => { localStorage.setItem('sitemap_showBoundaries', JSON.stringify(showBoundaries)); }, [showBoundaries]);
  useEffect(() => { localStorage.setItem('sitemap_showParcels', JSON.stringify(showParcels)); }, [showParcels]);

  const getAdjustedCenter = () => {
    if (!coordinates) return [0, 0];
    return [coordinates[0] + positionOffset.lat, coordinates[1] + positionOffset.lng];
  };

  // Generate floor plan canvas
  useEffect(() => {
    if (!design || !design.grid || design.grid.length === 0) return;

    let minX = Math.min(...design.grid.map(m => m.x));
    let maxX = Math.max(...design.grid.map(m => m.x + m.w));
    let minY = Math.min(...design.grid.map(m => m.y));
    let maxY = Math.max(...design.grid.map(m => m.y + m.h));

    if (design.walls) {
      design.walls.forEach(wall => {
        if (wall.x !== undefined && wall.y !== undefined) {
          minX = Math.min(minX, wall.x);
          minY = Math.min(minY, wall.y);
          if (wall.orientation === 'horizontal') {
            maxX = Math.max(maxX, wall.x + (wall.length || wall.width / 1000 || 1));
            maxY = Math.max(maxY, wall.y + (wall.thickness || 0.15));
          } else {
            maxX = Math.max(maxX, wall.x + (wall.thickness || 0.15));
            maxY = Math.max(maxY, wall.y + (wall.length || wall.height / 1000 || 1));
          }
        }
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = (maxX - minX) * CANVAS_PX_PER_CELL;
    canvas.height = (maxY - minY) * CANVAS_PX_PER_CELL;
    const ctx = canvas.getContext('2d');

    const loadImg = (mod) => new Promise((resolve) => {
      if (!mod.floorPlanImage) { resolve({ mod, img: null }); return; }
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ mod, img });
      img.onerror = () => resolve({ mod, img: null });
      img.src = mod.floorPlanImage;
    });

    Promise.all(design.grid.map(loadImg)).then((results) => {
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        if (img) ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
      });

      const dataUrl = canvas.toDataURL();
      floorPlanOverlayRef.current = dataUrl;
      setFloorPlanOverlay(dataUrl);
      if (onFloorPlanRendered) onFloorPlanRendered(dataUrl);
    });
  }, [design]);

  // Capture the map by screenshotting the actual visible map container
  const captureMapScreenshot = useCallback(async () => {
    if (!mapContainerRef.current) return null;
    const canvas = await html2canvas(mapContainerRef.current, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: false,
      foreignObjectRendering: false,
      ignoreElements: (el) => el.classList?.contains('sitemap-control-panel'),
    });
    return canvas.toDataURL('image/png');
  }, []);

  // Expose screenshot capture to parent
  useEffect(() => {
    if (onScreenshotReady) onScreenshotReady(captureMapScreenshot);
  }, [captureMapScreenshot, onScreenshotReady]);

  // Fetch property boundary from LINZ
  const fetchPropertyBoundary = async (lat, lon) => {
    setBoundaryLoading(true);
    try {
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(
        `${API_URL}/api/linz/property-boundary?lat=${lat}&lon=${lon}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.geojson) {
          setPropertyBoundary(data.geojson);
          toast.success('Property boundary loaded');
        } else {
          setPropertyBoundary(null);
          toast.info('No property boundary found at this location');
        }
      } else {
        throw new Error('Failed to fetch boundary');
      }
    } catch (err) {
      console.error('[SiteMapView] Property boundary error:', err);
      setPropertyBoundary(null);
      toast.error('Could not load property boundary');
    } finally {
      setBoundaryLoading(false);
    }
  };

  const geocodeAddress = async () => {
    if (!siteAddress.trim()) {
      toast.error('Please enter an address first');
      return;
    }
    
    setLoading(true);
    try {
      // Use Nominatim API directly
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(siteAddress)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=1` +
        `&countrycodes=nz`,
        {
          headers: {
            'User-Agent': 'Connectapod/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newCoords = [parseFloat(lat), parseFloat(lon)];
          setCoordinates(newCoords);
          setPositionOffset({ lat: 0, lng: 0 });
          const newKey = `${lat}-${lon}`;
          setMapKey(newKey);
          localStorage.setItem('sitemap_mapkey', newKey);
          toast.success('Location found!');
          
          // Fetch property boundary from LINZ if enabled
          if (showBoundaries) {
            fetchPropertyBoundary(parseFloat(lat), parseFloat(lon));
          }
        } else {
          toast.error('Address not found. Try a more specific address.');
        }
      } else {
        throw new Error(`Nominatim error: ${response.status}`);
      }
    } catch (err) {
      console.error('[SiteMapView] Geocoding error:', err);
      toast.error('Geocoding service error. Please try again in a minute.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddressSuggestions = async (query) => {
    if (!query.trim() || query.length < 3) { 
      setSuggestions([]); 
      return; 
    }
    
    try {
      // Use Nominatim API directly
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=8` +
        `&countrycodes=nz` +
        `&accept-language=en`,
        {
          headers: {
            'User-Agent': 'Connectapod/1.0',
            'Accept-Language': 'en'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data || []);
      } else {
        console.error('[SiteMapView] Nominatim error:', response.status);
        setSuggestions([]);
      }
    } catch (err) {
      console.error('[SiteMapView] Autocomplete error:', err);
      setSuggestions([]);
    }
  };

  const handleAddressChange = (e) => {
    setSiteAddress(e.target.value);
    fetchAddressSuggestions(e.target.value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (s) => {
    setSiteAddress(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDragStart = (e) => {
    isDragging.current = true;
    dragLast.current = { x: e.clientX, y: e.clientY };
  };

  const handleDragMove = (e) => {
    if (!isDragging.current || !dragLast.current || !mapRef.current || !coordinates) return;
    const dx = e.clientX - dragLast.current.x;
    const dy = e.clientY - dragLast.current.y;
    dragLast.current = { x: e.clientX, y: e.clientY };
    const mx = dx / CSS_SCALE;
    const my = dy / CSS_SCALE;
    const rad = (overlayRotation * Math.PI) / 180;
    const npx = mx * Math.cos(rad) + my * Math.sin(rad);
    const npy = -mx * Math.sin(rad) + my * Math.cos(rad);
    const map = mapRef.current;
    const center = map.getCenter();
    const centerPx = map.project(center, mapZoom);
    const newLatLng = map.unproject(L.point(centerPx.x - npx, centerPx.y - npy), mapZoom);
    setPositionOffset({ lat: newLatLng.lat - coordinates[0], lng: newLatLng.lng - coordinates[1] });
  };

  const handleDragEnd = () => { isDragging.current = false; dragLast.current = null; };

  const handlePanelDragStart = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    panelDragging.current = true;
    panelDragLast.current = { x: e.clientX, y: e.clientY };
  };

  const handlePanelDragMove = (e) => {
    if (!panelDragging.current || !panelDragLast.current) return;
    const dx = e.clientX - panelDragLast.current.x;
    const dy = e.clientY - panelDragLast.current.y;
    panelDragLast.current = { x: e.clientX, y: e.clientY };
    setPanelPosition(prev => ({
      top: prev.top === 'auto' ? 'auto' : prev.top + dy,
      right: prev.right === 'auto' ? 'auto' : prev.right - dx,
      bottom: prev.bottom === 'auto' ? 'auto' : prev.bottom - dy,
      left: prev.left === 'auto' ? 'auto' : prev.left + dx,
    }));
  };

  const handlePanelDragEnd = () => { panelDragging.current = false; panelDragLast.current = null; };

  // Overlay scale
  const getFloorPlanScale = () => {
    if (!coordinates) return 1;
    const METRES_PER_PX_AT_ZOOM0 = 78271.52;
    const lat = coordinates[0];
    const metresToPx = Math.pow(2, mapZoom) / (METRES_PER_PX_AT_ZOOM0 * Math.cos(lat * Math.PI / 180));
    const canvasPxPerMetre = CANVAS_PX_PER_CELL / CELL_M;
    return (metresToPx / canvasPxPerMetre) * planScaleMultiplier;
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <div
        ref={mapContainerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {coordinates ? (
          <>
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
                zoomControl={false}
              >
                <MapRefCapture mapRef={mapRef} />
                <MapSync center={getAdjustedCenter()} zoom={mapZoom} />
                <MapControlHandler onZoomChange={setMapZoom} />
                {/* LINZ Aerial Imagery for New Zealand */}
                <TileLayer
                  url="https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp?api=d01ev1qyt8bknf8m9z573x3xvhd"
                  attribution='&copy; <a href="https://data.linz.govt.nz">LINZ</a>'
                  maxZoom={21}
                  crossOrigin="anonymous"
                />
                
                {/* LINZ Property Boundaries via WMTS tile proxy */}
                {showBoundaries && (
                  <TileLayer
                    url={`${import.meta.env.VITE_BACKEND_URL || ''}/api/linz/wmts-tile/{z}/{x}/{y}`}
                    opacity={0.7}
                    maxZoom={21}
                    attribution="LINZ"
                  />
                )}
                
                
                <ZoomControl position="bottomright" />
                <CircleMarker center={coordinates} radius={8} pathOptions={{ color: '#F15A22', fillColor: '#F15A22', fillOpacity: 1 }}>
                  <Popup>Site Location</Popup>
                </CircleMarker>
              </MapContainer>
            </div>

            {floorPlanOverlay && design?.grid?.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 9999 }}>
                <img
                  src={floorPlanOverlay}
                  alt="Floor Plan"
                  style={{
                    transform: `scale(${getFloorPlanScale()})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.1s ease-out',
                    imageRendering: 'pixelated',
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
        <div
          className="sitemap-control-panel fixed z-[9999] bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-xs space-y-4 cursor-move select-none font-heading"
          style={{
            top: panelPosition.top === 'auto' ? 'auto' : `${panelPosition.top}px`,
            right: panelPosition.right === 'auto' ? 'auto' : `${panelPosition.right}px`,
            bottom: panelPosition.bottom === 'auto' ? 'auto' : `${panelPosition.bottom}px`,
            left: panelPosition.left === 'auto' ? 'auto' : `${panelPosition.left}px`,
          }}
          onMouseDown={handlePanelDragStart}
          onMouseMove={handlePanelDragMove}
          onMouseUp={handlePanelDragEnd}
          onMouseLeave={handlePanelDragEnd}
        >
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Site Address</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Enter site address"
                  value={siteAddress}
                  onChange={handleAddressChange}
                  onKeyPress={(e) => e.key === 'Enter' && geocodeAddress()}
                  onFocus={() => setShowSuggestions(true)}
                  className="text-sm"
                />
                {siteAddress && (
                  <button onClick={() => { setSiteAddress(''); setSuggestions([]); setShowSuggestions(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <button key={idx} onClick={() => selectSuggestion(s)} className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm text-gray-700 border-b last:border-b-0">
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={geocodeAddress} disabled={loading} className="px-2 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Zoom</label>
            <div className="flex items-center gap-2">
              <input type="range" min="10" max="22" step="1" value={mapZoom} onChange={(e) => setMapZoom(parseInt(e.target.value))} className="flex-1" style={{ accentColor: '#F15A22' }} />
              <span className="text-xs text-gray-600 w-6 text-right">{mapZoom}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Rotation</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="360" step="1" value={overlayRotation} onChange={(e) => setOverlayRotation(parseInt(e.target.value))} className="flex-1" style={{ accentColor: '#F15A22' }} />
              <span className="text-xs text-gray-600 w-8 text-right">{overlayRotation}°</span>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Property Boundary</label>
              {boundaryLoading && <span className="text-xs text-gray-500">Loading...</span>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showBoundaries} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowBoundaries(checked);
                  // Fetch boundary if enabled and we have coordinates
                  if (checked && coordinates) {
                    fetchPropertyBoundary(coordinates[0], coordinates[1]);
                  } else if (!checked) {
                    setPropertyBoundary(null);
                  }
                }}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                style={{ accentColor: '#F15A22' }}
              />
              <span className="text-xs text-gray-700">Show LINZ Property Boundary</span>
            </label>
            {propertyBoundary && (
              <div className="text-xs text-green-600 mt-1 ml-6">
                ✓ Boundary displayed
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-3 mt-3">
            <label className="text-xs font-semibold text-gray-600 block mb-2">Additional Resources</label>
            <div className="space-y-2 text-xs">
              <div>
                <a 
                  href="https://www.branz.co.nz/branz-maps-zones/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline flex items-center gap-1"
                >
                  🌪️ Wind Zones (BRANZ Maps)
                </a>
                <p className="text-gray-500 text-xs mt-0.5">Building wind classifications</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}