// Sequential Location-Hopping System for Satellite Analysis
// Generates a single specific location within a district for each analysis run

export interface LocationInfo {
  locationId: string; // Unique ID for this location (LOC-001, LOC-002, etc.)
  locationName: string; // Descriptive name of the location
  sequenceNumber: number; // Which location in sequence (1, 2, 3, etc.)
  coordinates: {
    latitude: number;
    longitude: number;
    dms: string; // Degrees, minutes, seconds format
    utm: string; // UTM coordinates
  };
  areaSize: {
    km2: number;
    m2: number;
  };
  locationBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  analysisArea: GeoJSON.Feature; // The specific area to analyze (500m x 500m)
}

/**
 * Generate a sequential location within a district for analysis
 * Each call returns a different location within the same district
 */
export async function generateSequentialLocation(
  districtAOI: GeoJSON.Feature,
  districtName: string,
  sequenceNumber: number
): Promise<LocationInfo> {
  console.log(`🎯 Generating location ${sequenceNumber} for district: ${districtName}`);
  
  // Extract district bounds
  const bounds = extractDistrictBounds(districtAOI);
  if (!bounds) {
    throw new Error('Could not extract district bounds');
  }
  
  // Generate a specific location within the district using sequence number as seed
  const location = generateLocationFromSequence(bounds, sequenceNumber, districtName);
  
  console.log(`📍 Generated location ${location.locationId}: ${location.locationName}`);
  console.log(`🌍 Coordinates: ${location.coordinates.latitude}, ${location.coordinates.longitude}`);
  console.log(`📐 Area: ${location.areaSize.km2} km²`);
  
  return location;
}

/**
 * Extract bounds from district AOI
 */
function extractDistrictBounds(aoiGeoJSON: GeoJSON.Feature): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} | null {
  try {
    const geometry = aoiGeoJSON.geometry;
    
    if (!geometry) {
      return null;
    }
    
    let coordinates: number[][][] = [];
    
    if (geometry.type === 'Polygon') {
      coordinates = (geometry as GeoJSON.Polygon).coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      // Take the first polygon from MultiPolygon
      coordinates = ((geometry as GeoJSON.MultiPolygon).coordinates)[0];
    } else {
      return null;
    }
    
    // Extract all coordinate pairs
    const allCoords = coordinates[0]; // Outer ring
    
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    for (const coord of allCoords) {
      const [lng, lat] = coord;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    
    return { minLng, maxLng, minLat, maxLat };
  } catch (error) {
    console.error('Error extracting bounds:', error);
    return null;
  }
}

/**
 * Generate a specific location based on sequence number
 * Uses deterministic algorithm to ensure different locations for each sequence
 */
function generateLocationFromSequence(
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  sequenceNumber: number,
  districtName: string
): LocationInfo {
  // Use sequence number as seed for deterministic location generation
  const seed = sequenceNumber * 1337; // Prime number for better distribution
  
  // Generate pseudo-random coordinates within bounds using sequence as seed
  const lngRange = bounds.maxLng - bounds.minLng;
  const latRange = bounds.maxLat - bounds.minLat;
  
  // Create deterministic "random" values based on sequence
  const lngOffset = ((seed * 0.618033988749) % 1) * lngRange; // Golden ratio for distribution
  const latOffset = ((seed * 0.381966011251) % 1) * latRange; // Complementary ratio
  
  const centerLng = bounds.minLng + lngOffset;
  const centerLat = bounds.minLat + latOffset;
  
  // Create 500m x 500m analysis area (approximately 0.0045 degrees)
  const areaSize = 0.0045; // ~500m in degrees
  const halfSize = areaSize / 2;
  
  const locationBounds = {
    north: centerLat + halfSize,
    south: centerLat - halfSize,
    east: centerLng + halfSize,
    west: centerLng - halfSize
  };
  
  // Generate location name based on sequence and district
  const locationTypes = [
    'Forest Reserve Area',
    'Remote Valley Region',
    'Hillside Location',
    'Riverside Zone',
    'Agricultural Buffer Area',
    'Protected Periphery',
    'Woodland Section',
    'Grassland Area',
    'Rocky Terrain Zone',
    'Savanna Region'
  ];
  
  const locationTypeIndex = (sequenceNumber - 1) % locationTypes.length;
  const locationName = `${locationTypes[locationTypeIndex]} ${String.fromCharCode(65 + ((sequenceNumber - 1) % 26))}`;
  
  // Create analysis area GeoJSON
  const analysisArea: GeoJSON.Feature = {
    type: 'Feature',
    properties: {
      name: locationName,
      sequence: sequenceNumber,
      district: districtName
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [locationBounds.west, locationBounds.south],
        [locationBounds.east, locationBounds.south],
        [locationBounds.east, locationBounds.north],
        [locationBounds.west, locationBounds.north],
        [locationBounds.west, locationBounds.south]
      ]]
    }
  };
  
  // Calculate area in km² and m²
  const areaKm2 = 0.25; // 500m x 500m = 0.25 km²
  const areaM2 = 250000; // 500m x 500m = 250,000 m²
  
  return {
    locationId: `LOC-${String(sequenceNumber).padStart(3, '0')}`,
    locationName,
    sequenceNumber,
    coordinates: {
      latitude: parseFloat(centerLat.toFixed(6)),
      longitude: parseFloat(centerLng.toFixed(6)),
      dms: convertToDMS(centerLat, centerLng),
      utm: convertToUTM(centerLat, centerLng)
    },
    areaSize: {
      km2: areaKm2,
      m2: areaM2
    },
    locationBounds,
    analysisArea
  };
}

/**
 * Convert coordinates to DMS format
 */
function convertToDMS(lat: number, lng: number): string {
  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
  const latSec = ((Math.abs(lat) - latDeg - latMin / 60) * 3600).toFixed(2);
  const latDir = lat >= 0 ? 'N' : 'S';
  
  const lngDeg = Math.floor(Math.abs(lng));
  const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
  const lngSec = ((Math.abs(lng) - lngDeg - lngMin / 60) * 3600).toFixed(2);
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${latDeg}°${latMin}'${latSec}"${latDir}, ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
}

/**
 * Convert coordinates to UTM format (simplified for Ghana - Zone 30N)
 */
function convertToUTM(lat: number, lng: number): string {
  // Simplified UTM conversion for Ghana (Zone 30N)
  const zone = 30;
  const hemisphere = 'N';
  
  // Rough conversion (not precise, but good enough for display)
  const easting = Math.round(500000 + (lng + 3) * 111320 * Math.cos(lat * Math.PI / 180));
  const northing = Math.round(lat * 110540);
  
  return `${zone}${hemisphere} ${easting}E ${northing}N`;
}

/**
 * Get the next sequence number for a district
 * This would typically be stored in a database, but for now we'll use a simple approach
 */
export function getNextSequenceNumber(districtName: string, currentSequence?: number): number {
  // If no current sequence provided, start with 1
  if (!currentSequence) {
    return 1;
  }
  
  // Increment sequence number
  return currentSequence + 1;
}

/**
 * Reset sequence for a district (start from location 1 again)
 */
export function resetSequence(): number {
  return 1;
}
