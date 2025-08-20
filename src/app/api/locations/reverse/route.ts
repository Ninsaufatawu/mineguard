import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid latitude or longitude'
      }, { status: 400 });
    }

    try {
      // Try reverse geocoding with Nominatim
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'MineGuard-Ghana-App/1.0',
            'Accept': 'application/json',
            'Accept-Language': 'en'
          }
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.display_name) {
          // Clean up the display name for better readability
          let displayName = data.display_name;
          
          if (data.address) {
            const addr = data.address;
            const parts = [];
            
            // Build a cleaner address
            if (addr.house_number && addr.road) {
              parts.push(`${addr.house_number} ${addr.road}`);
            } else if (addr.road) {
              parts.push(addr.road);
            }
            
            if (addr.suburb) parts.push(addr.suburb);
            if (addr.neighbourhood) parts.push(addr.neighbourhood);
            if (addr.village) parts.push(addr.village);
            if (addr.town) parts.push(addr.town);
            if (addr.city) parts.push(addr.city);
            if (addr.state) parts.push(addr.state);
            if (addr.country) parts.push(addr.country);
            
            if (parts.length > 0) {
              displayName = parts.join(', ');
            }
          }

          return NextResponse.json({
            success: true,
            address: displayName,
            details: data.address || {}
          });
        }
      }
    } catch (error) {
      console.warn('Nominatim reverse geocoding failed:', error);
    }

    // Fallback: Generate a basic location description based on coordinates
    const region = getGhanaRegion(latitude, longitude);
    const fallbackAddress = `Location near ${region}, Ghana (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

    return NextResponse.json({
      success: true,
      address: fallbackAddress,
      details: { region },
      source: 'fallback'
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reverse geocode location'
    }, { status: 500 });
  }
}

// Helper function to determine Ghana region based on coordinates
function getGhanaRegion(lat: number, lng: number): string {
  // Approximate regional boundaries for Ghana
  if (lat >= 9.5 && lng >= -1.2 && lng <= 0.5) {
    return 'Upper East Region';
  }
  if (lat >= 9.5 && lng >= -3.0 && lng <= -1.2) {
    return 'Upper West Region';
  }
  if (lat >= 8.5 && lat < 9.5 && lng >= -2.5 && lng <= 0.5) {
    return 'Northern Region';
  }
  if (lat >= 7.5 && lat < 8.5 && lng >= -3.0 && lng <= -1.5) {
    return 'Bono Region';
  }
  if (lat >= 6.5 && lat < 8.0 && lng >= -2.5 && lng <= -1.0) {
    return 'Ashanti Region';
  }
  if (lat >= 6.0 && lat < 7.5 && lng >= -1.0 && lng <= 1.0) {
    return 'Eastern Region';
  }
  if (lat >= 6.0 && lat < 7.0 && lng >= -0.5 && lng <= 1.0) {
    return 'Volta Region';
  }
  if (lat >= 5.0 && lat < 6.5 && lng >= -1.5 && lng <= -0.5) {
    return 'Central Region';
  }
  if (lat >= 5.0 && lat < 6.0 && lng >= -0.5 && lng <= 0.5) {
    return 'Greater Accra Region';
  }
  if (lat >= 4.5 && lat < 6.0 && lng >= -3.5 && lng <= -1.5) {
    return 'Western Region';
  }
  
  // Default fallback
  return 'Ghana';
}