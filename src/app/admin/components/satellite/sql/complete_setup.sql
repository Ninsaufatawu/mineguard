-- Complete SQL Setup for Satellite Analysis System
-- Run this entire script in your Supabase SQL editor

-- =====================================================
-- 1. CREATE STORAGE BUCKET FOR SATELLITE ANALYSIS
-- =====================================================

-- Create the satellite-analysis bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('satellite-analysis', 'satellite-analysis', true, false)
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies on the bucket (if any)
DROP POLICY IF EXISTS "Allow public uploads to satellite analysis" ON storage.objects;
DROP POLICY IF EXISTS "Allow access to satellite analysis" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to satellite analysis" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete of satellite analysis" ON storage.objects;

-- Allow any user to upload files to the satellite-analysis bucket
CREATE POLICY "Allow public uploads to satellite analysis"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'satellite-analysis'
);

-- Allow public access to satellite analysis files
CREATE POLICY "Allow access to satellite analysis"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'satellite-analysis'
);

-- Allow update of files in the satellite-analysis bucket
CREATE POLICY "Allow update to satellite analysis"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'satellite-analysis'
);

-- Allow deletion of files in the satellite-analysis bucket
CREATE POLICY "Allow delete of satellite analysis"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'satellite-analysis'
);

-- Make bucket public
UPDATE storage.buckets SET public = true WHERE id = 'satellite-analysis';

-- =====================================================
-- 2. CREATE REQUIRED SQL FUNCTIONS
-- =====================================================

-- Function to get district AOI by unioning all concessions
CREATE OR REPLACE FUNCTION get_district_union(district_name TEXT)
RETURNS TABLE(union_geom JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT ST_AsGeoJSON(ST_Union(geom))::JSONB as union_geom
  FROM concessions 
  WHERE concessions.district_name = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if polygons are outside legal concessions
CREATE OR REPLACE FUNCTION check_polygons_legality(
  polygons_geojson JSONB,
  district_name TEXT
)
RETURNS TABLE(
  is_illegal BOOLEAN,
  illegal_area_km2 NUMERIC,
  illegal_polygons JSONB
) AS $$
DECLARE
  polygon_feature JSONB;
  polygon_geom GEOMETRY;
  intersects_any BOOLEAN;
  illegal_geoms GEOMETRY[];
  total_illegal_area NUMERIC := 0;
  illegal_features JSONB[] := '{}';
BEGIN
  -- Initialize array for illegal geometries
  illegal_geoms := ARRAY[]::GEOMETRY[];
  
  -- Loop through each polygon in the GeoJSON FeatureCollection
  FOR polygon_feature IN SELECT jsonb_array_elements(polygons_geojson->'features')
  LOOP
    -- Convert GeoJSON to PostGIS geometry
    polygon_geom := ST_GeomFromGeoJSON(polygon_feature->'geometry');
    
    -- Check if this polygon intersects with any concession in the district
    SELECT EXISTS(
      SELECT 1 FROM concessions 
      WHERE concessions.district_name = $2 
      AND ST_Intersects(concessions.geom, polygon_geom)
    ) INTO intersects_any;
    
    -- If it doesn't intersect any concession, it's illegal
    IF NOT intersects_any THEN
      illegal_geoms := array_append(illegal_geoms, polygon_geom);
      illegal_features := array_append(illegal_features, polygon_feature);
      
      -- Add to total illegal area (convert from square meters to square kilometers)
      total_illegal_area := total_illegal_area + (ST_Area(polygon_geom::geography) / 1000000);
    END IF;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT 
    (array_length(illegal_geoms, 1) > 0) as is_illegal,
    total_illegal_area as illegal_area_km2,
    jsonb_build_object(
      'type', 'FeatureCollection',
      'features', array_to_json(illegal_features)
    ) as illegal_polygons;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. UPDATE SATELLITE_REPORTS TABLE
-- =====================================================

-- Add missing columns to existing satellite_reports table
ALTER TABLE satellite_reports 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS analysis_type TEXT,
ADD COLUMN IF NOT EXISTS vegetation_loss_percent NUMERIC,
ADD COLUMN IF NOT EXISTS bare_soil_increase_percent NUMERIC,
ADD COLUMN IF NOT EXISTS water_turbidity TEXT,
ADD COLUMN IF NOT EXISTS is_illegal BOOLEAN,
ADD COLUMN IF NOT EXISTS illegal_area_km2 NUMERIC,
ADD COLUMN IF NOT EXISTS geojson_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_satellite_reports_district ON satellite_reports(district);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_dates ON satellite_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_created_at ON satellite_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_is_illegal ON satellite_reports(is_illegal);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_analysis_type ON satellite_reports(analysis_type);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE satellite_reports ENABLE ROW LEVEL SECURITY;

-- Remove existing policies on satellite_reports (if any)
DROP POLICY IF EXISTS "Allow all operations on satellite_reports" ON satellite_reports;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on satellite_reports" ON satellite_reports
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify the satellite-analysis bucket exists
SELECT * FROM storage.buckets WHERE id = 'satellite-analysis';

-- Verify storage policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'objects' AND
  schemaname = 'storage' AND
  policyname LIKE '%satellite analysis%';

-- Verify satellite_reports table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'satellite_reports' 
ORDER BY ordinal_position;

-- Verify functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_district_union', 'check_polygons_legality');

-- Test district union function (replace 'YourDistrictName' with actual district)
-- SELECT get_district_union('YourDistrictName');

-- Check available districts
SELECT DISTINCT district_name, COUNT(*) as concession_count 
FROM concessions 
WHERE district_name IS NOT NULL 
GROUP BY district_name 
ORDER BY district_name 
LIMIT 10;

-- =====================================================
-- 5. SAMPLE DATA CHECK
-- =====================================================

-- Check if concessions table has data
SELECT 
  COUNT(*) as total_concessions,
  COUNT(DISTINCT district_name) as unique_districts,
  COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) as concessions_with_geometry
FROM concessions;

-- Check satellite_reports table
SELECT COUNT(*) as total_reports FROM satellite_reports;
