import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrations = [
  "202609140001_initial.sql",
  "202609140002_application_preparing.sql",
  "202609160001_career_profile_foundation.sql",
  "202609180001_company_diligence.sql",
  "202609180002_company_diligence_hardening.sql",
];
const parseEnv = (text) => Object.fromEntries(text.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^\s*([^#=]+)=(.*)$/);
  return match ? [[match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
}));
const env = parseEnv(await fs.readFile(path.join(root, ".env"), "utf8"));
const ref = new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
if (!env.SUPABASE_ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;
async function query(sql) {
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  const body = await response.text();
  if (!response.ok) throw new Error(`Management query failed (${response.status}): ${body.slice(0, 500)}`);
  return JSON.parse(body);
}
const current = await query("select to_regclass('public.jobs') as jobs, to_regclass('public.career_profiles') as career_profiles, to_regclass('public.company_diligence') as company_diligence;");
if (current[0]?.jobs || current[0]?.career_profiles || current[0]?.company_diligence) throw new Error(`Target is not empty; refusing schema bootstrap: ${JSON.stringify(current[0])}`);
for (const name of migrations) {
  await query(await fs.readFile(path.join(root, "supabase/migrations", name), "utf8"));
  console.log(`APPLIED ${name}`);
}
const verified = await query("select to_regclass('public.jobs') as jobs, to_regclass('public.career_profiles') as career_profiles, to_regclass('public.company_diligence') as company_diligence, (select relrowsecurity from pg_class where oid='public.jobs'::regclass) as jobs_rls, (select relrowsecurity from pg_class where oid='public.company_diligence'::regclass) as diligence_rls;");
console.log(JSON.stringify({ ref, verified }, null, 2));
