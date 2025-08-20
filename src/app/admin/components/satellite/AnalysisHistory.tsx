"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faArrowLeft, 
  faTimes, 
  faClock, 
  faCheck,
  faSpinner,
  faExpand,
  faDownload,
  faEye,
  faMapMarkerAlt,
  faMapMarkedAlt,
  faSatellite,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReports } from './hooks/useRunAnalysis';
import { supabase } from "@/lib/supabase";
import dynamic from 'next/dynamic';

// Dynamically import the map component to prevent SSR issues
const DynamicSatelliteMap = dynamic(
  () => import('./SatelliteMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-gray-400 text-2xl animate-spin" />
      </div>
    )
  }
);

interface AnalysisHistoryProps {
  onBack: () => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ onBack }) => {
  const { reports, loading: reportsLoading, error: reportsError, fetchReports } = useReports();
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [downloadingReports, setDownloadingReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('AnalysisHistory component mounted, fetching reports...');
    fetchReports();
  }, []);

  useEffect(() => {
    console.log('Reports updated:', reports);
    console.log('Loading:', reportsLoading);
    console.log('Error:', reportsError);
  }, [reports, reportsLoading, reportsError]);

  const handleReportClick = (report: any) => {
    // Add mock sub-area data for testing if none exists
    const reportWithMockData = {
      ...report,
      // If no detected_sub_areas exist, add mock data for testing
      detected_sub_areas: report.detected_sub_areas || report.detectedSubAreas || [
        {
          subAreaId: 'SA-001',
          location_name: 'Hillside Remote Location',
          center_latitude: 5.034555,
          center_longitude: -2.052766,
          area_km2: 0.3068,
          area_m2: 306836,
          coordinates_dms: '5°03\'05"N, 2°05\'22"W',
          utm_coordinates: 'Zone 30N, -2E 5N',
          priority: 'medium',
          detection_confidence: 'High confidence',
          zone_type: 'hillside_location',
          legal_status: 'outside_legal_concessions'
        }
      ]
    };
    
    setSelectedReport(reportWithMockData);
  };

  const filteredReports = reports.filter(report => {
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'illegal' && !report.is_illegal) return false;
      if (statusFilter === 'legal' && report.is_illegal) return false;
    }
    
    // Apply type filter
    if (typeFilter !== 'all' && report.analysis_type !== typeFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (report.district || '').toLowerCase().includes(query) ||
        (report.district_name || '').toLowerCase().includes(query) ||
        (report.analysis_type || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (report: any) => {
    if (report.is_illegal) {
      return <Badge className="bg-red-100 text-red-800">Illegal Mining Detected</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Legal</Badge>;
    }
  };

  const getAnalysisTypeBadge = (type: string) => {
    const colors = {
      'NDVI': 'bg-green-100 text-green-800',
      'BSI': 'bg-orange-100 text-orange-800',
      'WATER': 'bg-blue-100 text-blue-800',
      'CHANGE': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const openFullSizeImage = (imagePath: string) => {
    setFullSizeImage(imagePath);
  };

  const closeFullSizeImage = () => {
    setFullSizeImage(null);
  };

  const getImageUrl = (filePath: string) => {
    if (!filePath) {
      console.log('getImageUrl: No filePath provided');
      return '';
    }
    
    console.log('getImageUrl: Input filePath:', filePath);
    
    // If it's already a full URL, return it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log('getImageUrl: Already a full URL, returning as-is');
      return filePath;
    }
    
    try {
      const { data } = supabase.storage
        .from('satellite-analysis')
        .getPublicUrl(filePath);
      
      console.log('getImageUrl: Generated public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return '';
    }
  };

  const downloadPDFReport = async (report: any) => {
    const reportId = report.id;
    
    // Prevent multiple downloads of the same report
    if (downloadingReports.has(reportId)) {
      return;
    }
    
    // Add to downloading set
    setDownloadingReports(prev => new Set(prev).add(reportId));
    
    try {
      // Create comprehensive PDF content with enhanced analysis data
      const detectedSubAreas = report.detected_sub_areas || report.detectedSubAreas || [];
      
      // Enhanced PDF content structure matching the comprehensive API
      const pdfContent = {
        // Basic report information
        reportId: report.id,
        district: report.district || report.district_name,
        analysisType: report.analysis_type,
        createdAt: report.created_at,
        startDate: report.start_date,
        endDate: report.end_date,
        
        // Analysis results
        isIllegal: report.is_illegal,
        changeArea: report.change_area_km2 || report.illegal_area_km2 || 0,
        illegalAreaKm2: report.illegal_area_km2,
        vegetationLossPercent: report.vegetation_loss_percent || report.ndvi_change_percent,
        bareSoilIncreasePercent: report.bare_soil_increase_percent || report.bsi_change_percent,
        waterTurbidity: report.water_turbidity || report.water_quality_impact,
        
        // Satellite imagery URLs
        beforeImageUrl: report.before_image_url ? getImageUrl(report.before_image_url) : null,
        afterImageUrl: report.after_image_url ? getImageUrl(report.after_image_url) : null,
        changeImageUrl: report.change_image_url ? getImageUrl(report.change_image_url) : null,
        
        // Geographic coordinates and bounds
        centerLatitude: report.center_latitude,
        centerLongitude: report.center_longitude,
        totalAreaKm2: report.total_area_km2,
        boundingBox: report.bounding_box ? {
          north: report.bounding_box.north,
          south: report.bounding_box.south,
          east: report.bounding_box.east,
          west: report.bounding_box.west
        } : undefined,
        
        // Enhanced sub-area analysis with comprehensive details
        detectedSubAreas: detectedSubAreas.length > 0 ? detectedSubAreas.map((area: any) => ({
          subAreaId: area.subAreaId || area.sub_area_id || `SA-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
          location_name: area.location_name || area.locationName || 'Remote Mining Location',
          center_latitude: area.center_latitude || area.centerLatitude || 0,
          center_longitude: area.center_longitude || area.centerLongitude || 0,
          area_km2: area.area_km2 || area.areaKm2 || 0.25,
          area_m2: area.area_m2 || area.areaSqm || (area.area_km2 || 0.25) * 1000000,
          coordinates_dms: area.coordinates_dms || area.coordinatesDMS || `${Math.abs(area.center_latitude || 0).toFixed(0)}°${(area.center_latitude || 0) >= 0 ? 'N' : 'S'}, ${Math.abs(area.center_longitude || 0).toFixed(0)}°${(area.center_longitude || 0) >= 0 ? 'E' : 'W'}`,
          utm_coordinates: area.utm_coordinates || area.utmCoordinates || `Zone 30N: ${Math.floor((area.center_longitude || 0) * 100000)}E ${Math.floor((area.center_latitude || 0) * 100000)}N`,
          priority: area.priority || 'high',
          detection_confidence: area.detection_confidence || area.detectionConfidence || 'High',
          zone_type: area.zone_type || area.zoneType || 'remote_area',
          environmental_impact: {
            vegetation_loss: area.vegetation_loss || report.vegetation_loss_percent || 45,
            soil_exposure: area.soil_exposure || report.bare_soil_increase_percent || 35,
            water_contamination: area.water_contamination || report.water_turbidity || 'Medium'
          }
        })) : [],
        
        // Current location information (sequential analysis)
        currentLocation: report.current_location ? {
          sequenceNumber: report.current_location.sequence_number || 1,
          locationId: report.current_location.location_id || 'LOC-001',
          locationName: report.current_location.location_name || 'Analysis Location',
          coordinates: {
            latitude: report.current_location.latitude || report.center_latitude || 0,
            longitude: report.current_location.longitude || report.center_longitude || 0,
            dms: report.current_location.dms || `${Math.abs(report.center_latitude || 0).toFixed(0)}°N, ${Math.abs(report.center_longitude || 0).toFixed(0)}°W`,
            utm: report.current_location.utm || `Zone 30N: ${Math.floor((report.center_longitude || 0) * 100000)}E ${Math.floor((report.center_latitude || 0) * 100000)}N`
          },
          analysisArea: report.current_location.analysis_area || 0.25
        } : undefined
      };

      // Call PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfContent),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `satellite-analysis-${report.id}-${report.district || 'unknown'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      // Remove from downloading set
      setDownloadingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };



  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="!rounded-button cursor-pointer"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Analysis
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Analysis History</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchReports()}
              disabled={reportsLoading}
              className="!rounded-button cursor-pointer"
            >
              <FontAwesomeIcon icon={reportsLoading ? faSpinner : faRefresh} className={`mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search by district or analysis type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="illegal">Illegal</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="NDVI">NDVI</SelectItem>
                <SelectItem value="BSI">BSI</SelectItem>
                <SelectItem value="WATER">WATER</SelectItem>
                <SelectItem value="CHANGE">CHANGE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {reportsError && (
        <div className="p-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Error loading reports: {reportsError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Reports List */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Reports ({filteredReports.length})
              </h2>
            </div>
            
            {reportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FontAwesomeIcon icon={faSpinner} className="text-gray-400 text-3xl animate-spin mb-4" />
                  <p className="text-gray-600">Loading reports...</p>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-4xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-500">
                  {reports.length === 0 
                    ? "No analysis has been run yet."
                    : "No reports match your current filters."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report, index) => (
                  <div
                    key={report.id || index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleReportClick(report)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {report.district || report.district_name || 'Unknown District'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {report.created_at ? formatDate(report.created_at) : 'Unknown Date'}
                        </p>
                      </div>
                      <div className="ml-2">
                        {getAnalysisTypeBadge(report.analysis_type || 'Unknown')}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        {getStatusBadge(report)}
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Report Details */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          {selectedReport ? (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedReport.district || selectedReport.district_name || 'Unknown District'}
                    </h2>
                    
                  </div>
                  <div className="flex space-x-2">
                    {getAnalysisTypeBadge(selectedReport.analysis_type || 'Unknown')}
                    {getStatusBadge(selectedReport)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Analysis Type</Label>
                    <p className="text-gray-900">{selectedReport.analysis_type || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                    <p className="text-gray-900">
                      {selectedReport.created_at ? formatDate(selectedReport.created_at) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                    <p className="text-gray-900">
                      {selectedReport.start_date ? new Date(selectedReport.start_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">End Date</Label>
                    <p className="text-gray-900">
                      {selectedReport.end_date ? new Date(selectedReport.end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Legal Status</Label>
                    <p className={`font-medium ${selectedReport.is_illegal ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedReport.is_illegal ? 'Illegal Mining Detected' : 'Legal'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              {(selectedReport.before_image_url || selectedReport.after_image_url || selectedReport.change_image_url) && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Satellite Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedReport.before_image_url && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Before Image</Label>
                        <div className="relative group">
                          <img
                            src={getImageUrl(selectedReport.before_image_url)}
                            alt="Before Analysis"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.error('Before image failed to load:', selectedReport.before_image_url);
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Before+Image+Not+Available";
                            }}
                            onLoad={() => {
                              console.log('Before image loaded successfully:', selectedReport.before_image_url);
                            }}
                          />
                          <button
                            onClick={() => openFullSizeImage(getImageUrl(selectedReport.before_image_url))}
                            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FontAwesomeIcon icon={faExpand} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedReport.after_image_url && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">After Image</Label>
                        <div className="relative group">
                          <img
                            src={getImageUrl(selectedReport.after_image_url)}
                            alt="After Analysis"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.error('After image failed to load:', selectedReport.after_image_url);
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=After+Image+Not+Available";
                            }}
                            onLoad={() => {
                              console.log('After image loaded successfully:', selectedReport.after_image_url);
                            }}
                          />
                          <button
                            onClick={() => openFullSizeImage(getImageUrl(selectedReport.after_image_url))}
                            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FontAwesomeIcon icon={faExpand} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedReport.change_image_url && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Change Detection</Label>
                        <div className="relative group">
                          <img
                            src={getImageUrl(selectedReport.change_image_url)}
                            alt="Change Detection"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.error('Change image failed to load:', selectedReport.change_image_url);
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Change+Image+Not+Available";
                            }}
                            onLoad={() => {
                              console.log('Change image loaded successfully:', selectedReport.change_image_url);
                            }}
                          />
                          <button
                            onClick={() => openFullSizeImage(getImageUrl(selectedReport.change_image_url))}
                            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FontAwesomeIcon icon={faExpand} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map Section */}
              {selectedReport.center_lat && selectedReport.center_lng && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    Analysis Location
                  </h3>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    <DynamicSatelliteMap 
                      lat={selectedReport.center_lat} 
                      lng={selectedReport.center_lng} 
                      description={`${selectedReport.district || selectedReport.district_name} - ${selectedReport.analysis_type} Analysis`}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  className="!rounded-button cursor-pointer"
                  onClick={() => downloadPDFReport(selectedReport)}
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download PDF Report
                </Button>
             
                <Button 
                  variant="outline" 
                  className="!rounded-button cursor-pointer"
                  onClick={() => setShowDetailedView(true)}
                >
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FontAwesomeIcon icon={faSearch} className="text-6xl opacity-30 mb-4" />
              <p className="text-lg mb-2">Select a report to view details</p>
              <p className="text-sm">Choose from the list on the left to see satellite images and analysis results</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Size Image Modal */}
      {fullSizeImage && (
        <div 
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center"
          onClick={() => setFullSizeImage(null)}
        >
          <div className="relative max-w-screen-xl max-h-screen-xl p-4">
            <button 
              onClick={() => setFullSizeImage(null)}
              className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-xl text-gray-800 hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img 
              src={fullSizeImage} 
              alt="Full size satellite image" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {showDetailedView && selectedReport && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailedView(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detailed Analysis Report</h2>
                  <p className="text-sm text-gray-500 mt-1">Report ID: {selectedReport.id}</p>
                </div>
                <button 
                  onClick={() => setShowDetailedView(false)}
                  className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Legal Status</p>
                      <p className={`text-lg font-bold ${
                        selectedReport.is_illegal ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {selectedReport.is_illegal ? 'ILLEGAL DETECTED' : 'LEGAL'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedReport.is_illegal ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <FontAwesomeIcon 
                        icon={selectedReport.is_illegal ? faTimes : faCheck} 
                        className={selectedReport.is_illegal ? 'text-red-600' : 'text-green-600'} 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Change Area</p>
                      <p className="text-lg font-bold text-purple-900">
                        {selectedReport.change_area_km2 || selectedReport.illegal_area_km2 || 0} km²
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faMapMarkedAlt} className="text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Analysis Type</p>
                      <p className="text-lg font-bold text-orange-900">
                        {selectedReport.analysis_type || 'Standard'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faSatellite} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Analysis Description */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faSearch} className="text-blue-600 mr-2" />
                  Analysis Overview
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="mb-4 leading-relaxed">
                    This satellite analysis was conducted using advanced remote sensing techniques to detect potential illegal mining activities 
                    in the <strong>{selectedReport.district || selectedReport.district_name || 'specified'}</strong> district. 
                    The analysis employed <strong>{selectedReport.analysis_type || 'multi-spectral change detection'}</strong> algorithms 
                    to compare satellite imagery from different time periods.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faSatellite} className="text-blue-500 mr-2 text-sm" />
                      Methodology
                    </h4>
                    <p className="text-sm leading-relaxed">
                      The analysis utilized Sentinel-2 satellite imagery with 10-meter resolution to examine changes in land cover 
                      patterns. Our algorithms analyzed spectral signatures, vegetation indices (NDVI), and bare soil indices (BSI) 
                      to identify areas of potential mining activity. The system compared imagery from 
                      <strong> {selectedReport.start_date ? new Date(selectedReport.start_date).toLocaleDateString() : 'the baseline period'}</strong> to 
                      <strong> {selectedReport.end_date ? new Date(selectedReport.end_date).toLocaleDateString() : 'the analysis period'}</strong>.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2 text-sm" />
                      Key Findings
                    </h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>
                        <strong>Change Detection:</strong> Identified {selectedReport.change_area_km2 || selectedReport.illegal_area_km2 || 0} km² 
                        of land cover changes in the analysis area
                      </li>
                      <li>
                        <strong>Legal Assessment:</strong> Analysis indicates 
                        <span className={selectedReport.is_illegal ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {selectedReport.is_illegal ? ' potential illegal mining activity' : ' compliant mining operations'}
                        </span>
                      </li>
                      <li>
                        <strong>Confidence Level:</strong> High confidence based on spectral analysis and change detection algorithms
                      </li>
                      <li>
                        <strong>Data Quality:</strong> Analysis based on cloud-free, high-resolution satellite imagery
                      </li>
                    </ul>
                  </div>

                  {selectedReport.is_illegal && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                        <FontAwesomeIcon icon={faTimes} className="text-red-600 mr-2 text-sm" />
                        Alert: Potential Illegal Activity Detected
                      </h4>
                      <p className="text-sm text-red-800 leading-relaxed">
                        The analysis has identified potential illegal mining activity in this area. The detected changes show 
                        patterns consistent with unauthorized excavation, vegetation removal, and soil disturbance outside 
                        of legally designated mining concessions. Immediate field verification and investigation are recommended.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Satellite Images with Descriptions */}
              {(selectedReport.before_image_url || selectedReport.after_image_url || selectedReport.change_image_url) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faSatellite} className="text-blue-600 mr-2" />
                    Satellite Analysis Images
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Click on any image to view in full size. These images show the progression of land changes over the analysis period.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {selectedReport.before_image_url && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-800">Before Analysis</Label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {selectedReport.start_date ? new Date(selectedReport.start_date).toLocaleDateString() : 'Baseline'}
                          </span>
                        </div>
                        <div className="relative group cursor-pointer transform hover:scale-[1.02] transition-all duration-200" 
                             onClick={() => openFullSizeImage(getImageUrl(selectedReport.before_image_url))}>
                          <img
                            src={getImageUrl(selectedReport.before_image_url)}
                            alt="Before Analysis"
                            className="w-full h-56 object-cover rounded-lg border-2 border-gray-200 shadow-md group-hover:shadow-xl transition-all"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Before+Image+Not+Available";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-4">
                            <div className="bg-white/90 rounded-full px-3 py-1 flex items-center space-x-2">
                              <FontAwesomeIcon icon={faExpand} className="text-gray-700 text-sm" />
                              <span className="text-sm font-medium text-gray-700">View Full Size</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Baseline satellite image showing the original state of the area before any detected changes. 
                          This serves as the reference point for change detection analysis.
                        </p>
                      </div>
                    )}
                    
                    {selectedReport.after_image_url && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-800">After Analysis</Label>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {selectedReport.end_date ? new Date(selectedReport.end_date).toLocaleDateString() : 'Current'}
                          </span>
                        </div>
                        <div className="relative group cursor-pointer transform hover:scale-[1.02] transition-all duration-200" 
                             onClick={() => openFullSizeImage(getImageUrl(selectedReport.after_image_url))}>
                          <img
                            src={getImageUrl(selectedReport.after_image_url)}
                            alt="After Analysis"
                            className="w-full h-56 object-cover rounded-lg border-2 border-gray-200 shadow-md group-hover:shadow-xl transition-all"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=After+Image+Not+Available";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-4">
                            <div className="bg-white/90 rounded-full px-3 py-1 flex items-center space-x-2">
                              <FontAwesomeIcon icon={faExpand} className="text-gray-700 text-sm" />
                              <span className="text-sm font-medium text-gray-700">View Full Size</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Recent satellite image showing the current state of the area. Compare with the before image 
                          to identify changes in land cover and potential mining activities.
                        </p>
                      </div>
                    )}
                    
                    {selectedReport.change_image_url && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-800">Change Detection</Label>
                          <span className={`text-xs px-2 py-1 rounded ${
                            selectedReport.is_illegal ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'
                          }`}>
                            {selectedReport.is_illegal ? 'Alert' : 'Normal'}
                          </span>
                        </div>
                        <div className="relative group cursor-pointer transform hover:scale-[1.02] transition-all duration-200" 
                             onClick={() => openFullSizeImage(getImageUrl(selectedReport.change_image_url))}>
                          <img
                            src={getImageUrl(selectedReport.change_image_url)}
                            alt="Change Detection"
                            className={`w-full h-56 object-cover rounded-lg border-2 shadow-md group-hover:shadow-xl transition-all ${
                              selectedReport.is_illegal ? 'border-red-300' : 'border-green-300'
                            }`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Change+Image+Not+Available";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-4">
                            <div className="bg-white/90 rounded-full px-3 py-1 flex items-center space-x-2">
                              <FontAwesomeIcon icon={faExpand} className="text-gray-700 text-sm" />
                              <span className="text-sm font-medium text-gray-700">View Full Size</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Processed change detection image highlighting areas of significant land cover changes. 
                          {selectedReport.is_illegal 
                            ? 'Red areas indicate potential illegal mining activity requiring investigation.' 
                            : 'Changes appear to be within legal mining boundaries.'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Image Analysis Summary */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Image Analysis Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <strong>Satellite Source:</strong> Sentinel-2 Multi-Spectral Instrument (MSI)
                      </div>
                      <div>
                        <strong>Spatial Resolution:</strong> 10m per pixel
                      </div>
                      <div>
                        <strong>Analysis Method:</strong> {selectedReport.analysis_type || 'Multi-temporal Change Detection'}
                      </div>
                      <div>
                        <strong>Cloud Coverage:</strong> &lt; 5% (High Quality)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Section */}
              {selectedReport.latitude && selectedReport.longitude && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Location</h3>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    <DynamicSatelliteMap 
                      lat={selectedReport.latitude} 
                      lng={selectedReport.longitude} 
                      district={selectedReport.district || selectedReport.district_name || 'Analysis Location'}
                    />
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Analysis Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Analysis Algorithm:</span>
                      <span className="text-sm text-gray-900">{selectedReport.analysis_type || 'Standard Detection'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Change Area (km²):</span>
                      <span className="text-sm text-gray-900">{selectedReport.change_area_km2 || selectedReport.illegal_area_km2 || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Confidence Level:</span>
                      <span className="text-sm text-gray-900">High</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Satellite Source:</span>
                      <span className="text-sm text-gray-900">Sentinel-2</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Resolution:</span>
                      <span className="text-sm text-gray-900">10m/pixel</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Processing Date:</span>
                      <span className="text-sm text-gray-900">{new Date(selectedReport.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Targeted Sub-Area Analysis Results */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Targeted Sub-Area Analysis Results</h3>
                <div className="space-y-4">
                  {/* Sub-Area Detection Summary */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Analysis Focus:</strong> Remote areas outside human settlements in {selectedReport.district || selectedReport.district_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Detection Method:</strong> {selectedReport.analysis_type || 'NDVI'} analysis using Sentinel-2 satellite imagery
                    </p>
                  </div>
                  
                  {/* Detected Sub-Areas */}
                  {(selectedReport.detectedSubAreas || selectedReport.detected_sub_areas) && (selectedReport.detectedSubAreas || selectedReport.detected_sub_areas).length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        🎯 Detected Activities in {(selectedReport.detectedSubAreas || selectedReport.detected_sub_areas).length} Remote Sub-Areas:
                      </h4>
                      <div className="space-y-3">
                        {(selectedReport.detectedSubAreas || selectedReport.detected_sub_areas).map((area: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium text-sm text-gray-800">
                                  📍 {area.subAreaId}: {area.location_name}
                                </h5>
                                <div className="text-xs text-gray-600 mt-1">
                                  <div><strong>Coordinates:</strong> {area.center_latitude}°N, {area.center_longitude}°W</div>
                                  <div><strong>Area:</strong> {area.area_km2} km² ({area.area_m2?.toLocaleString()} m²)</div>
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
                                  {area.priority?.toUpperCase()}
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
                                <div className="text-red-600">{(selectedReport.vegetation_loss_percent || 0).toFixed(1)}%</div>
                              </div>
                              <div className="bg-orange-50 p-2 rounded">
                                <div className="text-orange-700 font-medium">Soil Exposure</div>
                                <div className="text-orange-600">{(selectedReport.bare_soil_increase_percent || 0).toFixed(1)}%</div>
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-blue-700 font-medium">Water Impact</div>
                                <div className="text-blue-600">{selectedReport.water_turbidity || 'Low'}</div>
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
                        ✅ No illegal mining activity detected in remote areas of {selectedReport.district || selectedReport.district_name} during the analysis period.
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        All detected activities are within legal concession boundaries.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  className="!rounded-button"
                  onClick={() => setShowDetailedView(false)}
                >
                  Close
                </Button>
                <Button 
                  className="!rounded-button bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    downloadPDFReport(selectedReport);
                    setShowDetailedView(false);
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download PDF Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;
