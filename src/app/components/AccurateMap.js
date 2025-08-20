"use client"

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Circle, LayersControl, ZoomControl, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2 } from 'lucide-react'

// Fix Leaflet icon issue in Next.js
let defaultIcon
let redIcon
let greenIcon
if (typeof window !== 'undefined') {
  defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
  
  redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
  
  greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

// Component to handle map events and marker updates
function MapEvents({ onLocationSelected }) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelected({ lat, lng })
    }
  })
  return null
}

// Component to update the map center when props change
function MapCenter({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom())
  }, [center, map])
  return null
}

export default function AccurateMap({ center, zoom, onLocationSelected, currentLocation }) {
  const [markerPosition, setMarkerPosition] = useState(currentLocation || center)
  const markerRef = useRef(null)
  const [locationAccuracy, setLocationAccuracy] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [accuracyText, setAccuracyText] = useState("")
  const mapRef = useRef(null)
  
  // Calibration system
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [rawDeviceLocation, setRawDeviceLocation] = useState(null)
  const [locationOffset, setLocationOffset] = useState({ lat: 0, lng: 0 })
  const [isUltraPrecise, setIsUltraPrecise] = useState(false)
  const rawMarkerRef = useRef(null)
  const accuracyCircleRef = useRef(null)
  
  // Function to get map instance
  const getMapInstance = (map) => {
    mapRef.current = map
  }
  
  // Update marker position when currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      setMarkerPosition(currentLocation)
    }
  }, [currentLocation])
  
  // Load saved calibration offset when component mounts
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
  
  // Handle marker events
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker) {
        const position = marker.getLatLng()
        const newPos = { lat: position.lat, lng: position.lng }
        setMarkerPosition(newPos)
        onLocationSelected(newPos)
        
        // If in calibration mode, update the calibration offset
        if (calibrationMode && rawDeviceLocation) {
          const newOffset = {
            lat: position.lat - rawDeviceLocation.lat,
            lng: position.lng - rawDeviceLocation.lng
          }
          setLocationOffset(newOffset)
          
          // Save offset to localStorage for future use
          try {
            localStorage.setItem('locationCalibrationOffset', JSON.stringify(newOffset))
            setAccuracyText(`Calibration saved (${newOffset.lat.toFixed(6)}, ${newOffset.lng.toFixed(6)})`)
          } catch (e) {
            console.error('Error saving calibration offset:', e)
          }
        }
      }
    }
  }
  
  // Start or stop calibration mode
  const toggleCalibrationMode = () => {
    if (!calibrationMode) {
      // Start calibration - first get current device location
      setIsLocating(true)
      setAccuracyText("Starting calibration... Getting device location")
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const deviceLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setRawDeviceLocation(deviceLocation)
            
            // Set up map for calibration
            if (mapRef.current) {
              mapRef.current.setView([deviceLocation.lat, deviceLocation.lng], 18)
            }
            
            setAccuracyText("Drag the green marker to your ACTUAL location")
            setCalibrationMode(true)
            setIsLocating(false)
          },
          (error) => {
            console.error("Error getting location for calibration:", error)
            setAccuracyText("Could not start calibration. Location error.")
            setIsLocating(false)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      }
    } else {
      // End calibration
      setCalibrationMode(false)
      setAccuracyText("Calibration completed")
    }
  }
  
  // Get high precision location (with calibration applied)
  const getHighPrecisionLocation = () => {
    if (!navigator.geolocation) {
      setAccuracyText("Geolocation is not supported by your browser")
      return
    }
    
    setIsLocating(true)
    setAccuracyText("Getting your location...")
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // Apply the calibration offset to raw coordinates
        const calibratedLat = latitude + locationOffset.lat
        const calibratedLng = longitude + locationOffset.lng
        
        const newLocation = { 
          lat: calibratedLat, 
          lng: calibratedLng 
        }
        
        console.log(`Raw location: ${latitude},${longitude} | Calibrated: ${calibratedLat},${calibratedLng} | Offset: ${locationOffset.lat},${locationOffset.lng}`)
        
        // Store raw location for potential calibration later
        setRawDeviceLocation({ lat: latitude, lng: longitude })
        
        // Update marker and notify parent component
        setMarkerPosition(newLocation)
        onLocationSelected(newLocation)
        setLocationAccuracy(accuracy)
        
        // Set map view with appropriate zoom based on accuracy
        if (mapRef.current) {
          const zoomLevel = accuracy < 50 ? 18 : 
                            accuracy < 100 ? 17 : 
                            accuracy < 500 ? 16 : 15
          mapRef.current.setView([newLocation.lat, newLocation.lng], zoomLevel)
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
        
        setIsLocating(false)
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
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
  
  // Ultra-precise location function with multiple attempts
  const getUltraPreciseLocation = () => {
    if (!navigator.geolocation) {
      setAccuracyText("Geolocation is not supported by your browser")
      return
    }
    
    setIsUltraPrecise(true)
    setIsLocating(true)
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
          setMarkerPosition(calibratedPos)
          onLocationSelected(calibratedPos)
          
          // Set appropriate zoom based on accuracy
          if (mapRef.current) {
            const zoomLevel = bestAccuracy < 20 ? 19 : 
                              bestAccuracy < 50 ? 18 : 
                              bestAccuracy < 100 ? 17 : 16
            mapRef.current.setView([calibratedPos.lat, calibratedPos.lng], zoomLevel)
          }
          
          setIsUltraPrecise(false)
          setIsLocating(false)
          setAccuracyText(`Best location found (±${bestAccuracy.toFixed(1)}m) with calibration`)
          setLocationAccuracy(bestAccuracy)
        } else {
          setAccuracyText("Could not determine your location with acceptable accuracy")
          setIsUltraPrecise(false)
          setIsLocating(false)
        }
        return
      }
      
      setAccuracyText(`Ultra-precise location attempt ${attemptIndex + 1}/${maxAttempts}...`)
      
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
            
            // Store raw location for potential calibration
            setRawDeviceLocation(rawLocation)
            
            // Update UI with progress
            const calibratedPos = {
              lat: latitude + locationOffset.lat,
              lng: longitude + locationOffset.lng
            }
            setMarkerPosition(calibratedPos)
            setLocationAccuracy(accuracy)
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
  }
  
  // Reset calibration data
  const resetCalibration = () => {
    setLocationOffset({ lat: 0, lng: 0 })
    try {
      localStorage.removeItem('locationCalibrationOffset')
    } catch (e) {
      console.error('Error removing calibration offset:', e)
    }
    setAccuracyText("Calibration reset to default")
  }

  return (
    <>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '0.375rem' }}
        zoomControl={false}
        ref={getMapInstance}
        whenCreated={(map) => {
          // Ensure map is fully initialized
          setTimeout(() => {
            try {
              // Make sure the map container is properly sized
              map.invalidateSize();
              console.log("Map initialized successfully");
            } catch (err) {
              console.error("Map initialization error:", err);
            }
          }, 100);
        }}
      >
        {/* Use try-catch for ZoomControl to prevent errors */}
        {typeof window !== 'undefined' && (
          <ZoomControl position="bottomright" />
        )}
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Humanitarian">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles &copy; <a href="https://www.hotosm.org/">HOT</a>'
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* Show raw device location marker in calibration mode */}
        {calibrationMode && rawDeviceLocation && (
          <Marker
            position={[rawDeviceLocation.lat, rawDeviceLocation.lng]}
            icon={redIcon}
          >
            <Popup>
              Device reported location (incorrect)
            </Popup>
          </Marker>
        )}
        
        {/* Main marker - draggable */}
        <Marker
          position={[markerPosition.lat, markerPosition.lng]}
          draggable={true}
          eventHandlers={eventHandlers}
          ref={markerRef}
          icon={calibrationMode ? greenIcon : defaultIcon}
        >
          <Popup>
            {calibrationMode ? "Drag to your actual location" : "Current location"}
          </Popup>
        </Marker>
        
        {/* Show accuracy circle when location accuracy is available */}
        {locationAccuracy > 0 && (
          <Circle
            center={[markerPosition.lat, markerPosition.lng]}
            radius={locationAccuracy}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
          />
        )}
        
        <MapEvents onLocationSelected={onLocationSelected} />
        <MapCenter center={markerPosition} />
      </MapContainer>
      
      {/* Location controls */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1">
        {/* Buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={getHighPrecisionLocation}
            className={`px-2 py-1 text-xs rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 cursor-pointer`}
            disabled={isLocating || calibrationMode}
          >
            {isLocating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 inline animate-spin" /> Locating...
              </>
            ) : (
              'Get Location'
            )}
          </button>
          
          <button
            onClick={getUltraPreciseLocation}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              isUltraPrecise
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            disabled={isLocating || calibrationMode}
          >
            Ultra-precise
          </button>
          
          <button
            onClick={toggleCalibrationMode}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
              calibrationMode
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
            disabled={isLocating && !calibrationMode}
          >
            {calibrationMode ? 'Save Calibration' : 'Calibrate'}
          </button>
        </div>
        
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
        
        {/* Coordinates display */}
        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs rounded border border-gray-200 font-mono">
          <span className="font-medium">Coordinates:</span> {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </div>
      </div>
    </>
  )
} 