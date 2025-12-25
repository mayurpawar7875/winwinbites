-- Fix storage policies for attendance-photos and problem-photos
-- Restrict access to owner + admin only (following principle of least privilege)

-- Drop existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view problem photos" ON storage.objects;

-- Create owner-only SELECT policy for attendance photos
CREATE POLICY "Users can view their own attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create admin SELECT policy for attendance photos
CREATE POLICY "Admins can view all attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create owner-only SELECT policy for problem photos
CREATE POLICY "Users can view their own problem photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'problem-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create admin SELECT policy for problem photos
CREATE POLICY "Admins can view all problem photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'problem-photos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);