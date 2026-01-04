-- Ensure address column exists (in case it was missing from initial creation)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address text;

-- Ensure other potentially missing columns just in case
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;

-- Reload PostgREST schema cache to ensure it sees the changes
NOTIFY pgrst, 'reload schema';
