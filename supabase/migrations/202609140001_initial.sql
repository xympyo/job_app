-- Personal Career Command Center V1. Apply through Supabase migrations.
-- No jobs, credentials or personal CV binaries seeded.
begin;

create table public.cv_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  name text not null default '',
  slug text not null default '',
  description text not null default '',
  file_reference text not null default '',
  notes text not null default '', target_roles jsonb not null default '[]' check(jsonb_typeof(target_roles) = 'array'), active boolean not null default true, unique(user_id, slug), check(length(trim(name)) > 0), check(length(trim(slug)) > 0)
);
alter table public.cv_versions enable row level security;
create policy own_records on public.cv_versions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.cv_versions to authenticated;
revoke all on public.cv_versions from anon;
create index cv_versions_owner_idx on public.cv_versions(user_id);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  name text not null default '',
  normalized_name text not null default '',
  website text not null default '',
  careers_url text not null default '',
  industry text not null default '',
  size text not null default '',
  headquarters text not null default '',
  notes text not null default '', unique(user_id, normalized_name), check(length(trim(name)) > 0)
);
alter table public.companies enable row level security;
create policy own_records on public.companies for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.companies to authenticated;
revoke all on public.companies from anon;
create index companies_owner_idx on public.companies(user_id);

create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  research_goal text not null default '',
  query_summary text not null default '',
  notes text not null default '', started_at timestamptz, completed_at timestamptz, result_count integer not null default 0 check(result_count >= 0), created_jobs_count integer not null default 0 check(created_jobs_count >= 0)
);
alter table public.research_runs enable row level security;
create policy own_records on public.research_runs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.research_runs to authenticated;
revoke all on public.research_runs from anon;
create index research_runs_owner_idx on public.research_runs(user_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  company_id uuid not null, foreign key (user_id, company_id) references public.companies(user_id, id) on delete restrict,
  title text not null default '',
  normalized_title text not null default '',
  location_text text not null default '',
  city text not null default '',
  country text not null default '',
  employment_type text not null default '',
  role_family text not null default '',
  seniority text not null default '',
  description text not null default '',
  responsibilities text not null default '',
  requirements text not null default '',
  preferred_requirements text not null default '',
  salary_currency text not null default '',
  salary_period text not null default '',
  source_confidence text not null default '',
  fit_label text not null default '',
  fit_reason text not null default '',
  recommendation text not null default '',
  research_notes text not null default '',
  notes text not null default '',
  work_mode text not null default 'Unknown' check(work_mode in ('Onsite','Hybrid','Remote','Unknown')),
  posting_status text not null default 'Unknown' check(posting_status in ('Unknown','Verified open','Possibly open','Closed','Expired')),
  review_status text not null default 'Found' check(review_status in ('Found','Reviewing','Saved','Ready to Apply','Skipped','Expired','Closed')),
  salary_min numeric check(salary_min >= 0), salary_max numeric check(salary_max >= salary_min),
  deadline date, published_at date, found_at date, last_verified_at timestamptz,
  fit_score integer check(fit_score between 0 and 100), check(fit_score is null or length(trim(fit_reason)) > 0),
  strengths jsonb not null default '[]', gaps jsonb not null default '[]', red_flags jsonb not null default '[]',
  recommended_cv_id uuid, foreign key (user_id, recommended_cv_id) references public.cv_versions(user_id, id) on delete restrict, custom_tailoring boolean not null default false,
  research_run_id uuid, foreign key (user_id, research_run_id) references public.research_runs(user_id, id) on delete restrict, check(length(trim(title)) > 0)
);
alter table public.jobs enable row level security;
create policy own_records on public.jobs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.jobs to authenticated;
revoke all on public.jobs from anon;
create index jobs_owner_idx on public.jobs(user_id);

create table public.job_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  job_id uuid not null, foreign key (user_id, job_id) references public.jobs(user_id, id) on delete cascade, source_name text not null default '',
  source_url text not null default '',
  apply_url text not null default '',
  external_job_id text not null default '', source_type text not null default 'Unknown' check(source_type in ('Official careers','Official posting','Job platform','Secondary','Unknown')), is_primary boolean not null default false, verified_at timestamptz, check(length(trim(source_name)) > 0)
);
alter table public.job_sources enable row level security;
create policy own_records on public.job_sources for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.job_sources to authenticated;
revoke all on public.job_sources from anon;
create index job_sources_owner_idx on public.job_sources(user_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  job_id uuid not null, foreign key (user_id, job_id) references public.jobs(user_id, id) on delete restrict, unique(user_id, job_id),
  status text not null default 'Ready to Apply' check(status in ('Ready to Apply','Applied','Assessment / OA','HR Interview','User / Hiring Manager Interview','Technical / Case Interview','Final Interview','Offer','Withdrawn','Rejected','Expired','Closed','Offer Declined','Offer Accepted')),
  applied_at date, cv_version_id uuid, foreign key (user_id, cv_version_id) references public.cv_versions(user_id, id) on delete restrict,
  job_snapshot jsonb not null default '{}', cv_snapshot jsonb not null default '{}', stage_history jsonb not null default '[]',
  cover_letter_used text not null default '',
  next_action text not null default '',
  recruiter_name text not null default '',
  recruiter_contact text not null default '',
  rejection_stage text not null default '',
  rejection_reason text not null default '',
  offer_details text not null default '',
  notes text not null default '',
  next_action_at timestamptz, check(status <> 'Rejected' or length(rejection_stage) > 0)
);
alter table public.applications enable row level security;
create policy own_records on public.applications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.applications to authenticated;
revoke all on public.applications from anon;
create index applications_owner_idx on public.applications(user_id);

