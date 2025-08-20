import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

// Enhanced interface for comprehensive satellite analysis data
interface EnhancedAnalysisData {
  // Basic report info
  reportId: string;
  district: string;
  analysisType: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  
  // Analysis results
  isIllegal: boolean;
  changeArea: number;
  illegalAreaKm2?: number;
  vegetationLossPercent?: number;
  bareSoilIncreasePercent?: number;
  waterTurbidity?: string;
  
  // Images
  beforeImageUrl?: string;
  afterImageUrl?: string;
  changeImageUrl?: string;
  
  // Enhanced sub-area analysis
  detectedSubAreas?: Array<{
    subAreaId: string;
    location_name: string;
    center_latitude: number;
    center_longitude: number;
    area_km2: number;
    area_m2: number;
    coordinates_dms: string;
    utm_coordinates: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    detection_confidence: string;
    zone_type?: string;
    environmental_impact?: {
      vegetation_loss: number;
      soil_exposure: number;
      water_contamination: string;
    };
  }>;
  
  // Current location info (sequential analysis)
  currentLocation?: {
    sequenceNumber: number;
    locationId: string;
    locationName: string;
    coordinates: {
      latitude: number;
      longitude: number;
      dms: string;
      utm: string;
    };
    analysisArea: number;
  };
  
