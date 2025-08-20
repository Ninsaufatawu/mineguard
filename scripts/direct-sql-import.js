// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables for Supabase connection');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Using anon key for connection');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateGeometries() {
  try {
    // Define the path to the CSV file
    const csvFilePath = path.join(process.cwd(), 'public', 'mining_licenses.csv');
    
    // Check if CSV file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    // Read the CSV file
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse the CSV file
    const { data } = Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
    });
    
    console.log(`Found ${data.length} concessions to process`);
    
    // First, try to create a SQL function that can update the geometries
    const createUpdateFunctionSQL = `
    CREATE OR REPLACE FUNCTION update_concession_geometry(
      p_code TEXT,
      p_wkt_geometry TEXT
    ) RETURNS BOOLEAN AS $$
    BEGIN
      UPDATE concessions
      SET geom = ST_GeomFromText(p_wkt_geometry, 4326)
      WHERE code = p_code AND p_wkt_geometry IS NOT NULL AND p_wkt_geometry != '';
      
      RETURN FOUND;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission to anon
    GRANT EXECUTE ON FUNCTION update_concession_geometry TO anon;
    `;
    
    console.log('Creating geometry update function...');
    
    // Try to create the function using direct SQL
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql_command: createUpdateFunctionSQL 
    }).catch(err => {
      return { error: err };
    });
    
    if (functionError) {
      console.log('Could not create update function directly. Trying to use direct updates instead.');
    } else {
      console.log('Successfully created update_concession_geometry function');
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each concession
    for (const row of data) {
      try {
        if (!row.geometry || !row.code) {
          console.warn(`Skipping row with code ${row.code || 'unknown'}: Missing geometry or code data`);
          continue;
        }
        
        if (!functionError) {
          // Use the function if it was created successfully
          const { data: updateResult, error } = await supabase.rpc('update_concession_geometry', {
            p_code: row.code,
            p_wkt_geometry: row.geometry
          });
          
          if (error) {
            console.error(`Error updating geometry for concession ${row.code}:`, error.message);
            errorCount++;
          } else {
            console.log(`Successfully updated geometry for concession: ${row.code}`);
            successCount++;
          }
        } else {
          // If function creation failed, try to directly insert the record
          // First check if record exists
          const { data: existingData, error: existingError } = await supabase
            .from('concessions')
            .select('id')
            .eq('code', row.code)
            .maybeSingle();
            
          if (existingError) {
            console.error(`Error checking for existing concession ${row.code}:`, existingError.message);
            errorCount++;
            continue;
          }
          
          // Format dates properly
          const startDate = row.start_date ? new Date(row.start_date) : null;
          const expiryDate = row.expiry_date ? new Date(row.expiry_date) : null;
            
          if (existingData?.id) {
            // If exists, we need to update with a custom RPC function that we might not have
            console.log(`Concession ${row.code} exists but cannot update geometry directly without the RPC function`);
            // We'll count this as an error since we can't update the geometry
            errorCount++;
          } else {
            // If it doesn't exist, we'll insert it
            // But we won't be able to set the geometry directly, so we'll log this
            const { data: insertedData, error } = await supabase
              .from('concessions')
              .insert({
                name: row.name || '',
                code: row.code || '',
                owner: row.owner || '',
                type: row.type || '',
                country: row.country || '',
                status: row.status || '',
                start_date: startDate ? startDate.toISOString().split('T')[0] : null,
                expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
                assets: row.assets || '',
                // Cannot set geometry directly via insert
              })
              .select();
              
            if (error) {
              console.error(`Error inserting concession ${row.code}:`, error.message);
              errorCount++;
            } else {
              console.log(`Inserted concession: ${row.code} but without geometry`);
              successCount++;
            }
          }
        }
      } catch (rowError) {
        console.error(`Error processing row with code ${row.code || 'unknown'}:`, rowError.message);
        errorCount++;
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Processing completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    console.log('\nInstructions for SQL Editor:');
    console.log('----------------------------');
    console.log('To update geometries for all concessions, run this SQL in the Supabase SQL Editor:');
    console.log(`
    -- Create temporary table for CSV data
    CREATE TEMP TABLE temp_concessions (
      name TEXT,
      code TEXT,
      owner TEXT,
      type TEXT,
      country TEXT,
      status TEXT,
      start_date TEXT,
      expiry_date TEXT,
      assets TEXT,
      geometry TEXT
    );
    
    -- IMPORTANT: You need to upload your CSV to Supabase first
    -- Then use this command to import the data:
    -- COPY temp_concessions FROM '/path/to/mining_licenses.csv' WITH (FORMAT csv, HEADER true);
    
    -- Update existing records with their geometries
    UPDATE concessions c
    SET geom = ST_GeomFromText(t.geometry, 4326)
    FROM temp_concessions t
    WHERE c.code = t.code AND t.geometry IS NOT NULL;
    
    -- Show how many records were updated
    SELECT COUNT(*) FROM concessions WHERE geom IS NOT NULL;
    `);
  } catch (error) {
    console.error('Error updating geometries:', error);
  }
}

// Run the function
(async () => {
  console.log('Starting geometry updates...');
  await updateGeometries();
})(); 