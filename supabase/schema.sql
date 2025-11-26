-- Create Rooms table if it doesn't exist
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('text', 'video')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add password column if it doesn't exist (idempotent)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'password') then
    alter table rooms add column password text;
  end if;
end $$;

-- Add host_token column if it doesn't exist (idempotent)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'host_token') then
    alter table rooms add column host_token text;
  end if;
end $$;

-- Create Messages table if it doesn't exist
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  content text not null,
  sender_slug text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table rooms enable row level security;
alter table messages enable row level security;

-- Drop existing policies to avoid conflicts when re-running
drop policy if exists "Public rooms are viewable by everyone" on rooms;
drop policy if exists "Anyone can create a room" on rooms;
drop policy if exists "Messages are viewable by everyone in the room" on messages;
drop policy if exists "Anyone can send a message" on messages;

-- Re-create Rooms policies
create policy "Public rooms are viewable by everyone"
  on rooms for select
  to anon
  using (true);

create policy "Anyone can create a room"
  on rooms for insert
  to anon
  with check (true);

-- Re-create Messages policies
create policy "Messages are viewable by everyone in the room"
  on messages for select
  to anon
  using (true);

create policy "Anyone can send a message"
  on messages for insert
  to anon
  with check (true);

-- Enable Realtime for messages table
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table messages, rooms;
commit;
