begin;

create table if not exists public.planner_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('photo', 'sticker')),
  storage_path text,
  sticker_key text,
  created_at timestamptz not null default now(),
  constraint planner_media_kind_content_check check (
    (kind = 'photo' and storage_path is not null and sticker_key is null)
    or
    (kind = 'sticker' and storage_path is null and sticker_key is not null)
  )
);

create index if not exists planner_media_user_date_idx
  on public.planner_media (user_id, date, created_at);

alter table public.planner_media enable row level security;

revoke all on table public.planner_media from anon;
grant select, insert, delete on table public.planner_media to authenticated;

drop policy if exists "Users can read their own planner media"
  on public.planner_media;
drop policy if exists "Users can create their own planner media"
  on public.planner_media;
drop policy if exists "Users can delete their own planner media"
  on public.planner_media;

create policy "Users can read their own planner media"
on public.planner_media for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own planner media"
on public.planner_media for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own planner media"
on public.planner_media for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'planner-photos',
  'planner-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own planner photos"
  on storage.objects;
drop policy if exists "Users can upload their own planner photos"
  on storage.objects;
drop policy if exists "Users can delete their own planner photos"
  on storage.objects;

create policy "Users can read their own planner photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'planner-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own planner photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'planner-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own planner photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'planner-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
