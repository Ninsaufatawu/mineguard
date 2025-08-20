export interface GhanaDistrict {
  fid: number;
  region: string;
  district: string;
  coordinates?: { lat: number; lng: number };
}

// Approximate coordinates for Ghana regions (center points)
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'GREATER ACCRA': { lat: 5.6037, lng: -0.1870 },
  'ASHANTI': { lat: 6.6885, lng: -1.6244 },
  'WESTERN': { lat: 5.0000, lng: -2.5000 },
  'WESTERN NORTH': { lat: 6.2000, lng: -2.8000 },
  'CENTRAL': { lat: 5.3000, lng: -1.0000 },
  'EASTERN': { lat: 6.1000, lng: -0.5000 },
  'VOLTA': { lat: 6.6000, lng: 0.5000 },
  'OTI': { lat: 7.5000, lng: 0.3000 },
  'NORTHERN': { lat: 9.4000, lng: -0.8000 },
  'NORTHERN EAST': { lat: 10.5000, lng: -0.2000 },
  'SAVANNAH': { lat: 8.5000, lng: -1.8000 },
  'UPPER EAST': { lat: 10.7000, lng: -1.0000 },
  'UPPER WEST': { lat: 10.3000, lng: -2.5000 },
  'BONO': { lat: 7.7000, lng: -2.3000 },
  'BONO EAST': { lat: 7.7000, lng: -1.0000 },
  'AHAFO': { lat: 7.2000, lng: -2.6000 }
};

// Approximate district coordinates (some major ones)
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Greater Accra
  'ACCRA METROPOLITAN': { lat: 5.6037, lng: -0.1870 },
  'TEMA METROPOLITAN': { lat: 5.6698, lng: 0.0166 },
  'ADENTA MUNICIPAL': { lat: 5.7089, lng: -0.1677 },
  'LEDZOKUKU MUNICIPAL': { lat: 5.6500, lng: 0.0000 },
  'ADA EAST': { lat: 5.7892, lng: 0.6350 },
  'ADA WEST': { lat: 5.7500, lng: 0.6000 },
  'SHAI OSUDOKU': { lat: 5.8500, lng: 0.1000 },
  
  // Ashanti
  'KUMASI METROPOLITAN': { lat: 6.6885, lng: -1.6244 },
  'ASANTE AKIM SOUTH': { lat: 6.4000, lng: -1.0000 },
  'OBUASI MUNICIPAL': { lat: 6.2028, lng: -1.6703 },
  
  // Western
  'TARKWA NSUAEM MUNICIPAL': { lat: 5.3000, lng: -2.0000 },
  'PRESTEA HUNI VALLEY': { lat: 5.4000, lng: -2.1000 },
  'WASSA AMENFI WEST': { lat: 5.2000, lng: -2.3000 },
  
  // Northern regions
  'TAMALE METROPOLITAN': { lat: 9.4008, lng: -0.8393 },
  'WA MUNICIPAL': { lat: 10.0601, lng: -2.5057 },
  'BOLGATANGA MUNICIPAL': { lat: 10.7856, lng: -0.8514 },
  
  // Add more as needed...
};

export async function loadGhanaDistricts(): Promise<GhanaDistrict[]> {
  try {
    const response = await fetch('/Ghana_New_260_District.csv');
    const csvText = await response.text();
    
    const lines = csvText.trim().split('\n');
    const districts: GhanaDistrict[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [fid, region, district] = line.split(',').map(field => field.trim());
        
        if (fid && region && district) {
          // Try to get specific district coordinates, fallback to region coordinates
          const coordinates = DISTRICT_COORDINATES[district.toUpperCase()] || 
                            REGION_COORDINATES[region.toUpperCase()] || 
                            { lat: 7.9465, lng: -1.0232 }; // Ghana center as fallback
          
          districts.push({
            fid: parseInt(fid),
            region,
            district,
            coordinates
          });
        }
      }
    }
    
    return districts;
  } catch (error) {
    console.error('Error loading Ghana districts:', error);
    return [];
  }
}

export function getUniqueRegions(districts: GhanaDistrict[]): string[] {
  const regions = [...new Set(districts.map(d => d.region))];
  return regions.sort();
}

export function getDistrictsByRegion(districts: GhanaDistrict[], region: string): GhanaDistrict[] {
  return districts
    .filter(d => d.region === region)
    .sort((a, b) => a.district.localeCompare(b.district));
}

export function findDistrictByName(districts: GhanaDistrict[], districtName: string): GhanaDistrict | null {
  return districts.find(d => d.district.toLowerCase() === districtName.toLowerCase()) || null;
}
