create table if not exists public.project_evaluations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  type text not null, -- 'agent_q' or 'real_simulation'
  evaluation_data jsonb,
  simulation_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.project_evaluations enable row level security;

create policy "Users can view their own project evaluations"
  on public.project_evaluations for select
  using ( auth.uid() in ( select user_id from public.projects where id = project_id ) );

create policy "Users can insert their own project evaluations"
  on public.project_evaluations for insert
  with check ( auth.uid() in ( select user_id from public.projects where id = project_id ) );
