import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useRunAnalysis, useReports } from './satellite/hooks/useRunAnalysis';
import type { AnalysisRequest } from './satellite/hooks/useRunAnalysis';
import AnalysisHistory from './satellite/AnalysisHistory';

interface Concession {
  id: string;
  name: string;
  code: string;
  owner: string;
  type: string;
  country: string;
  district_name: string;
  status: string;
  start_date: string | null;
  expiry_date: string | null;
  assets: string;
  geom: string;
}

const Satellite: React.FC = () => {
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [districtSearch, setDistrictSearch] = useState<string>('');
  const [currentView, setCurrentView] = useState<'analysis' | 'history'>('analysis');
  
  // Analysis parameters
  const [analysisType, setAnalysisType] = useState<'NDVI' | 'BSI' | 'WATER' | 'CHANGE'>('NDVI');
  const [startDate, setStartDate] = useState<string>('2025-04-01');
  const [endDate, setEndDate] = useState<string>('2025-05-26');
  const [detectionThreshold, setDetectionThreshold] = useState<number>(0.3);
  
  // Sequential location tracking
  const [locationSequence, setLocationSequence] = useState<number>(0);
  const [currentLocationInfo, setCurrentLocationInfo] = useState<any>(null);
  
  // Analysis hooks
  const { loading: analysisLoading, error: analysisError, data: analysisData, runAnalysis, reset } = useRunAnalysis();
  const { reports, loading: reportsLoading, fetchReports } = useReports();

  // Export state
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeAnalysis: true,
    includeMetadata: true,
    includeRecommendations: true
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Export functionality
  const handleExport = async () => {
    if (!analysisData) {
      alert('No analysis data available to export');
      return;
    }

    setExportLoading(true);
    try {
      if (exportFormat === 'pdf') {
        await exportToPDF();
      } else {
        // Handle other formats (GeoTIFF, Shapefile, KML)
        alert(`Export format ${exportFormat} is not yet implemented`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      // Prepare data for PDF generation API
      const reportData = {
        reportId: `SAT-${Date.now()}`,
        district: selectedDistrict || 'Unknown',
        analysisType: analysisType || 'change-detection',
        createdAt: new Date().toISOString(),
        startDate: startDate,
        endDate: endDate,
        isIllegal: analysisData.isIllegal || false,
        changeArea: analysisData.illegalAreaKm2 || 0, // Using illegalAreaKm2 as changeArea
        illegalAreaKm2: analysisData.illegalAreaKm2,
        vegetationLossPercent: analysisData.vegetationLossPercent,
        bareSoilIncreasePercent: analysisData.bareSoilIncreasePercent,
        waterTurbidity: analysisData.waterTurbidity,
        beforeImageUrl: exportOptions.includeImages ? analysisData.beforeImageURL : undefined,
        afterImageUrl: exportOptions.includeImages ? analysisData.afterImageURL : undefined,
        changeImageUrl: exportOptions.includeImages ? analysisData.ndviImageURL : undefined, // Using ndviImageURL as change image
        detectedSubAreas: exportOptions.includeAnalysis ? analysisData.detectedSubAreas : undefined,
        includeMetadata: exportOptions.includeMetadata,
        includeRecommendations: exportOptions.includeRecommendations,
        // Additional data from AnalysisReport
        centerLatitude: analysisData.centerLatitude,
        centerLongitude: analysisData.centerLongitude,
        totalAreaKm2: analysisData.totalAreaKm2,
        boundingBox: analysisData.boundingBox,
        currentLocation: analysisData.currentLocation,
        geojsonURL: analysisData.geojsonURL
      };

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satellite-analysis-${selectedDistrict}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  };

  // Fetch unique districts from concessions
  useEffect(() => {
    async function fetchDistricts() {
      try {
        const { data, error } = await supabase
          .from('concessions')
          .select('district_name')
          .not('district_name', 'is', null);
        
        if (error) {
          console.error('Error fetching districts:', error);
          return;
        }
        
        // Extract unique district names
        const uniqueDistricts = Array.from(new Set(data.map(item => item.district_name))).sort();
        setDistricts(uniqueDistricts as string[]);
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDistricts();
  }, []);

  // Filter districts based on search
  const filteredDistricts = districtSearch.length >= 3
    ? districts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))
    : districts;

  // Fetch concessions when district changes
  useEffect(() => {
    async function fetchConcessions() {
      if (!selectedDistrict || selectedDistrict === 'all') {
        setConcessions([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('concessions')
          .select('*')
          .eq('district_name', selectedDistrict);
        
        if (error) {
          console.error('Error fetching concessions:', error);
          return;
        }
        
        setConcessions(data as Concession[]);
      } catch (error) {
        console.error('Error fetching concessions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConcessions();
  }, [selectedDistrict]);

  // Handle running analysis with sequential location-hopping
  const handleRunAnalysis = async () => {
    if (!selectedDistrict || selectedDistrict === 'all') {
      alert('Please select a specific district first');
      return;
    }

    // Increment location sequence for next location
    const nextSequence = locationSequence + 1;
    setLocationSequence(nextSequence);
    
    console.log(`🎯 Starting analysis for location ${nextSequence} in ${selectedDistrict}`);

    const analysisParams: AnalysisRequest = {
      district: selectedDistrict,
      startDate,
      endDate,
      analysisType,
      detectionThreshold,
      locationSequence: nextSequence,
      forceNewLocation: true
    };

    try {
      await runAnalysis(analysisParams);
      
      // Update current location info from analysis result
      if (analysisData?.currentLocation) {
        setCurrentLocationInfo(analysisData.currentLocation);
        console.log(`✅ Analysis completed for ${analysisData.currentLocation.locationName}`);
      }
      
      // Refresh reports after successful analysis
      fetchReports();
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Load reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Debug logging
  console.log('Satellite component rendering, currentView:', currentView);

  // Render Analysis History view
  if (currentView === 'history') {
    console.log('Rendering AnalysisHistory component');
    return (
      <AnalysisHistory onBack={() => {
        console.log('Back button clicked, setting view to analysis');
        setCurrentView('analysis');
      }} />
    );
  }

  // Render main Analysis view
  console.log('Rendering main Analysis view');
  return (
    <div className="flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Satellite Analysis</h1>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="!rounded-button cursor-pointer whitespace-nowrap"
              onClick={() => {
                console.log('Analysis History button clicked');
                console.log('Current view before:', currentView);
                setCurrentView('history');
                console.log('Setting view to history');
              }}
            >
              <i className="fas fa-history mr-2"></i>
              Analysis History
            </Button>
            <Button 
              className="!rounded-button cursor-pointer whitespace-nowrap"
              onClick={handleRunAnalysis}
              disabled={analysisLoading || !selectedDistrict || selectedDistrict === 'all'}
            >
              <i className={`${analysisLoading ? 'fas fa-spinner fa-spin' : 'fas fa-play'} mr-2`}></i>
              {analysisLoading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto absolute left-0 top-0 h-full z-10">
          <div className="space-y-6">
            {/* District selection for concessions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Mining Concessions</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="district-select" className="text-xs text-gray-600">Filter by District</Label>
                  <Select
                    value={selectedDistrict}
                    onValueChange={(value) => {
                      setSelectedDistrict(value);
                      setDistrictSearch(''); // reset search on select
                    }}
                  >
                    <SelectTrigger id="district-select" className="mt-1 w-64 cursor-pointer">
                      <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent className="w-64 max-h-72 overflow-y-auto ">
                      {/* Search input inside dropdown */}
                      <div className="px-2 py-2 sticky top-0 z-10 bg-white">
                        <Input
                          autoFocus
                          type="text"
                          placeholder="Type at least 3 letters..."
                          className="mb-2"
                          value={districtSearch}
                          onChange={e => setDistrictSearch(e.target.value)}
                        />
                      </div>
                      <SelectItem value="all">All Districts</SelectItem>
                      {filteredDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : selectedDistrict && selectedDistrict !== 'all' && concessions.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    <div className="p-2 text-xs font-medium bg-gray-50 border-b">
                      Found {concessions.length} concessions in {selectedDistrict}
                    </div>
                    {concessions.map((concession) => (
                      <div key={concession.id} className="p-2 text-sm border-b last:border-0 hover:bg-gray-50">
                        <div className="font-medium">{concession.name}</div>
                        <div className="text-xs text-gray-500">
                          Owner: {concession.owner}
                        </div>
                        <div className="text-xs text-gray-500">
                          Code: {concession.code}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDistrict && selectedDistrict !== 'all' ? (
                  <div className="text-sm text-gray-500">No concessions found in this district</div>
                ) : null}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Analysis Type</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="ndvi" 
                    name="analysis-type" 
                    className="h-4 w-4 text-blue-600" 
                    checked={analysisType === 'NDVI'}
                    onChange={() => setAnalysisType('NDVI')}
                  />
                  <label htmlFor="ndvi" className="ml-2 text-sm text-gray-700 flex items-center">
                    NDVI (Vegetation)
                    <i className="fas fa-info-circle text-gray-400 ml-1 cursor-help" title="Normalized Difference Vegetation Index - Measures vegetation health and density"></i>
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="bsi" 
                    name="analysis-type" 
                    className="h-4 w-4 text-blue-600" 
                    checked={analysisType === 'BSI'}
                    onChange={() => setAnalysisType('BSI')}
                  />
                  <label htmlFor="bsi" className="ml-2 text-sm text-gray-700 flex items-center">
                    Bare Soil Index
                    <i className="fas fa-info-circle text-gray-400 ml-1 cursor-help" title="Detects exposed soil and mining activity areas"></i>
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="water" 
                    name="analysis-type" 
                    className="h-4 w-4 text-blue-600" 
                    checked={analysisType === 'WATER'}
                    onChange={() => setAnalysisType('WATER')}
                  />
                  <label htmlFor="water" className="ml-2 text-sm text-gray-700 flex items-center">
                    Water Analysis
                    <i className="fas fa-info-circle text-gray-400 ml-1 cursor-help" title="Monitors water quality and pollution levels"></i>
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="change" 
                    name="analysis-type" 
                    className="h-4 w-4 text-blue-600" 
                    checked={analysisType === 'CHANGE'}
                    onChange={() => setAnalysisType('CHANGE')}
                  />
                  <label htmlFor="change" className="ml-2 text-sm text-gray-700 flex items-center">
                    Change Detection
                    <i className="fas fa-info-circle text-gray-400 ml-1 cursor-help" title="Identifies changes in land use over time"></i>
                  </label>
                </div>
                
                
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Time Analysis</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="analysis-period" className="text-xs text-gray-600">Analysis Period</Label>
                  <Select defaultValue="custom">
                    <SelectTrigger id="analysis-period" className="mt-1">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                      <SelectItem value="quarter">Past Quarter</SelectItem>
                      <SelectItem value="year">Past Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date" className="text-xs text-gray-600">Start Date</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs text-gray-600">End Date</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="temporal-resolution" className="text-xs text-gray-600">Temporal Resolution</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger id="temporal-resolution" className="mt-1">
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Separator />
            
          </div>
        </div>
        <div className="flex-1 overflow-y-auto ml-72 h-full">
          <div className="min-h-full">
            {/* Error Display */}
            {analysisError && (
              <div className="p-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    Analysis Error: {analysisError}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Loading State */}
            {analysisLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Running satellite analysis...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
                </div>
              </div>
            )}
            
            {/* Analysis Results with Real Sentinel-2 Images and Coordinates */}
            {analysisData && (
              <div className="space-y-4">
                {/* Satellite Images Comparison */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-r border-gray-200 relative">
                    <img
                      src={analysisData.beforeImageURL}
                      alt="Sentinel-2 Before Analysis"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Failed to load before image:', analysisData.beforeImageURL);
                        e.currentTarget.src = '/placeholder-satellite.png';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                      🛰️ Sentinel-2 Before ({new Date(analysisData.startDate).toLocaleDateString()})
                    </div>
                    <div className="absolute bottom-2 left-2 bg-blue-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs">
                      Real Satellite Data
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src={analysisData.afterImageURL}
                      alt="Sentinel-2 After Analysis"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Failed to load after image:', analysisData.afterImageURL);
                        e.currentTarget.src = '/placeholder-satellite.png';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                      🛰️ Sentinel-2 After ({new Date(analysisData.endDate).toLocaleDateString()})
                    </div>
                    <div className="absolute bottom-2 left-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs">
                      Change Detection
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* No Analysis State */}
            {!analysisData && !analysisLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <i className="fas fa-satellite text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Analysis Results</h3>
                  <p className="text-gray-500 mb-4">Select a district and run analysis to see satellite imagery comparison</p>
                  <div className="flex flex-col items-center space-y-2">
                    <Button 
                      onClick={handleRunAnalysis}
                      disabled={!selectedDistrict || selectedDistrict === 'all'}
                      className="!rounded-button"
                    >
                      <i className="fas fa-satellite mr-2"></i>
                      {locationSequence === 0 ? 'Start Analysis' : `Analyze Location ${locationSequence + 1}`}
                    </Button>
                    
                    {locationSequence > 0 && (
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span>Current: Location {locationSequence}</span>
                        <Button 
                          onClick={() => {
                            setLocationSequence(0);
                            setCurrentLocationInfo(null);
                            reset();
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-6"
                        >
                          <i className="fas fa-redo mr-1"></i>
                          Reset to Location 1
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white pt-14 px-4">
            <Tabs defaultValue="results">
              <TabsList className="mb-4 cursor-pointer">
                <TabsTrigger value="results" >Analysis Results</TabsTrigger>
                <TabsTrigger value="metadata">Image Metadata</TabsTrigger>
                <TabsTrigger value="export">Export Options</TabsTrigger>
              </TabsList>
              <TabsContent value="results">
                <div className="space-y-4">
                  {analysisData ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Vegetation Loss</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end space-x-2">
                              <span className={`text-2xl font-bold ${
                                (analysisData.vegetationLossPercent || 0) > 20 ? 'text-red-600' : 
                                (analysisData.vegetationLossPercent || 0) > 10 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {analysisData.vegetationLossPercent?.toFixed(1) || '0'}%
                              </span>
                              <span className="text-sm text-gray-500">decrease</span>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Bare Soil Increase</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end space-x-2">
                              <span className={`text-2xl font-bold ${
                                (analysisData.bareSoilIncreasePercent || 0) > 30 ? 'text-red-600' : 
                                (analysisData.bareSoilIncreasePercent || 0) > 15 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {analysisData.bareSoilIncreasePercent?.toFixed(1) || '0'}%
                              </span>
                              <span className="text-sm text-gray-500">increase</span>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Water Turbidity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end space-x-2">
                              <span className={`text-2xl font-bold ${
                                analysisData.waterTurbidity === 'High' ? 'text-red-600' : 
                                analysisData.waterTurbidity === 'Medium' ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {analysisData.waterTurbidity || 'Low'}
                              </span>
                              <span className="text-sm text-gray-500">level</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Legality Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center space-x-2">
                              <div className={`h-3 w-3 rounded-full ${
                                analysisData.isIllegal ? 'bg-red-500' : 'bg-green-500'
                              }`}></div>
                              <span className={`font-medium ${
                                analysisData.isIllegal ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {analysisData.isIllegal ? 'Illegal Activity Detected' : 'Within Legal Boundaries'}
                              </span>
                            </div>
                            
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Analysis Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-sm">
                              <div>District: {analysisData.district}</div>
                              <div>Type: {analysisData.analysisType}</div>
                              <div>Date: {new Date(analysisData.createdAt).toLocaleDateString()}</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Targeted Sub-Area Analysis Results</h3>
                        <div className="space-y-4">
                          {/* Sub-Area Detection Summary */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Analysis Focus:</strong> Remote areas outside human settlements in {analysisData.district}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Detection Method:</strong> {analysisData.analysisType} analysis using Sentinel-2 satellite imagery
                            </p>
                          </div>
                          
                          {/* Detected Sub-Areas */}
                          {analysisData.detectedSubAreas && analysisData.detectedSubAreas.length > 0 ? (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">
                                🎯 Detected Activities in {analysisData.detectedSubAreas.length} Remote Sub-Areas:
                              </h4>
                              <div className="space-y-3">
                                {analysisData.detectedSubAreas.map((area: any, index: number) => (
                                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h5 className="font-medium text-sm text-gray-800">
                                          📍 {area.subAreaId}: {area.location_name}
                                        </h5>
                                        <div className="text-xs text-gray-600 mt-1">
                                          <div><strong>Coordinates:</strong> {area.center_latitude}°N, {area.center_longitude}°W</div>
                                          <div><strong>Area:</strong> {area.area_km2} km² ({area.area_m2.toLocaleString()} m²)</div>
                                          <div><strong>DMS:</strong> {area.coordinates_dms}</div>
                                          <div><strong>UTM:</strong> {area.utm_coordinates}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          area.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                          area.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {area.priority.toUpperCase()}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {area.detection_confidence} confidence
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Environmental Impact for this specific area */}
                                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                      <div className="bg-red-50 p-2 rounded">
                                        <div className="text-red-700 font-medium">Vegetation Loss</div>
                                        <div className="text-red-600">{(analysisData.vegetationLossPercent || 0).toFixed(1)}%</div>
                                      </div>
                                      <div className="bg-orange-50 p-2 rounded">
                                        <div className="text-orange-700 font-medium">Soil Exposure</div>
                                        <div className="text-orange-600">{(analysisData.bareSoilIncreasePercent || 0).toFixed(1)}%</div>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded">
                                        <div className="text-blue-700 font-medium">Water Impact</div>
                                        <div className="text-blue-600">{analysisData.waterTurbidity || 'Low'}</div>
                                      </div>
                                    </div>
                                    
                                    {/* Google Maps Link */}
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <a 
                                        href={`https://www.google.com/maps?q=${area.center_latitude},${area.center_longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                      >
                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                        View on Google Maps for Field Verification
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm text-green-700">
                                ✅ No illegal mining activity detected in remote areas of {analysisData.district} during the analysis period.
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                All detected activities are within legal concession boundaries.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {analysisData.isIllegal && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</h3>
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="fas fa-exclamation-circle text-red-600 text-xs"></i>
                              </div>
                              <p className="ml-2 text-sm text-gray-600">Flag as illegal mining site for enforcement</p>
                            </div>
                            <div className="flex items-start">
                              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="fas fa-calendar-check text-blue-600 text-xs"></i>
                              </div>
                              <p className="ml-2 text-sm text-gray-600">Schedule field inspection within 48 hours</p>
                            </div>
                            <div className="flex items-start">
                              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="fas fa-file-alt text-green-600 text-xs"></i>
                              </div>
                              <p className="ml-2 text-sm text-gray-600">Generate detailed report for EPA and Minerals Commission</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Current Location Information - Sequential Location-Hopping (LAST ITEM) */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 mt-6 mb-12">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          🎯 Current Analysis Location
                          {analysisData.currentLocation && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Location #{analysisData.currentLocation.sequenceNumber}
                            </span>
                          )}
                        </h4>
                        
                        {analysisData.currentLocation ? (
                          <div className="space-y-3">
                            {/* Location Header */}
                            <div className="bg-white p-3 rounded-md border border-blue-100">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-800">{analysisData.currentLocation.locationName}</h5>
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {analysisData.currentLocation.locationId}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                📍 Specific location within {analysisData.district} district
                              </div>
                            </div>
                            
                            {/* Coordinates Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Latitude:</span>
                                  <span className="font-mono text-gray-800">{analysisData.currentLocation.coordinates.latitude.toFixed(6)}°N</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Longitude:</span>
                                  <span className="font-mono text-gray-800">{analysisData.currentLocation.coordinates.longitude.toFixed(6)}°W</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Analysis Area:</span>
                                  <span className="font-medium text-gray-800">{analysisData.currentLocation.areaSize.km2} km²</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">DMS Format:</span>
                                  <span className="font-mono text-xs text-gray-800">{analysisData.currentLocation.coordinates.dms}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">UTM Zone:</span>
                                  <span className="font-mono text-xs text-gray-800">{analysisData.currentLocation.coordinates.utm}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Satellite:</span>
                                  <span className="font-medium text-green-600">Sentinel-2</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Next Location Hint */}
                            <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-yellow-800">
                              💡 Click "Run Analysis" again to analyze a different location within the same district
                            </div>
                          </div>
                        ) : (
                          /* Fallback to original coordinates display */
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">District:</span>
                                <span className="font-medium text-gray-800">{analysisData.district}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Analysis Type:</span>
                                <span className="font-medium text-blue-600">{analysisData.analysisType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Area:</span>
                                <span className="font-medium text-gray-800">{analysisData.totalAreaKm2?.toFixed(2) || 'N/A'} km²</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Center Lat:</span>
                                <span className="font-mono text-gray-800">{analysisData.centerLatitude?.toFixed(6) || 'N/A'}°N</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Center Lng:</span>
                                <span className="font-mono text-gray-800">{analysisData.centerLongitude?.toFixed(6) || 'N/A'}°W</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Satellite:</span>
                                <span className="font-medium text-green-600">Sentinel-2</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500">Run an analysis to see results here</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="metadata">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Before Image</h3>
                      <Table>
                        <TableBody>
                          {[
                            { label: 'Satellite', value: 'Sentinel-2' },
                            { label: 'Acquisition Date', value: startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
                            { label: 'Cloud Cover', value: '< 10%' },
                            { label: 'Resolution', value: '10m' },
                            { label: 'Bands', value: 'RGB, NIR, SWIR' },
                            { label: 'Image URL', value: analysisData?.beforeImageURL ? 'Available' : 'Not available' }
                          ].map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-xs">{item.label}</TableCell>
                              <TableCell className="text-xs">{item.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">After Image</h3>
                      <Table>
                        <TableBody>
                          {[
                            { label: 'Satellite', value: 'Sentinel-2' },
                            { label: 'Acquisition Date', value: endDate ? new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
                            { label: 'Cloud Cover', value: '< 10%' },
                            { label: 'Resolution', value: '10m' },
                            { label: 'Bands', value: 'RGB, NIR, SWIR' },
                            { label: 'Image URL', value: analysisData?.afterImageURL ? 'Available' : 'Not available' }
                          ].map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-xs">{item.label}</TableCell>
                              <TableCell className="text-xs">{item.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Location Information</h3>
                    <Table>
                      <TableBody>
                        {[
                          { label: 'District', value: selectedDistrict || 'Not specified' },
                          { label: 'Coordinates', value: analysisData?.currentLocation?.coordinates ? 
                            `${analysisData.currentLocation.coordinates.latitude.toFixed(4)}° N, ${Math.abs(analysisData.currentLocation.coordinates.longitude).toFixed(4)}° W` : 
                            analysisData?.centerLatitude && analysisData?.centerLongitude ? 
                            `${analysisData.centerLatitude.toFixed(4)}° N, ${Math.abs(analysisData.centerLongitude).toFixed(4)}° W` : 
                            'Not available' },
                          
                          { label: 'Location Name', value: analysisData?.currentLocation?.locationName || 'Analysis Area' },
                          { label: 'Analysis Type', value: analysisType?.toUpperCase() || 'CHANGE DETECTION' },
                          { label: 'Detection Status', value: analysisData?.isIllegal ? 'Illegal Activity Detected' : 'No Illegal Activity' },
                          { label: 'Coordinates (DMS)', value: analysisData?.currentLocation?.coordinates?.dms || 'Not available' },
                          { label: 'UTM Coordinates', value: analysisData?.currentLocation?.coordinates?.utm || 'Not available' }
                        ].map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-xs">{item.label}</TableCell>
                            <TableCell className="text-xs">{item.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="export">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Export Format</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="pdf" 
                          name="export-format" 
                          className="h-4 w-4 text-blue-600" 
                          checked={exportFormat === 'pdf'}
                          onChange={() => setExportFormat('pdf')}
                        />
                        <label htmlFor="pdf" className="ml-2 text-sm text-gray-700">PDF Report</label>
                      </div>
                      
                      
                      
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Include in Export</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="include-images" 
                          className="h-4 w-4 text-blue-600" 
                          checked={exportOptions.includeImages}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                        />
                        <label htmlFor="include-images" className="ml-2 text-sm text-gray-700">Before/After Images</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="include-analysis" 
                          className="h-4 w-4 text-blue-600" 
                          checked={exportOptions.includeAnalysis}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, includeAnalysis: e.target.checked }))}
                        />
                        <label htmlFor="include-analysis" className="ml-2 text-sm text-gray-700">Analysis Results</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="include-metadata" 
                          className="h-4 w-4 text-blue-600" 
                          checked={exportOptions.includeMetadata}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                        />
                        <label htmlFor="include-metadata" className="ml-2 text-sm text-gray-700">Image Metadata</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="include-recommendations" 
                          className="h-4 w-4 text-blue-600" 
                          checked={exportOptions.includeRecommendations}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                        />
                        <label htmlFor="include-recommendations" className="ml-2 text-sm text-gray-700">Recommendations</label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4 mb-8">
                   
                    <Button 
                      size="sm" 
                      className="!rounded-button cursor-pointer whitespace-nowrap"
                      onClick={handleExport}
                      disabled={!analysisData || exportLoading}
                    >
                      {exportLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download mr-2"></i>
                          Export Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Satellite; 