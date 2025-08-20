"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../../../../components/ui/button";  

import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Search, Eye, Edit, MoreVertical, BarChart2, PieChart, Activity, Users, RefreshCw, Calendar, MapPin, FileText, ExternalLink } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import dynamic from 'next/dynamic';
import { identifyLicenseType, LICENSE_TYPES } from "./LicenseTypes";
import { calculateLicenseStats } from "./LicenseHelper";
import { LicenseTypeChart } from "./LicenseTypeChart";

interface License {
  id: string;
  license_id: string;
  company_name: string;
  license_type: string;
  region: string;
  district: string;
  created_at: string;
  status: string;
  document_files: string[];
  coordinates?: string;
  area_description?: string;
  area_size?: string;
  company_address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  location_name?: string;
}

// Dynamically import map component to prevent SSR issues
const DynamicLicenseMap = dynamic(
  () => import('./LicenseMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    )
  }
);

// Function to get location name from coordinates using OpenStreetMap Nominatim API
const getLocationNameFromCoordinates = async (coordinates: string): Promise<string> => {
  if (!coordinates) return 'Location not available';
  
  try {
    // Parse coordinates
    let cleanString = coordinates.trim();
    if (cleanString.startsWith('[') && cleanString.endsWith(']')) {
      cleanString = cleanString.substring(1, cleanString.length - 1);
    }
    
    const coordParts = cleanString.split(',').map(p => parseFloat(p.trim()));
    
    if (coordParts.length >= 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
      const lat = coordParts[0];
      const lon = coordParts[1];
      
      // Call Nominatim API for reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        // Extract only relevant location parts (not roads, house numbers, etc.)
        const address = data.address;
        const relevantParts = [];
        
        // Add the most specific location name first
        if (address.hamlet) relevantParts.push(address.hamlet);
        else if (address.village) relevantParts.push(address.village);
        else if (address.town) relevantParts.push(address.town);
        else if (address.city) relevantParts.push(address.city);
        else if (address.municipality) relevantParts.push(address.municipality);
        
        // Add county/state if available and not already covered by district/region in UI
        if (address.county && relevantParts.length < 2) {
          relevantParts.push(address.county);
        }
        
        // If we couldn't extract relevant parts, use a simpler part of the display name
        if (relevantParts.length === 0 && data.display_name) {
          // Try to get a simplified version by taking the first part of display_name
          const simplifiedName = data.display_name.split(',').slice(0, 2).join(', ');
          return simplifiedName;
        }
        
        return relevantParts.join(', ');
      }
      
      if (data && data.display_name) {
        // Fallback: use first part of display_name (usually the most specific)
        return data.display_name.split(',').slice(0, 2).join(', ');
      }
    }
    
    return 'Location details unavailable'; // Return a message if geocoding fails
  } catch (error) {
    console.error('Error geocoding coordinates:', error);
    return 'Unable to retrieve location'; // Return a message on error
  }
};

// Cache for location names to avoid repeated API calls
const locationCache: Record<string, string> = {};

