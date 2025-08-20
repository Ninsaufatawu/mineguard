-- Fix missing columns in satellite_reports table
-- Run this SQL in your Supabase SQL editor to ensure all required columns exist

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'satellite_reports' 
ORDER BY ordinal_position;

-- Add any missing columns to satellite_reports table
ALTER TABLE satellite_reports 
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS analysis_type TEXT,
ADD COLUMN IF NOT EXISTS vegetation_loss_percent NUMERIC,
ADD COLUMN IF NOT EXISTS bare_soil_increase_percent NUMERIC,
ADD COLUMN IF NOT EXISTS water_turbidity TEXT,
ADD COLUMN IF NOT EXISTS is_illegal BOOLEAN,
ADD COLUMN IF NOT EXISTS illegal_area_km2 NUMERIC,
ADD COLUMN IF NOT EXISTS before_image_url TEXT,
ADD COLUMN IF NOT EXISTS after_image_url TEXT,
ADD COLUMN IF NOT EXISTS ndvi_image_url TEXT,
ADD COLUMN IF NOT EXISTS geojson_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify all columns exist after adding them
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'satellite_reports' 
ORDER BY ordinal_position;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_satellite_reports_district ON satellite_reports(district);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_dates ON satellite_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_created_at ON satellite_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_is_illegal ON satellite_reports(is_illegal);
CREATE INDEX IF NOT EXISTS idx_satellite_reports_analysis_type ON satellite_reports(analysis_type);
