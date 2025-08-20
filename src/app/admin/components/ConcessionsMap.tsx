'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Topographical map style
const TOPO_STYLE = {
  version: 8,
  sources: {
    'topo': {
      type: 'raster',
      tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      }
  },
  layers: [{
    id: 'topo',
    type: 'raster',
    source: 'topo',
    minzoom: 0,
    maxzoom: 17
  }]
};

// Default coordinates (Ghana center)
const GHANA_CENTER: [number, number] = [8.1, -1.2];
const DEFAULT_ZOOM = 6;

interface ConcessionsMapProps {
  className?: string;
}

export default function ConcessionsMap({ className = '' }: ConcessionsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get saved position or use default
    const savedPosition = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('mapPosition') || 'null')
      : null;

    // Initialize the map with topo style
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: TOPO_STYLE,
      center: savedPosition?.center || GHANA_CENTER,
      zoom: savedPosition?.zoom || DEFAULT_ZOOM,
      renderWorldCopies: false, // Better performance
      maxZoom: 17,
      minZoom: 4,
      hash: false,
      preserveDrawingBuffer: true // Better performance for static maps
    });

    // Save map position on move end
    const savePosition = () => {
      if (!map.current) return;
      const { lng, lat } = map.current.getCenter();
      const zoom = map.current.getZoom();
      if (typeof window !== 'undefined') {
        localStorage.setItem('mapPosition', JSON.stringify({
          center: [lng, lat],
          zoom: zoom
        }));
      }
    };

    // Add event listeners
    map.current.on('moveend', savePosition);

    // Add navigation controls with position
    const nav = new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: false // Better performance
    });
    map.current.addControl(nav, 'top-right');

    // Add scale control
    const scale = new maplibregl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    });
    map.current.addControl(scale, 'bottom-right');

    // Fetch and display concessions
    const fetchConcessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if concessions data is cached
        const cachedConcessions = localStorage.getItem('concessionsData');
        const cacheTimestamp = localStorage.getItem('concessionsCacheTime');
        const isCacheValid = cacheTimestamp && 
          (Date.now() - parseInt(cacheTimestamp)) < 600000; // 10 minutes cache

        let data;
        if (isCacheValid && cachedConcessions) {
          // Use cached data
          data = JSON.parse(cachedConcessions);
          console.log('Using cached concessions data');
        } else {
          // Fetch fresh data
          console.log('Fetching fresh concessions data');
          const { data: freshData, error: rpcError } = await supabase
            .rpc('get_concessions_geojson');

          if (rpcError) {
            throw rpcError;
          }

          data = freshData;
          
          // Cache the data
          if (data) {
            localStorage.setItem('concessionsData', JSON.stringify(data));
            localStorage.setItem('concessionsCacheTime', Date.now().toString());
          }
        }

        if (!data || !map.current) return;

        // Add the GeoJSON source and layer if they don't exist
        if (!map.current.getSource('concessions')) {
          map.current.addSource('concessions', {
            type: 'geojson',
            data: data
          });

          map.current.addLayer({
            id: 'concessions-fill',
            type: 'fill',
            source: 'concessions',
            paint: {
              'fill-color': '#f28f3b',
              'fill-opacity': 0.4,
              'fill-outline-color': '#ff6600'
            }
          });

          map.current.addLayer({
            id: 'concessions-outline',
            type: 'line',
            source: 'concessions',
            paint: {
              'line-color': '#ff6600',
              'line-width': 2
            }
          });

          // Fit bounds to the concessions if there are any features
          if (data.features && data.features.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            data.features.forEach((feature: any) => {
              if (feature.geometry && feature.geometry.coordinates) {
                const coordinates = feature.geometry.coordinates;
                // Handle both Polygon and MultiPolygon geometries
                if (feature.geometry.type === 'Polygon') {
                  coordinates[0].forEach((coord: [number, number]) => {
                    bounds.extend(coord);
                  });
                } else if (feature.geometry.type === 'MultiPolygon') {
                  coordinates.forEach((polygon: any) => {
                    polygon[0].forEach((coord: [number, number]) => {
                      bounds.extend(coord);
                    });
                  });
                }
              }
            });
            
            if (!bounds.isEmpty()) {
              map.current.fitBounds(bounds, { padding: 50 });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching concessions:', err);
        setError('Failed to load mining concessions data');
      } finally {
        setLoading(false);
      }
    };

    // Wait for the map to load before adding data
    map.current.on('load', fetchConcessions);

    // Cleanup function
    // Cleanup
    return () => {
      if (map.current) {
        map.current.off('moveend', savePosition);
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-700">Loading mining concessions...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
          <div className="text-center p-4">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <p className="text-red-700 font-medium">Error loading map data</p>
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md text-sm">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-[#f28f3b] opacity-40 mr-2 border border-[#ff6600]"></div>
          <span>Mining Concessions</span>
        </div>
      </div>
    </div>
  );
}
