"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Check,
  Shield,
  Info,
  Search,
  FileText,
  Plus,
  X,
  Leaf,
  Save,
  ArrowLeft,
  ArrowRight,
  Send,
  Lock,
  MapPin,
  Compass,
  Upload,
  Trash2,
  UserCircle,
  ClipboardList,
  Camera,
  Loader2,
  Navigation,
} from "lucide-react"
import dynamic from "next/dynamic"
import { supabase } from '@/lib/supabase';
import { storeReport } from '@/lib/reports-db';
import { processMultipleFilesForPrivacy, getProcessingSummary } from '@/lib/clientImagePrivacy';
import { useSession } from 'next-auth/react';

// Import Leaflet map dynamically to avoid SSR issues
const MapComponent = dynamic(() => import('./AccurateMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[300px] bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
})

// Import report components
import ReportTypeSelection from "@/app/report/ReportTypeSelection"
import IncidentDetails from "@/app/report/IncidentDetails"
import LocationInformation from "@/app/report/LocationInformation"
import EvidenceUpload from "@/app/report/EvidenceUpload"
import ReportConfirmation from "@/app/report/ReportConfirmation"

export default function ReportPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [reportType, setReportType] = useState<string>("")
  const [threatLevel, setThreatLevel] = useState<number[]>([2])
  const [locationTab, setLocationTab] = useState<string>("map")
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [reportId, setReportId] = useState<string>("")
  const [progress, setProgress] = useState<number>(25)
  const [files, setFiles] = useState<File[]>([])
  const [blurFaces, setBlurFaces] = useState<boolean>(true)
  const [stripLocation, setStripLocation] = useState<boolean>(true)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSelectionError, setLocationSelectionError] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<Array<{name: string, lat: number, lng: number}>>([])
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false)
  const [userTypeError, setUserTypeError] = useState<boolean>(false)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const [mapKey, setMapKey] = useState<string>(`map-${Math.random().toString(36).substring(2, 9)}`)
  const [miningType, setMiningType] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [miningTypeError, setMiningTypeError] = useState<boolean>(false)
  
  // Site description fields
  const [specificSiteName, setSpecificSiteName] = useState<string>('')
  const [siteDescription, setSiteDescription] = useState<string>('')
  const [nearbyLandmarks, setNearbyLandmarks] = useState<string>('')
  const [siteDescriptionError, setSiteDescriptionError] = useState<boolean>(false)
  
  // Security: Honeypot fields for bot detection (should remain empty)
  const [website, setWebsite] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [emailConfirm, setEmailConfirm] = useState<string>('')

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setProgress(currentStep * 25)
  }, [currentStep])

  useEffect(() => {
    if (locationTab === "map") {
      // Generate a new key to ensure a fresh map instance
      setMapKey(`map-${Math.random().toString(36).substring(2, 9)}`)
    }
  }, [locationTab])

  // Add a useEffect to handle changes to searchQuery
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      // Auto-suggest after user types at least 3 characters
      handleSearch();
    }
  }, [searchQuery]);

  // Clear location selection error when a location is selected
  useEffect(() => {
    if (currentLocation) {
      setLocationSelectionError(false);
    }
  }, [currentLocation]);

  const handleNext = () => {
    // Reset errors
    setLocationSelectionError(false)
    setUserTypeError(false)
    setMiningTypeError(false)
    setSiteDescriptionError(false)

    if (currentStep === 1) {
      if (!reportType) {
        setUserTypeError(true)
        return
      }
    }

    if (currentStep === 3) {
      console.log('Step 3 validation - Current Location:', currentLocation);
      console.log('Step 3 validation - Location Tab:', locationTab);
      console.log('Step 3 validation - Site Name:', specificSiteName);
      console.log('Step 3 validation - Site Description:', siteDescription);
      
      if (!currentLocation) {
        console.log('Validation failed: No location selected');
        setLocationSelectionError(true)
        return
      }
      
      // Site description is only compulsory for region/district selection (approximate location)
      // For map and coordinates (precise location), site description is optional
      if (locationTab === 'region') {
        // Check for compulsory site description fields only for region/district selection
        if (!specificSiteName.trim() || !siteDescription.trim()) {
          console.log('Validation failed: Missing site description fields (required for region/district selection)');
          console.log('Site Name empty:', !specificSiteName.trim());
          console.log('Site Description empty:', !siteDescription.trim());
          setSiteDescriptionError(true)
          return
        }
      } else {
        console.log('Map/coordinates selected - site description is optional');
      }
      
      console.log('Step 3 validation passed - proceeding to next step');
    }

    if (currentStep < 4) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1)
      setProgress(25 * (currentStep + 1))
    } else {
      console.log('Final step reached - submitting report');
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    // Validate mining type before submission
    if (!miningType) {
      setCurrentStep(2)
      setMiningTypeError(true)
      window.scrollTo(0, 0)
      return
    }

    // Add logging to debug the values of miningType and description
    console.log('Mining Type before submission:', miningType);
    console.log('Description before submission:', description);

    // Generate a unique report ID using the same format as the API
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newReportId = `RPT-${timestamp}-${randomPart}`;
    setReportId(newReportId);
    
    try {
      // Upload files to Supabase storage if there are any
      let uploadedFilePaths: string[] = [];
      
      if (files.length > 0) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('reportId', newReportId);
        
        // Add all files to the form data
        files.forEach(file => {
          formData.append('files', file);
        });
        
        // Upload files to Supabase storage via the API route
        const uploadResponse = await fetch('/api/reports/evidence', {
          method: 'POST',
          body: formData,
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          uploadedFilePaths = uploadResult.filePaths;
          console.log('Files uploaded successfully:', uploadedFilePaths);
        } else {
          console.error('Error uploading files:', uploadResult.error);
        }
      }
      
      // Create comprehensive location description from site details
      const locationParts = [];
      if (specificSiteName) locationParts.push(`Site: ${specificSiteName}`);
      if (siteDescription) locationParts.push(`Description: ${siteDescription}`);
      if (nearbyLandmarks) locationParts.push(`Landmarks: ${nearbyLandmarks}`);
      if (searchQuery) locationParts.push(`Search: ${searchQuery}`);
      
      const locationDescription = locationParts.length > 0 
        ? locationParts.join(' | ')
        : `Precise coordinates: ${currentLocation?.lat.toFixed(6)}, ${currentLocation?.lng.toFixed(6)}`;
      
      // Create the report data object with conditional user tracking
      const reportData = {
        report_id: newReportId,
        report_type: reportType, // Use the actual selected report type: 'anonymous' or 'registered'
        threat_level: threatLevel[0],
        mining_activity_type: miningType,
        incident_description: description,
        location_lat: currentLocation?.lat,
        location_lng: currentLocation?.lng,
        location_description: locationDescription,
        evidence_files: uploadedFilePaths, // Use the actual paths from Supabase
        blur_faces: blurFaces,
        strip_location: stripLocation,
        // For registered users: include email in user_id field
        // For anonymous users: leave user_id empty for privacy
        user_id: (reportType === 'registered' && session?.user?.email) ? session.user.email : undefined,
        // Security: Honeypot fields for bot detection
        website: website,
        phone: phone,
        email_confirm: emailConfirm
      };
      
      // Debug: Log the report data being sent to API
      console.log('Report data being sent to API:', {
        report_type: reportData.report_type,
        threat_level: reportData.threat_level,
        threat_level_type: typeof reportData.threat_level,
        mining_activity_type: reportData.mining_activity_type,
        incident_description: reportData.incident_description?.length,
        location_lat: reportData.location_lat,
        location_lng: reportData.location_lng,
        location_description: reportData.location_description?.length,
        evidence_files: reportData.evidence_files?.length
      });
      
      // Store the report using secure API endpoint
      const response = await fetch('/api/secure-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          // Security: Include honeypot fields for bot detection
          website,
          phone,
          email_confirm: emailConfirm,
        }),
      });
      
      const result = await response.json();
      
      console.log('Report submission result:', result);
      
      if (!response.ok || !result.success) {
        console.error('Failed to store report:', result.error);
        
        // Handle specific error cases
        if (response.status === 429) {
          alert('Too many reports submitted. Please wait 15 minutes before submitting another report.');
          return;
        } else if (response.status === 400) {
          // Get detailed error information from API response
          const errorData = await response.json();
          console.error('API Validation Error:', errorData);
          alert(`Invalid report data: ${errorData.error}${errorData.details ? '\nDetails: ' + errorData.details.join(', ') : ''}`);
          return;
        } else {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          alert(`Failed to submit report (${response.status}). Please try again later.`);
          return;
        }
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      // Still show success to the user even if database storage failed
    }
    
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      if (files.length + newFiles.length <= 5) {
        try {
          // Process files for privacy protection (strip metadata, add noise)
          console.log('Processing files for privacy protection...');
          const processedResults = await processMultipleFilesForPrivacy(newFiles, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
            addNoise: true,
            noiseIntensity: 0.3,
            stripMetadata: true
          });
          
          // Extract processed files
          const processedFiles = processedResults.map(result => result.file);
          
          // Get processing summary for user feedback
          const summary = getProcessingSummary(processedResults);
          
          // Log privacy protection results
          console.log('Privacy Protection Applied:', {
            totalFiles: summary.totalFiles,
            metadataStripped: summary.metadataStripped,
            noiseAdded: summary.noiseAdded,
            sizeReduction: `${summary.sizeReduction.toFixed(1)}%`,
            processingSuccess: summary.processingSuccess
          });
          
          // Show user feedback about privacy protection
          if (summary.metadataStripped > 0 || summary.noiseAdded > 0) {
            console.log(`🛡️ Privacy Protection: ${summary.metadataStripped} files had metadata stripped, ${summary.noiseAdded} images had noise added for forensic protection`);
          }
          
          setFiles([...files, ...processedFiles]);
        } catch (error) {
          console.error('Error processing files for privacy:', error);
          // Fallback to original files if processing fails
          setFiles([...files, ...newFiles]);
        }
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setReportType("")
    setMiningType("")
    setDescription("")
    setThreatLevel([2])
    setLocationTab("map")
    setIsSubmitted(false)
    setReportId("")
    setFiles([])
    setBlurFaces(true)
    setStripLocation(true)
    setCurrentLocation(null)
    setLocationError(null)
    setLocationSelectionError(false)
    setSearchQuery("")
    setSearchResults([])
    setUserTypeError(false)
    setMiningTypeError(false)
    // Reset site description fields
    setSpecificSiteName('')
    setSiteDescription('')
    setNearbyLandmarks('')
    setSiteDescriptionError(false)
    // Reset security fields
    setWebsite('')
    setPhone('')
    setEmailConfirm('')
    window.scrollTo(0, 0)
  }
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }
    
    setIsLoadingLocation(true)
    setLocationError(null)
    
    // Use high accuracy positioning options for precise location
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,   // Longer timeout for better accuracy
      maximumAge: 0     // Don't use cached position
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        
        // Fetch location name from coordinates using our API
        const reverseGeocode = async (lat: number, lng: number) => {
          try {
            const response = await fetch(`/api/locations/reverse?lat=${lat}&lng=${lng}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.address) {
                setSearchQuery(data.address);
              }
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            // Fallback to basic coordinates display
            setSearchQuery(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        };
        
        reverseGeocode(position.coords.latitude, position.coords.longitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError("Unable to retrieve your location. Error: " + error.message)
        setIsLoadingLocation(false)
      },
      options
    )
  }
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setSearchResults([]);
    setShowSearchResults(true);
    
    try {
      const query = searchQuery.trim();
      
      // Show loading state
      setSearchResults([{ name: "Searching...", lat: 0, lng: 0, type: 'loading' }]);
      
      // Use our API route for location search (avoids CORS issues)
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=8`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.results) {
        // Filter out help messages and invalid coordinates
        const validResults = data.results.filter((result: any) => 
          result.lat !== 0 || result.lng !== 0 || result.type === 'help'
        );
        
        if (validResults.length > 0) {
          setSearchResults(validResults);
        } else {
          setSearchResults([
            { name: `No locations found for "${query}"`, lat: 0, lng: 0, type: 'help' },
            { name: "Try searching for a city, town, or landmark in Ghana", lat: 0, lng: 0, type: 'help' }
          ]);
        }
      } else {
        throw new Error(data.error || 'Search failed');
      }
      
    } catch (error) {
      console.error("Error searching for location:", error);
      
      // Show helpful error message
      setSearchResults([
        { name: "Search temporarily unavailable", lat: 0, lng: 0, type: 'error' },
        { name: "Please try again or use the map to select a location", lat: 0, lng: 0, type: 'help' }
      ]);
    }
  };
  
  const selectSearchResult = (result: {name: string, lat: number, lng: number, type?: string}) => {
    // Don't select help, error, or loading results
    if (result.type === 'help' || result.type === 'error' || result.type === 'loading') {
      return;
    }
    
    // Don't select results with invalid coordinates
    if (result.lat === 0 && result.lng === 0) {
      return;
    }
    
    // Update the currentLocation state with the selected coordinates
    setCurrentLocation({ lat: result.lat, lng: result.lng });
    setSearchQuery(result.name);
    setShowSearchResults(false);
    
    // Clear any location errors
    setLocationError(null);
    setLocationSelectionError(false);
    
    // Generate a new map key to force refresh the map with new location
    setMapKey(`map-${Math.random().toString(36).substring(2, 9)}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ReportTypeSelection 
            reportType={reportType} 
            setReportType={setReportType} 
            userTypeError={userTypeError}
          />
        )
      case 2:
        return (
          <IncidentDetails 
            threatLevel={threatLevel} 
            setThreatLevel={setThreatLevel}
            miningType={miningType}
            setMiningType={setMiningType}
            description={description}
            setDescription={setDescription}
            miningTypeError={miningTypeError}
          />
        )
      case 3:
        return (
          <LocationInformation
            locationTab={locationTab}
            setLocationTab={setLocationTab}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            isLoadingLocation={isLoadingLocation}
            setIsLoadingLocation={setIsLoadingLocation}
            locationError={locationError}
            setLocationError={setLocationError}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            showSearchResults={showSearchResults}
            setShowSearchResults={setShowSearchResults}
            mapKey={mapKey}
            setMapKey={setMapKey}
            handleSearch={handleSearch}
            getCurrentLocation={getCurrentLocation}
            selectSearchResult={selectSearchResult}
            locationSelectionError={locationSelectionError}
            specificSiteName={specificSiteName}
            setSpecificSiteName={setSpecificSiteName}
            siteDescription={siteDescription}
            setSiteDescription={setSiteDescription}
            nearbyLandmarks={nearbyLandmarks}
            setNearbyLandmarks={setNearbyLandmarks}
            siteDescriptionError={siteDescriptionError}
          />
        )
      case 4:
        return (
          <EvidenceUpload
            files={files}
            handleFileChange={handleFileChange}
            removeFile={removeFile}
            blurFaces={blurFaces}
            setBlurFaces={setBlurFaces}
            stripLocation={stripLocation}
            setStripLocation={setStripLocation}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <main className="container mx-auto px-3 py-8 max-w-4xl">
        <div className="absolute top-3 right-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white border-none rounded-button whitespace-nowrap"
                >
                  <X className="mr-1 h-3 w-3" />
                  Quick Exit
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Quickly leave this page</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="mb-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-1">Report Illegal Mining Activity</h1>
            <p className="text-green-600 text-base">Help protect our environment by reporting illegal activities</p>
          </div>
          
          {!isSubmitted && (
            <Alert className="bg-green-50 border border-green-200 mb-6 py-2">
              <Shield className="h-3 w-3 mr-1 text-green-600" />
              <AlertTitle className="text-green-800 text-sm">Your safety is our priority</AlertTitle>
              <AlertDescription className="text-green-700 text-xs">
                Do not put yourself at risk to gather information. All reports are encrypted and your identity is
                protected.
              </AlertDescription>
            </Alert>
          )}
          {!isSubmitted && (
            <div className="mb-16">
              <div className="relative">
                <Progress value={progress} className="h-1.5 bg-green-100" />
                <div className="absolute top-3 w-full flex justify-between">
                  <div
                    className={`flex flex-col items-center ${currentStep >= 1 ? "text-green-600" : "text-green-400"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 1 ? "bg-green-600 text-white" : "bg-green-100"
                      }`}
                    >
                      <UserCircle className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 hidden md:block">User Type</span>
                  </div>
                  <div
                    className={`flex flex-col items-center ${currentStep >= 2 ? "text-green-600" : "text-green-400"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 2 ? "bg-green-600 text-white" : "bg-green-100"
                      }`}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 hidden md:block">Details</span>
                  </div>
                  <div
                    className={`flex flex-col items-center ${currentStep >= 3 ? "text-green-600" : "text-green-400"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 3 ? "bg-green-600 text-white" : "bg-green-100"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 hidden md:block">Location</span>
                  </div>
                  <div
                    className={`flex flex-col items-center ${currentStep >= 4 ? "text-green-600" : "text-green-400"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 4 ? "bg-green-600 text-white" : "bg-green-100"
                      }`}
                    >
                      <Camera className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] mt-1 hidden md:block">Evidence</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Card className="mb-5 border-green-100 shadow-md">
            <CardContent className="pt-4 px-4 sm:px-6">
              {/* Security: Hidden honeypot fields for bot detection */}
              <div style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
                <input
                  type="text"
                  name="website"
                  placeholder="Website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="email"
                  name="email_confirm"
                  placeholder="Confirm Email"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              
              {isSubmitted ? (
                <ReportConfirmation reportId={reportId} resetForm={resetForm} />
              ) : (
                renderStepContent()
              )}
            </CardContent>
            {!isSubmitted && (
              <CardFooter className="flex justify-between pt-2 pb-4 px-4 sm:px-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="rounded-button whitespace-nowrap border-green-200 text-green-700 hover:bg-green-50 text-sm py-1 h-8"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="rounded-button whitespace-nowrap bg-green-600 hover:bg-green-700 text-white text-sm py-1 h-8"
                >
                  {currentStep < 4 ? (
                    <>
                      Next
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Submit Report
                      <Send className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100">
            <div className="flex items-start space-x-3">
              <div className="text-green-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-green-800 mb-1 text-sm">Secure Reporting</h3>
                <p className="text-xs text-green-600">
                  This portal uses end-to-end encryption. Your IP address is not logged, and all metadata is stripped
                  from uploaded files.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
