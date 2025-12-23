-- Add user_name column to attendance table for admin listing
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS user_name text;

-- Create index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance(user_id, date);

-- Update existing RLS policies - admin can read all, employees can only read/write their own

-- Drop existing policies first to recreate them
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;

-- Admin can read all attendance records (view only)
CREATE POLICY "Admins can view all attendance" 
ON public.attendance 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own attendance
CREATE POLICY "Users can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING ((auth.uid() = user_id) AND is_user_active(auth.uid()));

-- Users can insert their own attendance for today only
CREATE POLICY "Users can insert their own attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND is_user_active(auth.uid()) AND (date = CURRENT_DATE));

-- Users can update their own attendance for today only
CREATE POLICY "Users can update their own attendance" 
ON public.attendance 
FOR UPDATE 
USING ((auth.uid() = user_id) AND is_user_active(auth.uid()) AND (date = CURRENT_DATE));