-- Create enum for request type
CREATE TYPE public.request_type AS ENUM ('LEAVE', 'OVERTIME');

-- Create enum for leave type
CREATE TYPE public.leave_type AS ENUM ('FULL_DAY', 'HALF_DAY');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT,
  request_type public.request_type NOT NULL,
  request_date DATE NOT NULL,
  leave_type public.leave_type,
  overtime_hours DOUBLE PRECISION,
  reason TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.leave_requests
FOR SELECT
USING ((auth.uid() = user_id) AND is_user_active(auth.uid()));

-- Users can insert their own requests
CREATE POLICY "Users can insert their own requests"
ON public.leave_requests
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_active(auth.uid()));

-- Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON public.leave_requests
FOR DELETE
USING ((auth.uid() = user_id) AND is_user_active(auth.uid()) AND status = 'PENDING');

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.leave_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (for approval/rejection)
CREATE POLICY "Admins can update requests"
ON public.leave_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();