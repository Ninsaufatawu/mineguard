-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create satellite_reports table
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

-- Create concessions table with PostGIS geometry
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

-- Create a function to insert concession with WKT geometry
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
$$ LANGUAGE plpgsql;

-- Create a function to generate the insert_concession function
-- This function can be called via RPC from the Next.js script
CREATE OR REPLACE FUNCTION create_insert_concession_function()
RETURNS BOOLEAN AS $$
BEGIN
  -- The function definition is already created above,
  -- so this just needs to return success
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create spatial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_concessions_geom ON concessions USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_location ON satellite_reports (lat, lng); 