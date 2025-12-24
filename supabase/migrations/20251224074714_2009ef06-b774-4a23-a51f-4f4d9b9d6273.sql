
-- Create salary_settings table (single record for global settings)
CREATE TABLE public.salary_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  default_monthly_salary double precision NOT NULL DEFAULT 20000,
  weekly_off_day text NOT NULL DEFAULT 'Thursday',
  min_days_for_weekly_off_paid integer NOT NULL DEFAULT 20,
  cap_at_monthly_salary boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.salary_settings (default_monthly_salary, weekly_off_day, min_days_for_weekly_off_paid, cap_at_monthly_salary)
VALUES (20000, 'Thursday', 20, true);

-- Enable RLS on salary_settings
ALTER TABLE public.salary_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage salary settings
CREATE POLICY "Admins can view salary settings"
ON public.salary_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update salary settings"
ON public.salary_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create advances table for employee advances
CREATE TABLE public.advances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  advance_date date NOT NULL,
  amount double precision NOT NULL,
  remaining_amount double precision NOT NULL,
  reason text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on advances
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- Admins can manage all advances
CREATE POLICY "Admins can manage advances"
ON public.advances FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own advances
CREATE POLICY "Users can view their own advances"
ON public.advances FOR SELECT
USING ((auth.uid() = user_id) AND is_user_active(auth.uid()));

-- Add new columns to salary_slips for the new calculation logic
ALTER TABLE public.salary_slips 
ADD COLUMN IF NOT EXISTS total_days_in_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_off_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_salary double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_day_salary double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_salary double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_deduction double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_deductions double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_balance_after double precision DEFAULT 0;

-- Create trigger for updated_at on advances
CREATE TRIGGER update_advances_updated_at
BEFORE UPDATE ON public.advances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on salary_settings
CREATE TRIGGER update_salary_settings_updated_at
BEFORE UPDATE ON public.salary_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
