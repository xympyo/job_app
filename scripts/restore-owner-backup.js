import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parseEnv = (text) => Object.fromEntries(text.split(/\r?\n/).flatMap((line) => { const m = line.match(/^\s*([^#=]+)=(.*)$/); return m ? [[m[1].trim(), m[2].trim().replace(/^['"]|['"]$/g, "")]] : []; }));
const env = parseEnv(await fs.readFile(path.join(root, ".env"), "utf8"));
const projectRef = new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
if (!env.SUPABASE_ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
const query = async (sql) => { const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) }); const body = await response.text(); if (!response.ok) throw new Error(`Management query failed (${response.status}): ${body.slice(0, 500)}`); return JSON.parse(body); };
const ownerEmail = process.env.RESTORE_OWNER_EMAIL;
if (!ownerEmail) throw new Error("RESTORE_OWNER_EMAIL is required.");
const users = await query(`select id from auth.users where lower(email)=lower('${ownerEmail}');`);
if (users.length !== 1) throw new Error(`Expected one restored owner account; found ${users.length}.`);
const ownerId = users[0].id;
const backup = JSON.parse(await fs.readFile(path.join(root, "private/gate3b/owner-v1-backup.json"), "utf8"));
const countsBefore = (await query(`select jsonb_build_object('companies',(select count(*) from public.companies),'cv_versions',(select count(*) from public.cv_versions),'research_runs',(select count(*) from public.research_runs),'jobs',(select count(*) from public.jobs),'job_sources',(select count(*) from public.job_sources),'applications',(select count(*) from public.applications),'application_questions',(select count(*) from public.application_questions),'application_events',(select count(*) from public.application_events)) as counts;`))[0].counts;
if (Object.values(countsBefore).some((count) => Number(count) !== 0)) throw new Error(`Refusing restore into non-empty target: ${JSON.stringify(countsBefore)}`);
const escapeJson = (rows) => JSON.stringify(rows.map((row) => ({ ...row, user_id: ownerId })));
const tables = ["companies", "cv_versions", "research_runs", "jobs", "job_sources", "applications", "application_questions", "application_events"];
const statements = ["begin;"];
for (const table of tables) {
  const rows = Array.isArray(backup[table]) ? backup[table] : [];
  if (!rows.length) continue;
  statements.push(`insert into public.${table} select * from jsonb_populate_recordset(null::public.${table}, '${escapeJson(rows).replaceAll("'", "''")}'::jsonb);`);
}
statements.push("commit;");
await query(statements.join("\n"));
const countsAfter = (await query(`select jsonb_build_object('companies',(select count(*) from public.companies),'cv_versions',(select count(*) from public.cv_versions),'research_runs',(select count(*) from public.research_runs),'jobs',(select count(*) from public.jobs),'job_sources',(select count(*) from public.job_sources),'applications',(select count(*) from public.applications),'application_questions',(select count(*) from public.application_questions),'application_events',(select count(*) from public.application_events)) as counts;`))[0].counts;
console.log(JSON.stringify({ projectRef, ownerId, backupExportedAt: backup.exported_at, countsBefore, countsAfter }, null, 2));
