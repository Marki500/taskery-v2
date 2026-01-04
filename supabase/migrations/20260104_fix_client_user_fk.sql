-- Drop the existing FK to auth.users if it exists (it was named implicitely or specific name)
-- We'll try to drop by column definition or common name.
-- Since we added it via "ADD COLUMN ... REFERENCES auth.users(id)", the constraint name is usually "clients_user_id_fkey".

ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Add explicit FK to public.profiles
-- This allows PostgREST to see the relationship between clients and profiles
ALTER TABLE public.clients
ADD CONSTRAINT clients_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
