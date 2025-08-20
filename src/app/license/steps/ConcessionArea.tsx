"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faArrowRight, 
  faPenToSquare, 
  faFileArrowUp, 
  faKeyboard, 
  faMinus,
  faTrashCan, 
  faCircleInfo, 
  faTriangleExclamation,
  faUpload,
  faPen,
  faXmark,
  faLocationDot,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import { Search, Loader2, MapPin } from "lucide-react";

// Define proper interfaces for search results
interface SearchResult {
  name: string;
  lat: number;
  lng: number;
  type?: string;
  class?: string;
  importance?: number;
}

// Import Leaflet map dynamically to avoid SSR issues
const MapComponent = dynamic(() => import('@/app/components/AccurateMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[300px] bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 mt-2">Loading map...</p>
      </div>
    </div>
  )
});

interface ConcessionAreaProps {
  onNext: () => void;
  onBack: () => void;
  formData: {
    areaMethod: string;
    coordinates: string;
    region: string;
    district: string;
    areaDescription: string;
    confirmNoOverlap: boolean;
    [key: string]: any;
  };
  updateFormData: (data: {
    areaMethod?: string;
    coordinates?: string;
    region?: string;
    district?: string;
    areaDescription?: string;
    confirmNoOverlap?: boolean;
    [key: string]: any;
  }) => void;
}

