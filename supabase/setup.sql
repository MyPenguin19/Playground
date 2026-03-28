create extension if not exists "pgcrypto";

create table if not exists public.sample_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  user_id uuid references auth.users (id) on delete set null,
  submitted_by_email text,
  created_at timestamptz not null default now()
);

alter table public.contact_messages
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.contact_messages
  add column if not exists submitted_by_email text;

alter table public.sample_messages enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "sample_messages are readable by everyone" on public.sample_messages;
create policy "sample_messages are readable by everyone"
on public.sample_messages
for select
to anon, authenticated
using (true);

drop policy if exists "contact_messages can be inserted by everyone" on public.contact_messages;
create policy "contact_messages can be inserted by everyone"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "contact_messages are readable by authenticated users" on public.contact_messages;
create policy "contact_messages are readable by authenticated users"
on public.contact_messages
for select
to authenticated
using (true);

insert into public.sample_messages (title, body)
select *
from (
  values
    ('Welcome to Playground', 'This row came from Supabase and confirms your public read path is working.'),
    ('Next step', 'Try signing in, then submit the contact form to store real data.')
) as seed(title, body)
where not exists (
  select 1 from public.sample_messages
);
