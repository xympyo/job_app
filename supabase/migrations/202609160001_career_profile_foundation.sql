begin;

create table if not exists public.career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started','draft','ready','migrating','blocked')),
  current_revision_id uuid,
  preferences_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(preferences_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (user_id, id)
);

create table if not exists public.career_profile_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  profile_id uuid not null,
  revision_number integer not null check (revision_number > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  schema_version text not null default '1.0',
  structured_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(structured_json) = 'object'),
  freeform_notes text not null default '' check (length(freeform_notes) <= 30000),
  source_map_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_map_json) = 'object'),
  content_hash text not null default '',
  created_by text not null default 'user'
    check (created_by in ('user','import','assistant_proposal','migration')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (user_id, id),
  unique (profile_id, revision_number),
  foreign key (user_id, profile_id)
    references public.career_profiles(user_id, id) on delete cascade
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'career_profiles_current_revision_fk') then
    alter table public.career_profiles
      add constraint career_profiles_current_revision_fk
      foreign key (user_id, current_revision_id)
      references public.career_profile_revisions(user_id, id)
      deferrable initially deferred;
  end if;
end $$;

alter table public.career_profiles enable row level security;
alter table public.career_profile_revisions enable row level security;
drop policy if exists career_profiles_owner on public.career_profiles;
create policy career_profiles_owner on public.career_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists career_profile_revisions_owner on public.career_profile_revisions;
create policy career_profile_revisions_owner on public.career_profile_revisions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.career_profiles to authenticated;
grant select, insert, update, delete on public.career_profile_revisions to authenticated;
revoke all on public.career_profiles, public.career_profile_revisions from anon;
create index if not exists career_profile_revisions_owner_idx on public.career_profile_revisions(user_id, profile_id, revision_number);
create unique index if not exists career_profile_one_draft_idx
  on public.career_profile_revisions(profile_id) where status = 'draft';

create or replace function public.guard_career_profile_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.status = 'published' then
    raise exception 'Use the publish operation for profile revisions';
  end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.user_id <> old.user_id or new.profile_id <> old.profile_id
      or new.revision_number <> old.revision_number then
      raise exception 'Profile revision identity and ownership are immutable';
    end if;
    if old.status = 'published' then
      raise exception 'Published profile revisions are immutable';
    end if;
    if new.status = 'published' and coalesce(current_setting('pyoloker.profile_publish', true), '') <> 'on' then
      raise exception 'Use the publish operation for profile revisions';
    end if;
    new.created_at := old.created_at;
  elsif tg_op = 'DELETE' then
    if old.status = 'published' or exists (
      select 1 from public.career_profiles p
      where p.user_id = old.user_id and p.id = old.profile_id and p.current_revision_id = old.id
    ) then
      raise exception 'Published/current profile revisions must be preserved';
    end if;
    return old;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists guard_career_profile_revision on public.career_profile_revisions;
create trigger guard_career_profile_revision
  before insert or update or delete on public.career_profile_revisions
  for each row execute function public.guard_career_profile_revision();

create or replace function public.guard_career_profile_pointer() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.current_revision_id is distinct from old.current_revision_id
    and coalesce(current_setting('pyoloker.profile_publish', true), '') <> 'on' then
    raise exception 'Use the publish operation to change the current profile revision';
  end if;
  if new.current_revision_id is not null and not exists (
    select 1 from public.career_profile_revisions r
    where r.id = new.current_revision_id and r.user_id = new.user_id
      and r.profile_id = new.id and r.status = 'published'
  ) then
    raise exception 'Current revision must be a published revision owned by this profile';
  end if;
  if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists guard_career_profile_pointer on public.career_profiles;
create trigger guard_career_profile_pointer
  before insert or update on public.career_profiles
  for each row execute function public.guard_career_profile_pointer();

create or replace function public.career_profile_create() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.career_profiles(user_id) values (auth.uid())
    on conflict (user_id) do nothing;
  select to_jsonb(p) into result from public.career_profiles p where p.user_id = auth.uid();
  return result;
end $$;

create or replace function public.career_profile_create_draft(p_profile_id uuid, p_copy_current boolean default true) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare p public.career_profiles%rowtype; current public.career_profile_revisions%rowtype; result jsonb; next_number integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into p from public.career_profiles where id = p_profile_id and user_id = auth.uid() for update;
  if not found then raise exception 'Profile not found'; end if;
  select to_jsonb(r) into result from public.career_profile_revisions r
    where r.profile_id = p.id and r.user_id = p.user_id and r.status = 'draft';
  if result is not null then return result; end if;
  if p_copy_current and p.current_revision_id is not null then
    select * into current from public.career_profile_revisions where id = p.current_revision_id for update;
  end if;
  select coalesce(max(revision_number), 0) + 1 into next_number
    from public.career_profile_revisions where profile_id = p.id;
  insert into public.career_profile_revisions(user_id, profile_id, revision_number, schema_version, structured_json, freeform_notes, source_map_json, content_hash)
    values (p.user_id, p.id, next_number, coalesce(current.schema_version, '1.0'), coalesce(current.structured_json, '{}'::jsonb), coalesce(current.freeform_notes, ''), coalesce(current.source_map_json, '{}'::jsonb), md5((jsonb_build_object('schemaVersion', coalesce(current.schema_version, '1.0'), 'structuredJson', coalesce(current.structured_json, '{}'::jsonb), 'freeformNotes', coalesce(current.freeform_notes, ''), 'sourceMapJson', coalesce(current.source_map_json, '{}'::jsonb)))::text))
    returning to_jsonb(career_profile_revisions.*) into result;
  update public.career_profiles set onboarding_status = case when onboarding_status = 'not_started' then 'draft' else onboarding_status end where id = p.id;
  return result;
