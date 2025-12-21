-- Create enums
CREATE TYPE public.payment_status AS ENUM ('PAID', 'CREDIT');
CREATE TYPE public.payment_mode AS ENUM ('CASH', 'ONLINE');
CREATE TYPE public.party_type AS ENUM ('VENDOR', 'CUSTOMER');
CREATE TYPE public.problem_type AS ENUM ('MACHINE', 'RAW_MATERIAL', 'LABOUR', 'POWER', 'QUALITY', 'OTHER');
CREATE TYPE public.problem_status AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE public.app_role AS ENUM ('admin', 'plantManager');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  punch_in_time TIMESTAMPTZ,
  punch_in_photo_url TEXT,
  punch_in_lat DOUBLE PRECISION,
  punch_in_lng DOUBLE PRECISION,
  punch_out_time TIMESTAMPTZ,
  punch_out_photo_url TEXT,
  punch_out_lat DOUBLE PRECISION,
  punch_out_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Production table
CREATE TABLE public.production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  labour_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  shift TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  opening_stock DOUBLE PRECISION NOT NULL,
  production_added DOUBLE PRECISION NOT NULL,
  sales_dispatched DOUBLE PRECISION NOT NULL,
  closing_stock DOUBLE PRECISION NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  vendor_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  payment_status payment_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  payment_status payment_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  expense_head TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  paid_to TEXT,
  mode_of_payment payment_mode NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outstanding table
CREATE TABLE public.outstanding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  party_name TEXT NOT NULL,
  party_type party_type NOT NULL,
  opening_outstanding DOUBLE PRECISION NOT NULL,
  new_credit_amount DOUBLE PRECISION NOT NULL,
  amount_settled DOUBLE PRECISION NOT NULL,
  closing_outstanding DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Problems table
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  location_text TEXT NOT NULL,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  problem_type problem_type NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  status problem_status DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outstanding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for user_roles (read-only for users)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own attendance"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own attendance"
ON public.attendance FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for production
CREATE POLICY "Users can view their own production"
ON public.production FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own production"
ON public.production FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own production"
ON public.production FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own production"
ON public.production FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for inventory
CREATE POLICY "Users can view their own inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own inventory"
ON public.inventory FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own inventory"
ON public.inventory FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own inventory"
ON public.inventory FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own purchases"
ON public.purchases FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own purchases"
ON public.purchases FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for sales
CREATE POLICY "Users can view their own sales"
ON public.sales FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own sales"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own sales"
ON public.sales FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own sales"
ON public.sales FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for outstanding
CREATE POLICY "Users can view their own outstanding"
ON public.outstanding FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own outstanding"
ON public.outstanding FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own outstanding"
ON public.outstanding FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own outstanding"
ON public.outstanding FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- RLS Policies for problems
CREATE POLICY "Users can view their own problems"
ON public.problems FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own problems"
ON public.problems FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can update their own problems"
ON public.problems FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own problems"
ON public.problems FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_active(auth.uid()));

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-photos', 'attendance-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('problem-photos', 'problem-photos', true);

-- Storage policies for attendance photos
CREATE POLICY "Users can upload their own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Attendance photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-photos');

-- Storage policies for problem photos
CREATE POLICY "Users can upload their own problem photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'problem-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Problem photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'problem-photos');

-- Function to handle new user signup (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Plant Manager'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'plantManager');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();