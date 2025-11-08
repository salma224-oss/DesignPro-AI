create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  title text,
  method text,
  created_at timestamp default now()
);

create table prompts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  method text,
  content text,
  created_at timestamp default now()
);

create table images (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  image_url text,
  status text,
  created_at timestamp default now()
);
