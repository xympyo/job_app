import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = process.env.SUPABASE_PROJECT_REF || "gficmubsqkeqqsdlbxup";
const ownerEmail = process.env.DILIGENCE_OWNER_EMAIL || "moshe4122004@gmail.com";
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

function envFile() {
  return fs.readFile(path.join(root, ".env"), "utf8").then((text) => Object.fromEntries(text.split(/\r?\n/).flatMap((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    return m ? [[m[1].trim(), m[2].trim().replace(/^['"]|['"]$/g, "")]] : [];
  })));
}
async function query(sql, token) {
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  const body = await response.text();
  if (!response.ok) throw new Error(`Management API query failed (${response.status}): ${body.slice(0, 500)}`);
  return JSON.parse(body);
}
const sqlText = (value) => `'${String(value).replaceAll("'", "''")}'`;
const norm = (value) => String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\b(pt|tbk|persero|indonesia|tiktok technologies|inc)\b/g, " ").replace(/\s+/g, " ").trim();
const deterministicUuid = (value) => {
  const digest = crypto.createHash("sha1").update(`company-diligence:${value}`).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50; digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
};
const aliases = new Map([
  ["pt bank central asia tbk bca", "pt bank central asia tbk bca"],
  ["pt bank negara indonesia persero tbk", "pt bank negara indonesia persero tbk"],
  ["boston consulting group bcg", "boston consulting group bcg"],
  ["pt bank digital bca bca digital", "pt bank digital bca bca digital"],
  ["frieslandcampina frisian flag indonesia", "frieslandcampina frisian flag indonesia"],
  ["spx express shopee", "spx express shopee"],
  ["pt mowilex", "pt mowilex"],
]);
function canonicalKey(name) { return aliases.get(norm(name)) || norm(name); }
function loadFixture() { return fs.readFile(path.join(root, "data/employer-diligence-2026-09-17.json"), "utf8").then(JSON.parse); }
function arraySql(value) { return `${sqlText(JSON.stringify(Array.isArray(value) ? value : []))}::jsonb`; }
function sourceRows(record, ownerId, diligenceId) {
  return (record.sources || []).map((source) => `(${sqlText(diligenceId)}::uuid, ${sqlText(ownerId)}::uuid, ${sqlText(source.name || "")}, ${sqlText(source.url || "")}, ${sqlText(source.type || "Unknown")}, ${sqlText(source.classification || "UNKNOWN")}, ${sqlText(source.scope || "company")}, ${source.sample == null ? "null" : Number(source.sample)}, ${sqlText(source.note || "")}, ${source.accessed_at ? `${sqlText(source.accessed_at)}::date` : "null"})`).join(",");
}
async function main() {
  const args = new Set(process.argv.slice(2));
  const execute = args.has("--execute");
  const env = await envFile();
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required in .env.");
  const fixture = await loadFixture();
  if (fixture.version !== 1 || !Array.isArray(fixture.records)) throw new Error("Invalid diligence fixture.");
  const users = await query(`select id from auth.users where lower(email)=lower(${sqlText(ownerEmail)});`, token);
  if (users.length !== 1) throw new Error(`Expected one owner account; found ${users.length}.`);
  const ownerId = users[0].id;
  const companies = await query(`select id,name from public.companies where user_id=${sqlText(ownerId)}::uuid order by name;`, token);
  const byKey = new Map();
  for (const company of companies) { const key = canonicalKey(company.name); const list = byKey.get(key) || []; list.push(company); byKey.set(key, list); }
  const mapped = []; const unresolved = [];
  for (const record of fixture.records) {
    const matches = byKey.get(canonicalKey(record.company)) || [];
    if (matches.length !== 1) unresolved.push({ auditCompany: record.company, matches: matches.map((m) => m.name) });
    else mapped.push({ record, company: matches[0] });
  }
  const existing = await query(`select company_id,status,confidence,researched_at from public.company_diligence where user_id=${sqlText(ownerId)}::uuid order by company_id;`, token).catch(() => []);
  const summary = { mode: execute ? "execute" : "preflight", ownerEmail, fixtureRecords: fixture.records.length, ownerCompanies: companies.length, mapped: mapped.length, unresolved, existing: existing.length };
  if (unresolved.length) { console.log(JSON.stringify(summary, null, 2)); throw new Error(`Failing closed: ${unresolved.length} diligence company mappings are unresolved.`); }
  if (!execute) { console.log(JSON.stringify(summary, null, 2)); return; }
  const statements = ["begin;"];
  for (const { record, company } of mapped) {
    const diligenceId = deterministicUuid(`${ownerId}:${company.id}`);
    statements.push(`insert into public.company_diligence (id,user_id,company_id,status,confidence,summary,positive_signals,concern_signals,verification_questions,operational_recommendation,researched_at) values (${sqlText(diligenceId)}::uuid,${sqlText(ownerId)}::uuid,${sqlText(company.id)}::uuid,${sqlText(record.status)},${sqlText(record.confidence)},${sqlText(record.summary || "")},${arraySql(record.positive_signals)},${arraySql(record.concern_signals)},${arraySql(record.verification_questions)},${sqlText(record.operational_recommendation || "")},${sqlText(fixture.audit_date)}::date) on conflict (user_id,company_id) do update set status=excluded.status,confidence=excluded.confidence,summary=excluded.summary,positive_signals=excluded.positive_signals,concern_signals=excluded.concern_signals,verification_questions=excluded.verification_questions,operational_recommendation=excluded.operational_recommendation,researched_at=excluded.researched_at,updated_at=now();`);
    statements.push(`delete from public.company_diligence_sources where user_id=${sqlText(ownerId)}::uuid and company_diligence_id=${sqlText(diligenceId)}::uuid;`);
    const sources = sourceRows(record, ownerId, diligenceId);
    if (sources) statements.push(`insert into public.company_diligence_sources (company_diligence_id,user_id,source_name,source_url,source_type,evidence_classification,scope,review_sample_size,note,accessed_at) values ${sources};`);
  }
  statements.push("commit");
  await query(`${statements.join("\n")};`, token);
  const after = await query(`select d.status,d.confidence,c.name from public.company_diligence d join public.companies c on c.id=d.company_id where d.user_id=${sqlText(ownerId)}::uuid order by c.name;`, token);
  console.log(JSON.stringify({ ...summary, imported: after.length, statuses: after.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {}) }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
