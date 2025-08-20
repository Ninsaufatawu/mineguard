"use client";

import { useEffect, useRef } from 'react';
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

interface ReportMapProps {
  lat: number;
  lng: number;
  description?: string;
}

const ReportMap = ({ lat, lng, description = 'Report Location' }: ReportMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    // Initialize Leaflet only on client side
    if (typeof window !== 'undefined' && mapRef.current && !leafletMap.current) {
      // Fix icon issues
      fixLeafletIcons();
      
      // Create map instance
      leafletMap.current = L.map(mapRef.current).setView([lat, lng], 13);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);
      
      // Add marker
      L.marker([lat, lng])
        .addTo(leafletMap.current)
        .bindPopup(description)
        .openPopup();
    }

    // Cleanup function
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [lat, lng, description]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default ReportMap; 