-- Add status and working_hours columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ABSENT',
ADD COLUMN IF NOT EXISTS working_hours DOUBLE PRECISION DEFAULT 0;

-- Create function to calculate working hours and set status
CREATE OR REPLACE FUNCTION public.calculate_attendance_status()
RETURNS TRIGGER AS $$
DECLARE
  hours_worked DOUBLE PRECISION;
  attendance_status TEXT;
BEGIN
  -- Only calculate when punch_out_time is being set
  IF NEW.punch_out_time IS NOT NULL AND NEW.punch_in_time IS NOT NULL THEN
    -- Calculate working hours
    hours_worked := EXTRACT(EPOCH FROM (NEW.punch_out_time - NEW.punch_in_time)) / 3600;
    NEW.working_hours := ROUND(hours_worked::numeric, 2);
    
    -- Determine status based on working hours
    IF hours_worked >= 8 THEN
      attendance_status := 'PRESENT';
    ELSIF hours_worked >= 5 THEN
      attendance_status := 'HALF_DAY';
    ELSE
      attendance_status := 'ABSENT';
    END IF;
    
    NEW.status := attendance_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-calculating status on punch out
DROP TRIGGER IF EXISTS calculate_attendance_status_trigger ON public.attendance;
CREATE TRIGGER calculate_attendance_status_trigger
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.calculate_attendance_status();

-- Create function to expire sessions at midnight
CREATE OR REPLACE FUNCTION public.expire_attendance_sessions()
RETURNS void AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  hours_worked DOUBLE PRECISION;
  attendance_status TEXT;
BEGIN
  -- Find all records from yesterday that have punch_in but no punch_out
  UPDATE public.attendance
  SET 
    punch_out_time = (date::timestamp + INTERVAL '23:59:59'),
    working_hours = ROUND((EXTRACT(EPOCH FROM ((date::timestamp + INTERVAL '23:59:59') - punch_in_time)) / 3600)::numeric, 2),
    status = CASE 
      WHEN EXTRACT(EPOCH FROM ((date::timestamp + INTERVAL '23:59:59') - punch_in_time)) / 3600 >= 8 THEN 'PRESENT'
      WHEN EXTRACT(EPOCH FROM ((date::timestamp + INTERVAL '23:59:59') - punch_in_time)) / 3600 >= 5 THEN 'HALF_DAY'
      ELSE 'ABSENT'
    END
  WHERE date = yesterday
    AND punch_in_time IS NOT NULL
    AND punch_out_time IS NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;