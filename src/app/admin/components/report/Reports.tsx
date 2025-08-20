"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RefreshCw } from 'lucide-react';
import { 
  faSearch, 
  faFileAlt,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { HiDocumentReport } from 'react-icons/hi';
import { MdVerifiedUser } from 'react-icons/md';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';
import { supabase } from "@/lib/supabase";
import ReportDetails from './ReportDetails';
import ReportAnalysisResults from './ReportAnalysisResults';

interface Report {
  id: string;
  report_id: string;
  location_description: string;
  location_lat: number;
  location_lng: number;
  incident_description: string;
  created_at: string;
  status: string;
  evidence_files?: string[];
  report_type: string;
  threat_level: number;
  mining_activity_type?: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'analysis'>('list');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mining_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error in fetchReports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setViewMode('details');
  };

  const handleAnalysisResultsClick = () => {
    setViewMode('analysis');
  };

  const handleBackToList = () => {
    setSelectedReport(null);
    setViewMode('list');
  };

  // Helper function to get threat level text
  const getThreatLevelText = (level: number): string => {
    switch (level) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Medium';
      case 4: return 'High';
      case 5: return 'Very High';
      default: return 'Unknown';
    }
  };

  // Get threat level badge class
  const getThreatLevelBadgeClass = (level: number): string => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Get coordinates string
  const getCoordinates = (report: Report): string => {
    if (report.location_lat && report.location_lng) {
      return `${report.location_lat.toFixed(6)}, ${report.location_lng.toFixed(6)}`;
    }
    return 'Not available';
  };

  // Filter reports based on search and status
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.location_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.incident_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getThreatLevelText(report.threat_level).toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const verifiedReports = reports.filter(r => r.status === 'verified').length;

  // Show ReportAnalysisResults view
  if (viewMode === 'analysis') {
    return (
      <ReportAnalysisResults 
        onBack={handleBackToList}
      />
    );
  }

  // Show ReportDetails view
  if (viewMode === 'details' && selectedReport) {
    return (
      <ReportDetails 
        report={selectedReport} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-6">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Reports</p>
                  <p className="text-3xl font-bold text-white">{totalReports}</p>
                  <p className="text-blue-100 text-xs mt-1">All submissions</p>
                </div>
                <div className="bg-blue-400/30 rounded-full p-3">
                  <HiDocumentReport className="text-2xl text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-0 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold text-white">{pendingReports}</p>
                  <p className="text-yellow-100 text-xs mt-1">Awaiting action</p>
                </div>
                <div className="bg-yellow-300/30 rounded-full p-3">
                  <FiClock className="text-2xl text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Verified</p>
                  <p className="text-3xl font-bold text-white">{verifiedReports}</p>
                  <p className="text-green-100 text-xs mt-1">Confirmed cases</p>
                </div>
                <div className="bg-green-400/30 rounded-full p-3">
                  <MdVerifiedUser className="text-2xl text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">High Priority</p>
                  <p className="text-3xl font-bold text-white">
                    {reports.filter(r => r.threat_level >= 4).length}
                  </p>
                  <p className="text-red-100 text-xs mt-1">Urgent attention</p>
                </div>
                <div className="bg-red-400/30 rounded-full p-3">
                  <FiAlertTriangle className="text-2xl text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <Input
                type="text"
                placeholder="Search reports by location, description, ID, status, or threat level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleAnalysisResultsClick}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4" />
              Analysis Results
            </Button>
            
            <Button 
              onClick={fetchReports} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FontAwesomeIcon icon={faFileAlt} className="text-6xl mb-4 opacity-30" />
            <p className="text-xl mb-2">No reports found</p>
            <p className="text-sm">Try adjusting your search criteria or refresh the data</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => handleReportClick(report)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.report_id}
                        </h3>
                        <Badge 
                          className={`${getThreatLevelBadgeClass(report.threat_level)} text-xs`}
                        >
                          {getThreatLevelText(report.threat_level)}
                        </Badge>
                        <Badge 
                          variant={report.status === 'verified' ? 'default' : 
                                 report.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-700 font-medium">
                          📍 {report.location_description}
                        </p>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {report.incident_description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {formatDate(report.created_at)}</span>
                          <span>🗂️ {report.report_type}</span>
                          <span>📍 {getCoordinates(report)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center">
                      <FontAwesomeIcon 
                        icon={faEye} 
                        className="text-gray-400 text-lg" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
