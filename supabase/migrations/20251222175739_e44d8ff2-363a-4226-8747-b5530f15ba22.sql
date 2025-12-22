-- Create a trigger to insert user role on signup based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  role_value text;
BEGIN
  -- Get role from user metadata
  role_value := new.raw_user_meta_data ->> 'role';
  
  -- Only insert if role is provided and valid
  IF role_value IS NOT NULL AND role_value IN ('plantManager', 'productionManager', 'accountant') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, role_value::app_role);
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();