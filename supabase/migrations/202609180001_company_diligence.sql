-- Owner-scoped employer due-diligence records imported from the reviewed audit.
begin;

create table public.company_diligence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid not null,
  status text not null check (status in ('cleared','caution','hold','avoid')),
  confidence text not null check (confidence in ('high','medium','low')),
  summary text not null default '',
  positive_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(positive_signals) = 'array'),
  concern_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(concern_signals) = 'array'),
  verification_questions jsonb not null default '[]'::jsonb check (jsonb_typeof(verification_questions) = 'array'),
  operational_recommendation text not null default '',
  researched_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, company_id),
  foreign key (user_id, company_id) references public.companies(user_id, id) on delete restrict
);
alter table public.company_diligence enable row level security;
create policy company_diligence_owner on public.company_diligence for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.company_diligence to authenticated;
revoke all on public.company_diligence from anon;
create index company_diligence_owner_idx on public.company_diligence(user_id);
create index company_diligence_company_idx on public.company_diligence(user_id, company_id);

create table public.company_diligence_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_diligence_id uuid not null,
  source_name text not null default '',
  source_url text not null default '',
  source_type text not null default 'Unknown',
  evidence_classification text not null default 'UNKNOWN'
    check (evidence_classification in ('FACT','REPEATED SIGNAL','ANECDOTE','UNKNOWN')),
  scope text not null default 'company'
    check (scope in ('company','office','team','role')),
  review_sample_size integer check (review_sample_size is null or review_sample_size >= 0),
  note text not null default '',
  accessed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, company_diligence_id)
    references public.company_diligence(user_id, id) on delete cascade
);
alter table public.company_diligence_sources enable row level security;
create policy company_diligence_sources_owner on public.company_diligence_sources for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.company_diligence_sources to authenticated;
revoke all on public.company_diligence_sources from anon;
create index company_diligence_sources_owner_idx on public.company_diligence_sources(user_id);
create index company_diligence_sources_diligence_idx on public.company_diligence_sources(user_id, company_diligence_id);

create trigger guard_record before insert or update on public.company_diligence
  for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.company_diligence_sources
  for each row execute function public.guard_record();

create or replace function public.apply_changes(changes jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  item jsonb; tbl text; op text; incoming jsonb; existing timestamptz;
  expected timestamptz; cols text; updates text; saved jsonb; output jsonb := '[]';
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 10000 then raise exception 'Invalid batch'; end if;
  for item in select value from jsonb_array_elements(changes) loop
    tbl := item->>'table'; op := item->>'operation'; incoming := item->'row';
    if tbl not in ('cv_versions','companies','research_runs','jobs','job_sources','applications','application_questions','application_events','company_diligence','company_diligence_sources') then raise exception 'Invalid table'; end if;
    if op not in ('upsert','delete') then raise exception 'Invalid operation'; end if;
    if incoming->>'id' is null then raise exception 'Missing record ID'; end if;
    if incoming->>'user_id' is not null and (incoming->>'user_id')::uuid <> auth.uid() then raise exception 'Ownership mismatch'; end if;
    expected := (item->>'expected_updated_at')::timestamptz;
    existing := null;
    execute format('select updated_at from public.%I where id = $1 and user_id = $2 for update', tbl)
      into existing using (incoming->>'id')::uuid, auth.uid();
    if (expected is null and existing is not null) or (expected is not null and existing is distinct from expected) then
      raise exception 'Record changed elsewhere. Reload before saving.';
    end if;
    if op = 'delete' then
      if tbl = 'applications' or tbl = 'research_runs' then raise exception 'Preserve application and research history'; end if;
      execute format('delete from public.%I where id = $1 and user_id = $2', tbl) using (incoming->>'id')::uuid, auth.uid();
      saved := jsonb_build_object('id', incoming->>'id');
    else
      incoming := incoming || jsonb_build_object('user_id', auth.uid());
      select string_agg(format('%I', key), ', '),
             string_agg(format('%I = excluded.%I', key, key), ', ') filter(where key not in ('id','user_id','created_at'))
      into cols, updates from jsonb_object_keys(incoming) key;
      execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1)
        on conflict (id) do update set %3$s returning to_jsonb(%1$I.*)', tbl, cols, updates)
        into saved using incoming;
    end if;
    output := output || jsonb_build_array(jsonb_build_object('table', tbl, 'operation', op, 'row', saved));
  end loop;
  return output;
end $$;
revoke all on function public.apply_changes(jsonb) from public, anon;
grant execute on function public.apply_changes(jsonb) to authenticated;

commit;
