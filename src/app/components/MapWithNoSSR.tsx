"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Compass, Navigation, Loader2 } from 'lucide-react'

// Define types for the component props
interface MapWithNoSSRProps {
  center: { lat: number; lng: number }
  zoom: number
  currentLocation: { lat: number; lng: number } | null
  onLocationSelected: (location: { lat: number; lng: number }) => void
}

// Create custom marker icons
const createColorIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

export default function MapWithNoSSR({ 
  center, 
  zoom = 10, 
  currentLocation, 
  onLocationSelected 
}: MapWithNoSSRProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const rawLocationMarkerRef = useRef<L.Marker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  
  // Calibration system states
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [rawDeviceLocation, setRawDeviceLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationOffset, setLocationOffset] = useState<{lat: number, lng: number}>({lat: 0, lng: 0})
  const [isLocationFetching, setIsLocationFetching] = useState(false)
  const [accuracyText, setAccuracyText] = useState("")
  const [locationAccuracy, setLocationAccuracy] = useState(0)
  const [isUltraPrecise, setIsUltraPrecise] = useState(false)
  
  // Icons for different marker states
  const icons = useRef({
    blue: createColorIcon('blue'),
    red: createColorIcon('red'),
    green: createColorIcon('green')
  })
  
  // Fix Leaflet default icon issue
  useEffect(() => {
    // This code runs only on the client
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);
  
  // Load saved calibration offset
  useEffect(() => {
    try {
      const savedOffset = localStorage.getItem('locationCalibrationOffset')
      if (savedOffset) {
        setLocationOffset(JSON.parse(savedOffset))
        setAccuracyText("Location calibration loaded")
      }
    } catch (e) {
      console.error('Error loading calibration offset:', e)
    }
  }, [])
  
  // Initialize map only once on component mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Generate a unique ID for the map container to prevent reuse
    const mapId = `map-${Math.random().toString(36).substring(2, 9)}`;
    mapContainerRef.current.id = mapId;
    
    // Create map instance
    const map = L.map(mapId, {
      zoomControl: false // We'll add it in a custom position
    }).setView([center.lat, center.lng], zoom);
    
    // Add zoom control in bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Add multiple tile layers with layer control
    const baseMaps = {
      "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }),
      "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }),
      "Terrain": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }),
      "Humanitarian": L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.hotosm.org/">HOT</a>'
      })
    };
    
    // Add the default layer
    baseMaps["OpenStreetMap"].addTo(map);
    
    // Add layer control
    L.control.layers(baseMaps, {}, { position: 'topright' }).addTo(map);
    
    // Store map reference
    mapRef.current = map;
    
    // Handle map click to set marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      // Remove existing marker if there is one
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Create new marker with the appropriate icon
      markerRef.current = L.marker([lat, lng], {
        draggable: true,
        icon: calibrationMode ? icons.current.green : icons.current.blue
      }).addTo(map);
      
      // Update location when marker is dragged
      markerRef.current.on('dragend', () => {
        const position = markerRef.current?.getLatLng();
        if (position) {
          // If in calibration mode, calculate offset
          if (calibrationMode && rawDeviceLocation) {
            const newOffset = {
              lat: position.lat - rawDeviceLocation.lat,
              lng: position.lng - rawDeviceLocation.lng
            }
            setLocationOffset(newOffset)
            
            // Save offset for future use
            try {
              localStorage.setItem('locationCalibrationOffset', JSON.stringify(newOffset))
              setAccuracyText(`Calibration saved (${newOffset.lat.toFixed(6)}, ${newOffset.lng.toFixed(6)})`)
            } catch (e) {
              console.error('Error saving calibration:', e)
            }
          }
          
          onLocationSelected({ lat: position.lat, lng: position.lng });
          
          // Update popup content after drag
          if (markerRef.current) {
            markerRef.current.bindPopup(`<b>Selected Location</b><br>Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`).openPopup();
          }
        }
      });

      // Update parent component with new location
      onLocationSelected({ lat, lng });
      
      // Add popup to marker
      markerRef.current.bindPopup(
        calibrationMode ? 
        `<b>Your Actual Location</b><br>Drag to adjust` :
        `<b>Selected Location</b><br>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
      ).openPopup();
    });
    
    setMapReady(true);
    
    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      
      if (rawLocationMarkerRef.current) {
        rawLocationMarkerRef.current.remove();
        rawLocationMarkerRef.current = null;
      }
      
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
      
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update UI for calibration mode changes
  useEffect(() => {
    // Update marker icon when calibration mode changes
    if (mapRef.current && markerRef.current && mapReady) {
      markerRef.current.setIcon(calibrationMode ? icons.current.green : icons.current.blue);
      
      // Update marker popup text
      const position = markerRef.current.getLatLng();
      markerRef.current.bindPopup(
        calibrationMode ? 
        `<b>Your Actual Location</b><br>Drag to adjust` :
        `<b>Selected Location</b><br>Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`
      );
      
      // Show raw location marker in calibration mode
      if (calibrationMode && rawDeviceLocation) {
        if (rawLocationMarkerRef.current) {
          rawLocationMarkerRef.current.remove();
        }
        
        rawLocationMarkerRef.current = L.marker(
          [rawDeviceLocation.lat, rawDeviceLocation.lng],
          { icon: icons.current.red }
        ).bindPopup('<b>Device Reported Location</b><br>(Uncalibrated)').addTo(mapRef.current);
      } else if (!calibrationMode && rawLocationMarkerRef.current) {
        rawLocationMarkerRef.current.remove();
        rawLocationMarkerRef.current = null;
      }
    }
  }, [calibrationMode, rawDeviceLocation, mapReady]);
  
  // Handle currentLocation updates
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    if (currentLocation) {
      // First update view to ensure we're looking at the right area
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], zoom);
      
      // Remove existing marker if there is one
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      // Create new marker with the appropriate icon
      markerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
        draggable: true,
        icon: calibrationMode ? icons.current.green : icons.current.blue
      }).addTo(mapRef.current);
      
      // Add a helpful popup to the marker
      markerRef.current.bindPopup(
        calibrationMode ? 
        `<b>Your Actual Location</b><br>Drag to adjust` :
        `<b>Selected Location</b><br>Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`
      ).openPopup();
      
      // Update location when marker is dragged
      markerRef.current.on('dragend', () => {
        const position = markerRef.current?.getLatLng();
        if (position) {
          // If in calibration mode, calculate offset
          if (calibrationMode && rawDeviceLocation) {
            const newOffset = {
              lat: position.lat - rawDeviceLocation.lat,
              lng: position.lng - rawDeviceLocation.lng
            }
            setLocationOffset(newOffset)
            
            // Save offset for future use
            try {
              localStorage.setItem('locationCalibrationOffset', JSON.stringify(newOffset))
              setAccuracyText(`Calibration saved (${newOffset.lat.toFixed(6)}, ${newOffset.lng.toFixed(6)})`)
            } catch (e) {
              console.error('Error saving calibration:', e)
            }
          }
          
          onLocationSelected({ lat: position.lat, lng: position.lng });
          
          // Update popup content after drag
          if (markerRef.current) {
            markerRef.current.bindPopup(
              calibrationMode ? 
              `<b>Your Actual Location</b><br>Drag to adjust` :
              `<b>Selected Location</b><br>Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`
            ).openPopup();
          }
        }
      });
    }
  }, [currentLocation, mapReady, zoom, calibrationMode, onLocationSelected]);
  
  // Handle changes to center or zoom
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    // Only update the view if we're not using currentLocation
    if (!currentLocation) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, mapReady, currentLocation]);
  
  // Get high precision location with calibration applied
  const getHighPrecisionLocation = () => {
    if (!navigator.geolocation) {
      setAccuracyText("Geolocation is not supported by your browser")
      return
    }
    
    setIsLocationFetching(true)
    setAccuracyText("Getting your location...")
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // Save raw device location for potential calibration
        const rawLocation = { lat: latitude, lng: longitude }
        setRawDeviceLocation(rawLocation)
        
        // Apply calibration offset
        const calibratedLat = latitude + locationOffset.lat
        const calibratedLng = longitude + locationOffset.lng
        
        const calibratedLocation = { 
          lat: calibratedLat, 
          lng: calibratedLng 
        }
        
        console.log(`Raw location: ${latitude},${longitude} | Calibrated: ${calibratedLat},${calibratedLng} | Offset: ${locationOffset.lat},${locationOffset.lng}`)
        
        // Update parent component with calibrated location
        onLocationSelected(calibratedLocation)
        
        // Update accuracy display
        setLocationAccuracy(accuracy)
        
        // Update map with accuracy circle
        if (mapRef.current) {
          // Remove old accuracy circle if exists
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.remove()
          }
          
          // Create new accuracy circle
          accuracyCircleRef.current = L.circle(
            [calibratedLat, calibratedLng],
            {
              radius: accuracy,
              color: 'blue',
              fillColor: 'blue',
              fillOpacity: 0.1,
              weight: 1
            }
          ).addTo(mapRef.current)
          
          // Set appropriate zoom based on accuracy
          const zoomLevel = accuracy < 50 ? 18 : 
                            accuracy < 100 ? 17 : 
                            accuracy < 500 ? 16 : 15
          
          mapRef.current.setView([calibratedLat, calibratedLng], zoomLevel)
        }
        
        // Format accuracy for display
        if (accuracy < 20) {
          setAccuracyText(`Excellent accuracy: ±${accuracy.toFixed(1)}m (calibrated)`)
        } else if (accuracy < 50) {
          setAccuracyText(`Good accuracy: ±${accuracy.toFixed(1)}m (calibrated)`)
        } else if (accuracy < 100) {
          setAccuracyText(`Fair accuracy: ±${accuracy.toFixed(1)}m (calibrated)`)
        } else {
          setAccuracyText(`Low accuracy: ±${accuracy.toFixed(1)}m - Try calibration or Ultra-precise mode`)
        }
        
        setIsLocationFetching(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        let errorMsg
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied"
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location unavailable"
            break
          case error.TIMEOUT:
            errorMsg = "Location request timed out"
            break
          default:
            errorMsg = "Unknown location error"
        }
        
        setAccuracyText(`${errorMsg}. Try again or set location manually.`)
        setIsLocationFetching(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
  
  // Ultra-precise location function
  const getUltraPreciseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAccuracyText("Geolocation is not supported by your browser")
      return
    }
    
    setIsUltraPrecise(true)
    setIsLocationFetching(true)
    setAccuracyText("Initializing ultra-precise location mode...")
    
    const maxAttempts = 5
    let bestAccuracy = Infinity
    let bestLocation = null
    let attemptTimings = [5000, 8000, 12000, 15000, 20000]
    
    // Function to get location with increasing timeout periods
    const attemptLocation = (attemptIndex = 0) => {
      if (attemptIndex >= maxAttempts) {
        // We've made all attempts, use the best one
        if (bestLocation) {
          const calibratedPos = {
            lat: bestLocation.lat + locationOffset.lat,
            lng: bestLocation.lng + locationOffset.lng
          }
          
          // Save raw device location
          setRawDeviceLocation(bestLocation)
          
          // Update parent component
          onLocationSelected(calibratedPos)
          
          // Update accuracy circle
          if (mapRef.current) {
            // Remove old accuracy circle if exists
            if (accuracyCircleRef.current) {
              accuracyCircleRef.current.remove()
            }
            
            // Create new accuracy circle
            accuracyCircleRef.current = L.circle(
              [calibratedPos.lat, calibratedPos.lng],
              {
                radius: bestAccuracy,
                color: 'purple',
                fillColor: 'purple',
                fillOpacity: 0.1,
                weight: 1
              }
            ).addTo(mapRef.current)
            
            // Set appropriate zoom
            const zoomLevel = bestAccuracy < 20 ? 19 : 
                             bestAccuracy < 50 ? 18 : 
                             bestAccuracy < 100 ? 17 : 16
            
            mapRef.current.setView([calibratedPos.lat, calibratedPos.lng], zoomLevel)
          }
          
          setIsUltraPrecise(false)
          setIsLocationFetching(false)
          setAccuracyText(`Best accuracy: ±${bestAccuracy.toFixed(1)}m with calibration`)
          setLocationAccuracy(bestAccuracy)
        } else {
          setAccuracyText("Could not determine your location with acceptable accuracy")
          setIsUltraPrecise(false)
          setIsLocationFetching(false)
        }
        return
      }
      
      setAccuracyText(`Ultra-precise attempt ${attemptIndex + 1}/${maxAttempts}...`)
      
      const options = {
        enableHighAccuracy: true,
        timeout: attemptTimings[attemptIndex],
        maximumAge: 0
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const rawLocation = { lat: latitude, lng: longitude }
          
          console.log(`Attempt ${attemptIndex + 1}: Accuracy: ${accuracy}m, Raw: ${latitude},${longitude}`)
          
          // Check if this is our best accuracy so far
          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy
            bestLocation = rawLocation
          }
          
          // Always continue with more attempts to try getting better accuracy
          setTimeout(() => attemptLocation(attemptIndex + 1), 1000)
        },
        (error) => {
          console.error(`Location attempt ${attemptIndex + 1} error:`, error)
          // Continue with next attempt despite error
          setTimeout(() => attemptLocation(attemptIndex + 1), 1000)
        },
        options
      )
    }
    
    // Start the location attempts
    attemptLocation()
  }, [locationOffset, onLocationSelected])
  
  // Start or stop calibration mode
  const toggleCalibrationMode = () => {
    if (!calibrationMode) {
      // Start calibration - first get current device location
      setIsLocationFetching(true)
      setAccuracyText("Starting calibration... Getting device location")
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const deviceLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setRawDeviceLocation(deviceLocation)
            
            // Set up map for calibration - center on raw location
            if (mapRef.current) {
              mapRef.current.setView([deviceLocation.lat, deviceLocation.lng], 18)
              
              // Create or update main marker at estimated calibrated position
              const calibratedPos = {
                lat: deviceLocation.lat + locationOffset.lat,
                lng: deviceLocation.lng + locationOffset.lng
              }
              
              if (markerRef.current) {
                markerRef.current.remove()
              }
              
              markerRef.current = L.marker([calibratedPos.lat, calibratedPos.lng], {
                draggable: true,
                icon: icons.current.green
              }).addTo(mapRef.current)
              
              // Update marker popup and events
              markerRef.current.bindPopup('<b>Your Actual Location</b><br>Drag to adjust').openPopup()
              
              markerRef.current.on('dragend', () => {
                const position = markerRef.current?.getLatLng()
                if (position && rawDeviceLocation) {
                  const newOffset = {
                    lat: position.lat - rawDeviceLocation.lat,
                    lng: position.lng - rawDeviceLocation.lng
                  }
                  setLocationOffset(newOffset)
                  
                  try {
                    localStorage.setItem('locationCalibrationOffset', JSON.stringify(newOffset))
                    setAccuracyText(`Calibration saved (${newOffset.lat.toFixed(6)}, ${newOffset.lng.toFixed(6)})`)
                  } catch (e) {
                    console.error('Error saving calibration:', e)
                  }
                  
                  onLocationSelected({ lat: position.lat, lng: position.lng })
                }
              })
            }
            
            setAccuracyText("Drag the green marker to your ACTUAL location")
            setCalibrationMode(true)
            setIsLocationFetching(false)
          },
          (error) => {
            console.error("Error getting location for calibration:", error)
            setAccuracyText("Could not start calibration. Location error.")
            setIsLocationFetching(false)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      }
    } else {
      // End calibration
      setCalibrationMode(false)
      setAccuracyText("Calibration saved. All future locations will be adjusted.")
      
      // Remove raw location marker
      if (rawLocationMarkerRef.current) {
        rawLocationMarkerRef.current.remove()
        rawLocationMarkerRef.current = null
      }
    }
  }
  
  // Reset calibration data
  const resetCalibration = () => {
    setLocationOffset({ lat: 0, lng: 0 })
    try {
      localStorage.removeItem('locationCalibrationOffset')
    } catch (e) {
      console.error('Error removing calibration offset:', e)
    }
    setAccuracyText("Calibration reset")
    
    // If we have a current raw location, update to it without offset
    if (rawDeviceLocation && mapRef.current && markerRef.current) {
      mapRef.current.setView([rawDeviceLocation.lat, rawDeviceLocation.lng], mapRef.current.getZoom())
      markerRef.current.setLatLng([rawDeviceLocation.lat, rawDeviceLocation.lng])
      onLocationSelected(rawDeviceLocation)
    }
  }

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Location controls */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1">
        {/* Buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={getHighPrecisionLocation}
            className={`px-2 py-1 text-xs rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 cursor-pointer`}
            disabled={isLocationFetching || calibrationMode}
          >
            {isLocationFetching ? (
              <>
                <Loader2 className="h-3 w-3 inline-block mr-1 animate-spin" /> Locating...
              </>
            ) : (
              <>
                <Navigation className="h-3 w-3 inline-block mr-1" /> Get Location
              </>
            )}
          </button>
          
          <button
            onClick={getUltraPreciseLocation}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              isUltraPrecise
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            disabled={isLocationFetching || calibrationMode}
          >
            {isUltraPrecise ? (
              <>
                <Loader2 className="h-3 w-3 inline-block mr-1 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Compass className="h-3 w-3 inline-block mr-1" /> Ultra-Precise
              </>
            )}
          </button>
          
          <button
            onClick={toggleCalibrationMode}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              calibrationMode
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            disabled={isLocationFetching && !calibrationMode}
          >
            {calibrationMode ? 'Save Calibration' : 'Calibrate Location'}
          </button>
        </div>
        
        {/* Reset calibration button */}
        {(locationOffset.lat !== 0 || locationOffset.lng !== 0) && (
          <button
            onClick={resetCalibration}
            className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer"
          >
            Reset calibration
          </button>
        )}
        
        {/* Status/help text */}
        {(accuracyText || calibrationMode) && (
          <div className="mt-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs rounded border border-gray-200">
            {calibrationMode ? (
              <>
                <strong>Calibration Mode:</strong> Drag the green marker to your actual location. Red marker shows device-reported location.
              </>
            ) : (
              accuracyText
            )}
          </div>
        )}
        
        {/* Offset display when calibration is active */}
        {(locationOffset.lat !== 0 || locationOffset.lng !== 0) && (
          <div className="px-2 py-1 bg-yellow-50/90 backdrop-blur-sm text-xs rounded border border-yellow-200 font-mono">
            Calibration: {locationOffset.lat.toFixed(6)}, {locationOffset.lng.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  )
} 