import { supabase } from "./supabase";
import { v4 as uuidv4 } from 'uuid';

// Type definition for license data
export type LicenseData = {
  id?: string;
  license_id: string;
  license_type: string;
  company_type: string;
  company_name: string;
  registration_number: string;
  tax_id: string;
  company_type_category: string;
  company_address: string;
  contact_name: string;
  contact_position: string;
  contact_email: string;
  contact_phone: string;
  ownership_structure: string;
  local_ownership_percentage: string;
  foreign_ownership_percentage: string;
  previous_licenses: string;
  mining_experience: string;
  annual_turnover: string;
  available_capital: string;
  incorporation_date: string;
  vat_registration: string;
  director_citizenship: string;
  document_files?: string[];
  area_method: string;
  area_size: string;
  perimeter: string;
  coordinates: string;
  region: string;
  district: string;
  area_description: string;
  confirm_no_overlap: boolean;
  status?: string;
  created_at?: string;
  user_id?: string;
  user_ip?: string;
  user_agent?: string;
};

/**
 * Store a license application in Supabase
 */
export async function storeLicense(licenseData: LicenseData): Promise<{ success: boolean; license_id?: string; error?: string }> {
  try {
    // Ensure we have a license ID
    const licenseId = licenseData.license_id || `LIC-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Create a data object for insertion
    const insertData = {
      id: uuidv4(),
      license_id: licenseId,
      license_type: licenseData.license_type,
      company_type: licenseData.company_type,
      company_name: licenseData.company_name,
      registration_number: licenseData.registration_number,
      tax_id: licenseData.tax_id,
      company_type_category: licenseData.company_type_category,
      company_address: licenseData.company_address,
      contact_name: licenseData.contact_name,
      contact_position: licenseData.contact_position,
      contact_email: licenseData.contact_email,
      contact_phone: licenseData.contact_phone,
      ownership_structure: licenseData.ownership_structure || '',
      local_ownership_percentage: licenseData.local_ownership_percentage || '',
      foreign_ownership_percentage: licenseData.foreign_ownership_percentage || '',
      previous_licenses: licenseData.previous_licenses || '',
      mining_experience: licenseData.mining_experience || '',
      annual_turnover: licenseData.annual_turnover || '',
      available_capital: licenseData.available_capital || '',
      incorporation_date: licenseData.incorporation_date || '',
      vat_registration: licenseData.vat_registration || '',
      director_citizenship: licenseData.director_citizenship || '',
      document_files: licenseData.document_files || [],
      area_method: licenseData.area_method,
      area_size: licenseData.area_size,
      perimeter: licenseData.perimeter || '',
      coordinates: licenseData.coordinates || '',
      region: licenseData.region,
      district: licenseData.district,
      area_description: licenseData.area_description || '',
      confirm_no_overlap: licenseData.confirm_no_overlap,
      status: licenseData.status || 'pending',
      created_at: new Date().toISOString(),
      user_id: licenseData.user_id,
      user_ip: licenseData.user_ip,
      user_agent: licenseData.user_agent,
    };
    
    // Store license data in Supabase
    const { data, error } = await supabase
      .from('mining_licenses')
      .insert(insertData)
      .select('license_id');
    
    if (error) {
      console.error('Error storing license in Supabase:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    console.log('License stored successfully:', data);
    return { 
      success: true, 
      license_id: data?.[0]?.license_id || licenseId 
    };
  } catch (error) {
    console.error('Exception storing license in Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all license applications from Supabase
 */
export async function getAllLicenses(): Promise<LicenseData[]> {
  try {
    const { data, error } = await supabase
      .from('mining_licenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching licenses from Supabase:', error);
      return [];
    }
    
    return data as LicenseData[];
  } catch (error) {
    console.error('Exception fetching licenses from Supabase:', error);
    return [];
  }
}

/**
 * Get a license by ID
 */
export async function getLicenseById(licenseId: string): Promise<LicenseData | null> {
  try {
    const { data, error } = await supabase
      .from('mining_licenses')
      .select('*')
      .eq('license_id', licenseId)
      .single();
    
    if (error) {
      console.error(`Error fetching license ${licenseId} from Supabase:`, error);
      return null;
    }
    
    return data as LicenseData;
  } catch (error) {
    console.error(`Exception fetching license ${licenseId} from Supabase:`, error);
    return null;
  }
}

/**
 * Update license status
 */
export async function updateLicenseStatus(licenseId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mining_licenses')
      .update({ status })
      .eq('license_id', licenseId);
    
    if (error) {
      console.error(`Error updating license ${licenseId} status:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception updating license ${licenseId} status:`, error);
    return false;
  }
} 