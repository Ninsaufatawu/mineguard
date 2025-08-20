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

// Helper function to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry a function multiple times
async function withRetry(fn, retries = 3, delay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      lastError = error;
      await sleep(delay);
      // Exponential backoff
      delay *= 2;
    }
  }
  throw lastError;
}

async function importConcessions() {
  try {
    // Define the path to the CSV file
    const csvFilePath = path.join(process.cwd(), 'public', 'concessions.csv');
    
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
    
    console.log(`Found ${data.length} concessions to import`);
    
    // Process in batches of 10
    const BATCH_SIZE = 10;
    let successCount = 0;
    let errorCount = 0;
    
    // Process rows in batches
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(data.length / BATCH_SIZE)}`);
      
      // Process each row in the batch
      const batchPromises = batch.map(async (row) => {
        try {
          if (!row.geometry) {
            console.warn(`Skipping row with code ${row.code || 'unknown'}: Missing geometry data`);
            return;
          }
          
          // Format dates properly
          const startDate = row.start_date ? new Date(row.start_date) : null;
          const expiryDate = row.expiry_date ? new Date(row.expiry_date) : null;
          
          // Use the insert_concession function to properly handle the geometry
          // With retry logic
          const result = await withRetry(async () => {
            const { data, error } = await supabase.rpc('insert_concession', {
              p_name: row.name || '',
              p_code: row.code || '',
              p_owner: row.owner || '',
              p_type: row.type || '',
              p_country: row.country || '',
              p_district_name: row.district_name || '',
              p_status: row.status || '',
              p_start_date: startDate ? startDate.toISOString().split('T')[0] : null,
              p_expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
              p_assets: row.assets || '',
              p_wkt_geometry: row.geometry
            });
            
            if (error) throw new Error(error.message);
            return data;
          });
          
          console.log(`Successfully imported concession: ${row.code || 'unknown'} with geometry`);
          successCount++;
        } catch (rowError) {
          console.error(`Error processing row with code ${row.code || 'unknown'}:`, rowError.message);
          errorCount++;
        }
      });
      
      // Wait for all rows in the batch to be processed
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid overwhelming the API
      await sleep(1000);
    }
    
    console.log(`Import completed. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error importing concessions:', error);
  }
}

// Run the import function
(async () => {
  console.log('Starting concessions import with geometry (batch mode)...');
  await importConcessions();
})(); 