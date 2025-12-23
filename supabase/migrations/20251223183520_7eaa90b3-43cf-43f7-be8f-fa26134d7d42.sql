-- Fix 1: Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('attendance-photos', 'problem-photos');

-- Fix 2: Drop public SELECT policies and create authenticated-only policies for attendance-photos
DROP POLICY IF EXISTS "Attendance photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view attendance photos" ON storage.objects;

-- Create authenticated-only SELECT policy for attendance-photos
CREATE POLICY "Authenticated users can view attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attendance-photos');

-- Fix 3: Drop public SELECT policies and create authenticated-only policies for problem-photos
DROP POLICY IF EXISTS "Problem photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view problem photos" ON storage.objects;

-- Create authenticated-only SELECT policy for problem-photos
CREATE POLICY "Authenticated users can view problem photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'problem-photos');

-- Fix 4: Update generate_invoice_number function to add authorization check
CREATE OR REPLACE FUNCTION public.generate_invoice_number(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_month TEXT;
  next_seq INT;
  invoice_prefix TEXT;
BEGIN
  -- Validate caller owns this user_id
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only generate invoice numbers for yourself';
  END IF;

  current_month := TO_CHAR(NOW(), 'YYYYMM');
  invoice_prefix := 'INV-' || current_month || '-';
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_no FROM LENGTH(invoice_prefix) + 1) AS INT)
  ), 0) + 1
  INTO next_seq
  FROM public.invoices
  WHERE created_by = user_id
  AND invoice_no LIKE invoice_prefix || '%';
  
  RETURN invoice_prefix || LPAD(next_seq::TEXT, 4, '0');
END;
$function$;