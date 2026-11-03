create table check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  note text,
  visibility text not null default 'friends' check (visibility in ('friends', 'everyone')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '75 minutes')
);

alter table check_ins enable row level security;

create policy "select own check-ins" on check_ins
  for select using (auth.uid() = user_id);

create policy "insert own check-ins" on check_ins
  for insert with check (auth.uid() = user_id);

-- RLS policies only filter rows — they don't substitute for the base table
-- grant, which the SQL editor doesn't set up automatically (unlike creating
-- a table through the Table Editor UI, which grants this for you).
grant select, insert on public.check_ins to authenticated;