  // Coordinates and bounds
  centerLatitude?: number;
  centerLongitude?: number;
  totalAreaKm2?: number;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Helper function to fetch image and convert to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl || imageUrl === '') {
      return null;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine the image format from the URL or content type
    const contentType = response.headers.get('content-type') || '';
    let format = 'JPEG'; // Default format
    
    if (contentType.includes('png') || imageUrl.toLowerCase().includes('.png')) {
      format = 'PNG';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg') || 
               imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg')) {
      format = 'JPEG';
    }
    
    return `data:${contentType || 'image/jpeg'};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const reportData: EnhancedAnalysisData = await req.json();
    
    // Fetch images in parallel
    console.log('Fetching images for enhanced PDF report...');
    const [beforeImageBase64, afterImageBase64, changeImageBase64] = await Promise.all([
      reportData.beforeImageUrl ? fetchImageAsBase64(reportData.beforeImageUrl) : Promise.resolve(null),
      reportData.afterImageUrl ? fetchImageAsBase64(reportData.afterImageUrl) : Promise.resolve(null),
      reportData.changeImageUrl ? fetchImageAsBase64(reportData.changeImageUrl) : Promise.resolve(null)
    ]);
    
    console.log('Images fetched:', {
      before: !!beforeImageBase64,
      after: !!afterImageBase64,
      change: !!changeImageBase64
    });
    
    // Create new PDF document with enhanced formatting
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set up document properties
    doc.setProperties({
      title: `Enhanced Satellite Analysis Report - ${reportData.district}`,
      subject: 'Comprehensive Illegal Mining Detection Analysis',
      author: 'MineGuard Advanced Satellite System',
      creator: 'MineGuard Enhanced Analysis Engine'
    });

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Helper function to add section header
    const addSectionHeader = (title: string, color: [number, number, number] = [40, 40, 40]) => {
      checkPageBreak(20);
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition - 5, contentWidth, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.text(title, margin + 5, yPosition + 3);
      yPosition += 15;
    };

    // Helper function to add key-value pair
    const addKeyValue = (key: string, value: string, indent: number = 0) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(key, margin + 5 + indent, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const keyWidth = doc.getTextWidth(key);
      doc.text(value, margin + 5 + indent + keyWidth + 5, yPosition);
      yPosition += 6;
    };

    // Header with enhanced styling
    doc.setFillColor(25, 118, 210); // Blue header
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ENHANCED SATELLITE ANALYSIS REPORT', margin, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Illegal Mining Detection & Environmental Impact Assessment', margin, 28);
    
    yPosition = 50;

    // Executive Summary Box
    if (reportData.isIllegal) {
      doc.setFillColor(255, 235, 235); // Red for illegal
      doc.rect(margin, yPosition - 5, contentWidth, 25, 'F');
      doc.setDrawColor(220, 53, 69);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition - 5, contentWidth, 25, 'S');
    } else {
      doc.setFillColor(235, 255, 235); // Green for legal
      doc.rect(margin, yPosition - 5, contentWidth, 25, 'F');
      doc.setDrawColor(40, 167, 69);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition - 5, contentWidth, 25, 'S');
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    if (reportData.isIllegal) {
      doc.setTextColor(220, 53, 69);
    } else {
      doc.setTextColor(40, 167, 69);
    }
    const statusText = reportData.isIllegal ? 'ILLEGAL MINING DETECTED' : 'NO ILLEGAL ACTIVITY DETECTED';
    doc.text(statusText, margin + 5, yPosition + 5);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const executiveSummary = reportData.isIllegal 
      ? `Unauthorized mining activities detected across ${reportData.changeArea?.toFixed(2) || 'N/A'} km² in ${reportData.district} district`
      : `Analysis of ${reportData.district} district shows no unauthorized mining activities during the monitoring period`;
    doc.text(executiveSummary, margin + 5, yPosition + 12);
    
    yPosition += 35;

    // 1. REPORT INFORMATION
    addSectionHeader('REPORT INFORMATION');
    
    const reportInfo = [
      ['Report ID:', reportData.reportId || 'N/A'],
      ['District:', reportData.district || 'Unknown'],
      ['Analysis Type:', reportData.analysisType || 'N/A'],
      ['Generated:', new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['Analysis Period:', `${reportData.startDate ? new Date(reportData.startDate).toLocaleDateString() : 'N/A'} to ${reportData.endDate ? new Date(reportData.endDate).toLocaleDateString() : 'N/A'}`],
      ['Report Date:', reportData.createdAt ? new Date(reportData.createdAt).toLocaleDateString() : 'N/A']
    ];
    
    reportInfo.forEach(([key, value]) => addKeyValue(key, value));
    yPosition += 5;

    // 2. GEOGRAPHIC COORDINATES & BOUNDS
    if (reportData.centerLatitude || reportData.centerLongitude || reportData.boundingBox) {
      addSectionHeader('GEOGRAPHIC INFORMATION');
      
      if (reportData.centerLatitude && reportData.centerLongitude) {
        addKeyValue('Center Coordinates:', `${reportData.centerLatitude.toFixed(6)}°N, ${reportData.centerLongitude.toFixed(6)}°W`);
      }
      
      if (reportData.totalAreaKm2) {
        addKeyValue('Total Analysis Area:', `${reportData.totalAreaKm2.toFixed(2)} km²`);
      }
      
      if (reportData.boundingBox) {
        addKeyValue('Bounding Box:', '');
        addKeyValue('North:', `${reportData.boundingBox.north.toFixed(6)}°`, 10);
        addKeyValue('South:', `${reportData.boundingBox.south.toFixed(6)}°`, 10);
        addKeyValue('East:', `${reportData.boundingBox.east.toFixed(6)}°`, 10);
        addKeyValue('West:', `${reportData.boundingBox.west.toFixed(6)}°`, 10);
      }
      
      yPosition += 5;
    }

   
    
    yPosition += 5

    // 4. ANALYSIS STATUS
    addSectionHeader('ANALYSIS STATUS');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (reportData.isIllegal) {
      doc.setTextColor(220, 53, 69); // Red color for illegal
      doc.text('STATUS: ILLEGAL MINING DETECTED', margin + 5, yPosition);
    } else {
      doc.setTextColor(40, 167, 69); // Green color for legal
      doc.text('STATUS: NO ILLEGAL ACTIVITY DETECTED', margin + 5, yPosition);
    }
    yPosition += 15;

    // 5. TARGETED SUB-AREA ANALYSIS RESULTS
    if (reportData.detectedSubAreas && reportData.detectedSubAreas.length > 0) {
      addSectionHeader('TARGETED SUB-AREA ANALYSIS RESULTS');
      
      // Analysis overview box
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, yPosition - 2, contentWidth, 20, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.rect(margin, yPosition - 2, contentWidth, 20, 'S');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('ANALYSIS OVERVIEW', margin + 5, yPosition + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Focus: Remote areas outside human settlements in ${reportData.district}`, margin + 5, yPosition + 10);
      doc.text(`Method: ${reportData.analysisType} analysis using Sentinel-2 satellite imagery`, margin + 5, yPosition + 15);
      
      yPosition += 25;
      
      
      
      reportData.detectedSubAreas.forEach((area, index) => {
        checkPageBreak(65); // Increased space requirement
        
        // Main sub-area container with enhanced design
        const containerHeight = 55;
        
        // Background with subtle gradient effect
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, yPosition - 3, contentWidth, containerHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPosition - 3, contentWidth, containerHeight, 'S');
        
        // Header section with location info
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, yPosition - 3, contentWidth, 15, 'F');
        
        // Location title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(`${index + 1}. ${area.subAreaId}: ${area.location_name}`, margin + 8, yPosition + 6);
        
        // Enhanced priority badge with better positioning
        const badgeWidth = 28;
        const badgeX = margin + contentWidth - badgeWidth - 5;
        
        if (area.priority === 'critical') {
          doc.setFillColor(220, 53, 69);
        } else if (area.priority === 'high') {
          doc.setFillColor(255, 152, 0);
        } else {
          doc.setFillColor(255, 193, 7);
        }
        
        doc.rect(badgeX, yPosition - 1, badgeWidth, 10, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(area.priority.toUpperCase(), badgeX + 2, yPosition + 5);
        
        // Confidence indicator
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        doc.text(`${area.detection_confidence} `, badgeX, yPosition + 9);
        
        yPosition += 18;
        
        // Coordinates section with improved layout
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(70, 70, 70);
        doc.text('COORDINATES AND AREA:', margin + 8, yPosition);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        
        // Two-column layout for coordinates
        const leftCol = margin + 8;
        const rightCol = margin + (contentWidth / 2) + 5;
        
        // Left column
        doc.text(`GPS: ${area.center_latitude.toFixed(6)}°N, ${area.center_longitude.toFixed(6)}°W`, leftCol, yPosition + 6);
        doc.text(`DMS: ${area.coordinates_dms}`, leftCol, yPosition + 12);
        
        // Right column
        doc.text(`Area: ${area.area_km2} km² (${area.area_m2.toLocaleString()} m²)`, rightCol, yPosition + 6);
        doc.text(`UTM: ${area.utm_coordinates}`, rightCol, yPosition + 12);
        
        yPosition += 15;
        
        // Google Maps section with better visual separation
        doc.setDrawColor(230, 230, 230);
        doc.line(margin + 10, yPosition, margin + contentWidth - 10, yPosition);
        yPosition += 3;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(70, 70, 70);
        doc.text('FIELD VERIFICATION:', margin + 8, yPosition + 4);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        doc.setFontSize(8);
        const googleMapsUrl = `https://www.google.com/maps?q=${area.center_latitude},${area.center_longitude}`;
        doc.text('View on Google Maps for Field Verification', margin + 8, yPosition + 8);
        
        
        // URL in smaller text
        doc.setFontSize(9);
        doc.setTextColor(25, 118, 210);
        doc.text(googleMapsUrl, margin + 8, yPosition + 12);
        
        yPosition += 30;
        
        // Environmental impact for this sub-area
        if (area.environmental_impact) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text('Environmental Impact:', margin + 5, yPosition);
          yPosition += 8;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          addKeyValue('Vegetation Loss:', `${area.environmental_impact.vegetation_loss}%`, 5);
          addKeyValue('Soil Exposure:', `${area.environmental_impact.soil_exposure}%`, 5);
          addKeyValue('Water Contamination:', area.environmental_impact.water_contamination, 5);
        }
        
        yPosition += 5;
      });
    } else {
      addSectionHeader('SUB-AREA ANALYSIS RESULTS');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 167, 69);
      doc.text(`No illegal mining activity detected in remote areas of ${reportData.district} during the analysis period.`, margin + 5, yPosition);
      doc.text('All detected activities are within legal concession boundaries.', margin + 5, yPosition + 6);
      yPosition += 20;
    }

    // 6. CURRENT LOCATION INFORMATION (Sequential Analysis)
    if (reportData.currentLocation) {
      addSectionHeader('CURRENT ANALYSIS LOCATION');
      
      // Location header box
      doc.setFillColor(235, 248, 255);
      doc.rect(margin, yPosition - 3, contentWidth, 25, 'F');
      doc.setDrawColor(25, 118, 210);
      doc.rect(margin, yPosition - 3, contentWidth, 25, 'S');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 118, 210);
      doc.text(`Location #${reportData.currentLocation.sequenceNumber}: ${reportData.currentLocation.locationName}`, margin + 5, yPosition + 5);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Location ID: ${reportData.currentLocation.locationId}`, margin + 5, yPosition + 12);
      doc.text(`Specific location within ${reportData.district} district`, margin + 5, yPosition + 18);
      
      yPosition += 30;
      
      // Coordinates grid
      addKeyValue('Latitude:', `${reportData.currentLocation.coordinates.latitude.toFixed(6)}°N`);
      addKeyValue('Longitude:', `${reportData.currentLocation.coordinates.longitude.toFixed(6)}°W`);
      addKeyValue('DMS Format:', reportData.currentLocation.coordinates.dms);
      addKeyValue('UTM Coordinates:', reportData.currentLocation.coordinates.utm);
      addKeyValue('Analysis Area:', `${reportData.currentLocation.analysisArea} km²`);
      
      yPosition += 5;
    }
    
    
    // 7. SATELLITE IMAGERY ANALYSIS
    addSectionHeader('SATELLITE IMAGERY ANALYSIS');
    
    // Enhanced satellite imagery display with better error handling
    const imageWidth = (contentWidth - 10) / 3; // Three images side by side
    const imageHeight = 40;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Sentinel-2 Satellite Imagery Analysis:', margin + 5, yPosition);
    yPosition += 8;
    
    // Image URLs info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Analysis Period: ${reportData.startDate ? new Date(reportData.startDate).toLocaleDateString() : 'N/A'} to ${reportData.endDate ? new Date(reportData.endDate).toLocaleDateString() : 'N/A'}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`District: ${reportData.district} | Analysis Type: ${reportData.analysisType}`, margin + 5, yPosition);
    yPosition += 10;
    
    let imageXPosition = margin + 5;
    let imagesAdded = 0;
    
    // Before Image
    if (beforeImageBase64) {
      try {
        doc.addImage(beforeImageBase64, 'PNG', imageXPosition, yPosition, imageWidth, imageHeight);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('BEFORE ANALYSIS', imageXPosition, yPosition + imageHeight + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(reportData.startDate ? new Date(reportData.startDate).toLocaleDateString() : 'N/A', imageXPosition, yPosition + imageHeight + 10);
        imagesAdded++;
      } catch (error) {
        console.error('Error adding before image:', error);
        // Add placeholder for failed image
        doc.setFillColor(245, 245, 245);
        doc.rect(imageXPosition, yPosition, imageWidth, imageHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(imageXPosition, yPosition, imageWidth, imageHeight, 'S');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Before Image', imageXPosition + 5, yPosition + imageHeight/2);
        doc.text('(Loading Error)', imageXPosition + 5, yPosition + imageHeight/2 + 5);
      }
      imageXPosition += imageWidth + 5;
    }
    
    // After Image
    if (afterImageBase64) {
      try {
        doc.addImage(afterImageBase64, 'PNG', imageXPosition, yPosition, imageWidth, imageHeight);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('AFTER ANALYSIS', imageXPosition, yPosition + imageHeight + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(reportData.endDate ? new Date(reportData.endDate).toLocaleDateString() : 'N/A', imageXPosition, yPosition + imageHeight + 10);
        imagesAdded++;
      } catch (error) {
        console.error('Error adding after image:', error);
        // Add placeholder for failed image
        doc.setFillColor(245, 245, 245);
        doc.rect(imageXPosition, yPosition, imageWidth, imageHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(imageXPosition, yPosition, imageWidth, imageHeight, 'S');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('After Image', imageXPosition + 5, yPosition + imageHeight/2);
        doc.text('(Loading Error)', imageXPosition + 5, yPosition + imageHeight/2 + 5);
      }
      imageXPosition += imageWidth + 5;
    }
    
    // Change Detection Image
    if (changeImageBase64) {
      try {
        doc.addImage(changeImageBase64, 'PNG', imageXPosition, yPosition, imageWidth, imageHeight);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('CHANGE DETECTION', imageXPosition, yPosition + imageHeight + 5);
        doc.setFont('helvetica', 'normal');
        doc.text('Red areas indicate changes', imageXPosition, yPosition + imageHeight + 10);
        imagesAdded++;
      } catch (error) {
        console.error('Error adding change image:', error);
        // Add placeholder for failed image
        doc.setFillColor(245, 245, 245);
        doc.rect(imageXPosition, yPosition, imageWidth, imageHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(imageXPosition, yPosition, imageWidth, imageHeight, 'S');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Change Detection', imageXPosition + 5, yPosition + imageHeight/2);
        doc.text('(Loading Error)', imageXPosition + 5, yPosition + imageHeight/2 + 5);
      }
    }
    
    // If no images were available, show informative message
    if (!beforeImageBase64 && !afterImageBase64 && !changeImageBase64) {
      doc.setFillColor(255, 248, 220); // Light yellow background
      doc.rect(margin + 5, yPosition, contentWidth - 10, 30, 'F');
      doc.setDrawColor(255, 193, 7);
      doc.rect(margin + 5, yPosition, contentWidth - 10, 30, 'S');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(133, 77, 14);
      doc.text('Satellite Imagery Status:', margin + 10, yPosition + 10);
      doc.setFont('helvetica', 'normal');
      doc.text('Images are being processed or temporarily unavailable.', margin + 10, yPosition + 18);
      doc.text('Please check the online analysis dashboard for real-time imagery.', margin + 10, yPosition + 25);
      yPosition += 35;
    } else {
      yPosition += imageHeight + 20;
      
      // Add image analysis summary
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      yPosition += 30;
    }
    
    // 8. RECOMMENDED ACTIONS (if illegal mining detected)
    if (reportData.isIllegal) {
      addSectionHeader('RECOMMENDED ACTIONS');
      
      const recommendations = [
        {
          icon: '⚠️',
          text: 'Flag as illegal mining site for immediate enforcement action',
          priority: 'URGENT'
        },
        {
          icon: '📅',
          text: 'Schedule field inspection within 48 hours for ground verification',
          priority: 'HIGH'
        },
        {
          icon: '📄',
          text: 'Generate detailed report for EPA and Minerals Commission',
          priority: 'HIGH'
        },
        {
          icon: '🚨',
          text: 'Notify local authorities and mining enforcement teams',
          priority: 'URGENT'
        },
        {
          icon: '📊',
          text: 'Monitor area for continued illegal activity',
          priority: 'MEDIUM'
        }
      ];
      
      recommendations.forEach((rec, index) => {
        checkPageBreak(15);
        
        // Priority badge
        if (rec.priority === 'URGENT') {
          doc.setFillColor(220, 53, 69);
        } else if (rec.priority === 'HIGH') {
          doc.setFillColor(255, 152, 0);
        } else {
          doc.setFillColor(108, 117, 125);
        }
        doc.rect(margin + 5, yPosition - 3, 20, 8, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(rec.priority, margin + 7, yPosition + 1);
        
        // Recommendation text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`${index + 1}. ${rec.text}`, margin + 30, yPosition);
        
        yPosition += 12;
      });
      
      yPosition += 5;
    }
    
    // 9. ANALYSIS SUMMARY & CONCLUSION
    addSectionHeader('ANALYSIS SUMMARY & CONCLUSION');
    
    // Summary based on analysis results
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (reportData.isIllegal) {
      doc.text('CONCLUSION: This satellite analysis has identified unauthorized mining activities in the specified', margin + 5, yPosition);
      doc.text(`area of ${reportData.district} district. The detected activities require immediate attention and`, margin + 5, yPosition + 6);
      doc.text('enforcement action as outlined in the recommended actions section above.', margin + 5, yPosition + 12);
      yPosition += 20;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('PRIORITY: HIGH - Immediate enforcement action required', margin + 5, yPosition);
    } else {
      doc.text('CONCLUSION: This satellite analysis shows no evidence of unauthorized mining activities', margin + 5, yPosition);
      doc.text(`in the analyzed area of ${reportData.district} district during the specified time period.`, margin + 5, yPosition + 6);
      doc.text('All detected activities appear to be within legal concession boundaries.', margin + 5, yPosition + 12);
      yPosition += 20;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 167, 69);
      doc.text('STATUS: COMPLIANT - Continue regular monitoring', margin + 5, yPosition);
    }
    
    yPosition += 15;
    
    // Add footer on last page
    const addFooter = () => {
      const footerY = pageHeight - 25;
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Footer content
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      
      // Left side - System info
      
      doc.text(` Generated: ${new Date().toLocaleString()}`, margin, footerY + 5);
      
      // Right side - Page number
      const pageNum = (doc as any).internal.getNumberOfPages();
      doc.text(`Page ${pageNum}`, pageWidth - margin - 20, footerY);
      doc.text('CONFIDENTIAL', pageWidth - margin - 30, footerY + 5);
    };
    
    // Add footer to current page
    addFooter();
    
    // Summary Section (keeping original structure)
    // doc.setFontSize(14);
    // doc.setTextColor(40, 40, 40);
    doc.text('SUMMARY', 20, yPosition);
    doc.setFontSize(14);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    const summaryText = reportData.isIllegal 
      ? `This satellite analysis has detected potential illegal mining activity in ${reportData.district}. The analysis covered a period from ${reportData.startDate ? new Date(reportData.startDate).toLocaleDateString() : 'unknown'} to ${reportData.endDate ? new Date(reportData.endDate).toLocaleDateString() : 'unknown'} using ${reportData.analysisType} analysis techniques. A total change area was identified as potentially illegal mining activity.`
      : `This satellite analysis shows no illegal mining activity detected in ${reportData.district}. The analysis covered a period from ${reportData.startDate ? new Date(reportData.startDate).toLocaleDateString() : 'unknown'} to ${reportData.endDate ? new Date(reportData.endDate).toLocaleDateString() : 'unknown'} using ${reportData.analysisType} analysis techniques. All detected changes appear to be within legal mining concession boundaries.`;
    
    const splitText = doc.splitTextToSize(summaryText, 160);
    doc.text(splitText, 25, yPosition);
    yPosition += splitText.length * 5 + 15;
    
    // Recommendations Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('RECOMMENDATIONS', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    const recommendations = reportData.isIllegal 
      ? [
          '• Immediate field verification is recommended',
          '• Contact local mining authorities for investigation',
          '• Consider implementing enhanced monitoring for this area',
          '• Review mining concession boundaries and permits',
          '• Schedule follow-up satellite analysis in 30 days'
        ]
      : [
          '• Continue regular monitoring of the area',
          '• Maintain current compliance monitoring schedule',
          '• No immediate action required',
          '• Schedule next routine analysis as per monitoring plan'
        ];
    
    recommendations.forEach(recommendation => {
      doc.text(recommendation, 25, yPosition);
      yPosition += 6;
    });
    
    yPosition += 15;
    
    // Footer (adjust position based on content)
    const footerY = Math.max(yPosition + 10, 270);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('This report was generated automatically by the GeoGuard Satellite Analysis System.', 20, footerY);
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="satellite-analysis-${reportData.reportId}-${reportData.district}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}
