-- Drop the overly permissive policy that exposes all profiles to any authenticated user
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;