const ConcessionArea: React.FC<ConcessionAreaProps> = ({ onNext, onBack, formData, updateFormData }) => {
  // State for map controls
  const [mapLoaded, setMapLoaded] = useState(false);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [manualCoordinates, setManualCoordinates] = useState<{lat: string, lng: string}>({
    lat: '',
    lng: ''
  });
  const [mapKey, setMapKey] = useState<string>(`map-${Math.random().toString(36).substring(2, 9)}`);
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // Initialize areaMethod to 'map' by default if not already set
  useEffect(() => {
    if (!formData.areaMethod) {
      updateFormData({ areaMethod: 'map' });
    }
  }, []);
  
  // Parse coordinates from form data if they exist
  useEffect(() => {
    if (formData.coordinates) {
      try {
        const parsedLocation = JSON.parse(formData.coordinates);
        if (Array.isArray(parsedLocation) && parsedLocation.length === 2) {
          setLocation(parsedLocation as [number, number]);
          setManualCoordinates({
            lat: parsedLocation[0].toString(),
            lng: parsedLocation[1].toString()
          });
        }
      } catch (e) {
        console.error("Error parsing coordinates:", e);
      }
    }
  }, [formData.coordinates]);
  
  // Initialize map loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import CSS files on client-side
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      setMapLoaded(true);
      
      // Force default to map view if not already set
      if (!formData.areaMethod || formData.areaMethod !== 'map') {
        updateFormData({ areaMethod: 'map' });
      }
    }
  }, []);

  // Effect to refresh map when changing method
  useEffect(() => {
    if (formData.areaMethod === 'map') {
      // Generate a new key to force refresh the map
      setMapKey(`map-${Math.random().toString(36).substring(2, 9)}`);
    }
  }, [formData.areaMethod]);
  
  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add a useEffect to handle changes to searchQuery
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Add a small delay to prevent too many API calls while typing
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length === 0) {
      // Clear results when search is empty
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);
  
  // Helper functions for region and district extraction
  const getRegionFromAddress = (address: string): string => {
    const regions = [
      "Western Region", "Central Region", "Greater Accra Region", "Volta Region", 
      "Eastern Region", "Ashanti Region", "Western North Region", "Ahafo Region", 
      "Bono Region", "Bono East Region", "Northern Region", "Savannah Region", 
      "North East Region", "Upper East Region", "Upper West Region", "Oti Region"
    ];
    
    for (const region of regions) {
      if (address.includes(region)) {
        return region;
      }
    }
    
    // Default or fallback
    if (address.includes("Accra")) return "Greater Accra Region";
    if (address.includes("Kumasi")) return "Ashanti Region";
    if (address.includes("Takoradi")) return "Western Region";
    if (address.includes("Tamale")) return "Northern Region";
    
    return "";
  };

  const getDistrictFromAddress = (address: string): string => {
    const districts = [
      "Tarkwa-Nsuaem", "Obuasi Municipal", "Accra Metropolitan", "Kumasi Metropolitan",
      "Sekondi-Takoradi Metropolitan", "Prestea Huni-Valley", "Birim North", "Bibiani"
    ];
    
    for (const district of districts) {
      if (address.includes(district)) {
        return district;
      }
    }
    
    return "";
  };
  
  // Search for locations
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchResults([]);
    setIsSearching(true);
    
    // Create a list of mining locations in Ghana
    const miningLocations = [
      { name: "Obuasi Gold Mines", lat: 6.2066, lng: -1.6689 },
      { name: "Tarkwa Gold Mine", lat: 5.3018, lng: -1.9886 },
      { name: "Prestea Mining Area", lat: 5.4323, lng: -2.1437 },
      { name: "Bibiani Gold Mine", lat: 6.4632, lng: -2.3295 },
      { name: "Akyem Gold Mine", lat: 6.3400, lng: -0.9900 },
      { name: "Chirano Gold Mine", lat: 6.2571, lng: -2.2129 },
      { name: "Damang Gold Mine", lat: 5.5158, lng: -1.8670 },
      { name: "Wassa Gold Mine", lat: 5.3126, lng: -1.9356 },
      { name: "Iduapriem Gold Mine", lat: 5.2926, lng: -2.0070 },
      { name: "Asanko Gold Mine", lat: 6.5821, lng: -1.7793 },
      { name: "Nzema Gold Mine", lat: 5.0626, lng: -2.4576 },
      { name: "Konongo Gold Mine", lat: 6.6167, lng: -1.2167 },
      { name: "Ahafo Gold Mine", lat: 7.0275, lng: -2.3417 },
      { name: "Kenyasi Mining Area", lat: 7.0071, lng: -2.3551 },
      { name: "Nsuta Manganese Mine", lat: 5.2815, lng: -1.9437 },
      { name: "Awaso Bauxite Mine", lat: 6.4693, lng: -2.4820 }
    ];
    
    // Check if query directly matches any mining location
    const directMatches = miningLocations.filter(location => 
      location.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    
    try {
      // Use OpenStreetMap Nominatim geocoding API to search for locations
      const searchTerm = encodeURIComponent(searchQuery.trim() + ", Ghana");
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchTerm}&countrycodes=gh&limit=10&addressdetails=1&accept-language=en`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Transform the response into our expected format
        const apiResults = data.map((item: any) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
          class: item.class,
          importance: item.importance
        }));
        
        // Combine API results with any direct matches from our mining locations
        let combinedResults = [...apiResults];
        
        // Add direct matches if they're not already in results (check by coordinates)
        directMatches.forEach(match => {
          if (!combinedResults.some(r => Math.abs(r.lat - match.lat) < 0.01 && Math.abs(r.lng - match.lng) < 0.01)) {
            combinedResults.push(match);
          }
        });
        
        // Sort by relevance (API results first, then direct matches)
        setSearchResults(combinedResults);
      } else {
        // If no API results, show mining locations as alternatives
        // Filter mining locations by fuzzy search to find potential matches
        const fuzzyMatches = miningLocations.filter(location => {
          // Split the search query into words
          const searchWords = searchQuery.toLowerCase().split(/\s+/);
          // Check if any word in the search query matches part of the location name
          return searchWords.some(word => 
            word.length > 2 && location.name.toLowerCase().includes(word)
          );
        });
        
        if (fuzzyMatches.length > 0) {
          setSearchResults([
            { name: `Search results for "${searchQuery}":`, lat: 0, lng: 0 },
            ...fuzzyMatches
          ]);
        } else {
          // If no fuzzy matches, show all mining locations
          setSearchResults([
            { name: `No exact results for "${searchQuery}". Try these mining areas:`, lat: 0, lng: 0 },
            ...miningLocations
          ]);
        }
      }
    } catch (error) {
      console.error("Error searching for location:", error);
      // In case of error, check for direct matches in our mining locations
      if (directMatches.length > 0) {
        setSearchResults([
          { name: `Found these mining areas matching "${searchQuery}":`, lat: 0, lng: 0 },
          ...directMatches
        ]);
      } else {
        // If no direct matches, show common mining cities as fallback
        setSearchResults([
          { name: "Error searching. Try these major mining cities:", lat: 0, lng: 0 },
          { name: "Obuasi", lat: 6.2066, lng: -1.6689 },
          { name: "Tarkwa", lat: 5.3018, lng: -1.9886 },
          { name: "Prestea", lat: 5.4323, lng: -2.1437 },
          { name: "Bibiani", lat: 6.4632, lng: -2.3295 },
          { name: "Kenyasi", lat: 7.0071, lng: -2.3551 },
          { name: "Accra", lat: 5.6037, lng: -0.1870 },
          { name: "Kumasi", lat: 6.6885, lng: -1.6244 }
        ]);
      }
    }
    
    setIsSearching(false);
    setShowSearchResults(true);
  };
  
  // Select a search result
  const selectSearchResult = (result: SearchResult) => {
    if (result.lat === 0) return;
    
    // Update the location state with the selected coordinates
    setLocation([result.lat, result.lng]);
    setSearchQuery(result.name);
    setShowSearchResults(false);
    
    // Update manual coordinates
    setManualCoordinates({
      lat: result.lat.toString(),
      lng: result.lng.toString()
    });
    
    // Get additional location details through reverse geocoding for more accurate region/district
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${result.lat}&lon=${result.lng}&zoom=18&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.address) {
          const region = data.address.state || data.address.region || "";
          const district = data.address.county || data.address.city_district || data.address.district || data.address.city || "";
          
          // Update form data with coordinates and region/district
          updateFormData({
            coordinates: JSON.stringify([result.lat, result.lng]),
            region: region || formData.region,
            district: district || formData.district
          });
        } else {
          // If reverse geocoding doesn't provide address details, just update coordinates
          updateFormData({
            coordinates: JSON.stringify([result.lat, result.lng])
          });
        }
      })
      .catch(err => {
        console.error("Error getting detailed location info:", err);
        // If error, just update coordinates
        updateFormData({
          coordinates: JSON.stringify([result.lat, result.lng])
        });
      });
    
    // Refresh map
    setMapKey(`map-${Math.random().toString(36).substring(2, 9)}`);
  };
  
  // Handle location selection from map
  const handleLocationSelected = (newLocation: { lat: number, lng: number }) => {
    // Round to 6 decimal places for consistency
    const latRounded = parseFloat(newLocation.lat.toFixed(6));
    const lngRounded = parseFloat(newLocation.lng.toFixed(6));
    
    setLocation([latRounded, lngRounded]);
    
    // Update the manual coordinates
    setManualCoordinates({
      lat: latRounded.toString(),
      lng: lngRounded.toString()
    });
    
    // Update form data with basic coordinates
    updateFormData({
      coordinates: JSON.stringify([latRounded, lngRounded])
    });
    
    // Get location name and address details through reverse geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latRounded}&lon=${lngRounded}&zoom=18&addressdetails=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          setSearchQuery(data.display_name);
          
          // Try to extract region and district info
          if (data.address) {
            const region = data.address.state || data.address.region || "";
            const district = data.address.county || data.address.city_district || data.address.district || data.address.city || "";
            
            // Update form data with location details
            updateFormData({
              coordinates: JSON.stringify([latRounded, lngRounded]),
              region: region || formData.region,
              district: district || formData.district
            });
          }
        }
      })
      .catch(err => {
        console.error("Error getting location name:", err);
      });
  };
  
  // Handle manual coordinate changes
  const handleManualCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    setManualCoordinates({
      ...manualCoordinates,
      [field]: value
    });
    
    // Update location if both coordinates are valid
    if (field === 'lat' && manualCoordinates.lng || field === 'lng' && manualCoordinates.lat) {
      const lat = field === 'lat' ? parseFloat(value) : parseFloat(manualCoordinates.lat);
      const lng = field === 'lng' ? parseFloat(value) : parseFloat(manualCoordinates.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setLocation([lat, lng]);
        updateFormData({
          coordinates: JSON.stringify([lat, lng])
        });
        
        // Update the map
        setMapKey(`map-${Math.random().toString(36).substring(2, 9)}`);
      }
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLoadingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setLocation(newLocation);
        
        setManualCoordinates({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString()
        });
        
        updateFormData({
          coordinates: JSON.stringify(newLocation)
        });
        
        // Get location name through reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`)
          .then(response => response.json())
          .then(data => {
            if (data && data.display_name) {
              setSearchQuery(data.display_name);
              
              // Try to extract region and district info
              if (data.address) {
                const region = data.address.state || data.address.region || "";
                const district = data.address.county || data.address.city_district || data.address.district || data.address.city || "";
                
                // Update form data with location details
                updateFormData({
                  coordinates: JSON.stringify(newLocation),
                  region: region || formData.region,
                  district: district || formData.district
                });
              }
            }
          })
          .catch(err => {
            console.error("Error getting location name:", err);
          });
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(`Unable to retrieve your location: ${error.message}`);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Add state for location error and loading
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Define Concession Area</h3>
      <p className="text-gray-600 mb-6">Specify the location for which you are applying for mineral rights:</p>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
          <Button
            onClick={() => updateFormData({ areaMethod: 'map' })}
            variant={formData.areaMethod === 'map' ? 'default' : 'outline'}
            className={`flex-1 !rounded-button whitespace-nowrap cursor-pointer ${formData.areaMethod === 'map' ? 'bg-indigo-600 hover:bg-indigo-700' : ''} text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 min-w-0`}
          >
            <FontAwesomeIcon icon={faLocationDot} className="sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Select on Map</span>
          </Button>
          <Button
            onClick={() => updateFormData({ areaMethod: 'upload' })}
            variant={formData.areaMethod === 'upload' ? 'default' : 'outline'}
            className={`flex-1 !rounded-button whitespace-nowrap cursor-pointer ${formData.areaMethod === 'upload' ? 'bg-indigo-600 hover:bg-indigo-700' : ''} text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 min-w-0`}
          >
            <FontAwesomeIcon icon={faFileArrowUp} className="sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Upload GPS Data</span>
          </Button>
          <Button
            onClick={() => updateFormData({ areaMethod: 'manual' })}
            variant={formData.areaMethod === 'manual' ? 'default' : 'outline'}
            className={`flex-1 !rounded-button whitespace-nowrap cursor-pointer ${formData.areaMethod === 'manual' ? 'bg-indigo-600 hover:bg-indigo-700' : ''} text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 min-w-0`}
          >
            <FontAwesomeIcon icon={faKeyboard} className="sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Enter Manually</span>
          </Button>
        </div>
        
        {/* Method description */}
        <div className="mb-4 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg">
          {formData.areaMethod === 'map' && (
            <div className="flex items-start">
              <FontAwesomeIcon icon={faLocationDot} className="text-indigo-500 mt-1 mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Select your mining site location on the map</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Simply click anywhere on the map to place a marker at your desired mining location.
                </p>
              </div>
            </div>
          )}
          
          {formData.areaMethod === 'upload' && (
            <div className="flex items-start">
              <FontAwesomeIcon icon={faFileArrowUp} className="text-indigo-500 mt-1 mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Upload GPS coordinates</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  If you already have the GPS coordinates of your mining site, upload them here.
                </p>
              </div>
            </div>
          )}
          
          {formData.areaMethod === 'manual' && (
            <div className="flex items-start">
              <FontAwesomeIcon icon={faKeyboard} className="text-indigo-500 mt-1 mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Manually enter coordinates</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Enter the latitude and longitude coordinates of your mining site.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {(formData.areaMethod === 'map' || !formData.areaMethod) && typeof window !== 'undefined' && (
          <div>
            {/* Search input */}
            <div className="mb-3 sm:mb-4">
              <div className="relative">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search for any location in Ghana"
                      className="flex-1 h-7 sm:h-8 text-xs sm:text-sm pl-6 sm:pl-7"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.trim().length >= 3 && setShowSearchResults(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Search className="absolute left-1.5 sm:left-2 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={handleSearch}
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <span className="text-xs">Search</span>
                    )}
                  </Button>
                </div>
                
                {/* Search results dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-50 max-h-[120px] sm:max-h-[150px] overflow-auto"
                  >
                    <ul className="py-1">
                      {searchResults.map((result, index) => (
                        <li 
                          key={index} 
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs border-b last:border-b-0 ${
                            result.lat === 0 ? 'bg-gray-50 text-gray-500 font-medium' : ''
                          }`}
                          onClick={() => {
                            if (result.lat !== 0) {
                              selectSearchResult(result);
                            }
                          }}
                        >
                          <div className="font-medium">{result.name}</div>
                          {result.lat !== 0 && (
                            <div className="text-[8px] sm:text-[10px] text-gray-500 flex items-center">
                              <MapPin className="h-1.5 w-1.5 sm:h-2 sm:w-2 mr-0.5 sm:mr-1" />
                              {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`relative w-full h-[250px] sm:h-[300px] overflow-hidden rounded-md border border-gray-200`}>
              {mapLoaded ? (
                <MapComponent
                  key={mapKey}
                  center={location ? {lat: location[0], lng: location[1]} : {lat: 5.6037, lng: -0.1870}}
                  zoom={10}
                  currentLocation={location ? {lat: location[0], lng: location[1]} : null}
                  onLocationSelected={(loc: { lat: number, lng: number }) => {
                    // Convert the location object to the format expected by handleLocationSelected
                    handleLocationSelected(loc);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-2 mb-3 sm:mb-4">
              <Button 
                variant="outline"
                size="sm" 
                className="text-[10px] sm:text-xs h-7 sm:h-8 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                )}
                {isLoadingLocation ? "Getting location..." : "Use my current location"}
              </Button>
            </div>
            
            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded p-2 sm:p-3 mb-3 sm:mb-4 text-xs sm:text-sm text-red-700">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1 sm:mr-1.5" />
                {locationError}
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 mt-0.5 mr-2 sm:mr-3 h-3 w-3 sm:h-5 sm:w-5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-blue-800">Location Selection Instructions</h4>
                  <div className="text-[10px] sm:text-xs text-blue-700 mt-1 sm:mt-2">
                    <p>Click anywhere on the map to select the location of your mining site. You can zoom in for more precision.</p>
                    <p className="mt-1 sm:mt-2">Use the location controls on the map for more accurate positioning.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="latitude" className="text-xs sm:text-sm">Latitude</Label>
                <Input 
                  id="latitude" 
                  value={location ? location[0].toFixed(6) : ''} 
                  onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
                  placeholder="e.g. 5.6037"
                  className="cursor-pointer h-7 sm:h-9 text-xs sm:text-sm" 
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs sm:text-sm">Longitude</Label>
                <Input 
                  id="longitude" 
                  value={location ? location[1].toFixed(6) : ''} 
                  onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
                  placeholder="e.g. -0.1870"
                  className="cursor-pointer h-7 sm:h-9 text-xs sm:text-sm" 
                />
              </div>
            </div>
          </div>
        )}
        
        {formData.areaMethod === 'upload' && (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
                  <FontAwesomeIcon icon={faFileArrowUp} className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Upload a file with your GPS coordinates
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Supported formats: GPX, KML, CSV
                  </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 whitespace-nowrap cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Upload Coordinates
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {formData.areaMethod === 'manual' && (
          <div className="mb-3 sm:mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <Label htmlFor="manual-latitude" className="text-xs sm:text-sm">Latitude</Label>
                <Input 
                  id="manual-latitude" 
                  placeholder="e.g. 5.6037" 
                  className="cursor-pointer h-7 sm:h-9 text-xs sm:text-sm"
                  value={manualCoordinates.lat}
                  onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="manual-longitude" className="text-xs sm:text-sm">Longitude</Label>
                <Input 
                  id="manual-longitude" 
                  placeholder="e.g. -0.1870" 
                  className="cursor-pointer h-7 sm:h-9 text-xs sm:text-sm"
                  value={manualCoordinates.lng}
                  onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
                />
              </div>
            </div>
            
            {/* Show preview map if coordinates are entered */}
            {mapLoaded && location && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-800 mb-2">Location Preview</h4>
                <div className="w-full h-36 sm:h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <MapComponent
                    key={`preview-${mapKey}`}
                    center={{lat: location[0], lng: location[1]}}
                    zoom={10}
                    currentLocation={{lat: location[0], lng: location[1]}}
                    onLocationSelected={handleLocationSelected}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
        <h4 className="font-medium text-gray-800 text-sm sm:text-base">Additional Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="region" className="text-xs sm:text-sm">Region</Label>
            <Select 
              value={formData.region || undefined}
              onValueChange={(value) => updateFormData({ region: value })}
            >
              <SelectTrigger className="w-full cursor-pointer h-7 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Western Region">Western Region</SelectItem>
                <SelectItem value="Ashanti Region">Ashanti Region</SelectItem>
                <SelectItem value="Eastern Region">Eastern Region</SelectItem>
                <SelectItem value="Central Region">Central Region</SelectItem>
                <SelectItem value="Greater Accra Region">Greater Accra Region</SelectItem>
                <SelectItem value="Western North Region">Western North Region</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="district" className="text-xs sm:text-sm">District</Label>
            <Select 
              value={formData.district || undefined}
              onValueChange={(value) => updateFormData({ district: value })}
            >
              <SelectTrigger className="w-full cursor-pointer h-7 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tarkwa-Nsuaem">Tarkwa-Nsuaem</SelectItem>
                <SelectItem value="Obuasi Municipal">Obuasi Municipal</SelectItem>
                <SelectItem value="Birim North">Birim North</SelectItem>
                <SelectItem value="Prestea Huni-Valley">Prestea Huni-Valley</SelectItem>
                <SelectItem value="Bibiani">Bibiani</SelectItem>
                <SelectItem value="Accra Metropolitan">Accra Metropolitan</SelectItem>
                <SelectItem value="Kumasi Metropolitan">Kumasi Metropolitan</SelectItem>
                <SelectItem value="Sekondi-Takoradi Metropolitan">Sekondi-Takoradi Metropolitan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="area-description" className="text-xs sm:text-sm">Area Description</Label>
          <Textarea
            id="area-description"
            placeholder="Provide a brief description of the mining site and surrounding area"
            className="resize-none cursor-pointer text-xs sm:text-sm"
            value={formData.areaDescription}
            onChange={(e) => updateFormData({ areaDescription: e.target.value })}
          />
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="confirm-overlap" 
            checked={formData.confirmNoOverlap} 
            onCheckedChange={(checked) => updateFormData({ confirmNoOverlap: checked === true })}
            className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4"
          />
          <Label htmlFor="confirm-overlap" className="text-[10px] sm:text-xs cursor-pointer">
            I confirm that the specified location does not overlap with any existing concessions, protected areas, or restricted zones.
          </Label>
        </div>
      </div>
      
      {/* Mobile-optimized navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-between sm:hidden">
        <div className="flex space-x-2">
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium cursor-pointer"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3" />
        </Button>
      </div>
      
      {/* Desktop navigation buttons */}
      <div className="hidden sm:flex justify-between mt-8">
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="text-gray-700 !rounded-button whitespace-nowrap hover:bg-gray-100 border-gray-300 text-sm px-3 py-2 h-9 cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="!rounded-button whitespace-nowrap text-sm px-3 py-2 h-9 cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button whitespace-nowrap text-sm px-4 py-2 h-9 cursor-pointer"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      {/* Spacer for mobile to prevent content from being hidden behind fixed buttons */}
      <div className="h-16 sm:hidden"></div>
    </div>
  );
};

export default ConcessionArea; 