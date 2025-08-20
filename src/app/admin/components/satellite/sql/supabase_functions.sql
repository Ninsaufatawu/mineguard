-- SQL functions for Supabase PostGIS operations
-- Run these in your Supabase SQL editor

-- Function to get all concessions as GeoJSON FeatureCollection
CREATE OR REPLACE FUNCTION get_concessions_geojson()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::jsonb,
          'properties', to_jsonb(concessions) - 'geom'::text
        )
      ),
      '[]'::jsonb
    )
  ) INTO result
  FROM concessions;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get district AOI by unioning all concessions
CREATE OR REPLACE FUNCTION get_district_union(district_name TEXT)
RETURNS TABLE(union_geom JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT ST_AsGeoJSON(ST_Union(geom))::JSONB as union_geom
  FROM concessions 
  WHERE district_name = $1;
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

-- Create satellite_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS satellite_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  analysis_type TEXT NOT NULL,
  vegetation_loss_percent NUMERIC,
  bare_soil_increase_percent NUMERIC,
  water_turbidity TEXT,
  is_illegal BOOLEAN NOT NULL,
  illegal_area_km2 NUMERIC NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  ndvi_image_url TEXT,
  geojson_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_satellite_reports_district ON satellite_reports(district);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_dates ON satellite_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_created_at ON satellite_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_is_illegal ON satellite_reports(is_illegal);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE satellite_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on satellite_reports" ON satellite_reports
  FOR ALL USING (true) WITH CHECK (true);
