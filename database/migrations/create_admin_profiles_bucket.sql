-- Create storage bucket for admin profile images
-- Run this SQL in your Supabase SQL editor

-- Create the bucket for admin profile images
-- Public bucket allows easy access to profile images in the UI
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-profiles',
  'admin-profiles', 
  true,
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create comprehensive policies for all admin operations (INSERT, SELECT, UPDATE, DELETE)
-- This provides full permissions while gracefully handling permission issues
DO $$
BEGIN
  -- Try to create all necessary policies, but don't fail if we don't have permissions
  
  -- Allow SELECT (read/view) operations on admin-profiles bucket
  BEGIN
    EXECUTE 'CREATE POLICY "Enable SELECT for admin-profiles" ON storage.objects FOR SELECT USING (bucket_id = ''admin-profiles'')';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipped creating SELECT policy due to insufficient privileges';
    WHEN duplicate_object THEN
      RAISE NOTICE 'SELECT policy already exists';
  END;
  
  -- Allow INSERT (upload) operations on admin-profiles bucket
  BEGIN
    EXECUTE 'CREATE POLICY "Enable INSERT for admin-profiles" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''admin-profiles'')';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipped creating INSERT policy due to insufficient privileges';
    WHEN duplicate_object THEN
      RAISE NOTICE 'INSERT policy already exists';
  END;
  
  -- Allow UPDATE (modify) operations on admin-profiles bucket
  BEGIN
    EXECUTE 'CREATE POLICY "Enable UPDATE for admin-profiles" ON storage.objects FOR UPDATE USING (bucket_id = ''admin-profiles'')';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipped creating UPDATE policy due to insufficient privileges';
    WHEN duplicate_object THEN
      RAISE NOTICE 'UPDATE policy already exists';
  END;
  
  -- Allow DELETE (remove) operations on admin-profiles bucket
  BEGIN
    EXECUTE 'CREATE POLICY "Enable DELETE for admin-profiles" ON storage.objects FOR DELETE USING (bucket_id = ''admin-profiles'')';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipped creating DELETE policy due to insufficient privileges';
    WHEN duplicate_object THEN
      RAISE NOTICE 'DELETE policy already exists';
  END;
  
END $$;

-- Note: 
-- - Public bucket allows profile images to be displayed without authentication
-- - Application-level security (JWT tokens) controls who can upload
-- - File validation happens in the frontend before upload
