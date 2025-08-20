"use client";

import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LicenseMapProps {
  lat: number;
  lng: number;
  description: string;
}

// Define layer types to help with TypeScript
type LayerKey = 'openstreetmap' | 'satellite' | 'terrain' | 'humanitarian';
type LayerMap = Record<LayerKey, L.TileLayer>;

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

const LicenseMap: React.FC<LicenseMapProps> = ({ lat, lng, description }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerKey>('openstreetmap');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Start loading state
    setIsLoading(true);
    
    // Fix marker icon issues
    fixLeafletIcons();

    // Pre-load map tiles before initialization
    const preloadImages = (urls: string[]) => {
      urls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };

    // Preload some common tiles
    preloadImages([
      'https://a.tile.openstreetmap.org/13/4096/4096.png',
      'https://b.tile.openstreetmap.org/13/4097/4096.png',
      'https://c.tile.openstreetmap.org/13/4096/4097.png'
    ]);

    // Use setTimeout to create a small delay before initializing the map
    // This allows the page to render and become responsive before heavy map operations
    const initializationTimeout = setTimeout(() => {
      // Initialize map with reduced animation duration
      const map = L.map(mapRef.current, {
        attributionControl: false,  // Disable the attribution control completely
        zoomControl: true,
        zoomAnimation: true, // Smoother experience
        fadeAnimation: true,
        markerZoomAnimation: true,
        zoom: 13
      }).setView([lat, lng], 13);
      
      mapInstanceRef.current = map;

      // Define basemap layers
      const layers: LayerMap = {
        openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ' ',
          maxZoom: 19,
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: ' ',
          maxZoom: 19,
        }),
        terrain: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
          attribution: ' ',
          maxZoom: 18,
        }),
        humanitarian: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          attribution: ' ',
          maxZoom: 19,
        })
      };

      // Add the default layer (openstreetmap)
      layers[activeLayer].addTo(map);
      
      // Add event listener to detect when tiles are loaded
      let tilesLoaded = 0;
      const totalTilesToLoad = 4; // Approximate number of tiles for initial view
      
      layers[activeLayer].on('load', () => {
        tilesLoaded++;
        if (tilesLoaded >= totalTilesToLoad) {
          // Hide loading indicator after tiles are loaded
          setIsLoading(false);
        }
      });
      
      // Safety timeout - hide loading indicator after 3 seconds regardless
      setTimeout(() => setIsLoading(false), 3000);

      // Add a marker
      const marker = L.marker([lat, lng]);
      
      // Only add popup if there's a description
      if (description) {
        marker.bindPopup(description).openPopup();
      }
      
      marker.addTo(map);

      // Use Leaflet's built-in layer control
      const baseMaps = {
        "OpenStreetMap": layers.openstreetmap,
        "Satellite": layers.satellite,
        "Terrain": layers.terrain,
        "Humanitarian": layers.humanitarian
      };
      
      // Add layer control to the map
      L.control.layers(baseMaps, {}, {
        position: 'topright',
        collapsed: false
      }).addTo(map);
      
      // When user changes the layer, update state
      map.on('baselayerchange', (e: L.LayersControlEvent) => {
        // Determine which layer was selected
        const selectedLayer = Object.entries(baseMaps).find(
          ([, layer]) => layer === e.layer
        );
        
        if (selectedLayer) {
          const layerName = selectedLayer[0].toLowerCase();
          if (
            layerName === 'openstreetmap' || 
            layerName === 'satellite' || 
            layerName === 'terrain' || 
            layerName === 'humanitarian'
          ) {
            setActiveLayer(layerName as LayerKey);
          }
        }
      });
    }, 100); // Small delay for better UX

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      clearTimeout(initializationTimeout);
    };
  }, [lat, lng, description]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full z-10" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-20">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseMap; 