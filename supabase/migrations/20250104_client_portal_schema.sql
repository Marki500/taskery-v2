-- Add user_id to clients to link them to an auth account
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add client_id to projects to assign a project to a client
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Enable RLS on modified tables (already enabled, but good practice to ensure)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- POLICY: Clients can view their own Client Record
CREATE POLICY "Clients can view their own record" 
ON public.clients 
FOR SELECT 
USING (
  auth.uid() = user_id
);

-- POLICY: Clients can view Projects assigned to them
CREATE POLICY "Clients can view assigned projects" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = projects.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- POLICY: Clients can view Tasks in their assigned projects
CREATE POLICY "Clients can view tasks in assigned projects" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    JOIN public.clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id 
    AND clients.user_id = auth.uid()
  )
);
