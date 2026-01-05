-- Create project_members junction table for organization/filtering
create table if not exists public.project_members (
    project_id uuid references public.projects(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text check (role in ('owner', 'member')) default 'member',
    assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (project_id, user_id)
);

-- Enable RLS
alter table public.project_members enable row level security;

-- RLS Policy: All workspace members can see all project assignments (for filtering)
create policy "Workspace members can view project assignments"
    on public.project_members for select
    using (
        exists (
            select 1 from public.workspace_members wm
            join public.projects p on p.workspace_id = wm.workspace_id
            where wm.user_id = auth.uid()
            and p.id = project_members.project_id
        )
    );

-- RLS Policy: Workspace members can manage project assignments
create policy "Workspace members can manage project assignments"
    on public.project_members for all
    using (
        exists (
            select 1 from public.workspace_members wm
            join public.projects p on p.workspace_id = wm.workspace_id
            where wm.user_id = auth.uid()
            and p.id = project_members.project_id
        )
    );

-- Create indexes for performance
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_project_members_project on public.project_members(project_id);

-- Add comment
comment on table public.project_members is 'Junction table for assigning workspace members to projects for organization and filtering purposes';