create table public.application_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  application_id uuid not null, foreign key (user_id, application_id) references public.applications(user_id, id) on delete cascade, question_text text not null default '',
  draft_answer text not null default '',
  final_answer text not null default '',
  reasoning_notes text not null default '', question_type text not null default 'free_text' check(question_type in ('motivation','behavioral','leadership','technical','scenario','compensation','relocation','eligibility','free_text','multiple_choice','other')), required boolean not null default false,
  character_limit integer check(character_limit between 1 and 100000), status text not null default 'Draft' check(status in ('Draft','Ready','Completed')),
  check(length(trim(question_text)) > 0), check(status <> 'Completed' or not required or length(trim(final_answer)) > 0),
  check(status = 'Draft' or character_limit is null or length(final_answer) <= character_limit)
);
alter table public.application_questions enable row level security;
create policy own_records on public.application_questions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.application_questions to authenticated;
revoke all on public.application_questions from anon;
create index application_questions_owner_idx on public.application_questions(user_id);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id),
  application_id uuid not null, foreign key (user_id, application_id) references public.applications(user_id, id) on delete cascade, title text not null default '',
  notes text not null default '', kind text not null default 'Other' check(kind in ('Assessment','HR interview','Hiring manager interview','Technical / case interview','Final interview','Recruiter contact','Other')), scheduled_at timestamptz, status text not null default 'Planned' check(status in ('Planned','Completed','Cancelled')), check(length(trim(title)) > 0)
);
alter table public.application_events enable row level security;
create policy own_records on public.application_events for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.application_events to authenticated;
revoke all on public.application_events from anon;
create index application_events_owner_idx on public.application_events(user_id);

revoke delete on public.applications, public.research_runs from authenticated;
alter table public.jobs add check(fit_label in ('','Excellent Fit','Strong Fit','Possible Fit','Stretch','Weak Fit'));
alter table public.jobs add check(recommendation in ('','Apply ASAP','Apply','Apply if interested','Research first','Low priority','Skip'));
alter table public.jobs add check(jsonb_typeof(strengths) = 'array' and jsonb_typeof(gaps) = 'array' and jsonb_typeof(red_flags) = 'array');
alter table public.applications add check(jsonb_typeof(job_snapshot) = 'object' and jsonb_typeof(cv_snapshot) = 'object' and jsonb_typeof(stage_history) = 'array');
alter table public.applications add check(rejection_stage in ('','CV screening','initial application','online assessment','HR interview','hiring manager interview','technical interview','case study','final interview','unknown'));
create index jobs_review_idx on public.jobs(user_id, review_status);
create index jobs_company_idx on public.jobs(user_id, company_id);
create index jobs_role_idx on public.jobs(user_id, role_family);
create index jobs_deadline_idx on public.jobs(user_id, deadline);
create index jobs_cv_idx on public.jobs(user_id, recommended_cv_id);
create index job_sources_job_idx on public.job_sources(user_id, job_id);
create index applications_status_idx on public.applications(user_id, status);
create index applications_action_idx on public.applications(user_id, next_action_at);
create index questions_application_idx on public.application_questions(user_id, application_id);
create index events_application_idx on public.application_events(user_id, application_id);
create index events_schedule_idx on public.application_events(user_id, scheduled_at);

-- Immutable identity and original vacancy snapshot, even on direct database edits.
create function public.guard_record() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if new.user_id <> old.user_id or new.id <> old.id then raise exception 'Record ownership and identity are immutable'; end if;
    new.created_at := old.created_at;
    if TG_TABLE_NAME = 'applications' then
      new.job_snapshot := old.job_snapshot;
      if new.job_id <> old.job_id then raise exception 'Historical application job cannot change'; end if;
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
create trigger guard_record before insert or update on public.cv_versions for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.companies for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.research_runs for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.jobs for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.job_sources for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.applications for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.application_questions for each row execute function public.guard_record();
create trigger guard_record before insert or update on public.application_events for each row execute function public.guard_record();

-- Atomic batch used by manual edits and confirmed imports. SECURITY INVOKER means
-- ordinary table RLS applies. Table whitelist and identifier quoting prevent injection.
create function public.apply_changes(changes jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  item jsonb; tbl text; op text; incoming jsonb; existing timestamptz;
  expected timestamptz; cols text; updates text; saved jsonb; output jsonb := '[]';
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 10000 then raise exception 'Invalid batch'; end if;
  for item in select value from jsonb_array_elements(changes) loop
    tbl := item->>'table'; op := item->>'operation'; incoming := item->'row';
    if tbl not in ('cv_versions','companies','research_runs','jobs','job_sources','applications','application_questions','application_events') then raise exception 'Invalid table'; end if;
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