end $$;

create or replace function public.career_profile_save_draft(p_profile_id uuid, p_revision_id uuid, p_payload jsonb, p_expected_updated_at timestamptz default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.career_profile_revisions%rowtype; result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into r from public.career_profile_revisions where id = p_revision_id and profile_id = p_profile_id and user_id = auth.uid() for update;
  if not found then raise exception 'Draft not found'; end if;
  if r.status <> 'draft' then raise exception 'Only a draft revision can be edited'; end if;
  if p_expected_updated_at is not null and r.updated_at <> p_expected_updated_at then raise exception 'Draft changed elsewhere. Reload before saving.'; end if;
  if jsonb_typeof(coalesce(p_payload->'structuredJson', '{}'::jsonb)) <> 'object' or jsonb_typeof(coalesce(p_payload->'sourceMapJson', '{}'::jsonb)) <> 'object' then raise exception 'Invalid profile payload'; end if;
  update public.career_profile_revisions set
    schema_version = coalesce(nullif(p_payload->>'schemaVersion',''), r.schema_version),
    structured_json = p_payload->'structuredJson',
    freeform_notes = coalesce(p_payload->>'freeformNotes',''),
    source_map_json = coalesce(p_payload->'sourceMapJson','{}'::jsonb),
    created_by = coalesce(nullif(p_payload->>'createdBy',''), r.created_by),
    content_hash = md5((jsonb_build_object('schemaVersion', coalesce(p_payload->>'schemaVersion', r.schema_version), 'structuredJson', p_payload->'structuredJson', 'freeformNotes', coalesce(p_payload->>'freeformNotes',''), 'sourceMapJson', coalesce(p_payload->'sourceMapJson','{}'::jsonb)))::text)
    where id = r.id returning to_jsonb(career_profile_revisions.*) into result;
  return result;
end $$;

create or replace function public.career_profile_publish_draft(p_profile_id uuid, p_revision_id uuid, p_expected_updated_at timestamptz default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.career_profile_revisions%rowtype; result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into r from public.career_profile_revisions where id = p_revision_id and profile_id = p_profile_id and user_id = auth.uid() for update;
  if not found then raise exception 'Draft not found'; end if;
  if r.status <> 'draft' then raise exception 'Only a draft revision can be published'; end if;
  if p_expected_updated_at is not null and r.updated_at <> p_expected_updated_at then raise exception 'Draft changed elsewhere. Reload before publishing.'; end if;
  perform set_config('pyoloker.profile_publish', 'on', true);
  update public.career_profile_revisions set status = 'published', published_at = clock_timestamp(), content_hash = md5((jsonb_build_object('schemaVersion', schema_version, 'structuredJson', structured_json, 'freeformNotes', freeform_notes, 'sourceMapJson', source_map_json))::text) where id = r.id returning to_jsonb(career_profile_revisions.*) into result;
  update public.career_profiles set current_revision_id = r.id, onboarding_status = 'ready' where id = p_profile_id and user_id = auth.uid();
  return result;
end $$;

create or replace function public.career_profile_discard_draft(p_profile_id uuid, p_revision_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare deleted integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.career_profile_revisions where id = p_revision_id and profile_id = p_profile_id and user_id = auth.uid() and status = 'draft';
  get diagnostics deleted = row_count;
  if deleted = 0 then raise exception 'Draft not found'; end if;
  return true;
end $$;

revoke all on function public.career_profile_create() from public, anon;
revoke all on function public.career_profile_create_draft(uuid, boolean) from public, anon;
revoke all on function public.career_profile_save_draft(uuid, uuid, jsonb, timestamptz) from public, anon;
revoke all on function public.career_profile_publish_draft(uuid, uuid, timestamptz) from public, anon;
revoke all on function public.career_profile_discard_draft(uuid, uuid) from public, anon;
grant execute on function public.career_profile_create() to authenticated;
grant execute on function public.career_profile_create_draft(uuid, boolean) to authenticated;
grant execute on function public.career_profile_save_draft(uuid, uuid, jsonb, timestamptz) to authenticated;
grant execute on function public.career_profile_publish_draft(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.career_profile_discard_draft(uuid, uuid) to authenticated;

commit;
