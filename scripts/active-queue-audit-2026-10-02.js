import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ownerEmail = "moshe4122004@gmail.com";
const auditDate = "2026-10-02";
const auditAt = "2026-10-02T16:30:00Z";
const env = Object.fromEntries((await fs.readFile(path.join(root, ".env"), "utf8")).split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^\s*([^#=]+)=(.*)$/);
  return match ? [[match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
const ref = process.env.SUPABASE_PROJECT_REF || new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required in .env");
const sqlText = (value) => `'${String(value ?? "").replaceAll("'", "''")}'`;
async function query(sql) {
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  const body = await response.text();
  if (!response.ok) throw new Error(`Management API query failed (${response.status}): ${body.slice(0, 800)}`);
  return JSON.parse(body);
}

const rules = [
  ["Kearney", "Kearney Junior Analyst 2026 (JKT)", "APPLY ASAP", "Current official campus role remains strategically excellent for a final-year 2026 candidate; no material eligibility blocker found.", 90, "Strong Fit"],
  ["Tada", "Product Support & Sysadmin", "RESEARCH FIRST", "BSD location is attractive, but support workload, employer evidence and progression remain unresolved."],
  ["PT Amber Solusi Internasional", "Fresh Graduate Business Analyst", "RESEARCH FIRST", "Relevant entry-level analyst role, but current source is a secondary listing and employer/role details need confirmation."],
  ["Danone Indonesia", "Graduate Program STAR & GREAT 2027", "APPLY ASAP", "Current structured graduate pathway, strong role fit and credible employer; confirm placement and assessment details.", 93, "Excellent Fit"],
  ["Deloitte", "T&T Consultant - Technology Strategy & Transformation - ID", "RESEARCH FIRST", "Strong technology-transformation fit, but Consultant-level eligibility and workload/travel need confirmation."],
  ["Deloitte", "T&T Graduate Analyst - Artificial Intelligence & Data - ID", "DROP FROM ACTIVE QUEUE", "The stored source is not a current actionable route and the role is a narrower AI/data direction than Moshe's preferred business-technology path."],
  ["SPX Express / Shopee", "Shopee & SPX Express Future Leaders Program (Operations) 2027 - Indonesia", "APPLY ASAP", "Current graduate program, strong operations/leadership match and 31 October deadline; nationwide placement is the main trade-off.", 92, "Excellent Fit"],
  ["99 Group", "Graduate Trainee Programme (All Functions)", "APPLIED / WAITING", "Already applied on 15 September; preserve the application and wait for employer evidence."],
  ["Knauf Indonesia", "Knauf APAC Management Trainee Program (LEAP)", "CLOSED / HISTORICAL", "Stored deadline passed and the current source no longer showed an actionable opening."],
  ["PT Wiratara Prima", "Data Analyst Staff", "CLOSED / HISTORICAL", "The current JobStreet source indicates the listing is expired; preserve the record without new application effort."],
  ["Berca Global Access", "Business Analyst / PMO Consultant", "DROP FROM ACTIVE QUEUE", "The current generic careers page does not expose a clearly matched live requisition, so it should not consume active-queue attention."],
  ["PT Link Net Tbk", "Process Excellence Intern", "OPTIONAL", "Near-home and relevant, but an internship is secondary to Moshe's full-time goal and current opening details are uncertain."],
  ["Dipo Star Finance", "IT Business Analyst - Business Process Improvement", "RESEARCH FIRST", "Strong role fit, but current JobStreet evidence and employer diligence are insufficient for immediate application effort."],
  ["StraitsX", "Junior Product Operations Associate", "RESEARCH FIRST", "Potential product-operations fit, but current role availability, contract details and employer evidence need confirmation."],
  ["PT Sustainable Solutions Indonesia", "Environmental Data Analyst", "DROP FROM ACTIVE QUEUE", "The environmental-specialist direction is less aligned with Moshe's target identity and the employer/source evidence remains weak."],
  ["Oliver Wyman", "Entry-level Consultant & Project Analyst (2027) - Jakarta", "APPLIED / WAITING", "Already applied on 15 September; the vacancy is expired, but the application history must remain intact."],
  ["Coway Indonesia", "Planning Analyst", "CLOSED / HISTORICAL", "The current JobStreet source indicates the listing is expired; preserve the record without new application effort."],
  ["HashMicro", "International ERP Consultant", "DROP FROM ACTIVE QUEUE", "Already skipped; the current record does not provide a sufficiently credible active opening and the international ERP route is not a priority over stronger options."],
  ["Dwigraha Medical", "Data Analyst Officer", "RESEARCH FIRST", "Role fit is plausible, but employer diligence is HOLD and the source does not establish enough current detail for immediate effort."],
  ["PT Intelegensia Mustaka", "ERP Technical Consultant & System Administrator", "RESEARCH FIRST", "Deadline is near and the technical/ERP fit is plausible, but the source is secondary and employer evidence is unresolved."],
  ["PT. Mowilex", "Management Trainee - Mowilex Future Leaders Program 2026", "RESEARCH FIRST", "Manufacturing/leadership fit is strong, but current requirements, program timing and employer trade-offs need confirmation."],
  ["OpenWay", "Implementation Engineer Intern", "OPTIONAL", "Strategically relevant implementation work, but it is an internship and secondary to the full-time objective; keep only as a selective fallback."],
  ["Boston Consulting Group (BCG)", "Business Analyst, Indonesia (2027)", "CLOSED / HISTORICAL", "Stored deadline passed and the current source no longer showed an actionable route."],
  ["TikTok", "Graduate Development Program (TikTok Shop E-commerce, Indonesia) - 2027 Start", "APPLIED / WAITING", "Already applied on 15 September; preserve the active application and await employer response."],
  ["TikTok", "Logistics Operation Excellence Graduate (GTL Logistics, Indonesia) - 2027 Start", "APPLIED / WAITING", "Already applied on 15 September; preserve the active application and await employer response."],
  ["Sea", "2027 Sea Global Management Associate Program (Shopee/Monee)", "APPLIED / WAITING", "Applied on 15 September; online assessment completed 19 September and result is still pending."],
  ["Krom", "Associate Product Manager", "CLOSED / HISTORICAL", "Current source did not provide an actionable open listing; preserve the skipped history."],
  ["PT Suzuki Indomobil Motor", "Corporate Planning Staff", "RESEARCH FIRST", "Corporate-planning fit is plausible, but the current secondary listing and employer/team evidence need confirmation."],
  ["FrieslandCampina / Frisian Flag Indonesia", "Global Traineeship Program Engineering & Technology - Indonesia", "APPLIED / WAITING", "Already applied on 15 September; preserve the application despite the role's engineering-degree and placement uncertainty."],
  ["Deliveree Indonesia", "Fresh Graduate Management Training Program", "APPLY", "Current graduate listing with a 31 October deadline and relevant logistics/operations exposure; verify workload and assignment before submission.", 82, "Strong Fit"],
  ["Traveloka", "Product Analyst", "DROP FROM ACTIVE QUEUE", "Current official posting requires approximately 3–5 years of product-management experience, materially above Moshe's profile."],
  ["PT Toyota Astra Financial Services", "IT Business Process Analyst", "CLOSED / HISTORICAL", "Application workspace is closed and the vacancy source is closed; preserve history."],
  ["Indodana", "Business Intelligence Analyst", "RESEARCH FIRST", "Relevant BI role, but employer/team evidence and compensation remain unresolved."],
  ["Indodana", "Data Analyst - Operations", "RESEARCH FIRST", "Strong operations-analytics relevance, but employer/team evidence and compensation remain unresolved."],
  ["Noraa & Co.", "ERP Consultant — Entry Level / Fresh Graduate", "APPLIED / WAITING", "Already applied on 15 September; the source is expired, but no rejection evidence exists."],
  ["Container Maritime Activities", "IT Business Engagement Analyst", "RESEARCH FIRST", "Good business-technology bridge, but the current secondary source and employer evidence need confirmation."],
  ["Paper", "Associate Product Manager", "CLOSED / HISTORICAL", "Current LinkedIn source did not provide an actionable open listing."],
  ["PT Bhakti Idola Tama", "Marketing Business Analyst Staff", "CLOSED / HISTORICAL", "The current JobStreet source indicates the listing is expired; preserve the record without new application effort."],
  ["Yayasan Astra Bina Ilmu (Politeknik Astra)", "PDCA Analyst", "RESEARCH FIRST", "Potential process-improvement fit, but Cikarang commute and current employer/source evidence require confirmation."],
  ["SPE Solution", "IT Business Analyst - Product Development", "APPLY", "Direct fit and Tier 1 Tangerang location; proceed while verifying the HOLD employer questions.", 84, "Strong Fit"],
  ["PT Kapal Api Global", "Project Management Officer", "CLOSED / HISTORICAL", "The current JobStreet source indicates the listing is expired; preserve the record without new application effort."],
  ["Lalamove Indonesia", "Global Trainee Program 2027", "RESEARCH FIRST", "Strong program value, but Hong Kong/global relocation is a material unresolved preference decision."],
  ["Koperasi Astra International", "Operational Analyst", "OPTIONAL", "Potential operations fit, but generic scope and current JobStreet evidence do not justify immediate effort."],
  ["PT Paradise Perkasa", "Management Trainee", "APPLY", "Near-home full-time graduate role with a current deadline; proceed with the documented employer-caution questions.", 84, "Strong Fit"],
  ["Vidio", "Associate Product Manager - Operations", "CLOSED / HISTORICAL", "The current LinkedIn source indicates the listing is closed; preserve the record without new application effort."],
  ["EDTS", "Associate Product Manager - Ignition Development Program 2027", "CLOSED / HISTORICAL", "Current source did not provide an actionable open listing."],
  ["PT Bank Negara Indonesia (Persero) Tbk", "Talent Pool Officer Development Program (ODP) Data Analytics 2027", "CLOSED / HISTORICAL", "Stored deadline passed; preserve the Preparing workspace but do not spend new effort without a fresh official route."],
  ["PEFINDO", "Strategic Management Office Intern", "OPTIONAL", "Analytical/strategy content is relevant, but internship status and uncertain JobStreet evidence make it secondary."],
  ["ATI Business Group", "Business Analyst", "RESEARCH FIRST", "Relevant analyst role, but current opening details and employer evidence are insufficient for immediate application."],
  ["ATI Business Group", "Finance & Operations Associate", "RESEARCH FIRST", "Potentially local and operational, but finance emphasis, role assignment and employer evidence remain unresolved."],
  ["Accenture Indonesia", "Graduate Analyst Talent Advancement Program", "APPLY", "Strong technology-transformation fit with a graduate route; verify project assignment, travel and assessment sequence.", 89, "Strong Fit"],
  ["PT Bank Central Asia Tbk (BCA)", "Management Development Program (MDP)", "APPLY ASAP", "Current official graduate program, strong fit and 31 October event window; nationwide placement is the main trade-off.", 92, "Excellent Fit"],
  ["PT Bank Digital BCA (BCA Digital)", "Business Analyst", "APPLIED / WAITING", "Already applied on 15 September; the source is now closed but no rejection evidence exists."],
  ["PT Hino Finance Indonesia", "Credit Analyst", "OPTIONAL", "Near-home full-time role, but credit-domain fit and employer evidence are weaker than the core analyst queue."],
  ["Krom Bank Indonesia", "Product Operations Support", "CLOSED / HISTORICAL", "The current LinkedIn source indicates the listing is closed; preserve the record without new application effort."],
  ["Ukirama", "Junior ERP Consultant", "CLOSED / HISTORICAL", "Source is closed; preserve the Preparing workspace and do not invest further without a new official route."],
  ["Garena", "Garena Development Program", "APPLY ASAP", "Current official entry-level program remains a strong technology-business option for a final-year candidate.", 87, "Strong Fit"],
  ["Summarecon", "Business Analyst", "APPLY ASAP", "Current official Gading Serpong role is near-home, fresh-graduate compatible and deadline-bound; restore it from the accidental closed state.", 87, "Strong Fit"]
];

const bucketToFields = {
  "APPLY ASAP": { review_status: "Ready to Apply", recommendation: "Apply ASAP" },
  APPLY: { review_status: "Ready to Apply", recommendation: "Apply" },
  "RESEARCH FIRST": { review_status: "Reviewing", recommendation: "Research first" },
  OPTIONAL: { review_status: "Saved", recommendation: "Low priority" },
  "DROP FROM ACTIVE QUEUE": { review_status: "Skipped", recommendation: "Skip" },
  "CLOSED / HISTORICAL": null,
  "APPLIED / WAITING": null
};
const sourceReplacements = [
  ["Kearney", "Kearney Junior Analyst 2026 (JKT)", "https://kearney.recsolu.com/jobs/Zqeh65-Nb3fK5C4Abcnv5A?locale=en"],
  ["Danone Indonesia", "Graduate Program STAR & GREAT 2027", "https://careers.danone.com/id/id/jobs/graduate-program-star-great-2027-28122-en-us.html"],
  ["SPE Solution", "IT Business Analyst - Product Development", "https://www.spesolution.com/list-job"],
  ["Lalamove Indonesia", "Global Trainee Program 2027", "https://www.lalamove.com/global-trainee-program"]
];
const jobs = await query(`select * from public.jobs where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)}));`);
const companies = await query(`select id,name from public.companies where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)}));`);
const applications = await query(`select id,job_id,status,applied_at,next_action from public.applications where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)}));`);
const appByJob = new Map(applications.map((app) => [app.job_id, app]));
const companyById = new Map(companies.map((company) => [company.id, company.name]));
const ruleByKey = new Map(rules.map((rule) => [`${rule[0]}\u0000${rule[1]}`, rule]));
const missing = jobs.filter((job) => !ruleByKey.has(`${companyById.get(job.company_id)}\u0000${job.title}`));
const duplicates = rules.length - ruleByKey.size;
if (missing.length || duplicates || jobs.length !== rules.length) throw new Error(`Coverage failure: jobs=${jobs.length}, rules=${rules.length}, missing=${JSON.stringify(missing.map((j) => [companyById.get(j.company_id), j.title]))}, duplicateRules=${duplicates}`);
const before = { jobs: jobs.length, applications: applications.length, job_ids: jobs.map((j) => j.id), application_ids: applications.map((a) => a.id) };
const classification = jobs.map((job) => {
  const key = `${companyById.get(job.company_id)}\u0000${job.title}`;
  const [company, title, bucket, reason, fitScore, fitLabel] = ruleByKey.get(key);
  return { job, company, title, bucket, reason, fitScore, fitLabel, application: appByJob.get(job.id) || null };
});
const summary = classification.reduce((acc, item) => { acc[item.bucket] = (acc[item.bucket] || 0) + 1; return acc; }, {});
if (!process.argv.includes("--execute")) { console.log(JSON.stringify({ mode: "preflight", auditDate, before, summary, applied: classification.filter((i) => i.bucket === "APPLIED / WAITING").map((i) => [i.company, i.title, i.application?.status]), missing: missing.length }, null, 2)); process.exit(0); }

const statements = ["begin;"];
for (const item of classification) {
  const { job, bucket, reason, fitScore, fitLabel } = item;
  const fields = [];
  const mapped = bucketToFields[bucket];
  if (mapped) fields.push(`review_status=${sqlText(mapped.review_status)}`, `recommendation=${sqlText(mapped.recommendation)}`);
  if (bucket === "CLOSED / HISTORICAL") {
    const closedPosting = ["Krom Bank Indonesia", "PT Toyota Astra Financial Services", "Ukirama"].includes(item.company);
    fields.push(`posting_status=${sqlText(closedPosting ? "Closed" : "Expired")}`);
    fields.push(`review_status=${sqlText(closedPosting ? "Closed" : "Expired")}`, `recommendation=${sqlText("Skip")}`);
  }
  if (item.company === "Summarecon" && item.title === "Business Analyst") fields.push(`posting_status=${sqlText("Verified open")}`, `deadline=${sqlText("2026-10-31")}::date`);
  if (fitScore != null) fields.push(`fit_score=${fitScore}`, `fit_label=${sqlText(fitLabel)}`);
  const auditNote = `October active-queue audit (${auditDate}): ${bucket}. ${reason}`;
  fields.push(`research_notes=case when research_notes like '%' || ${sqlText(auditNote)} || '%' then research_notes else concat_ws(E'\\n', nullif(research_notes,''), ${sqlText(auditNote)}) end`);
  statements.push(`update public.jobs set ${fields.join(", ")} where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)})) and id=${sqlText(job.id)}::uuid;`);
}
for (const [company, title, url] of sourceReplacements) {
  statements.push(`update public.job_sources set source_url=${sqlText(url)}, apply_url=${sqlText(url)}, verified_at=${sqlText(auditAt)}::timestamptz where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)})) and is_primary=true and job_id=(select j.id from public.jobs j join public.companies c on c.id=j.company_id where j.user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)})) and c.name=${sqlText(company)} and j.title=${sqlText(title)} limit 1);`);
}
statements.push("commit;");
await query(statements.join("\n"));
const after = await query(`select jsonb_build_object('jobs',(select count(*) from public.jobs where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)}))),'applications',(select count(*) from public.applications where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)}))),'events',(select count(*) from public.application_events where user_id=(select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)})))) as counts;`);
const sea = classification.find((item) => item.company === "Sea");
const report = { generated_at: new Date().toISOString(), audit_date: auditDate, pre_run: before, post_run: after[0].counts, total_jobs_audited: jobs.length, buckets: summary, applied_preserved: classification.filter((i) => i.bucket === "APPLIED / WAITING").map((i) => ({ company: i.company, title: i.title, status: i.application?.status, applied_at: i.application?.applied_at, next_action: i.application?.next_action || "Await employer evidence" })), sea_assessment_preserved: sea?.application?.status === "Applied", no_deletion: true };
await fs.writeFile(path.join(root, "output/active-queue-audit-2026-10-02.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
