// Don't import Leaflet directly at the top level
// import L from 'leaflet';

// Fix for Leaflet default marker icons in Next.js
export function fixLeafletMarkerIcons() {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return;
  }
  
  // Import Leaflet dynamically only on client side
  const L = require('leaflet');

  // Ensure Leaflet CSS is loaded
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  linkElement.crossOrigin = '';
  
  // Only add if not already present
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    document.head.appendChild(linkElement);
  }

  // Fix Leaflet's icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} 