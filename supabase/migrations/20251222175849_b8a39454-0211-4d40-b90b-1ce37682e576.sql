-- Update handle_new_user to use selected role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_value text;
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Plant Manager'), NEW.email);
  
  -- Get role from user metadata, default to plantManager
  role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'plantManager');
  
  -- Only insert valid roles (exclude admin for security)
  IF role_value IN ('plantManager', 'productionManager', 'accountant') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, role_value::app_role);
  ELSE
    -- Default to plantManager if invalid role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'plantManager');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the separate role trigger since handle_new_user now handles it
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;