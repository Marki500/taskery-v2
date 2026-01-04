-- 1. Create project_chats table
CREATE TABLE IF NOT EXISTS public.project_chats (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT project_chats_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.project_chats ENABLE ROW LEVEL SECURITY;

-- Policies for project_chats

-- Policy: Workspace members can view chats for projects in their workspace
CREATE POLICY "Workspace members can view project chats"
ON public.project_chats
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        JOIN public.workspace_members ON projects.workspace_id = workspace_members.workspace_id
        WHERE projects.id = project_chats.project_id
        AND workspace_members.user_id = auth.uid()
    )
);

-- Policy: Assigned Clients can view chats for their project
CREATE POLICY "Assigned clients can view project chats"
ON public.project_chats
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        JOIN public.clients ON projects.client_id = clients.id
        WHERE projects.id = project_chats.project_id
        AND clients.user_id = auth.uid()
    )
);

-- Policy: Workspace members can insert chats
CREATE POLICY "Workspace members can insert project chats"
ON public.project_chats
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        JOIN public.workspace_members ON projects.workspace_id = workspace_members.workspace_id
        WHERE projects.id = project_chats.project_id
        AND workspace_members.user_id = auth.uid()
    )
);

-- Policy: Assigned Clients can insert chats
CREATE POLICY "Assigned clients can insert project chats"
ON public.project_chats
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        JOIN public.clients ON projects.client_id = clients.id
        WHERE projects.id = project_chats.project_id
        AND clients.user_id = auth.uid()
    )
);


-- 2. Trigger for Automatic Client Linking
-- Function to link client on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_client_link()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there is a client with this email but no user_id
    UPDATE public.clients
    SET user_id = NEW.id
    WHERE email = NEW.email
    AND user_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created_link_client ON auth.users;
CREATE TRIGGER on_auth_user_created_link_client
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_client_link();

-- Notify to reload schema
NOTIFY pgrst, 'reload schema';
