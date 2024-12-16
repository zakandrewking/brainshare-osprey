-- TODO more reliable uploads
-- https://github.com/supabase/supabase/tree/master/examples/storage/resumable-upload-uppy

create policy "Anyone can read buckets"
    on storage.buckets for select
    to authenticated, anon
    using (true);

create policy "Authenticated user can create objects"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'files');

create policy "Authenticated user can manage their own objects"
    on storage.objects for all to authenticated
    using (bucket_id = 'files' and auth.uid() = owner);

create table file (
    id bigint generated by default as identity primary key,
    name text not null,
    size bigint not null,
    bucket_id text not null,
    object_path text not null,
    user_id uuid not null,
    mime_type text,
    latest_task_id text
);
alter table file enable row level security;
create policy "Authenticated user can manage their files" on file
  for all to authenticated using (auth.uid() = user_id);
