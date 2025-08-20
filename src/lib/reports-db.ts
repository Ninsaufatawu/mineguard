import { supabase } from "./supabase";
import { v4 as uuidv4 } from 'uuid';

// Type definition for report data
export type ReportData = {
  id?: string;
  report_id: string;
  report_type: string;
  threat_level: number;
  incident_description?: string;
  mining_activity_type?: string;
  location_lat?: number;
  location_lng?: number;
  location_description?: string;
  evidence_files?: string[];
  blur_faces?: boolean;
  strip_location?: boolean;
  status?: string;
  created_at?: string;
  user_id?: string;
  
  
};

/**
 * Store a mining activity report in Supabase
 */
export async function storeReport(reportData: ReportData): Promise<{ success: boolean; report_id?: string; error?: string }> {
  try {
    // Add more detailed logging to debug missing fields
    console.log('Storing report in Supabase with full data:', {
      report_id: reportData.report_id,
      report_type: reportData.report_type,
      threat_level: reportData.threat_level,
      mining_activity_type: reportData.mining_activity_type || 'MISSING', // Debug
      incident_description: reportData.incident_description || 'MISSING', // Debug
      location_lat: reportData.location_lat,
      location_lng: reportData.location_lng,
      evidence_files: reportData.evidence_files ? reportData.evidence_files.length : 0,
    });
    
    // Ensure we have a report ID
    const reportId = reportData.report_id || `ID-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Create a data object for anonymous reporting (no user tracking)
    const insertData: any = {
      id: uuidv4(),
      report_id: reportId,
      report_type: reportData.report_type,
      threat_level: reportData.threat_level,
      incident_description: reportData.incident_description || '', // Ensure a default value
      mining_activity_type: reportData.mining_activity_type || '', // Ensure a default value
      location_lat: reportData.location_lat,
      location_lng: reportData.location_lng,
      location_description: reportData.location_description || '',
      evidence_files: reportData.evidence_files || [],
      blur_faces: reportData.blur_faces ?? true,
      strip_location: reportData.strip_location ?? true,
      status: reportData.status || 'pending',
      created_at: new Date().toISOString(),
    };
    
    // Handle user_id field: store email for registered users, null for anonymous
    insertData.user_id = reportData.user_id || null;
    
    // Never store IP or user agent for privacy protection
    // These fields are intentionally omitted for all reports
    
    console.log('Final insert data structure:', {
      mining_activity_type: insertData.mining_activity_type,
      incident_description: insertData.incident_description,
    });
    
    // Store report data in Supabase
    const { data, error } = await supabase
      .from('mining_reports')
      .insert(insertData)
      .select('report_id');
    
    if (error) {
      console.error('Error storing report in Supabase:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    console.log('Report stored successfully:', data);
    return { 
      success: true, 
      report_id: data?.[0]?.report_id || reportId 
    };
  } catch (error) {
    console.error('Exception storing report in Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all reports from Supabase
 */
export async function getAllReports(): Promise<ReportData[]> {
  try {
    const { data, error } = await supabase
      .from('mining_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reports from Supabase:', error);
      return [];
    }
    
    return data as ReportData[];
  } catch (error) {
    console.error('Exception fetching reports from Supabase:', error);
    return [];
  }
}

/**
 * Get a report by ID
 */
export async function getReportById(reportId: string): Promise<ReportData | null> {
  try {
    const { data, error } = await supabase
      .from('mining_reports')
      .select('*')
      .eq('report_id', reportId)
      .single();
    
    if (error) {
      console.error(`Error fetching report ${reportId} from Supabase:`, error);
      return null;
    }
    
    return data as ReportData;
  } catch (error) {
    console.error(`Exception fetching report ${reportId} from Supabase:`, error);
    return null;
  }
}

/**
 * Update report status
 */
export async function updateReportStatus(reportId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mining_reports')
      .update({ status })
      .eq('report_id', reportId);
    
    if (error) {
      console.error(`Error updating report ${reportId} status:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception updating report ${reportId} status:`, error);
    return false;
  }
}

/**
 * Update report evidence files
 */
export async function updateReportEvidence(reportId: string, evidenceFiles: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mining_reports')
      .update({ evidence_files: evidenceFiles })
      .eq('report_id', reportId);
    
    if (error) {
      console.error(`Error updating report ${reportId} evidence files:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception updating report ${reportId} evidence files:`, error);
    return false;
  }
} 