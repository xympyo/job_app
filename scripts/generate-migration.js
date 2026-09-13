import fs from "node:fs";

const common = `id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, id)`;
const text = (names) =>
  names
    .split(" ")
    .map((n) => `${n} text not null default ''`)
    .join(",\n  ");
const fk = (col, table, deletion = "restrict") =>
  `foreign key (user_id, ${col}) references public.${table}(user_id, id) on delete ${deletion}`;
const tables = {
  cv_versions: `${text("name slug description file_reference notes")}, target_roles jsonb not null default '[]' check(jsonb_typeof(target_roles) = 'array'), active boolean not null default true, unique(user_id, slug), check(length(trim(name)) > 0), check(length(trim(slug)) > 0)`,
  companies: `${text("name normalized_name website careers_url industry size headquarters notes")}, unique(user_id, normalized_name), check(length(trim(name)) > 0)`,
  research_runs: `${text("research_goal query_summary notes")}, started_at timestamptz, completed_at timestamptz, result_count integer not null default 0 check(result_count >= 0), created_jobs_count integer not null default 0 check(created_jobs_count >= 0)`,
  jobs: `company_id uuid not null, ${fk("company_id", "companies")},
  ${text("title normalized_title location_text city country employment_type role_family seniority description responsibilities requirements preferred_requirements salary_currency salary_period source_confidence fit_label fit_reason recommendation research_notes notes")},
  work_mode text not null default 'Unknown' check(work_mode in ('Onsite','Hybrid','Remote','Unknown')),
  posting_status text not null default 'Unknown' check(posting_status in ('Unknown','Verified open','Possibly open','Closed','Expired')),
  review_status text not null default 'Found' check(review_status in ('Found','Reviewing','Saved','Ready to Apply','Skipped','Expired','Closed')),
  salary_min numeric check(salary_min >= 0), salary_max numeric check(salary_max >= salary_min),
  deadline date, published_at date, found_at date, last_verified_at timestamptz,
  fit_score integer check(fit_score between 0 and 100), check(fit_score is null or length(trim(fit_reason)) > 0),
  strengths jsonb not null default '[]', gaps jsonb not null default '[]', red_flags jsonb not null default '[]',
  recommended_cv_id uuid, ${fk("recommended_cv_id", "cv_versions")}, custom_tailoring boolean not null default false,
  research_run_id uuid, ${fk("research_run_id", "research_runs")}, check(length(trim(title)) > 0)`,
  job_sources: `job_id uuid not null, ${fk("job_id", "jobs", "cascade")}, ${text("source_name source_url apply_url external_job_id")}, source_type text not null default 'Unknown' check(source_type in ('Official careers','Official posting','Job platform','Secondary','Unknown')), is_primary boolean not null default false, verified_at timestamptz, check(length(trim(source_name)) > 0)`,
  applications: `job_id uuid not null, ${fk("job_id", "jobs")}, unique(user_id, job_id),
  status text not null default 'Ready to Apply' check(status in ('Ready to Apply','Applied','Assessment / OA','HR Interview','User / Hiring Manager Interview','Technical / Case Interview','Final Interview','Offer','Withdrawn','Rejected','Expired','Closed','Offer Declined','Offer Accepted')),
  applied_at date, cv_version_id uuid, ${fk("cv_version_id", "cv_versions")},
  job_snapshot jsonb not null default '{}', cv_snapshot jsonb not null default '{}', stage_history jsonb not null default '[]',
  ${text("cover_letter_used next_action recruiter_name recruiter_contact rejection_stage rejection_reason offer_details notes")},
  next_action_at timestamptz, check(status <> 'Rejected' or length(rejection_stage) > 0)`,
  application_questions: `application_id uuid not null, ${fk("application_id", "applications", "cascade")}, ${text("question_text draft_answer final_answer reasoning_notes")}, question_type text not null default 'free_text' check(question_type in ('motivation','behavioral','leadership','technical','scenario','compensation','relocation','eligibility','free_text','multiple_choice','other')), required boolean not null default false,
  character_limit integer check(character_limit between 1 and 100000), status text not null default 'Draft' check(status in ('Draft','Ready','Completed')),
  check(length(trim(question_text)) > 0), check(status <> 'Completed' or not required or length(trim(final_answer)) > 0),
  check(status = 'Draft' or character_limit is null or length(final_answer) <= character_limit)`,
  application_events: `application_id uuid not null, ${fk("application_id", "applications", "cascade")}, ${text("title notes")}, kind text not null default 'Other' check(kind in ('Assessment','HR interview','Hiring manager interview','Technical / case interview','Final interview','Recruiter contact','Other')), scheduled_at timestamptz, status text not null default 'Planned' check(status in ('Planned','Completed','Cancelled')), check(length(trim(title)) > 0)`,
};
let sql = `-- Personal Career Command Center V1. Apply through Supabase migrations.\n-- No jobs, credentials or personal CV binaries seeded.\nbegin;\n`;
for (const [table, fields] of Object.entries(tables))
  sql += `
create table public.${table} (
  ${common},
  ${fields}
);
alter table public.${table} enable row level security;
create policy own_records on public.${table} for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.${table} to authenticated;
revoke all on public.${table} from anon;
create index ${table}_owner_idx on public.${table}(user_id);
`;
sql += `
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
`;
for (const table of Object.keys(tables))
  sql += `create trigger guard_record before insert or update on public.${table} for each row execute function public.guard_record();\n`;
sql += `
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
`;
fs.mkdirSync("supabase/migrations", { recursive: true });
fs.writeFileSync("supabase/migrations/202609140001_initial.sql", sql);
