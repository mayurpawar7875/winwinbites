-- Fix profiles table: Users can only see their own profile, admins can see all
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix customers table: Users can only see customers they created, admins can see all
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;

CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all customers" 
ON public.customers 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));