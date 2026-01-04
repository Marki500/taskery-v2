-- Create clients table
create table if not exists public.clients (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone default now(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  avatar_url text,

  constraint clients_pkey primary key (id)
);

-- Internal ID for easier referencing? Maybe not needed for now.

-- Enable RLS
alter table public.clients enable row level security;

-- Policies
create policy "Users can view clients in their workspaces"
  on public.clients for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = clients.workspace_id
      and user_id = auth.uid()
    )
  );

create policy "Users can create clients in their workspaces"
  on public.clients for insert
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_id = clients.workspace_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update clients in their workspaces"
  on public.clients for update
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = clients.workspace_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete clients in their workspaces"
  on public.clients for delete
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = clients.workspace_id
      and user_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger handle_updated_at before update on public.clients
  for each row execute procedure moddatetime (updated_at);
