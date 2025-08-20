"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues with webpack
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

interface SatelliteMapProps {
  lat: number;
  lng: number;
  description?: string;
  district?: string;
  showControls?: boolean;
  analysisData?: {
    beforeImageUrl?: string;
    afterImageUrl?: string;
    changePolygons?: any[];
    analysisType?: string;
    bounds?: [[number, number], [number, number]];
  };
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
}

const SatelliteMap = ({ 
  lat, 
  lng, 
  description = 'Analysis Location',
  district,
  showControls = false,
  analysisData,
  onLocationSelect,
  height = '100%',
  zoom = 13
}: SatelliteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [currentLayer, setCurrentLayer] = useState<'satellite' | 'before' | 'after'>('satellite');
  const layersRef = useRef<{[key: string]: L.TileLayer | L.ImageOverlay}>({});
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  useEffect(() => {
    // Initialize Leaflet only on client side
    if (typeof window !== 'undefined' && mapRef.current && !leafletMap.current) {
      // Fix icon issues
      fixLeafletIcons();
      
      // Create map instance
      leafletMap.current = L.map(mapRef.current).setView([lat, lng], zoom);
      
      // Add base satellite tile layer
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
      satelliteLayer.addTo(leafletMap.current);
      layersRef.current.satellite = satelliteLayer;
      
      // Add OpenStreetMap layer as alternative
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      layersRef.current.osm = osmLayer;
      
      // Add layer control if controls are enabled
      if (showControls) {
        const baseLayers = {
          'Satellite': satelliteLayer,
          'Street Map': osmLayer
        };
        L.control.layers(baseLayers).addTo(leafletMap.current);
      }
      
      // Add markers layer group
      markersRef.current.addTo(leafletMap.current);
      
      // Add click handler for location selection
      if (onLocationSelect) {
        leafletMap.current.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    // Update map view when coordinates change
    if (leafletMap.current) {
      leafletMap.current.setView([lat, lng], zoom);
    }

    // Cleanup function
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [lat, lng, zoom, showControls, onLocationSelect]);

  // Update markers when data changes
  useEffect(() => {
    if (!leafletMap.current || !markersRef.current) return;
    
    // Clear existing markers
    markersRef.current.clearLayers();
    
    // Add main location marker
    const miningIcon = L.divIcon({
      html: `<div style="background-color: ${analysisData?.analysisType === 'CHANGE' ? '#ef4444' : '#3b82f6'}; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-mining-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    const marker = L.marker([lat, lng], { icon: miningIcon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${description}</h3>
          ${district ? `<p class="text-xs text-gray-600">District: ${district}</p>` : ''}
          ${analysisData?.analysisType ? `<p class="text-xs text-gray-600">Analysis: ${analysisData.analysisType}</p>` : ''}
        </div>
      `);
    
    markersRef.current.addLayer(marker);
    
    // Add change polygons if available
    if (analysisData?.changePolygons && analysisData.changePolygons.length > 0) {
      analysisData.changePolygons.forEach((polygon, index) => {
        if (polygon.coordinates && polygon.coordinates[0]) {
          const coords = polygon.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
          const changePolygon = L.polygon(coords, {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.3,
            weight: 2
          }).bindPopup(`
            <div class="p-2">
              <h4 class="font-semibold text-sm">Detected Change ${index + 1}</h4>
              <p class="text-xs text-gray-600">Area: ${polygon.area_km2 || 'N/A'} km²</p>
              <p class="text-xs text-gray-600">Confidence: High</p>
            </div>
          `);
          markersRef.current.addLayer(changePolygon);
        }
      });
    }
    
    // Fit bounds if analysis bounds are provided
    if (analysisData?.bounds && leafletMap.current) {
      leafletMap.current.fitBounds(analysisData.bounds, { padding: [20, 20] });
    }
    
  }, [lat, lng, description, district, analysisData]);

  // Handle before/after image overlays
  useEffect(() => {
    if (!leafletMap.current || !analysisData) return;
    
    // Remove existing image overlays
    Object.keys(layersRef.current).forEach(key => {
      if (key.includes('Image') && leafletMap.current?.hasLayer(layersRef.current[key])) {
        leafletMap.current.removeLayer(layersRef.current[key]);
      }
    });
    
    // Add before/after image overlays if available
    if (analysisData.bounds) {
      if (analysisData.beforeImageUrl && currentLayer === 'before') {
        const beforeOverlay = L.imageOverlay(analysisData.beforeImageUrl, analysisData.bounds, {
          opacity: 0.8
        });
        beforeOverlay.addTo(leafletMap.current);
        layersRef.current.beforeImage = beforeOverlay;
      }
      
      if (analysisData.afterImageUrl && currentLayer === 'after') {
        const afterOverlay = L.imageOverlay(analysisData.afterImageUrl, analysisData.bounds, {
          opacity: 0.8
        });
        afterOverlay.addTo(leafletMap.current);
        layersRef.current.afterImage = afterOverlay;
      }
    }
  }, [currentLayer, analysisData]);

  return (
    <div className="relative" style={{ height, width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      
      {/* Layer switcher for before/after images */}
      {analysisData?.beforeImageUrl && analysisData?.afterImageUrl && (
        <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-lg p-2">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentLayer('satellite')}
              className={`px-3 py-1 text-xs rounded ${
                currentLayer === 'satellite' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setCurrentLayer('before')}
              className={`px-3 py-1 text-xs rounded ${
                currentLayer === 'before' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setCurrentLayer('after')}
              className={`px-3 py-1 text-xs rounded ${
                currentLayer === 'after' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              After
            </button>
          </div>
        </div>
      )}
      
      {/* Analysis info panel */}
      {analysisData && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-sm mb-1">Analysis Results</h4>
          <p className="text-xs text-gray-600 mb-1">Type: {analysisData.analysisType}</p>
          {analysisData.changePolygons && (
            <p className="text-xs text-gray-600">
              Changes Detected: {analysisData.changePolygons.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SatelliteMap;