const License = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [fullSizeDocument, setFullSizeDocument] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [licenseStats, setLicenseStats] = useState({
    active: 0,
    pending: 0,
    expired: 0,
    revoked: 0,
    total: 0,
    MiningLease: 0,
    Prospecting: 0,
    Reconnaissance: 0,
    smallScale: 0
  });

  // Cache key for license data
  const CACHE_KEY = 'license_data_cache';
  const CACHE_TIMESTAMP_KEY = 'license_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Check if we have cached data
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cacheTimestamp) {
      const now = Date.now();
      const cacheAge = now - parseInt(cacheTimestamp);
      
      // If cache is still valid, use cached data
      if (cacheAge < CACHE_DURATION) {
        try {
          const parsedData = JSON.parse(cachedData);
          setLicenses(parsedData.licenses || []);
          setLicenseStats(parsedData.stats || {
            active: 0,
            pending: 0,
            expired: 0,
            revoked: 0,
            total: 0,
            MiningLease: 0,
            Prospecting: 0,
            Reconnaissance: 0,
            smallScale: 0
          });
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing cached license data:', error);
          // If cache is corrupted, fall through to fetch fresh data
        }
      }
    }
    
    // If no valid cache, fetch fresh data
    fetchLicenses();
  }, []);

  useEffect(() => {
    // Function to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };
    
    // Function to close dropdown when pressing Escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(null);
      }
    };
    
    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Function to enrich license data with location names
  const enrichLicensesWithLocationNames = async (licensesData: License[]): Promise<License[]> => {
    const enrichedLicenses = [...licensesData];
    
    for (let i = 0; i < enrichedLicenses.length; i++) {
      const license = enrichedLicenses[i];
      if (license.coordinates) {
        // Check cache first
        if (locationCache[license.coordinates]) {
          license.location_name = locationCache[license.coordinates];
        } else {
          // Geocode and cache the result
          const locationName = await getLocationNameFromCoordinates(license.coordinates);
          locationCache[license.coordinates] = locationName;
          license.location_name = locationName;
        }
      }
    }
    
    return enrichedLicenses;
  };

  const fetchLicenses = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('mining_licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching licenses:', error);
        return;
      }

      // Enrich licenses with location names
      const enrichedLicenses = await enrichLicensesWithLocationNames(data || []);
      setLicenses(enrichedLicenses);
      
      // Use the helper to calculate license statistics
      const stats = calculateLicenseStats(data || []);
      setLicenseStats(stats);
      
      // Cache the fetched data
      const cacheData = {
        licenses: enrichedLicenses,
        stats: stats
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error in fetchLicenses:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // When setting selected license, fetch its location name if needed
  const setSelectedLicenseWithLocation = async (license: License | null) => {
    if (license && license.coordinates && !license.location_name) {
      if (locationCache[license.coordinates]) {
        license.location_name = locationCache[license.coordinates];
      } else {
        const locationName = await getLocationNameFromCoordinates(license.coordinates);
        locationCache[license.coordinates] = locationName;
        license.location_name = locationName;
      }
    }
    setSelectedLicense(license);
  };

  const updateLicenseStatus = async (licenseId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('mining_licenses')
        .update({ status })
        .eq('id', licenseId);

      if (error) {
        console.error('Error updating license status:', error);
        return;
      }

      // Update local state
      setLicenses(licenses.map(license => 
        license.id === licenseId ? { ...license, status } : license
      ));
      
      if (selectedLicense && selectedLicense.id === licenseId) {
        setSelectedLicense({ ...selectedLicense, status });
      }
      
      fetchLicenses(); // Refresh stats
    } catch (error) {
      console.error('Error in updateLicenseStatus:', error);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Get document file URL
  const getDocumentUrl = (filePath: string) => {
    if (!filePath) return '';
    
    try {
      const { data } = supabase.storage
        .from('license-documents')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return '';
    }
  };

  const openFullSizeDocument = (documentPath: string) => {
    setFullSizeDocument(getDocumentUrl(documentPath));
  };

  const closeFullSizeDocument = () => {
    setFullSizeDocument(null);
  };

  // Helper function to check if a date is within the specified range
  const isDateInRange = (dateString: string, range: string): boolean => {
    if (!dateString || range === 'all') return true;
    
    const date = new Date(dateString);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return date >= monthAgo;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return date >= yearAgo;
      default:
        return true;
    }
  };

  // Update filteredLicenses to include date filter
  const filteredLicenses = licenses.filter(license => {
    // Apply status filter
    if (statusFilter !== 'all' && license.status !== statusFilter) {
      return false;
    }
    
    // Apply license type filter
    if (typeFilter !== 'all') {
      const standardizedType = identifyLicenseType(license.license_type);
      if (typeFilter === 'mining-lease' && standardizedType !== LICENSE_TYPES.MINING_LEASE) return false;
      if (typeFilter === 'prospecting' && standardizedType !== LICENSE_TYPES.PROSPECTING) return false;
      if (typeFilter === 'reconnaissance' && standardizedType !== LICENSE_TYPES.RECONNAISSANCE) return false;
      if (typeFilter === 'small-scale' && standardizedType !== LICENSE_TYPES.SMALL_SCALE) return false;
    }
    
    // Apply date filter
    if (dateFilter !== 'all' && !isDateInRange(license.created_at, dateFilter)) {
      return false;
    }
    
    // Apply search filter across multiple fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const dateString = license.created_at ? formatDate(license.created_at).toLowerCase() : '';
      
      return (
        license.license_id?.toLowerCase().includes(query) ||
        license.company_name?.toLowerCase().includes(query) ||
        license.region?.toLowerCase().includes(query) ||
        license.district?.toLowerCase().includes(query) ||
        license.license_type?.toLowerCase().includes(query) ||
        dateString.includes(query)
      );
    }
    
    return true;
  });

  // Get coordinates for map display
  const getCoordinatesForMap = (coordinatesString?: string) => {
    if (!coordinatesString) return null;
    
    try {
      // Remove any square brackets and split by comma
      let cleanString = coordinatesString.trim();
      
      // Handle square bracket format [lat,lng]
      if (cleanString.startsWith('[') && cleanString.endsWith(']')) {
        cleanString = cleanString.substring(1, cleanString.length - 1);
      }
      
      const coordParts = cleanString.split(',').map(p => parseFloat(p.trim()));
      
      if (coordParts.length >= 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
        return {
          lat: coordParts[0],
          lng: coordParts[1]
        };
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
    return null;
  };

  // Update clearAllFilters to include date filter
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
  };

  // Toggle expanded license row with location enrichment
  const toggleExpandedLicense = async (licenseId: string) => {
    // If we're currently viewing license details in the full view, close it first
    if (selectedLicense) {
      setSelectedLicense(null);
    }
    
    if (expandedLicenseId === licenseId) {
      setExpandedLicenseId(null);
    } else {
      setExpandedLicenseId(licenseId);
      
      // Enrich the expanded license with location name if needed
      const license = licenses.find(l => l.id === licenseId);
      if (license && license.coordinates && !license.location_name) {
        const updatedLicenses = [...licenses];
        const index = updatedLicenses.findIndex(l => l.id === licenseId);
        
        if (locationCache[license.coordinates]) {
          updatedLicenses[index].location_name = locationCache[license.coordinates];
        } else {
          const locationName = await getLocationNameFromCoordinates(license.coordinates);
          locationCache[license.coordinates] = locationName;
          updatedLicenses[index].location_name = locationName;
        }
        
        setLicenses(updatedLicenses);
      }
    }
  };

  // Handle edit license click
  const handleEditLicense = (license: License) => {
    setSelectedLicenseWithLocation(license);
    setShowEditModal(true);
  };

  // Handle more options dropdown
  const handleMoreOptions = (license: License, action: string) => {
    // Always close the dropdown first
    setShowDropdown(null);
    
    switch (action) {
      case 'delete':
        setSelectedLicense(license);
        setShowDeleteDialog(true);
        break;
      case 'changeStatus':
        setSelectedLicense(license);
        setShowStatusDialog(true);
        break;
      case 'print':
        // Open a print view
        printLicense(license);
        break;
      case 'export':
        // Create a CSV export
        exportLicenseData(license);
        break;
      default:
        break;
    }
  };

  // Delete license function
  const deleteLicense = async () => {
    if (!selectedLicense) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('mining_licenses')
        .delete()
        .eq('id', selectedLicense.id);
        
      if (error) {
        console.error('Error deleting license:', error);
        alert('Error deleting license: ' + error.message);
        return;
      }
      
      // Update local state by filtering out the deleted license
      setLicenses(licenses.filter(license => license.id !== selectedLicense.id));
      setSelectedLicense(null);
      setShowDeleteDialog(false);
      alert('License deleted successfully');
      
      // Refresh data
      fetchLicenses();
    } catch (error) {
      console.error('Error in deleteLicense:', error);
      alert('An error occurred while deleting the license');
    } finally {
      setLoading(false);
    }
  };

  // Add a comprehensive export function
  const exportLicenseData = (license: License) => {
    // Create a complete dataset with all license fields
    const fullLicenseData = {
      license_id: license.license_id || "",
      company_name: license.company_name || "",
      license_type: license.license_type || "",
      region: license.region || "Not specified",
      district: license.district || "Not specified",
      status: license.status || "",
      created_at: license.created_at || "",
      location: license.location_name || "Not specified",
      coordinates: license.coordinates || "Not specified",
      area_description: license.area_description || "Not specified",
      area_size: license.area_size || "Not specified",
      company_address: license.company_address || "Not specified",
      contact_name: license.contact_name || "Not specified",
      contact_email: license.contact_email || "Not specified",
      contact_phone: license.contact_phone || "Not specified",
      documents: license.document_files ? license.document_files.length.toString() : "0"
    };

    // Convert to CSV format with all fields
    const headers = Object.keys(fullLicenseData);
    const values = Object.values(fullLicenseData).map(value => 
      // Escape any commas in the values to maintain CSV format
      `"${value.toString().replace(/"/g, '""')}"`
    );
    
    const csvContent = [
      headers.join(","),
      values.join(",")
    ].join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `license_${license.license_id}_full.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add a print license function
  const printLicense = (license: License) => {
    // Ensure we have the location name before printing
    const ensureLocationAndPrint = async () => {
      let locationToShow = license.location_name;
      
      // If location name is not available, try to get it
      if (!locationToShow && license.coordinates) {
        if (locationCache[license.coordinates]) {
          locationToShow = locationCache[license.coordinates];
        } else {
          try {
            locationToShow = await getLocationNameFromCoordinates(license.coordinates);
            // Cache for future use
            locationCache[license.coordinates] = locationToShow;
          } catch (error) {
            console.error('Error getting location name:', error);
            locationToShow = license.coordinates || 'Not specified';
          }
        }
      }

      // Create a printable view of the license
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      const createdDate = license.created_at ? formatDate(license.created_at) : 'Not issued';
      const licenseId = license.license_id || "";
      const licenseType = license.license_type || "";
      const status = license.status || "";
      const companyName = license.company_name || "";
      const companyAddress = license.company_address || 'Not specified';
      const contactName = license.contact_name || 'Not specified';
      const contactEmail = license.contact_email || 'Not specified';
      const contactPhone = license.contact_phone || 'Not specified';
      const region = license.region || 'Not specified';
      const district = license.district || 'Not specified';
      const location = locationToShow || 'Not specified';
      const coordinates = license.coordinates || 'Not specified';
      const areaDescription = license.area_description || 'Not specified';
      const areaSize = license.area_size || 'Not specified';
      const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
      const currentDate = new Date().toLocaleString();
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>License ${licenseId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .license-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .field {
              display: flex;
              margin-bottom: 8px;
            }
            .field-label {
              font-weight: bold;
              width: 180px;
            }
            .field-value {
              flex: 1;
            }
            .status {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-weight: bold;
            }
            .status-active {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-expired {
              background-color: #e5e7eb;
              color: #374151;
            }
            .status-revoked {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="license-title">Mining License Certificate</div>
            <div>Republic of Ghana</div>
            <div>Minerals Commission</div>
          </div>
          
          <div class="section">
            <div class="section-title">License Information</div>
            <div class="field">
              <div class="field-label">License ID:</div>
              <div class="field-value">${licenseId}</div>
            </div>
            <div class="field">
              <div class="field-label">License Type:</div>
              <div class="field-value">${licenseType}</div>
            </div>
            <div class="field">
              <div class="field-label">Status:</div>
              <div class="field-value">
                <span class="status status-${status}">
                  ${statusCapitalized}
                </span>
              </div>
            </div>
            <div class="field">
              <div class="field-label">Issue Date:</div>
              <div class="field-value">${createdDate}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Company Information</div>
            <div class="field">
              <div class="field-label">Company Name:</div>
              <div class="field-value">${companyName}</div>
            </div>
            <div class="field">
              <div class="field-label">Company Address:</div>
              <div class="field-value">${companyAddress}</div>
            </div>
            <div class="field">
              <div class="field-label">Contact Person:</div>
              <div class="field-value">${contactName}</div>
            </div>
            <div class="field">
              <div class="field-label">Contact Email:</div>
              <div class="field-value">${contactEmail}</div>
            </div>
            <div class="field">
              <div class="field-label">Contact Phone:</div>
              <div class="field-value">${contactPhone}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Location Information</div>
            <div class="field">
              <div class="field-label">Region:</div>
              <div class="field-value">${region}</div>
            </div>
            <div class="field">
              <div class="field-label">District:</div>
              <div class="field-value">${district}</div>
            </div>
            <div class="field">
              <div class="field-label">Location:</div>
              <div class="field-value">${location}</div>
            </div>
            <div class="field">
              <div class="field-label">Coordinates:</div>
              <div class="field-value"><span style="font-size: 0.9em; color: #666;">${coordinates}</span></div>
            </div>
            <div class="field">
              <div class="field-label">Area Description:</div>
              <div class="field-value">${areaDescription}</div>
            </div>
            <div class="field">
              <div class="field-label">Area Size:</div>
              <div class="field-value">${areaSize}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official license document issued by the Ghana Minerals Commission.</p>
            <p>Printed on: ${currentDate}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print License</button>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    };

    // Call the async function to ensure location and print
    ensureLocationAndPrint();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 pr-10 border-b border-gray-200 bg-white">
        <div className="flex justify-end items-center">
          <Button 
            variant="default" 
            onClick={fetchLicenses}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2 " />
              Refresh
              </>
            )}
            </Button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        {/* License Analytics */}
        <div className="mb-8">
          
          
          {refreshing && (
            <div className="fixed inset-0 bg-black/10 z-40 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center pointer-events-auto">
                <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-700">Refreshing data...</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{licenseStats.active}</p>
                    <p className="text-sm text-gray-600">Active Licenses</p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-yellow-600">{licenseStats.pending}</p>
                    <p className="text-sm text-gray-600">Pending Licenses</p>
                  </div>
                  <div className="p-3 bg-yellow-200 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-600">{licenseStats.expired}</p>
                    <p className="text-sm text-gray-600">Expired Licenses</p>
                  </div>
                  <div className="p-3 bg-gray-200 rounded-full">
                    <Activity className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-red-600">{licenseStats.revoked}</p>
                    <p className="text-sm text-gray-600">Revoked Licenses</p>
                  </div>
                  <div className="p-3 bg-red-200 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LicenseTypeChart stats={licenseStats} />
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-medium text-gray-700">Recent Licenses</CardTitle>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {licenses.slice(0, 4).map((license) => (
                    <div key={license.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium">{license.license_id}</p>
                        <p className="text-xs text-gray-500">{license.company_name}</p>
                      </div>
                      <Badge 
                        className={
                          license.status === 'active' ? 'bg-green-100 text-green-800' :
                          license.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          license.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Licenses Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            
            
            {/* Search and filter controls */}
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between">
                {/* Search on the left */}
                <div className="relative w-full max-w-md">
                  <Input
                    type="text"
                    placeholder="Search by company name, location, type..."
                    className="pl-10 pr-4 py-2 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
                
                {/* All filters on the right */}
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <Select 
                    defaultValue="all" 
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    defaultValue="all" 
                    onValueChange={(value) => setTypeFilter(value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="License Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="mining-lease">{LICENSE_TYPES.MINING_LEASE}</SelectItem>
                      <SelectItem value="prospecting">{LICENSE_TYPES.PROSPECTING}</SelectItem>
                      <SelectItem value="reconnaissance">{LICENSE_TYPES.RECONNAISSANCE}</SelectItem>
                      <SelectItem value="small-scale">{LICENSE_TYPES.SMALL_SCALE}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    defaultValue="all" 
                    onValueChange={(value) => setDateFilter(value)}
                  >
                    <SelectTrigger className="w-32">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Date" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Search results count */}
              <div className="text-sm text-gray-500 flex justify-between items-center">
                <div>
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all' ? (
                    <p>Showing {filteredLicenses.length} of {licenses.length} licenses</p>
                  ) : null}
                </div>
                
                {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin text-gray-500">Loading...</div>
            </div>
          ) : refreshing ? (
            <div className="flex flex-col justify-center items-center h-32">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500">Refreshing license data...</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">License ID</TableHead>
                <TableHead>Company/Applicant</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      No licenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLicenses.map((license) => (
                    <React.Fragment key={license.id}>
                      <TableRow 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleExpandedLicense(license.id)}
                      >
                      <TableCell className="font-medium">{license.license_id}</TableCell>
                      <TableCell>{license.company_name}</TableCell>
                      <TableCell>{`${license.district || ''}, ${license.region || ''}`}</TableCell>
                      <TableCell>{license.license_type}</TableCell>
                      <TableCell>{license.created_at ? formatDate(license.created_at) : 'Pending'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                              license.status === 'active' ? 'bg-green-100 text-green-800' :
                              license.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              license.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                      }
                    >
                      {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                    </Badge>
                  </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandedLicense(license.id);
                            }}
                            title="View Details"
                          >
                            <Eye className={`h-4 w-4 ${expandedLicenseId === license.id ? 'text-blue-500' : ''}`} />
                    </Button>
                          <div className="relative inline-block" ref={dropdownRef}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (showDropdown === license.id) {
                                  setShowDropdown(null);
                                } else {
                                  setShowDropdown(license.id);
                                }
                              }}
                              title="More Options"
                            >
                              <MoreVertical className="h-4 w-4" />
                    </Button>
                            {showDropdown === license.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1 text-left border border-gray-200">
                                <button
                                  className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-full text-red-400 bg-red-100 hover:bg-red-200 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(null);
                                  }}
                                  aria-label="Close menu"
                                >
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L7 7M1 7L7 1" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                
                                <button 
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLicense(license);
                                    setShowStatusDialog(true);
                                    setShowDropdown(null);
                                  }}
                                >
                                  Change Status
                                </button>
                                <button 
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    printLicense(license);
                                    setShowDropdown(null);
                                  }}
                                >
                                  Print License
                                </button>
                                <button 
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportLicenseData(license);
                                    setShowDropdown(null);
                                  }}
                                >
                                  Export Data
                                </button>
                                <button 
                                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLicense(license);
                                    setShowDeleteDialog(true);
                                    setShowDropdown(null);
                                  }}
                                >
                                  Delete License
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded row content */}
                      {expandedLicenseId === license.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* License details */}
                                <div>
                                  <h3 className="text-md font-medium mb-4">License Information</h3>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <Label className="text-xs text-gray-500">Company Name</Label>
                                      <p className="text-sm font-medium">{license.company_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">License Type</Label>
                                      <p className="text-sm font-medium">{license.license_type}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">Status</Label>
                                      <p className="text-sm font-medium">{license.status}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">Issue Date</Label>
                                      <p className="text-sm font-medium">{license.created_at ? formatDate(license.created_at) : 'Not issued'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">Region</Label>
                                      <p className="text-sm font-medium">{license.region || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">District</Label>
                                      <p className="text-sm font-medium">{license.district || 'Not specified'}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-4">
                                    <Label className="text-xs text-gray-500">Location</Label>
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                                      <p className="text-sm font-medium">{license.location_name || 'Fetching location...'}</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{license.coordinates}</p>
                                  </div>
                                  
                                  <div className="mb-4">
                                    <Label className="text-xs text-gray-500">Area Description</Label>
                                    <p className="text-sm font-medium">{license.area_description || 'Not specified'}</p>
                                  </div>
                                </div>
                                
                                {/* Map preview if coordinates are available */}
                                {license.coordinates && getCoordinatesForMap(license.coordinates) && (
                                  <div>
                                    <h3 className="text-md font-medium mb-4">Location</h3>
                                    <div className="h-64 border border-gray-200 rounded-md overflow-hidden">
                                      <DynamicLicenseMap 
                                        lat={getCoordinatesForMap(license.coordinates)?.lat || 0} 
                                        lng={getCoordinatesForMap(license.coordinates)?.lng || 0} 
                                        description={license.location_name || license.area_description || "License Location"}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Document section */}
                              {license.document_files && license.document_files.length > 0 && (
                                <div className="mt-6">
                                  <h3 className="text-md font-medium mb-3">Documents</h3>
                                  <div 
                                    className="grid gap-3"
                                    style={{ 
                                      gridTemplateColumns: 'repeat(3, 1fr)', 
                                      gridTemplateRows: 'repeat(6, auto)',
                                      gridAutoFlow: 'row'
                                    }}
                                  >
                                    {license.document_files.map((doc, index) => {
                                      const docName = doc.split('/').pop() || '';
                                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docName);
                                      const isPdf = /\.pdf$/i.test(docName);
                                      
                                      return (
                                        <div 
                                          key={index} 
                                          className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                                        >
                                          <div className="flex items-center space-x-3 truncate">
                                            <div className="flex-shrink-0">
                                              <FileText className={`h-5 w-5 ${isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : 'text-gray-500'}`} />
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium truncate max-w-[180px]" title={docName}>
                                              {docName}
                                            </span>
                                          </div>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => openFullSizeDocument(doc)}
                                            className="ml-2 flex-shrink-0 border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                    </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Actions */}
                              <div className="mt-6 flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => toggleExpandedLicense(license.id)}
                                >
                                  Close Details
                                </Button>
                                
                                {license.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      className="text-red-600"
                                      size="sm"
                                      onClick={() => updateLicenseStatus(license.id, 'revoked')}
                                    >
                                      Reject
                                    </Button>
                                    <Button 
                                      variant="default"
                                      className="bg-green-600 hover:bg-green-700"
                                      size="sm"
                                      onClick={() => updateLicenseStatus(license.id, 'active')}
                                    >
                                      Approve
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                  </TableCell>
                </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
            </TableBody>
          </Table>
          )}
        </div>
        
        {/* License Details - Only shown when a license is selected */}
        {selectedLicense && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedLicense.license_id}</h2>
                  <p className="text-sm text-gray-500">{selectedLicense.company_name}</p>
                </div>
                <div className="flex space-x-2 items-center">
                  <Badge
                    className={
                      selectedLicense.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedLicense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLicense.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {selectedLicense.status.charAt(0).toUpperCase() + selectedLicense.status.slice(1)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedLicense(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left column - License details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-4">License Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                          <Label className="text-sm text-gray-700">Company Name</Label>
                          <p className="text-sm font-medium mt-1">{selectedLicense.company_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-700">License Type</Label>
                          <p className="text-sm font-medium mt-1">{selectedLicense.license_type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-700">Region</Label>
                          <p className="text-sm font-medium mt-1">{selectedLicense.region || 'Not specified'}</p>
                  </div>
                  <div>
                          <Label className="text-sm text-gray-700">District</Label>
                          <p className="text-sm font-medium mt-1">{selectedLicense.district || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                        <Label className="text-sm text-gray-700">Location</Label>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                          <p className="text-sm font-medium">{selectedLicense.location_name || 'Fetching location...'}</p>
                </div>
                        <p className="text-xs text-gray-400 mt-1">{selectedLicense.coordinates}</p>
                </div>
                <div>
                        <Label className="text-sm text-gray-700">Area Size</Label>
                        <p className="text-sm font-medium mt-1">{selectedLicense.area_size || 'Not specified'}</p>
                  </div>

                <div>
                  <Label className="text-sm text-gray-700">Application Status</Label>
                  <div className="mt-2">
                    <div className="space-y-2">
                      <div className="flex items-center">
                              <CheckCircle2 className={`h-5 w-5 ${selectedLicense.status !== 'pending' ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`ml-2 text-sm ${selectedLicense.status !== 'pending' ? 'text-gray-600' : 'text-gray-400'}`}>
                                Documentation Submitted
                              </span>
                      </div>
                      <div className="flex items-center">
                              <CheckCircle2 className={`h-5 w-5 ${selectedLicense.status === 'active' || selectedLicense.status === 'expired' || selectedLicense.status === 'revoked' ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`ml-2 text-sm ${selectedLicense.status === 'active' || selectedLicense.status === 'expired' || selectedLicense.status === 'revoked' ? 'text-gray-600' : 'text-gray-400'}`}>
                                Review Complete
                              </span>
                      </div>
                      <div className="flex items-center">
                              <CheckCircle2 className={`h-5 w-5 ${selectedLicense.status === 'active' || selectedLicense.status === 'expired' ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`ml-2 text-sm ${selectedLicense.status === 'active' || selectedLicense.status === 'expired' ? 'text-gray-600' : 'text-gray-400'}`}>
                                Approved
                              </span>
                            </div>
                          </div>
                      </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  {selectedLicense.document_files && selectedLicense.document_files.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium mb-4">License Documents</h3>
                      <div 
                        className="grid gap-3"
                        style={{ 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gridTemplateRows: 'repeat(6, auto)',
                          gridAutoFlow: 'row'
                        }}
                      >
                        {selectedLicense.document_files.map((doc, index) => {
                          const docName = doc.split('/').pop() || '';
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docName);
                          const isPdf = /\.pdf$/i.test(docName);
                          
                          return (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex items-center space-x-3 truncate">
                                <div className="flex-shrink-0">
                                  <FileText className={`h-5 w-5 ${isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : 'text-gray-500'}`} />
                                </div>
                                <span className="text-sm text-gray-700 font-medium truncate max-w-[180px]" title={docName}>
                                  {docName}
                                </span>
                              </div>
                            <Button 
                                variant="outline" 
                              size="sm" 
                              onClick={() => openFullSizeDocument(doc)}
                                className="ml-2 flex-shrink-0 bg-white border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                      </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                      </div>

                {/* Right column - Map */}
                    <div>
                  {selectedLicense.coordinates && (
                    <div className="h-full">
                      <h3 className="text-md font-medium mb-4">License Location</h3>
                      <div className="border border-gray-200 rounded-md overflow-hidden h-96">
                        {getCoordinatesForMap(selectedLicense.coordinates) ? (
                          <DynamicLicenseMap 
                            lat={getCoordinatesForMap(selectedLicense.coordinates)?.lat || 0} 
                            lng={getCoordinatesForMap(selectedLicense.coordinates)?.lng || 0} 
                            description={selectedLicense.location_name || selectedLicense.area_description || "License Location"}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            Unable to display map - invalid coordinates
                      </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                    </div>
              
              {selectedLicense.status === 'pending' && (
                <div className="mt-6 flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600"
                    onClick={() => updateLicenseStatus(selectedLicense.id, 'revoked')}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateLicenseStatus(selectedLicense.id, 'active')}
                  >
                    Approve
                  </Button>
                </div>
              )}
                    </div>
                  </div>
        )}
                </div>
      
      {fullSizeDocument && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={closeFullSizeDocument}
        >
          <div className="relative w-10/12 h-[90vh] max-w-6xl bg-white rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 z-10 p-2">
            <Button 
                variant="outline"
                size="sm"
              onClick={closeFullSizeDocument}
                className="bg-white hover:bg-red-50 hover:text-red-600 border-red-200 rounded-full h-8 w-8 p-0 flex items-center justify-center"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </Button>
            </div>
            <iframe 
              src={fullSizeDocument} 
              className="w-full h-full rounded-lg"
            ></iframe>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedLicense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete license <span className="font-medium">{selectedLicense.license_id}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                onClick={deleteLicense}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      {showStatusDialog && selectedLicense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowStatusDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Change License Status</h3>
            <p className="mb-4">
              Select a new status for license <span className="font-medium">{selectedLicense.license_id}</span>:
            </p>
            <div className="mb-6 space-y-3">
              <Button 
                variant={selectedLicense.status === 'active' ? 'default' : 'outline'}
                className={selectedLicense.status === 'active' ? 'bg-green-600 hover:bg-green-700 w-full' : 'w-full'}
                onClick={() => {
                  updateLicenseStatus(selectedLicense.id, 'active');
                  setShowStatusDialog(false);
                }}
              >
                Active
              </Button>
              <Button 
                variant={selectedLicense.status === 'pending' ? 'default' : 'outline'}
                className={selectedLicense.status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700 w-full' : 'w-full'}
                onClick={() => {
                  updateLicenseStatus(selectedLicense.id, 'pending');
                  setShowStatusDialog(false);
                }}
              >
                Pending
              </Button>
              <Button 
                variant={selectedLicense.status === 'expired' ? 'default' : 'outline'}
                className={selectedLicense.status === 'expired' ? 'bg-gray-600 hover:bg-gray-700 w-full' : 'w-full'}
                onClick={() => {
                  updateLicenseStatus(selectedLicense.id, 'expired');
                  setShowStatusDialog(false);
                }}
              >
                Expired
              </Button>
              <Button 
                variant={selectedLicense.status === 'revoked' ? 'default' : 'outline'}
                className={selectedLicense.status === 'revoked' ? 'bg-red-600 hover:bg-red-700 w-full' : 'w-full'}
                onClick={() => {
                  updateLicenseStatus(selectedLicense.id, 'revoked');
                  setShowStatusDialog(false);
                }}
              >
                Revoked
              </Button>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </Button>
            </div>
              </div>
        </div>
      )}
    </div>
  );
};

export default License; 