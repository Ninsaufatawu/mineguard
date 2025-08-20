import { Alert } from './types';

// Handle PDF export
export const handleExportPDF = async (alert: Alert) => {
  try {
    // Import jsPDF dynamically
    const jsPDF = await import('jspdf');
    const { jsPDF: PDF } = jsPDF;
    const doc = new PDF();
    
    // Set up the PDF
    doc.setFontSize(20);
    doc.text('MINING ALERT REPORT', 20, 20);
    
    doc.setFontSize(12);
    let yPosition = 40;
    
    // Basic Information
    doc.text(`Alert ID: ${alert.id}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Source: ${alert.source}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Priority: ${alert.priority.toUpperCase()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Status: ${alert.status.toUpperCase()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Location: ${alert.location}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${alert.datetime}`, 20, yPosition);
    yPosition += 20;
    
    // Description
    doc.setFontSize(14);
    doc.text('Description:', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    const description = alert.source === 'Satellite' && alert.is_illegal ? 
      `Illegal mining detected via ${alert.analysis_type} analysis in ${alert.district}. Immediate investigation required.` :
    alert.source === 'Satellite' ? 
      `Mining analysis completed using ${alert.analysis_type} in ${alert.district}. Normal operations detected.` :
    alert.source === 'Report' ? 
      `Community report from ${alert.district}. Requires verification and potential response.` :
    alert.source === 'System' && alert.analysis_type?.includes('pending') ? 
      `License application pending review in ${alert.district}.` :
    alert.source === 'System' && alert.analysis_type?.includes('expired') ? 
      `License expired in ${alert.district}. Renewal required.` :
    alert.source === 'System' && alert.analysis_type?.includes('revoked') ? 
      `License revoked in ${alert.district}. Operations must cease.` :
    `License status updated in ${alert.district}.`;
    
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5 + 15;
    
    // Technical Details
    doc.setFontSize(14);
    doc.text('Technical Details:', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    if (alert.analysis_type) {
      doc.text(`Analysis Type: ${alert.analysis_type}`, 20, yPosition);
      yPosition += 8;
    }
    if (alert.latitude && alert.longitude) {
      doc.text(`Coordinates: ${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`, 20, yPosition);
      yPosition += 8;
    }
    if (alert.change_area_km2 !== undefined && alert.change_area_km2 > 0) {
      doc.text(`Affected Area: ${alert.change_area_km2.toFixed(2)} km²`, 20, yPosition);
      yPosition += 8;
    }
    if (alert.is_illegal !== undefined) {
      doc.text(`Legal Status: ${alert.is_illegal ? 'ILLEGAL' : 'LEGAL'}`, 20, yPosition);
      yPosition += 8;
    }
    
    // Footer
    yPosition += 20;
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    doc.text('MineGuard Alert System', 20, yPosition + 8);
    
    // Save the PDF
    doc.save(`alert-${alert.id}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    console.log('PDF export completed for alert:', alert.id);
  } catch (error) {
    console.error('Error loading jsPDF:', error);
    // Fallback to text file if PDF library fails
    const pdfContent = `MINING ALERT REPORT\n\nAlert ID: ${alert.id}\nSource: ${alert.source}\nPriority: ${alert.priority}\nStatus: ${alert.status}\nLocation: ${alert.location}\nDate: ${alert.datetime}\n\nGenerated on: ${new Date().toLocaleString()}\nMineGuard Alert System`;
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alert-${alert.id}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Fallback text export completed for alert:', alert.id);
  }
};

// Handle take action navigation
export const handleTakeAction = (alert: Alert, setActiveTab?: (tab: string) => void) => {
  if (setActiveTab) {
    // Navigate to appropriate tab based on alert source
    switch (alert.source) {
      case 'Satellite':
        setActiveTab('satellite');
        break;
      case 'Report':
        setActiveTab('reports');
        break;
      case 'System':
        setActiveTab('licenses');
        break;
      default:
        setActiveTab('dashboard');
    }
  }
  
  console.log('Taking action for alert:', alert.id);
};

// Filter alerts based on search query and filter type
export const filterAlerts = (alerts: Alert[], searchQuery: string, filterType: string): Alert[] => {
  let filtered = alerts;

  // Apply source filter
  if (filterType !== 'all') {
    const sourceMap: { [key: string]: string } = {
      'satellite': 'Satellite',
      'community': 'Report',
      'system': 'System'
    };
    
    const targetSource = sourceMap[filterType];
    if (targetSource) {
      filtered = filtered.filter(alert => alert.source === targetSource);
    }
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(alert =>
      alert.description.toLowerCase().includes(query) ||
      alert.location.toLowerCase().includes(query) ||
      alert.id.toLowerCase().includes(query) ||
      (alert.district && alert.district.toLowerCase().includes(query)) ||
      (alert.analysis_type && alert.analysis_type.toLowerCase().includes(query))
    );
  }

  return filtered;
};

// Get priority color class
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Get status color class
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'in-progress': return 'bg-orange-100 text-orange-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Get source color class
export const getSourceColor = (source: string): string => {
  switch (source) {
    case 'Satellite': return 'bg-blue-100 text-blue-800';
    case 'Report': return 'bg-green-100 text-green-800';
    case 'System': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
