-- Add policy for admins to view all attendance records
CREATE POLICY "Admins can view all attendance"
ON public.attendance
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));