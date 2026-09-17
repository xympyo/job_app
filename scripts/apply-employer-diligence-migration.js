import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = process.env.SUPABASE_PROJECT_REF || "gficmubsqkeqqsdlbxup";
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
async function main() {
  const args = new Set(process.argv.slice(2));
  const envText = await fs.readFile(path.join(root, ".env"), "utf8");
  const env = Object.fromEntries(envText.split(/\r?\n/).flatMap((line) => { const m = line.match(/^\s*([^#=]+)=(.*)$/); return m ? [[m[1].trim(), m[2].trim().replace(/^['"]|['"]$/g, "")]] : []; }));
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required in .env.");
  const query = async (sql) => { const r = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) }); const body = await r.text(); if (!r.ok) throw new Error(`Management API query failed (${r.status}): ${body.slice(0, 500)}`); return JSON.parse(body); };
  const state = await query("select to_regclass('public.company_diligence') as company_diligence, to_regclass('public.company_diligence_sources') as company_diligence_sources;");
  if (state[0]?.company_diligence && state[0]?.company_diligence_sources) { console.log(JSON.stringify({ mode: "already-applied", state }, null, 2)); return; }
  if (!args.has("--execute")) { console.log(JSON.stringify({ mode: "preflight", state, migration: "202609180001_company_diligence.sql" }, null, 2)); return; }
  const migration = await fs.readFile(path.join(root, "supabase/migrations/202609180001_company_diligence.sql"), "utf8");
  await query(migration);
  const verified = await query("select to_regclass('public.company_diligence') as company_diligence, to_regclass('public.company_diligence_sources') as company_diligence_sources, (select relrowsecurity from pg_class where oid='public.company_diligence'::regclass) as diligence_rls, (select relrowsecurity from pg_class where oid='public.company_diligence_sources'::regclass) as source_rls;");
  if (!verified[0]?.company_diligence || !verified[0]?.company_diligence_sources || !verified[0].diligence_rls || !verified[0].source_rls) throw new Error("Employer diligence schema/RLS verification failed.");
  console.log(JSON.stringify({ mode: "applied", verified }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
