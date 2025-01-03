create table custom_type (
    id bigint generated by default as identity primary key,
    name text not null,
    description text not null,
    rules text[] not null default '{}',
    examples text[] not null default '{}',
    not_examples text[] not null default '{}',
    user_id uuid not null,
    values_key text not null generated always as (
        'br-values-' || user_id || '-' || id
    ) stored,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (name, user_id)
);

alter table custom_type enable row level security;
create policy "Authenticated users can manage their custom types" on custom_type
    for all to authenticated using (auth.uid() = user_id);

-- Add realtime support
alter publication supabase_realtime add table custom_type;
