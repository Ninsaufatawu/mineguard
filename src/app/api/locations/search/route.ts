import { NextRequest, NextResponse } from 'next/server';

// Function to search using Nominatim API with timeout
async function searchNominatim(query: string, timeout: number = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const searchUrls = [
      // Primary search with Ghana context
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Ghana")}&countrycodes=gh&limit=8&addressdetails=1&extratags=1`,
      // Secondary search for landmarks, POIs, and amenities
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=8&addressdetails=1&extratags=1&featuretype=settlement,landmark,tourism,amenity,leisure,historic`,
      // Tertiary search without Ghana suffix for exact matches
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=8&addressdetails=1`
    ];

    let allResults: Array<{name: string, lat: number, lng: number, type?: string, importance?: number}> = [];

    // Try each search strategy
    for (const searchUrl of searchUrls) {
      try {
        const response = await fetch(searchUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'MineGuard-Ghana-App/1.0',
            'Accept': 'application/json',
            'Accept-Language': 'en'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const results = data.map((item: any) => {
              // Create more descriptive names based on available data
              let displayName = item.display_name;

              // If we have address details, create a cleaner name
              if (item.address) {
                const addr = item.address;
                const parts = [];

                // Add specific place name (landmarks, amenities, etc.)
                if (addr.amenity) parts.push(addr.amenity);
                if (addr.tourism) parts.push(addr.tourism);
                if (addr.building) parts.push(addr.building);
                if (addr.shop) parts.push(addr.shop);
                if (addr.office) parts.push(addr.office);
                if (addr.leisure) parts.push(addr.leisure);
                if (addr.historic) parts.push(addr.historic);
                if (addr.natural) parts.push(addr.natural);
                if (addr.landuse) parts.push(addr.landuse);

                // Add location context
                if (addr.suburb) parts.push(addr.suburb);
                if (addr.neighbourhood) parts.push(addr.neighbourhood);
                if (addr.village) parts.push(addr.village);
                if (addr.town) parts.push(addr.town);
                if (addr.city) parts.push(addr.city);
                if (addr.state) parts.push(addr.state);

                if (parts.length > 0) {
                  displayName = parts.join(', ');
                }
              }

              return {
                name: displayName,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                type: item.type || 'location',
                class: item.class || 'place',
                importance: item.importance || 0
              };
            });

            // Remove duplicates and add to results
            results.forEach(result => {
              if (!allResults.some(existing => 
                Math.abs(existing.lat - result.lat) < 0.001 && 
                Math.abs(existing.lng - result.lng) < 0.001
              )) {
                allResults.push(result);
              }
            });

            if (allResults.length >= 8) break; // Stop if we have enough results
          }
        }
      } catch (err) {
        console.warn('Search strategy failed:', err);
        continue;
      }
    }

    clearTimeout(timeoutId);
    return allResults;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters long'
      }, { status: 400 });
    }

    // Use real geocoding data from Nominatim (same as Leaflet/OpenStreetMap)
    try {
      const nominatimResults = await searchNominatim(query.trim(), 8000); // 8 second timeout
      
      if (nominatimResults.length > 0) {
        // Sort results by relevance and importance
        nominatimResults.sort((a, b) => {
          const aExact = a.name.toLowerCase().includes(query.toLowerCase());
          const bExact = b.name.toLowerCase().includes(query.toLowerCase());
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Sort by importance if available
          if (a.importance && b.importance) {
            return b.importance - a.importance;
          }
          
          return 0;
        });

        return NextResponse.json({
          success: true,
          results: nominatimResults.slice(0, limit),
          source: 'nominatim'
        });
      }
    } catch (error) {
      console.warn('Nominatim API failed:', error);
    }

    // If no results from Nominatim, return empty with helpful message
    const noResults = [
      { name: `No locations found for "${query}"`, lat: 0, lng: 0, type: 'help' },
      { name: "Try a different search term", lat: 0, lng: 0, type: 'help' }
    ];

    return NextResponse.json({
      success: true,
      results: noResults,
      source: 'no_results'
    });

  } catch (error) {
    console.error('Location search error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Search service temporarily unavailable'
    }, { status: 500 });
  }
}