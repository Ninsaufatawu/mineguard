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
  faSatellite,
  faRefresh,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { getReportAnalysisResults } from "@/lib/saveReportAnalysis";

interface ReportAnalysisResult {
  id: string;
  report_id: string;
  analysis_type: string;
  created_at: string;
  is_illegal: boolean;
  confidence: number;
  affected_area: number;
  location_name: string;
  risk_level: string;
  environmental_impact: {
    vegetationLoss: number;
    soilExposure: number;
    waterContamination: string;
    severity: string;
  };
  report_data: {
    location_description: string;
    incident_description: string;
    report_type: string;
    threat_level: number;
    status: string;
    created_at: string;
  };
}

interface ReportAnalysisResultsProps {
  onBack: () => void;
}

const ReportAnalysisResults: React.FC<ReportAnalysisResultsProps> = ({ onBack }) => {
  const [analysisResults, setAnalysisResults] = useState<ReportAnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ReportAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  useEffect(() => {
    fetchAnalysisResults();
  }, []);

  const fetchAnalysisResults = async () => {
    try {
      setLoading(true);
      
      // Fetch real analysis results from database
      const analysisData = await getReportAnalysisResults();
      
      // Transform the data to match our interface
      const transformedResults: ReportAnalysisResult[] = analysisData.map((result: any) => ({
        id: result.id,
        report_id: result.report_id,
        analysis_type: result.analysis_type,
        created_at: result.created_at,
        is_illegal: result.is_illegal,
        confidence: result.confidence,
        affected_area: result.affected_area || 1.0,
        location_name: result.location_name || result.report_location_description,
        risk_level: result.risk_level,
        environmental_impact: {
          vegetationLoss: result.environmental_impact?.vegetationLoss || 0,
          soilExposure: result.environmental_impact?.soilExposure || 0,
          waterContamination: result.environmental_impact?.waterContamination || 'Low',
          severity: result.environmental_impact?.severity || 'Low'
        },
        report_data: {
          location_description: result.report_location_description || '',
          incident_description: result.report_incident_description || '',
          report_type: result.report_type || '',
          threat_level: result.report_threat_level || 1,
          status: result.report_status || 'pending',
          created_at: result.report_created_at || result.created_at
        }
      }));

      setAnalysisResults(transformedResults);
      console.log('✅ Loaded', transformedResults.length, 'real analysis results from database');
    } catch (error) {
      console.error('❌ Error fetching analysis results:', error);
      // Fallback to empty array if database fetch fails
      setAnalysisResults([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (result: ReportAnalysisResult) => {
    try {
      // Prepare PDF content similar to AnalysisHistory
      const pdfContent = {
        // Basic report information
        reportId: result.report_id,
        analysisId: result.id,
        analysisType: result.analysis_type,
        analysisDate: result.created_at,
        
        // Location and coordinates
        locationDescription: result.report_data.location_description,
        locationName: result.location_name,
        
        // Analysis results
        isIllegal: result.is_illegal,
        confidence: result.confidence,
        riskLevel: result.risk_level,
        affectedArea: result.affected_area,
        
        // Environmental impact
        environmentalImpact: result.environmental_impact,
        
        // Original report data
        originalReport: {
          incidentDescription: result.report_data.incident_description,
          reportType: result.report_data.report_type,
          threatLevel: result.report_data.threat_level,
          status: result.report_data.status,
          submissionDate: result.report_data.created_at
        }
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
      link.download = `report-analysis-${result.report_id}-${result.analysis_type.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report. Please try again.');
    }
  };

  const openFullSizeImage = (imageUrl: string) => {
    setFullSizeImage(imageUrl);
  };

  const closeFullSizeImage = () => {
    setFullSizeImage(null);
  };

  const filteredResults = analysisResults.filter(result => {
    const matchesSearch = result.report_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.report_data.location_description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'illegal' && result.is_illegal) ||
                         (statusFilter === 'legal' && !result.is_illegal) ||
                         (statusFilter === result.risk_level);
    
    return matchesSearch && matchesStatus;
  });



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
              className="text-gray-600 hover:text-gray-800"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Reports
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Report Analysis Results</h2>
              <p className="text-sm text-gray-500">View and download satellite analysis results for user reports</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAnalysisResults}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <FontAwesomeIcon icon={faRefresh} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by report ID, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="illegal">Illegal Mining Detected</SelectItem>
                <SelectItem value="legal">No Illegal Activity</SelectItem>
                <SelectItem value="critical">Critical Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FontAwesomeIcon icon={faSpinner} className="text-gray-400 text-2xl animate-spin" />
            <span className="ml-3 text-gray-600">Loading analysis results...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FontAwesomeIcon icon={faFileAlt} className="text-4xl mb-4" />
            <p className="text-lg font-medium">No analysis results found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Report {result.report_id}
                          </h3>
                          <Badge className={result.is_illegal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {result.is_illegal ? 'Illegal Mining Detected' : 'No Illegal Activity'}
                          </Badge>
                          {result.is_illegal && (
                            <Badge className={`${
                              result.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                              result.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                              result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {result.risk_level.toUpperCase()} RISK
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Analysis Type:</span>
                            <p className="font-medium">{result.analysis_type}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <p className="font-medium">{result.location_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Confidence:</span>
                            <p className="font-medium">{result.confidence}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Analyzed:</span>
                            <p className="font-medium">{new Date(result.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedResult(result);
                            setShowDetailedView(true);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPDF(result)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
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
      {showDetailedView && selectedResult && (
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
                  <p className="text-sm text-gray-500 mt-1">Report ID: {selectedResult.report_id}</p>
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
                        selectedResult.is_illegal ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {selectedResult.is_illegal ? 'ILLEGAL MINING DETECTED' : 'NOT ILLEGAL MINING'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedResult.is_illegal ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <FontAwesomeIcon 
                        icon={selectedResult.is_illegal ? faTimes : faCheck} 
                        className={selectedResult.is_illegal ? 'text-red-600' : 'text-green-600'} 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Affected Area</p>
                      <p className="text-lg font-bold text-purple-900">
                        {selectedResult.affected_area} km²
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Analysis Type</p>
                      <p className="text-lg font-bold text-orange-900">
                        {selectedResult.analysis_type}
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
                    at <strong>{selectedResult.report_data.location_description}</strong>. 
                    The analysis employed <strong>{selectedResult.analysis_type}</strong> algorithms 
                    to examine changes in land cover patterns and detect mining activities.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faSatellite} className="text-blue-500 mr-2 text-sm" />
                      Methodology
                    </h4>
                    <p className="text-sm leading-relaxed">
                      The analysis utilized Sentinel-2 satellite imagery with 10-meter resolution to examine changes in land cover 
                      patterns. Our algorithms analyzed spectral signatures, vegetation indices (NDVI), and bare soil indices (BSI) 
                      to identify areas of potential mining activity with <strong>{selectedResult.confidence}% confidence</strong>.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2 text-sm" />
                      Key Findings
                    </h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>
                        <strong>Change Detection:</strong> Identified {selectedResult.affected_area} km² 
                        of land cover changes in the analysis area
                      </li>
                      <li>
                        <strong>Legal Assessment:</strong> Analysis indicates 
                        <span className={selectedResult.is_illegal ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {selectedResult.is_illegal ? ' potential illegal mining activity' : ' compliant mining operations'}
                        </span>
                      </li>
                      <li>
                        <strong>Confidence Level:</strong> {selectedResult.confidence}% confidence based on spectral analysis
                      </li>
                      <li>
                        <strong>Environmental Impact:</strong> {selectedResult.environmental_impact.severity} severity level detected
                      </li>
                    </ul>
                  </div>

                  {selectedResult.is_illegal && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                        <FontAwesomeIcon icon={faTimes} className="text-red-600 mr-2 text-sm" />
                        Alert: Potential Illegal Activity Detected
                      </h4>
                      <p className="text-sm text-red-800 leading-relaxed">
                        The analysis has identified potential illegal mining activity in this area. The detected changes show 
                        patterns consistent with unauthorized excavation, vegetation removal, and soil disturbance. 
                        Risk level: <strong>{selectedResult.risk_level.toUpperCase()}</strong>. 
                        Immediate field verification and investigation are recommended.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Environmental Impact Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600 mr-2" />
                  Environmental Impact Assessment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold mb-2 ${
                      selectedResult.environmental_impact.vegetationLoss >= 50 ? 'text-red-600' :
                      selectedResult.environmental_impact.vegetationLoss >= 30 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {selectedResult.environmental_impact.vegetationLoss}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Vegetation Loss</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold mb-2 ${
                      selectedResult.environmental_impact.soilExposure >= 40 ? 'text-red-600' :
                      selectedResult.environmental_impact.soilExposure >= 20 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {selectedResult.environmental_impact.soilExposure}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Soil Exposure</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-lg font-bold mb-2 ${
                      selectedResult.environmental_impact.waterContamination === 'High' ? 'text-red-600' :
                      selectedResult.environmental_impact.waterContamination === 'Medium' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {selectedResult.environmental_impact.waterContamination}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Water Risk</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-lg font-bold mb-2 ${
                      selectedResult.environmental_impact.severity === 'Critical' || selectedResult.environmental_impact.severity === 'High' ? 'text-red-600' :
                      selectedResult.environmental_impact.severity === 'Moderate' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {selectedResult.environmental_impact.severity}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Overall Severity</div>
                  </div>
                </div>
              </div>

              {/* Original Report Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 mr-2" />
                  Report Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Location Description</Label>
                      <p className="mt-1 text-gray-900">{selectedResult.report_data.location_description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Report Type</Label>
                      <p className="mt-1 text-gray-900">{selectedResult.report_data.report_type}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Incident Description</Label>
                    <p className="mt-1 text-gray-900">{selectedResult.report_data.incident_description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Threat Level</Label>
                      <p className="mt-1 text-gray-900">{selectedResult.report_data.threat_level}/5</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge className={
                        selectedResult.report_data.status === 'verified' ? 'bg-green-100 text-green-800' :
                        selectedResult.report_data.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {selectedResult.report_data.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                      <p className="mt-1 text-gray-900">{new Date(selectedResult.report_data.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailedView(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => downloadPDF(selectedResult)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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

export default ReportAnalysisResults;
