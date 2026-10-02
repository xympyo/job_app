import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ownerEmail = "moshe4122004@gmail.com";
const refreshDate = "2026-10-02";
const refreshAt = "2026-10-02T15:00:00Z";

const env = Object.fromEntries((await fs.readFile(path.join(root, ".env"), "utf8")).split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^\s*([^#=]+)=(.*)$/);
  return match ? [[match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
const projectRef = process.env.SUPABASE_PROJECT_REF || new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required in .env");

async function query(sql) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Management API query failed (${response.status}): ${body.slice(0, 800)}`);
  return JSON.parse(body);
}

const sqlText = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const sqlJson = (value) => `${sqlText(JSON.stringify(value ?? []))}::jsonb`;
const shaUuid = (prefix, value) => {
  const digest = crypto.createHash("sha1").update(`${prefix}:${value}`).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50; digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};
const norm = (value) => String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\b(pt|tbk|persero|indonesia|inc|ltd)\b/g, " ").replace(/\s+/g, " ").trim();
const normTitle = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const canonicalCompanyKey = (name) => {
  const n = norm(name);
  if (["bca", "bank central asia", "pt bank central asia tbk bca"].includes(n)) return "bank central asia bca";
  if (n.includes("spx") || n.includes("shopee")) return "spx shopee";
  if (n.includes("frieslandcampina") || n.includes("frisian flag")) return "frieslandcampina frisian flag";
  if (n.includes("bcg") || n.includes("boston consulting group")) return "boston consulting group";
  return n;
};

const input = JSON.parse(await fs.readFile(path.join(root, "data/october-refresh-2026-10-02.json"), "utf8"));
const users = await query(`select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)});`);
if (users.length !== 1) throw new Error(`Expected one owner account, found ${users.length}`);
const ownerId = users[0].id;
const companies = await query(`select id,name,normalized_name,website,careers_url,industry,size,headquarters,notes from public.companies where user_id=${sqlText(ownerId)}::uuid order by name;`);
const jobs = await query(`select id,company_id,title,normalized_title,posting_status,review_status,recommendation,last_verified_at,deadline from public.jobs where user_id=${sqlText(ownerId)}::uuid order by title;`);
const sources = await query(`select id,job_id,source_url,is_primary from public.job_sources where user_id=${sqlText(ownerId)}::uuid;`);
const apps = await query(`select id,job_id,status,applied_at,next_action from public.applications where user_id=${sqlText(ownerId)}::uuid order by id;`);
const cvs = await query(`select id,name,slug from public.cv_versions where user_id=${sqlText(ownerId)}::uuid order by name;`);
const cvByName = new Map(cvs.map((cv) => [cv.name.toLowerCase(), cv.id]));
const companyByKey = new Map();
for (const company of companies) {
  const key = canonicalCompanyKey(company.name);
  const list = companyByKey.get(key) || [];
  list.push(company);
  companyByKey.set(key, list);
}

const mappedCompanies = new Map();
const unresolvedCompanies = [];
for (const row of input.new_jobs) {
  const matches = companyByKey.get(canonicalCompanyKey(row.company)) || [];
  if (matches.length > 1) unresolvedCompanies.push({ company: row.company, matches: matches.map((m) => m.name) });
  else if (matches.length === 1) mappedCompanies.set(row.company, matches[0]);
}
for (const row of input.new_diligence) {
  const matches = companyByKey.get(canonicalCompanyKey(row.company)) || [];
  if (matches.length > 1) unresolvedCompanies.push({ company: row.company, matches: matches.map((m) => m.name) });
  else if (matches.length === 1) mappedCompanies.set(row.company, matches[0]);
}
if (unresolvedCompanies.length) throw new Error(`Ambiguous company mappings: ${JSON.stringify(unresolvedCompanies)}`);

const staleByTitle = new Map([
  ["Talent Pool Officer Development Program (ODP) Data Analytics 2027", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Primary September listing deadline 20 Sep 2026 passed; no current extension found." }],
  ["Business Analyst, Indonesia (2027)", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Stored 23 Sep 2026 deadline passed; current source no longer showed an actionable path." }],
  ["Entry-level Consultant & Project Analyst (2027) - Jakarta", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Stored 28 Sep 2026 deadline passed and the current source indicated the listing was closed." }],
  ["Knauf APAC Management Trainee Program (LEAP)", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Stored 30 Sep 2026 deadline passed; current careers page indicated the listing was no longer open." }],
  ["Associate Product Manager", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Current LinkedIn source no longer provided an actionable open listing." }],
  ["Associate Product Manager - Ignition Development Program 2027", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Current LinkedIn source did not provide an actionable open listing." }],
  ["ERP Consultant — Entry Level / Fresh Graduate", { posting_status: "Expired", review_status: "Expired", recommendation: "Skip", note: "Current LinkedIn source returned no actionable open listing; preserve the applied history." }],
  ["Junior ERP Consultant", { posting_status: "Closed", review_status: "Closed", recommendation: "Skip", note: "Current source indicated the vacancy was closed; preserve the Preparing workspace." }],
  ["IT Business Process Analyst", { posting_status: "Closed", review_status: "Closed", recommendation: "Skip", note: "Current source indicated the vacancy was closed; preserve the terminal application history." }],
  ["Business Analyst", { posting_status: "Closed", review_status: "Closed", recommendation: "Skip", note: "The current BCA Digital source indicated the listing was closed; preserve the Applied history." }]
]);
const travelokaJob = jobs.find((j) => j.title === "Product Analyst" && j.company_id === companies.find((c) => c.name === "Traveloka")?.id);
const activeVerifiedTitles = new Set([
  "Management Development Program (MDP)",
  "Fresh Graduate Management Training Program",
  "2027 Sea Global Management Associate Program (Shopee/Monee)",
  "Graduate Development Program (TikTok Shop E-commerce, Indonesia) - 2027 Start",
  "Logistics Operation Excellence Graduate (GTL Logistics, Indonesia) - 2027 Start",
  "Shopee & SPX Express Future Leaders Program (Operations) 2027 - Indonesia",
  "Garena Development Program",
  "Business Analyst"
]);
const jobsById = new Map(jobs.map((j) => [j.id, j]));
const sourceByJob = new Map();
for (const source of sources) { if (source.is_primary) sourceByJob.set(source.job_id, source); }

const before = {
  counts: {
    companies: companies.length, jobs: jobs.length, job_sources: sources.length,
    applications: apps.length, cv_versions: cvs.length,
  },
  application_ids: apps.map((a) => a.id), job_ids: jobs.map((j) => j.id), cv_ids: cvs.map((c) => c.id),
};
const summary = { mode: process.argv.includes("--execute") ? "execute" : "preflight", ownerId, refreshDate, before, existingJobsReverified: jobs.length, plannedNewJobs: input.new_jobs.length, mappedExistingCompanies: [...mappedCompanies.keys()], unresolvedCompanies };
if (!process.argv.includes("--execute")) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const statements = ["begin;"];
const researchRunId = shaUuid("october-research-run", `${ownerId}:${refreshDate}`);
statements.push(`insert into public.research_runs (id,user_id,research_goal,query_summary,notes,started_at,completed_at,result_count,created_jobs_count) values (${sqlText(researchRunId)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(input.goal)},${sqlText("October 2026 refresh: full-time early-career research with Tangerang-first geography, stale-inventory reconciliation and employer diligence." )},${sqlText("Current-source reverification of the existing portfolio plus a curated October batch. No scraping, auto-apply or destructive history changes. Assessment uncertainty and employer-quality signals remain explicit." )},${sqlText(refreshAt)}::timestamptz,${sqlText(refreshAt)}::timestamptz,${input.new_jobs.length},${input.new_jobs.length}) on conflict (id) do nothing;`);

// Reverify every existing job/source. Uncertain listings are deliberately downgraded to Possibly open.
for (const job of jobs) {
  const company = companies.find((c) => c.id === job.company_id);
  let patch = { posting_status: activeVerifiedTitles.has(job.title) ? "Verified open" : "Possibly open", review_status: job.review_status, recommendation: job.recommendation, note: "October refresh: primary source checked on 2026-10-02; current availability remains uncertain." };
  if (staleByTitle.has(job.title)) patch = { ...patch, ...staleByTitle.get(job.title) };
  if (job.title === "Fresh Graduate Management Training Program") patch.deadline = "2026-10-31";
  if (job.title === "Management Development Program (MDP)") patch.deadline = "2026-10-31";
  if (job.title === "Global Traineeship Program Engineering & Technology - Indonesia") patch.deadline = null;
  if (job.title === "Product Analyst" && company?.name === "Traveloka") patch = { posting_status: "Verified open", review_status: "Skipped", recommendation: "Skip", fit_score: 52, fit_label: "Weak Fit", fit_reason: "Current official posting requires approximately 3-5 years of product-management experience and is contractor-based, which is materially above Moshe's current early-career profile.", note: "Current official Traveloka listing was checked on 2026-10-02; retain as research history but remove from the actionable queue." };
  const fields = [`last_verified_at=${sqlText(refreshAt)}::timestamptz`, `posting_status=${sqlText(patch.posting_status)}`, `review_status=${sqlText(patch.review_status)}`, `recommendation=${sqlText(patch.recommendation)}`];
  if (patch.deadline !== undefined) fields.push(`deadline=${patch.deadline == null ? "null" : `${sqlText(patch.deadline)}::date`}`);
  if (patch.fit_score !== undefined) fields.push(`fit_score=${patch.fit_score}`, `fit_label=${sqlText(patch.fit_label)}`, `fit_reason=${sqlText(patch.fit_reason)}`);
  fields.push(`research_notes=concat_ws(E'\\n', nullif(research_notes,''), ${sqlText(patch.note)})`);
  statements.push(`update public.jobs set ${fields.join(", ")} where user_id=${sqlText(ownerId)}::uuid and id=${sqlText(job.id)}::uuid;`);
}
for (const source of sources) statements.push(`update public.job_sources set verified_at=${sqlText(refreshAt)}::timestamptz where user_id=${sqlText(ownerId)}::uuid and id=${sqlText(source.id)}::uuid;`);

// Existing applications stay untouched except for the documented Sea assessment event/follow-up action.
const seaApp = apps.find((a) => jobsById.get(a.job_id)?.title?.startsWith("2027 Sea Global"));
if (!seaApp) throw new Error("Sea application not found; refusing to claim the assessment progression.");
const seaEventId = shaUuid("sea-assessment-event", `${ownerId}:${seaApp.id}:2026-09-19`);
statements.push(`update public.applications set next_action=${sqlText("Await Sea Global MAP online-assessment result; do not infer pass/fail")}, notes=concat_ws(E'\\n', nullif(notes,''), ${sqlText("Online assessment completed 2026-09-19; awaiting result as of 2026-10-02. No pass/fail inference.")}) where user_id=${sqlText(ownerId)}::uuid and id=${sqlText(seaApp.id)}::uuid;`);
statements.push(`insert into public.application_events (id,user_id,application_id,title,notes,kind,scheduled_at,status) values (${sqlText(seaEventId)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(seaApp.id)}::uuid,${sqlText("Sea Global MAP online assessment completed")},${sqlText("Completed 2026-09-19; result not received by 2026-10-02. Preserve uncertainty." )},${sqlText("Assessment")},${sqlText("2026-09-19T12:00:00Z")}::timestamptz,${sqlText("Completed")}) on conflict (id) do nothing;`);

const companyIds = new Map(mappedCompanies);
for (const row of input.new_jobs) {
  if (!companyIds.has(row.company)) {
    const id = shaUuid("october-company", `${ownerId}:${canonicalCompanyKey(row.company)}`);
    companyIds.set(row.company, { id, name: row.company, normalized_name: canonicalCompanyKey(row.company) });
    statements.push(`insert into public.companies (id,user_id,name,normalized_name,website,careers_url,industry,size,headquarters,notes) values (${sqlText(id)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(row.company)},${sqlText(canonicalCompanyKey(row.company))},${sqlText(row.website || "")},${sqlText(row.website || "")},${sqlText(row.industry || "")},'',${sqlText(row.location_text || "")},${sqlText("October 2026 refresh company record")}) on conflict (user_id,normalized_name) do nothing;`);
  }
}
for (const row of input.new_diligence) {
  if (!companyIds.has(row.company)) {
    const id = shaUuid("october-company", `${ownerId}:${canonicalCompanyKey(row.company)}`);
    companyIds.set(row.company, { id, name: row.company, normalized_name: canonicalCompanyKey(row.company) });
  }
  const company = companyIds.get(row.company);
  const diligenceId = shaUuid("october-diligence", `${ownerId}:${company.id}`);
  statements.push(`insert into public.company_diligence (id,user_id,company_id,status,confidence,summary,positive_signals,concern_signals,verification_questions,operational_recommendation,researched_at) values (${sqlText(diligenceId)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(company.id)}::uuid,${sqlText(row.status)},${sqlText(row.confidence)},${sqlText(row.summary)},${sqlJson(row.positive_signals)},${sqlJson(row.concern_signals)},${sqlJson(row.verification_questions)},${sqlText(row.operational_recommendation)},${sqlText(refreshDate)}::date) on conflict (user_id,company_id) do update set status=excluded.status,confidence=excluded.confidence,summary=excluded.summary,positive_signals=excluded.positive_signals,concern_signals=excluded.concern_signals,verification_questions=excluded.verification_questions,operational_recommendation=excluded.operational_recommendation,researched_at=excluded.researched_at,updated_at=now();`);
  statements.push(`delete from public.company_diligence_sources where user_id=${sqlText(ownerId)}::uuid and company_diligence_id=${sqlText(diligenceId)}::uuid;`);
  for (const source of row.sources || []) {
    const sourceId = shaUuid("october-diligence-source", `${diligenceId}:${source.url}`);
    statements.push(`insert into public.company_diligence_sources (id,user_id,company_diligence_id,source_name,source_url,source_type,evidence_classification,scope,review_sample_size,note,accessed_at) values (${sqlText(sourceId)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(diligenceId)}::uuid,${sqlText(source.name)},${sqlText(source.url)},${sqlText(source.type || "Unknown")},${sqlText(source.classification || "UNKNOWN")},${sqlText(source.scope || "company")},${source.sample == null ? "null" : Number(source.sample)},${sqlText(source.note || "")},${source.accessed_at ? `${sqlText(source.accessed_at)}::date` : `${sqlText(refreshDate)}::date`}) on conflict (id) do update set note=excluded.note,accessed_at=excluded.accessed_at;`);
  }
}

const jobSourcesByUrl = new Map(sources.map((s) => [s.source_url, s]));
for (const row of input.new_jobs) {
  const company = companyIds.get(row.company);
  if (!company?.id) throw new Error(`No company id for ${row.company}`);
  const existingSource = jobSourcesByUrl.get(row.source.url);
  if (existingSource) continue;
  const jobId = shaUuid("october-job", `${ownerId}:${canonicalCompanyKey(row.company)}:${normTitle(row.title)}`);
  const sourceId = shaUuid("october-job-source", `${jobId}:${row.source.url}`);
  const cvId = cvByName.get(String(row.recommended_cv || "").toLowerCase()) || null;
  if (!cvId) throw new Error(`No CV variant found for ${row.recommended_cv}`);
  const job = {
    id: jobId, user_id: ownerId, company_id: company.id, title: row.title, normalized_title: normTitle(row.title), location_text: row.location_text,
    city: row.city || "", country: row.country || "Indonesia", employment_type: row.employment_type || "", role_family: row.role_family || "", seniority: row.seniority || "",
    description: row.description || "", responsibilities: row.responsibilities || "", requirements: row.requirements || "", preferred_requirements: row.preferred_requirements || "",
    salary_currency: "", salary_period: "", source_confidence: row.source_confidence || "", fit_label: row.fit_label || "", fit_reason: row.fit_reason || "", recommendation: row.recommendation || "",
    research_notes: row.research_notes || "", notes: row.notes || "", work_mode: row.work_mode || "Unknown", posting_status: row.posting_status || "Unknown", review_status: row.review_status || "Found",
    salary_min: null, salary_max: null, deadline: row.deadline || null, published_at: row.published_at || null, found_at: refreshDate, last_verified_at: refreshAt,
    fit_score: row.fit_score, strengths: row.strengths || [], gaps: row.gaps || [], red_flags: row.red_flags || [], recommended_cv_id: cvId, custom_tailoring: false, research_run_id: researchRunId,
  };
  const cols = Object.keys(job);
  const vals = cols.map((key) => { const value = job[key]; if (value == null) return "null"; if (["strengths", "gaps", "red_flags"].includes(key)) return sqlJson(value); if (["deadline", "published_at"].includes(key)) return `${sqlText(value)}::date`; if (key === "last_verified_at") return `${sqlText(value)}::timestamptz`; if (typeof value === "number") return String(value); if (typeof value === "boolean") return value ? "true" : "false"; return sqlText(value); });
  statements.push(`insert into public.jobs (${cols.join(",")}) values (${vals.join(",")}) on conflict (id) do nothing;`);
  statements.push(`insert into public.job_sources (id,user_id,job_id,source_name,source_url,apply_url,external_job_id,source_type,is_primary,verified_at) values (${sqlText(sourceId)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(jobId)}::uuid,${sqlText(row.source.name)},${sqlText(row.source.url)},${sqlText(row.source.apply_url || row.source.url)},${sqlText(row.source.external_job_id || "")},${sqlText(row.source.type || "Unknown")},true,${sqlText(refreshAt)}::timestamptz) on conflict (id) do nothing;`);
}
statements.push("commit;");
await query(statements.join("\n"));

const afterCounts = (await query(`select jsonb_build_object('companies',(select count(*) from public.companies where user_id=${sqlText(ownerId)}::uuid),'jobs',(select count(*) from public.jobs where user_id=${sqlText(ownerId)}::uuid),'job_sources',(select count(*) from public.job_sources where user_id=${sqlText(ownerId)}::uuid),'research_runs',(select count(*) from public.research_runs where user_id=${sqlText(ownerId)}::uuid),'applications',(select count(*) from public.applications where user_id=${sqlText(ownerId)}::uuid),'application_questions',(select count(*) from public.application_questions where user_id=${sqlText(ownerId)}::uuid),'application_events',(select count(*) from public.application_events where user_id=${sqlText(ownerId)}::uuid),'company_diligence',(select count(*) from public.company_diligence where user_id=${sqlText(ownerId)}::uuid),'company_diligence_sources',(select count(*) from public.company_diligence_sources where user_id=${sqlText(ownerId)}::uuid)) as counts;`))[0].counts;
const seaCheck = await query(`select a.status,a.applied_at,a.next_action,(select count(*) from public.application_events e where e.application_id=a.id and e.user_id=a.user_id) as event_count from public.applications a where a.user_id=${sqlText(ownerId)}::uuid and a.id=${sqlText(seaApp.id)}::uuid;`);
const changed = { stale_titles: [...staleByTitle.keys()], traveloka_deprioritized: Boolean(travelokaJob), new_jobs: input.new_jobs.map((r) => r.title), new_diligence: input.new_diligence.map((r) => r.company) };
const report = { generated_at: new Date().toISOString(), refresh_date: refreshDate, owner_email: ownerEmail, pre_run: before, post_run: afterCounts, changed, sea: seaCheck[0], history_policy: "No jobs, sources, research runs, applications, CV variants, questions or history were deleted. Existing applications were not reclassified; only Sea follow-up metadata/event was added.", sources: "See output/october-refresh-2026-10-02.md for source list and dated evidence." };
await fs.mkdir(path.join(root, "output"), { recursive: true });
await fs.writeFile(path.join(root, "output/october-refresh-2026-10-02.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
