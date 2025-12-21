-- Add salary-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_salary DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_rate DOUBLE PRECISION DEFAULT 0;

-- Create salary_slips table
CREATE TABLE public.salary_slips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Working days calculation
  total_working_days INTEGER NOT NULL DEFAULT 0,
  days_present INTEGER NOT NULL DEFAULT 0,
  days_absent INTEGER NOT NULL DEFAULT 0,
  days_half INTEGER NOT NULL DEFAULT 0,
  
  -- Hours calculation
  total_hours_worked DOUBLE PRECISION NOT NULL DEFAULT 0,
  regular_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
  overtime_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
  
  -- Salary calculation
  basic_salary DOUBLE PRECISION NOT NULL DEFAULT 0,
  overtime_pay DOUBLE PRECISION NOT NULL DEFAULT 0,
  deductions DOUBLE PRECISION NOT NULL DEFAULT 0,
  net_salary DOUBLE PRECISION NOT NULL DEFAULT 0,
  
  -- Metadata
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  
  -- Ensure one slip per user per month
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all salary slips
CREATE POLICY "Admins can manage salary slips"
ON public.salary_slips
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Users can view their own salary slips
CREATE POLICY "Users can view their own salary slips"
ON public.salary_slips
FOR SELECT
USING (auth.uid() = user_id AND is_user_active(auth.uid()));

-- Policy: Admins can update profiles for salary info
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add realtime for salary_slips
ALTER PUBLICATION supabase_realtime ADD TABLE public.salary_slips;