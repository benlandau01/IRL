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

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  friend_code text not null unique,
  created_at timestamptz not null default now()
);

create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

alter table check_ins enable row level security;
alter table profiles enable row level security;
alter table friendships enable row level security;

create policy "select own check-ins" on check_ins
  for select using (auth.uid() = user_id);

create policy "insert own check-ins" on check_ins
  for insert with check (auth.uid() = user_id);

create policy "update own check-ins" on check_ins
  for update using (auth.uid() = user_id);

-- Lets the Nearby tab see other users' public check-ins (strangers opting
-- into "everyone nearby" visibility).
create policy "select everyone-visible check-ins" on check_ins
  for select using (visibility = 'everyone' and expires_at > now());

create policy "select friends' check-ins" on check_ins
  for select using (
    visibility = 'friends' and exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = check_ins.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = check_ins.user_id))
    )
  );

-- Deliberately open: display name + friend code aren't sensitive (unlike
-- email), and adding a friend by code requires codes to be lookupable.
create policy "select all profiles" on profiles
  for select using (true);

create policy "insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "select own friendships" on friendships
  for select using (auth.uid() in (requester_id, addressee_id));

create policy "insert own friend requests" on friendships
  for insert with check (auth.uid() = requester_id);

create policy "accept own incoming requests" on friendships
  for update using (auth.uid() = addressee_id);

-- RLS policies only filter rows — they don't substitute for the base table
-- grant, which the SQL editor doesn't set up automatically (unlike creating
-- a table through the Table Editor UI, which grants this for you).
grant select, insert, update on public.check_ins to authenticated;
grant select, insert on public.profiles to authenticated;
grant select, insert, update on public.friendships to authenticated;
