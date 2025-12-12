-- ✅ TABLE ÉTATS PROJET
-- Cette table stocke l'état complet de l'idéation pour chaque projet
-- Elle est essentielle pour le fonctionnement de la page d'idéation
create table if not exists project_states (
  project_id uuid primary key references projects(id) on delete cascade,
  selected_generation_method text,
  selected_methodology text,
  methodology_params jsonb,
  generated_prompt text,
  design_results jsonb,
  step_file text,
  selected_design_index integer,
  active_step text,
  uploaded_sketch text,
  uploaded_image text,
  user_prompt text,
  agent_q_evaluation jsonb,
  real_simulation jsonb,
  evaluation_complete boolean,
  updated_at timestamp with time zone default now()
);

-- RLS (Row Level Security)
alter table project_states enable row level security;

-- Policies
create policy "Users can view own project states"
  on project_states for select
  using ( exists (select 1 from projects where id = project_states.project_id and user_id = auth.uid()) );

create policy "Users can insert own project states"
  on project_states for insert
  with check ( exists (select 1 from projects where id = project_states.project_id and user_id = auth.uid()) );

create policy "Users can update own project states"
  on project_states for update
  using ( exists (select 1 from projects where id = project_states.project_id and user_id = auth.uid()) );

create policy "Users can delete own project states"
  on project_states for delete
  using ( exists (select 1 from projects where id = project_states.project_id and user_id = auth.uid()) );
