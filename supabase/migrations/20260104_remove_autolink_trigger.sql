-- Drop the auto-linking trigger (no longer needed with invitation-only flow)
DROP TRIGGER IF EXISTS on_auth_user_created_link_client ON auth.users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user_client_link();

-- Notify to reload schema
NOTIFY pgrst, 'reload schema';
