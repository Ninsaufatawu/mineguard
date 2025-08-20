import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ConcessionData {
  name: string;
  code: string;
  owner: string;
  type: string;
  country: string;
  district_name: string;
  status: string;
  start_date: string;
  expiry_date: string;
  assets: string;
  geometry: string; // WKT format
}

async function importConcessions() {
  try {
    // Define the path to the CSV file
    const csvFilePath = path.join(process.cwd(), 'public', 'concessions.csv');
    
    // Read the CSV file
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse the CSV file
    const { data } = Papa.parse<ConcessionData>(csvFile, {
      header: true,
      skipEmptyLines: true,
    });
    
    console.log(`Found ${data.length} concessions to import`);
    
    // First, let's create the database function to handle WKT conversion
    // This only needs to be done once, not for each row
    const { error: functionError } = await supabase.rpc('create_insert_concession_function', {});
    
    if (functionError) {
      console.log('Creating function failed, it might already exist:', functionError.message);
    } else {
      console.log('Successfully created insert_concession function');
    }
    
    // Process each row
    for (const row of data) {
      try {
        // Format dates properly
        const startDate = row.start_date ? new Date(row.start_date) : null;
        const expiryDate = row.expiry_date ? new Date(row.expiry_date) : null;
        
        // Use raw SQL query to handle PostGIS geometry conversion
        const { data: insertedData, error } = await supabase.rpc('insert_concession', {
          p_name: row.name,
          p_code: row.code,
          p_owner: row.owner,
          p_type: row.type,
          p_country: row.country,
          p_status: row.status,
          p_start_date: startDate?.toISOString().split('T')[0],
          p_expiry_date: expiryDate?.toISOString().split('T')[0],
          p_assets: row.assets,
          p_wkt_geometry: row.geometry,
          p_district_name: row.district_name
        });
          
        if (error) {
          console.error(`Error inserting concession ${row.code}:`, error);
        } else {
          console.log(`Successfully imported concession: ${row.code}`);
        }
      } catch (rowError) {
        console.error(`Error processing row with code ${row.code}:`, rowError);
      }
    }
    
    console.log('Import completed');
  } catch (error) {
    console.error('Error importing concessions:', error);
  }
}

export default importConcessions; 