create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  content text not null check (char_length(btrim(content)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_user_date_idx
  on public.calendar_events (user_id, date, sort_order);

create or replace function public.set_calendar_event_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_calendar_event_updated_at();

alter table public.calendar_events enable row level security;

revoke all on table public.calendar_events from anon;
grant select, insert, update, delete on table public.calendar_events to authenticated;

create policy "Users can read their own calendar events"
on public.calendar_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own calendar events"
on public.calendar_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own calendar events"
on public.calendar_events
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own calendar events"
on public.calendar_events
for delete
to authenticated
using ((select auth.uid()) = user_id);
