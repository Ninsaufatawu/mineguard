"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle,
  faSatellite,
  faDownload,
  faCheck,
  faLeaf,
  faWater,
  faMountain
} from '@fortawesome/free-solid-svg-icons';
import { useCoordinateAnalysis } from './hooks/useCoordinateAnalysis';

interface Report {
  report_id: string;
  incident_description: string;
  location_description: string;
  location_lat: number;
  location_lng: number;
  report_type: string;
  threat_level: number;
  status: string;
  created_at: string;
  evidence_files?: string[];
}

interface ReportSatelliteAnalysisProps {
  report: Report;
  showSatelliteAnalysis: boolean;
  onToggleAnalysis: () => void;
}

export default function ReportSatelliteAnalysis({ 
  report, 
  showSatelliteAnalysis, 
  onToggleAnalysis 
}: ReportSatelliteAnalysisProps) {
  const [analysisType, setAnalysisType] = useState<'NDVI' | 'BSI' | 'WATER' | 'CHANGE'>('NDVI');
  const [currentAnalysisReportId, setCurrentAnalysisReportId] = useState<string | null>(null);
  const { runAnalysis, loading: analysisLoading, error: analysisError, data: analysisData } = useCoordinateAnalysis();

  const runSatelliteAnalysis = async (reportToAnalyze: Report) => {
    if (!reportToAnalyze.location_lat || !reportToAnalyze.location_lng) {
      alert('No coordinates available for this report');
      return;
    }

    setCurrentAnalysisReportId(reportToAnalyze.report_id);
    
    const endDate = new Date(reportToAnalyze.created_at).toISOString().split('T')[0];
    const startDate = new Date(new Date(reportToAnalyze.created_at).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await runAnalysis({
      latitude: reportToAnalyze.location_lat,
      longitude: reportToAnalyze.location_lng,
      startDate,
      endDate,
      analysisType,
      detectionThreshold: 0.3,
      reportId: reportToAnalyze.report_id
    });
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faSatellite} className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Satellite Analysis</h3>
              <p className="text-sm text-slate-600">Verify mining activity using satellite imagery</p>
            </div>
          </div>
          <Button
            onClick={onToggleAnalysis}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {showSatelliteAnalysis ? 'Hide Analysis' : 'Run Analysis'}
          </Button>
        </div>

        {showSatelliteAnalysis ? (
          <div className="space-y-6">
            {/* Analysis Controls */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                <div className="lg:col-span-2">
                  <Label className="text-sm font-semibold text-blue-800 mb-2 block">Analysis Type</Label>
                  <Select value={analysisType} onValueChange={(value: 'NDVI' | 'BSI' | 'WATER' | 'CHANGE') => setAnalysisType(value)}>
                    <SelectTrigger className="w-full bg-white border-blue-200">
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NDVI">
                        <div className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faLeaf} className="h-4 w-4 text-green-600" />
                          <span>NDVI (Vegetation Analysis)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BSI">
                        <div className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faMountain} className="h-4 w-4 text-amber-600" />
                          <span>BSI (Bare Soil Index)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="WATER">
                        <div className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faWater} className="h-4 w-4 text-blue-600" />
                          <span>WATER (Water Quality)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => runSatelliteAnalysis(report)}
                  disabled={analysisLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium h-10"
                >
                  {analysisLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faSatellite} className="h-4 w-4" />
                      <span>Run Analysis</span>
                    </div>
                  )}
                </Button>
              </div>
              
              {/* Analysis Period Info */}
              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-700 font-semibold mb-1">Analysis Period:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-600">
                  <div>📅 Report Date: {new Date(report.created_at).toLocaleDateString()}</div>
                  <div>🔍 Comparison: 30 days prior</div>
                </div>
              </div>
            </div>
            
            {/* Loading State */}
            {analysisLoading && currentAnalysisReportId === report.report_id && (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FontAwesomeIcon icon={faSatellite} className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Running Satellite Analysis</h3>
                <p className="text-slate-600">Processing Sentinel-2 imagery and detecting changes...</p>
              </div>
            )}
            
            {/* Simple Analysis Results */}
            {analysisData && currentAnalysisReportId === report.report_id && (
              <div className="space-y-4">
                {/* Status Card */}
                <div className={`rounded-2xl p-6 ${
                  analysisData.isIllegal 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                } text-white shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon 
                        icon={analysisData.isIllegal ? faExclamationTriangle : faCheck} 
                        className="h-6 w-6" 
                      />
                      <div>
                        <h3 className="text-lg font-bold">
                          {analysisData.isIllegal ? 'Illegal Mining Detected' : 'No Illegal Activity'}
                        </h3>
                        <p className="text-sm opacity-90">
                          {analysisData.confidence}% confidence • {analysisData.riskLevel || 'Medium'} risk
                        </p>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Quick Summary */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-md">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-slate-800">{analysisType}</div>
                        <div className="text-xs text-slate-500">Analysis Type</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{analysisData.environmentalImpact?.vegetationLoss || '15'}%</div>
                        <div className="text-xs text-slate-500">Vegetation Loss</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">Sentinel-2</div>
                        <div className="text-xs text-slate-500">Data Source</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Error State */}
            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                  <span className="font-semibold">Analysis Failed</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{analysisError}</p>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
