import React, { useRef, useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Compass, Search, Navigation, Loader2, Info, Shield, AlertCircle, MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { loadGhanaDistricts, getUniqueRegions, getDistrictsByRegion, findDistrictByName, type GhanaDistrict } from '@/lib/ghanaDistricts';

// Import Leaflet map dynamically to avoid SSR issues
const MapComponent = dynamic(() => import('../components/AccurateMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[300px] bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
})

interface LocationInformationProps {
  locationTab: string;
  setLocationTab: (tab: string) => void;
  currentLocation: { lat: number, lng: number } | null;
  setCurrentLocation: (location: { lat: number, lng: number } | null) => void;
  isLoadingLocation: boolean;
  setIsLoadingLocation: (loading: boolean) => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Array<{name: string, lat: number, lng: number}>;
  setSearchResults: (results: Array<{name: string, lat: number, lng: number}>) => void;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  mapKey: string;
  setMapKey: (key: string) => void;
  handleSearch: () => void;
  getCurrentLocation: () => void;
  selectSearchResult: (result: {name: string, lat: number, lng: number}) => void;
  locationSelectionError?: boolean;
  // New props for site description
  specificSiteName: string;
  setSpecificSiteName: (name: string) => void;
  siteDescription: string;
  setSiteDescription: (description: string) => void;
  nearbyLandmarks: string;
  setNearbyLandmarks: (landmarks: string) => void;
  siteDescriptionError?: boolean;
}

export default function LocationInformation({
  locationTab, setLocationTab, currentLocation, setCurrentLocation,
  isLoadingLocation, setIsLoadingLocation, locationError, setLocationError,
  searchQuery, setSearchQuery, searchResults, setSearchResults,
  showSearchResults, setShowSearchResults, mapKey, setMapKey,
  handleSearch, getCurrentLocation, selectSearchResult, locationSelectionError,
  specificSiteName, setSpecificSiteName, siteDescription, setSiteDescription,
  nearbyLandmarks, setNearbyLandmarks, siteDescriptionError
}: LocationInformationProps) {
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // Region/District selection state
  const [districts, setDistricts] = useState<GhanaDistrict[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [availableDistricts, setAvailableDistricts] = useState<GhanaDistrict[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  
  // Remove local state since these are now props from parent

  // Load districts data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingDistricts(true);
      try {
        const districtsData = await loadGhanaDistricts();
        setDistricts(districtsData);
        setRegions(getUniqueRegions(districtsData));
      } catch (error) {
        console.error('Failed to load districts data:', error);
        setLocationError('Failed to load districts data');
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    loadData();
  }, []);

  // Update available districts when region changes
  useEffect(() => {
    if (selectedRegion) {
      const regionDistricts = getDistrictsByRegion(districts, selectedRegion);
      setAvailableDistricts(regionDistricts);
      setSelectedDistrict(''); // Reset district selection
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedRegion, districts]);

  // Handle district selection and update coordinates
  const handleDistrictSelection = (districtName: string) => {
    setSelectedDistrict(districtName);
    const district = findDistrictByName(districts, districtName);
    if (district && district.coordinates) {
      setCurrentLocation(district.coordinates);
      setLocationError(null);
      // Update map to show the new location
      setMapKey(Date.now().toString());
    }
  };

  // Reset region/district selection
  const resetRegionDistrictSelection = () => {
    setSelectedRegion('');
    setSelectedDistrict('');
    setCurrentLocation(null);
    setSpecificSiteName('');
    setSiteDescription('');
    setNearbyLandmarks('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Location Information</h2>
      {locationSelectionError && (
        <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200 py-2 mb-2">
          <AlertCircle className="h-4 w-4 mr-1 text-red-600" />
          <AlertTitle className="text-xs font-medium">Location is required</AlertTitle>
          <AlertDescription className="text-xs">
            Please select a location on the map, search for a location, or enter coordinates manually before proceeding.
          </AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="map" value={locationTab} onValueChange={setLocationTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="region" className="text-xs py-1.5">
            <MapIcon className="mr-1.5 h-3 w-3" />
            Region/District
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs py-1.5">
            <MapPin className="mr-1.5 h-3 w-3" />
            Use Map
          </TabsTrigger>
          <TabsTrigger value="coordinates" className="text-xs py-1.5">
            <Compass className="mr-1.5 h-3 w-3" />
            Enter Coordinates
          </TabsTrigger>
        </TabsList>
        <TabsContent value="region" className="space-y-3 pt-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="region-select" className="text-sm font-medium">
                  Select Region
                </Label>
                <Select 
                  value={selectedRegion} 
                  onValueChange={setSelectedRegion}
                  disabled={isLoadingDistricts}
                >
                  <SelectTrigger className={`mt-1 h-8 text-sm ${locationSelectionError ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder={isLoadingDistricts ? "Loading regions..." : "Choose a region"} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region} className="text-sm">
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="district-select" className="text-sm font-medium">
                  Select District
                </Label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={handleDistrictSelection}
                  disabled={!selectedRegion || isLoadingDistricts}
                >
                  <SelectTrigger className={`mt-1 h-8 text-sm ${locationSelectionError ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder={!selectedRegion ? "Select region first" : "Choose a district"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDistricts.map((district) => (
                      <SelectItem key={district.fid} value={district.district} className="text-sm">
                        {district.district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedRegion && selectedDistrict && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                  <div className="font-medium text-green-800 mb-1">District Selected</div>
                  <div className="text-green-700">
                    <div><strong>Region:</strong> {selectedRegion}</div>
                    <div><strong>District:</strong> {selectedDistrict}</div>
                    {currentLocation && (
                      <div className="text-xs mt-1 text-green-600">
                        District Center: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </div>
                    )}
                   
                  </div>
                </div>
                
                <div className={`bg-blue-100 border rounded p-3 ${siteDescriptionError ? 'border-red-300 bg-red-50' : 'border-blue-200'}`}>
                  <div className={`font-medium mb-2 text-sm ${siteDescriptionError ? 'text-red-800' : 'text-amber-800'}`}>
                    Specify Exact Mining Site Location *
                    {siteDescriptionError && (
                      <span className="text-red-600 text-xs ml-2">(Required)</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="site-name" className={`text-xs font-medium ${siteDescriptionError ? 'text-red-700' : 'text-amber-700'}`}>
                        Site Name or Area * (e.g., "Near Tarkwa Forest", "Behind Chief's Palace")
                      </Label>
                      <Input 
                        id="site-name"
                        placeholder="Enter specific site name or area (Required)"
                        className={`mt-1 h-8 text-sm bg-white ${siteDescriptionError && !specificSiteName ? 'border-red-300' : ''}`}
                        value={specificSiteName}
                        onChange={(e) => setSpecificSiteName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="site-description" className={`text-xs font-medium ${siteDescriptionError ? 'text-red-700' : 'text-amber-700'}`}>
                        Site Description * (e.g., "Open pit mining near river", "Excavators working in farmland")
                      </Label>
                      <Input 
                        id="site-description"
                        placeholder="Describe what you see at the mining site (Required)"
                        className={`mt-1 h-8 text-sm bg-white ${siteDescriptionError && !siteDescription ? 'border-red-300' : ''}`}
                        value={siteDescription}
                        onChange={(e) => setSiteDescription(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="landmarks" className={`text-xs font-medium ${siteDescriptionError ? 'text-red-700' : 'text-amber-700'}`}>
                        Nearby Landmarks (e.g., "500m from Tarkwa-Bogoso road", "Next to Bonsa River")
                      </Label>
                      <Input 
                        id="landmarks"
                        placeholder="Mention nearby roads, rivers, buildings, or known places"
                        className="mt-1 h-8 text-sm bg-white"
                        value={nearbyLandmarks}
                        onChange={(e) => setNearbyLandmarks(e.target.value)}
                      />
                    </div>
                  </div>
                  {siteDescriptionError && (
                    <div className="mt-2 text-xs text-red-600">
                      Please provide both site name and description - this information is required to help authorities locate the illegal mining site.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm" 
                className="text-xs h-7 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={resetRegionDistrictSelection}
                disabled={!selectedRegion && !selectedDistrict}
              >
                Reset Selection
              </Button>
            </div>
            
            
            
            <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> District selection only provides general area coordinates. For authorities to locate the illegal mining site, please mark the exact location on the map.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="map" className="space-y-3 pt-2">
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
            <p className="text-xs text-red-700 flex items-start">
              <AlertCircle className="h-3 w-3 mr-1 text-red-600 mt-0.5" />
              <span>
                <strong>Click on the map</strong> to mark the exact location where illegal mining is happening. 
                Be as precise as possible - this helps authorities locate and stop the illegal activity.
              </span>
            </p>
          </div>
          <div className={`relative w-full h-[300px] overflow-hidden rounded-md border ${locationSelectionError ? 'border-red-300 ring-1 ring-red-500' : ''}`}>
            {locationTab === "map" && typeof window !== 'undefined' && (
              <MapComponent 
                key={mapKey} 
                center={currentLocation || { lat: 5.6037, lng: -0.1870 }}
                zoom={currentLocation ? 15 : 10}
                currentLocation={currentLocation}
                onLocationSelected={(location: { lat: number; lng: number }) => setCurrentLocation(location)}
              />
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search for any location, landmark, or place..."
                    className={`flex-1 h-8 text-sm pl-7 ${locationSelectionError ? 'border-red-300' : ''}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length >= 3 && setShowSearchResults(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
                <Button variant="outline" size="sm" className="h-8" onClick={handleSearch}>
                  <span className="text-xs">Search</span>
                </Button>
              </div>
              
              {showSearchResults && searchResults.length > 0 && (
                <div 
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-10 max-h-[150px] overflow-auto"
                >
                  <ul className="py-1">
                    {searchResults.map((result, index) => {
                      // Determine result type and clickability
                      const resultType = (result as any).type || 'location';
                      const isClickable = result.lat !== 0 || result.lng !== 0;
                      const isValidLocation = isClickable && resultType !== 'help' && resultType !== 'error' && resultType !== 'loading';
                      
                      // Get appropriate icon and styling based on type
                      let icon = <MapPin className="h-3 w-3 mt-0.5" />;
                      let iconColor = 'text-gray-400';
                      let bgColor = 'bg-gray-50';
                      let textColor = 'text-gray-600';
                      let cursor = 'cursor-default';
                      
                      if (resultType === 'loading') {
                        icon = <Loader2 className="h-3 w-3 mt-0.5 animate-spin" />;
                        iconColor = 'text-blue-500';
                        bgColor = 'bg-blue-50';
                        textColor = 'text-blue-700';
                      } else if (resultType === 'error') {
                        icon = <AlertCircle className="h-3 w-3 mt-0.5" />;
                        iconColor = 'text-red-500';
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-700';
                      } else if (resultType === 'help') {
                        icon = <Info className="h-3 w-3 mt-0.5" />;
                        iconColor = 'text-amber-500';
                        bgColor = 'bg-amber-50';
                        textColor = 'text-amber-700';
                      } else if (isValidLocation) {
                        icon = <MapPin className="h-3 w-3 mt-0.5" />;
                        iconColor = 'text-blue-500';
                        bgColor = 'hover:bg-gray-100';
                        textColor = 'text-gray-900';
                        cursor = 'cursor-pointer';
                      }
                      
                      return (
                        <li 
                          key={index} 
                          className={`px-3 py-1.5 text-xs border-b last:border-b-0 ${bgColor} ${textColor} ${cursor}`}
                          onClick={() => isValidLocation && selectSearchResult(result)}
                        >
                          <div className="flex items-start space-x-2">
                            <span className={iconColor}>{icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{result.name}</div>
                              {isValidLocation && (
                                <div className="text-[10px] text-gray-500 flex items-center mt-0.5">
                                  <span>📍 {result.lat.toFixed(4)}, {result.lng.toFixed(4)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline"
                size="sm" 
                className="text-xs h-7 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3 mr-1" />
                )}
                {isLoadingLocation ? "Getting location..." : "Use my current location"}
              </Button>
            </div>
            
            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                {locationError}
              </div>
            )}

            {currentLocation && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                <div className="font-medium text-green-800">Mining Site Location Marked</div>
                <div className="text-green-700">
                  Precise Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </div>
                <div className="text-green-600 text-[10px] mt-1">
                  ✓ These coordinates will help authorities locate the illegal mining site
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="coordinates" className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </Label>
              <Input 
                id="latitude" 
                type="number" 
                step="any"
                placeholder="e.g., 5.6037" 
                className={`mt-1 h-8 text-sm ${locationSelectionError ? 'border-red-300' : ''}`}
                value={currentLocation?.lat || ""} 
                onChange={(e) => {
                  const value = e.target.value;
                  setCurrentLocation(prev => ({
                    ...(prev || { lat: 0, lng: 0 }),
                    lat: value === "" ? 0 : parseFloat(value)
                  }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </Label>
              <Input 
                id="longitude" 
                type="number" 
                step="any"
                placeholder="e.g., -0.1870" 
                className={`mt-1 h-8 text-sm ${locationSelectionError ? 'border-red-300' : ''}`}
                value={currentLocation?.lng || ""} 
                onChange={(e) => {
                  const value = e.target.value;
                  const newLng = value === "" ? 0 : parseFloat(value);
                  setCurrentLocation({
                    lat: currentLocation?.lat || 0,
                    lng: newLng
                  });
                }}
              />
            </div>
          </div>
          <Button 
            variant="outline"
            size="sm" 
            className="text-xs h-7 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 w-full"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3 mr-1" />
            )}
            {isLoadingLocation ? "Getting location..." : "Use my current location"}
          </Button>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs flex items-start">
              <Info className="h-3 w-3 mr-1 text-blue-500 mt-0.5" />
              <span>
                You can find coordinates using Google Maps by right-clicking on a location and selecting "What's
                here?"
              </span>
            </p>
          </div>
        </TabsContent>
      </Tabs>
      <Alert className="py-2">
        <Shield className="h-3 w-3 mr-1 text-amber-500" />
        <AlertTitle className="text-xs font-medium">Privacy Protection</AlertTitle>
        <AlertDescription className="text-[10px]">
          Your location data is encrypted and only accessible to authorized personnel. We recommend using
          approximate coordinates for your safety.
        </AlertDescription>
      </Alert>
    </div>
  );
} 