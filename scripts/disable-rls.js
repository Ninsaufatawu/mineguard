// Script to disable RLS for tables using anon key
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function disableRLS() {
  try {
    // Use the anon key that's already available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required environment variables');
      console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
      process.exit(1);
    }
    
    console.log('Connecting to Supabase with anon key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // SQL to disable RLS and grant permissions to anon user
    const disableRlsSql = `
    -- Create the tables if they don't exist first
    CREATE TABLE IF NOT EXISTS satellite_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT,
      district TEXT,
      lat FLOAT,
      lng FLOAT,
      before_image_url TEXT,
      after_image_url TEXT,
      ndvi_image_url TEXT,
      detected_at TIMESTAMP DEFAULT now()
    );

    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE IF NOT EXISTS concessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      code TEXT,
      owner TEXT,
      type TEXT,
      country TEXT,
      status TEXT,
      start_date DATE,
      expiry_date DATE,
      assets TEXT,
      geom GEOMETRY(POLYGON, 4326)
    );
    
    -- Disable RLS on these tables
    ALTER TABLE satellite_reports DISABLE ROW LEVEL SECURITY;
    ALTER TABLE concessions DISABLE ROW LEVEL SECURITY;
    
    -- Grant all privileges on these tables to anon role
    GRANT ALL PRIVILEGES ON TABLE satellite_reports TO anon;
    GRANT ALL PRIVILEGES ON TABLE concessions TO anon;
    GRANT ALL PRIVILEGES ON SEQUENCE satellite_reports_id_seq TO anon;
    GRANT ALL PRIVILEGES ON SEQUENCE concessions_id_seq TO anon;
    
    -- Create the functions needed for importing concessions with proper permissions
    CREATE OR REPLACE FUNCTION insert_concession(
      p_name TEXT,
      p_code TEXT,
      p_owner TEXT,
      p_type TEXT,
      p_country TEXT,
      p_status TEXT,
      p_start_date DATE,
      p_expiry_date DATE,
      p_assets TEXT,
      p_wkt_geometry TEXT
    ) RETURNS UUID AS $$
    DECLARE
      new_id UUID;
    BEGIN
      INSERT INTO concessions (
        id, name, code, owner, type, country, status, 
        start_date, expiry_date, assets, geom
      ) VALUES (
        gen_random_uuid(), 
        p_name, 
        p_code, 
        p_owner, 
        p_type, 
        p_country, 
        p_status, 
        p_start_date, 
        p_expiry_date, 
        p_assets, 
        ST_GeomFromText(p_wkt_geometry, 4326)
      )
      RETURNING id INTO new_id;
      
      RETURN new_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission to anon
    GRANT EXECUTE ON FUNCTION insert_concession TO anon;
    
    CREATE OR REPLACE FUNCTION create_insert_concession_function()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission to anon
    GRANT EXECUTE ON FUNCTION create_insert_concession_function TO anon;
    `;
    
    // Execute the SQL using raw query (since we're not using RPC now)
    console.log('Executing SQL to disable RLS and grant permissions...');
    const { error } = await supabase.rpc('exec_sql', { sql_command: disableRlsSql });
    
    if (error) {
      if (error.message && error.message.includes('function "exec_sql" does not exist')) {
        console.log('The exec_sql function does not exist, creating it first...');
        
        // Create the exec_sql function
        const { error: createFunctionError } = await supabase
          .from('_exec_sql_function')
          .insert({
            sql: `
            CREATE OR REPLACE FUNCTION exec_sql(sql_command TEXT) RETURNS JSONB AS $$
            BEGIN
              EXECUTE sql_command;
              RETURN jsonb_build_object('success', true);
            EXCEPTION WHEN OTHERS THEN
              RETURN jsonb_build_object('success', false, 'error', SQLERRM);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Grant execute permission to anon
            GRANT EXECUTE ON FUNCTION exec_sql TO anon;
            `
          });
          
        if (createFunctionError) {
          console.error('Unable to create exec_sql function:', createFunctionError);
          console.log('\nAlternative approach: You need to run this SQL manually in the Supabase SQL Editor:');
          console.log(`
          CREATE OR REPLACE FUNCTION exec_sql(sql_command TEXT) RETURNS JSONB AS $$
          BEGIN
            EXECUTE sql_command;
            RETURN jsonb_build_object('success', true);
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('success', false, 'error', SQLERRM);
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Grant execute permission to anon
          GRANT EXECUTE ON FUNCTION exec_sql TO anon;
          `);
        } else {
          console.log('exec_sql function created successfully, retrying the main SQL...');
          const { error: retryError } = await supabase.rpc('exec_sql', { sql_command: disableRlsSql });
          if (retryError) {
            console.error('Error executing SQL after creating exec_sql function:', retryError);
          } else {
            console.log('SQL executed successfully!');
          }
        }
      } else {
        console.error('Error executing SQL:', error);
      }
    } else {
      console.log('RLS disabled and permissions granted successfully!');
    }
    
    console.log('\nNext steps:');
    console.log('1. Run setup-db.js to create tables and functions');
    console.log('2. Run import-concessions.js to import data from CSV');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
(async () => {
  console.log('Starting RLS configuration...');
  await disableRLS();
})(); 