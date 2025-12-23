-- Fix: Separate sensitive salary data into admin-only table and add RESTRICTIVE policies

-- Step 1: Create employee_salaries table for sensitive salary data (admin-only)
CREATE TABLE public.employee_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  monthly_salary double precision DEFAULT 0,
  overtime_rate double precision DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on employee_salaries
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;

-- Only admins can access salary data
CREATE POLICY "Admins can view all salaries"
ON public.employee_salaries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert salaries"
ON public.employee_salaries
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update salaries"
ON public.employee_salaries
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete salaries"
ON public.employee_salaries
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 2: Migrate existing salary data from profiles to employee_salaries
INSERT INTO public.employee_salaries (user_id, monthly_salary, overtime_rate)
SELECT user_id, COALESCE(monthly_salary, 0), COALESCE(overtime_rate, 0)
FROM public.profiles
WHERE monthly_salary IS NOT NULL OR overtime_rate IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Remove salary columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS monthly_salary;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS overtime_rate;

-- Step 4: Add RESTRICTIVE policy as additional security layer on profiles
-- This ensures that even if a permissive policy is accidentally added, 
-- users must still be authenticated
CREATE POLICY "Require authentication for profiles access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: Create trigger to update updated_at on employee_salaries
CREATE TRIGGER update_employee_salaries_updated_at
BEFORE UPDATE ON public.employee_salaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();