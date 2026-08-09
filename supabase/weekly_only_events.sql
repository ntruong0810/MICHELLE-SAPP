create table public.weekly_only_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  week_start date not null,
  content text not null check (char_length(btrim(content)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weekly_only_events_user_week_date_idx
  on public.weekly_only_events (user_id, week_start, date, sort_order);

create or replace function public.set_weekly_only_event_updated_at()
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

create trigger weekly_only_events_set_updated_at
before update on public.weekly_only_events
for each row execute function public.set_weekly_only_event_updated_at();

alter table public.weekly_only_events enable row level security;

revoke all on table public.weekly_only_events from anon;
grant select, insert, update, delete on table public.weekly_only_events to authenticated;

create policy "Users can read their own weekly-only events"
on public.weekly_only_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own weekly-only events"
on public.weekly_only_events for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own weekly-only events"
on public.weekly_only_events for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own weekly-only events"
on public.weekly_only_events for delete to authenticated
using ((select auth.uid()) = user_id);
