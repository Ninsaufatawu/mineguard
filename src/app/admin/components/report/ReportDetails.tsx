"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faExpand,
  faExclamationTriangle,
  faSatellite,
  faDownload,
  faChartBar,
  faMapMarker,
  faImage,
  faCalendarAlt,
  faLocationDot,
  faFileAlt,
  faTimes,
  faCheck,
  faEye,
  faShieldAlt,
  faLeaf,
  faWater,
  faMountain
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from "@/lib/supabase";
import ReportSatelliteAnalysis from './ReportSatelliteAnalysis';

interface Report {
  report_id: string;
  incident_description: string;
  location_description: string;
  location_lat: number;
  location_lng: number;
  report_type: string;
  user_id: string;
  threat_level: number;
  status: string;
  created_at: string;
  evidence_files?: string[];
}

interface ReportDetailsProps {
  report: Report;
  onBack: () => void;
}

export default function ReportDetails({ report, onBack }: ReportDetailsProps) {
  const [verificationNotes, setVerificationNotes] = useState('');
  const [newStatus, setNewStatus] = useState(report.status);
  const [updating, setUpdating] = useState(false);
  const [showSatelliteAnalysis, setShowSatelliteAnalysis] = useState(false);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

  // Load evidence images from Supabase
  useEffect(() => {
    const loadEvidenceImages = async () => {
      console.log('Loading evidence files:', report.evidence_files);
      
      if (!report.evidence_files || report.evidence_files.length === 0) {
        console.log('No evidence files found');
        return;
      }
      
      try {
        const imageUrls = await Promise.all(
          report.evidence_files.map(async (filePath) => {
            try {
              // Handle both direct URLs and file paths
              if (filePath.startsWith('http')) {
                return filePath;
              }
              
              const { data } = supabase.storage
                .from('report-evidence')
                .getPublicUrl(filePath);
              
              console.log('Generated public URL for', filePath, ':', data.publicUrl);
              return data.publicUrl;
            } catch (error) {
              console.error('Error loading image:', filePath, error);
              return null;
            }
          })
        );
        
        const validUrls = imageUrls.filter(url => url !== null) as string[];
        console.log('Valid image URLs:', validUrls);
        setEvidenceImages(validUrls);
      } catch (error) {
        console.error('Error in loadEvidenceImages:', error);
      }
    };
    
    loadEvidenceImages();
  }, [report.evidence_files]);

  const getThreatLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Medium';
      case 4: return 'High';
      case 5: return 'Very High';
      default: return 'Unknown';
    }
  };

  const getThreatLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateReportStatus = async () => {
    if (!report) return;
    
    setUpdating(true);
    try {
      console.log('Updating report:', report.report_id, 'with status:', newStatus, 'and notes:', verificationNotes);
      
      const updateData: any = { 
        status: newStatus
      };
      
      if (verificationNotes.trim()) {
        updateData.verification_notes = verificationNotes.trim();
      }
      
      const { data, error } = await supabase
        .from('mining_reports')
        .update(updateData)
        .eq('report_id', report.report_id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      
      // Update the local report object
      report.status = newStatus;
      if (verificationNotes.trim()) {
        (report as any).verification_notes = verificationNotes.trim();
      }
      
      alert('Report status updated successfully!');
    } catch (error) {
      console.error('Error updating report:', error);
      alert(`Failed to update report status: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glassmorphism */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                <span className="font-medium">Back to Reports</span>
              </Button>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {report.report_id}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 text-slate-500" />
                  <p className="text-sm text-slate-600 font-medium">{report.location_description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getThreatLevelColor(report.threat_level)} shadow-sm border-0 font-semibold`}>
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3 mr-1" />
                {getThreatLevelText(report.threat_level)}
              </Badge>
              <Badge className={`${getStatusColor(report.status)} shadow-sm border-0 font-semibold`}>
                <FontAwesomeIcon icon={faShieldAlt} className="h-3 w-3 mr-1" />
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Information Card */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl font-bold text-slate-800">
              <FontAwesomeIcon icon={faFileAlt} className="h-5 w-5 text-blue-600" />
              <span>Report Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4 text-blue-600" />
                      <label className="text-sm font-semibold text-blue-800">Report Type</label>
                      
                    </div>
                    <p className="text-slate-800 font-medium">{report.report_type}</p>
                    <p className="text-slate-500 ">{report.user_id}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-emerald-600" />
                      <label className="text-sm font-semibold text-emerald-800">Submission Date</label>
                    </div>
                    <p className="text-slate-800 font-medium">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-amber-600" />
                    <label className="text-sm font-semibold text-amber-800">Incident Description</label>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{report.incident_description}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-purple-600" />
                    <label className="text-sm font-semibold text-purple-800">Location Description</label>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{report.location_description}</p>
                </div>
                
                {report.location_lat && report.location_lng && (
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-100">
                    <div className="flex items-center space-x-2 mb-3">
                      <FontAwesomeIcon icon={faMapMarker} className="h-4 w-4 text-rose-600" />
                      <label className="text-sm font-semibold text-rose-800">GPS Coordinates</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p className="text-slate-700 font-mono">Lat: {report.location_lat.toFixed(6)}°</p>
                      <p className="text-slate-700 font-mono">Lng: {report.location_lng.toFixed(6)}°</p>
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 mt-2 text-xs text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                      <span>View on Google Maps</span>
                    </a>
                  </div>
                )}
              </div>
              
              {/* Status and Actions */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Status Management</h3>
                  <div className="space-y-3">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add verification notes..."
                      className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    
                    <Button 
                      onClick={updateReportStatus}
                      disabled={updating}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                    >
                      {updating ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                          <span>Update Status</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Gallery */}
        <Card className="backdrop-blur-xl bg-white/70 border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl font-bold text-slate-800">
              <FontAwesomeIcon icon={faImage} className="h-5 w-5 text-emerald-600" />
              <span>Evidence Gallery</span>
              <Badge className="bg-emerald-100 text-emerald-800 border-0">
                {evidenceImages.length || 0} {evidenceImages.length === 1 ? 'Image' : 'Images'}
              </Badge>
              
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evidenceImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {evidenceImages.map((imageUrl, index) => (
                  <div key={index} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                      <img
                        src={imageUrl}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-300"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖼️ Image clicked!');
                          console.log('📸 Image URL:', imageUrl);
                          console.log('🔄 Current fullSizeImage state:', fullSizeImage);
                          console.log('⚡ Setting fullSizeImage to:', imageUrl);
                          setFullSizeImage(imageUrl);
                          
                          // Additional debugging
                          setTimeout(() => {
                            console.log('🔍 After setState - fullSizeImage should be:', imageUrl);
                          }, 100);
                        }}
                        onError={(e) => {
                          console.error('Failed to load image:', imageUrl);
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2MS4wNDYgMTAwIDE3MCA5MC45NTQzIDE3MCA4MEM1NzAgNjkuMDQ1NyAxNjEuMDQ2IDYwIDE1MCA2MEM1MzguOTU0IDYwIDEzMCA2OS4wNDU3IDEzMCA4MEM1MzAgOTAuOTU0MyAxMzguOTU0IDEwMCAxNTAgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTMwIDIwMEgxNzBWMjQwSDEzMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+CjwvcmVnPgo8L3N2Zz4K';
                        }}
                        onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                      />
                      {/* Click Overlay - This should capture clicks */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🎯 OVERLAY clicked!');
                          console.log('📸 Image URL from overlay:', imageUrl);
                          setFullSizeImage(imageUrl);
                        }}
                      >
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                          <div className="flex items-center justify-between text-white">
                            <span className="text-sm font-medium">Click to enlarge</span>
                            <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 max-w-md mx-auto">
                  <FontAwesomeIcon icon={faImage} className="h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Evidence Files</h3>
                  <p className="text-slate-500 text-sm">
                    {report.evidence_files && report.evidence_files.length > 0 
                      ? 'Evidence files are being loaded...' 
                      : 'No evidence files were submitted with this report'}
                  </p>
                  {report.evidence_files && report.evidence_files.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-400 mb-2">Debug Info:</div>
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded font-mono">
                        Files: {JSON.stringify(report.evidence_files)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sophisticated Satellite Analysis Section */}
        <ReportSatelliteAnalysis 
          report={report}
          showSatelliteAnalysis={showSatelliteAnalysis}
          onToggleAnalysis={() => setShowSatelliteAnalysis(!showSatelliteAnalysis)}
        />
      </div>

      {/* Full Size Image Modal - Enhanced Version */}
      {fullSizeImage && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black/90 z-[99999] animate-in fade-in duration-300"
            onClick={() => {
              console.log('Modal backdrop clicked, closing modal');
              setFullSizeImage(null);
            }}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
            <div className="relative pointer-events-auto animate-in zoom-in-95 duration-300">
              {/* Close Button */}
              <button 
                onClick={() => {
                  console.log('Close button clicked');
                  setFullSizeImage(null);
                }}
                className="absolute -top-4 -right-4 z-10 bg-white hover:bg-gray-100 rounded-full p-3 shadow-2xl transition-all duration-200 hover:scale-110"
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-gray-800" />
              </button>
              
              {/* Image */}
              <div className="relative bg-white rounded-2xl p-2 shadow-2xl max-w-[95vw] max-h-[95vh]">
                <img 
                  src={fullSizeImage} 
                  alt="Full size evidence" 
                  className="max-w-full max-h-[90vh] object-contain rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                  onLoad={() => console.log('Full size image loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load full size image:', fullSizeImage);
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwQzI3Ny42MTQgMTUwIDMwMCAxMjcuNjE0IDMwMCAxMDBDMzAwIDcyLjM4NTggMjc3LjYxNCA1MCAyNTAgNTBDMjIyLjM4NiA1MCAyMDAgNzIuMzg1OCAyMDAgMTAwQzIwMCAxMjcuNjE0IDIyMi4zODYgMTUwIDI1MCAxNTBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMDAgMzUwSDMwMFY0MDBIMjAwVjM1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMjUwIiB5PSIzMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0EzQUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
