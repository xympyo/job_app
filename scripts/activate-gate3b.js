import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { profileRevisionPayloadSchema, revisionContentHash } from "../src/v2/profile.js";
import { profileRevisionToCompilerInput } from "../src/v2/profile-domain.js";
import { compileCareerPack } from "../src/v2/compiler.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = process.env.SUPABASE_PROJECT_REF || "gficmubsqkeqqsdlbxup";
const ownerEmail = process.env.GATE3B_OWNER_EMAIL || "moshe4122004@gmail.com";
const expectedCandidateHash = "fnv1a64:8dfc4141079a9c34";
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

function loadDotEnv() {
  const values = {};
  return fs.readFile(path.join(root, ".env"), "utf8").then((text) => {
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+)=(.*)$/);
      if (match) values[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
    return values;
  });
}

async function query(sql, token) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Management API query failed (${response.status}): ${body.slice(0, 400)}`);
  try { return JSON.parse(body); } catch { throw new Error("Management API returned invalid JSON"); }
}

const sqlText = (value) => `'${String(value).replaceAll("'", "''")}'`;
const one = (rows, label) => {
  if (!Array.isArray(rows) || !rows[0]) throw new Error(`Production query returned no ${label}`);
  return rows[0];
};

function compileValidationPacks(revision, cvVariants) {
  const compilerInput = profileRevisionToCompilerInput({
    id: revision.id,
    status: "published",
    schemaVersion: revision.schema_version || revision.schemaVersion,
    structuredJson: revision.structured_json || revision.structuredJson,
    freeformNotes: revision.freeform_notes ?? revision.freeformNotes ?? "",
    sourceMapJson: revision.source_map_json || revision.sourceMapJson || {},
    createdBy: revision.created_by || revision.createdBy || "migration",
  }, cvVariants);
  const p = compilerInput.profile;
  return [
    compileCareerPack({ ...compilerInput, taskType: "career_discussion", packId: "gate3b-career-discussion", generatedAt: new Date().toISOString(), task: { type: "career_discussion", userRequest: "Help me evaluate my current career direction." } }),
    compileCareerPack({ ...compilerInput, taskType: "research_jobs", packId: "gate3b-research-jobs", generatedAt: new Date().toISOString(), profileSummary: p, targetRoles: p.targetRoles, locationPreferences: p.locationPreferences, constraints: p.constraints, existingOpportunityFingerprints: [], searchPreferences: { employmentType: p.workPreferences?.employmentType, workModes: p.workPreferences?.modes }, task: { type: "research_jobs", userRequest: "Research suitable full-time roles in my preferred locations." } }),
  ];
}

async function loadCandidate() {
  const file = path.join(root, "output/v2-gate3a-shadow/moshe-v2-profile-candidate.json");
  const candidate = JSON.parse(await fs.readFile(file, "utf8"));
  const payload = profileRevisionPayloadSchema.parse(candidate);
  const canonicalHash = revisionContentHash(payload);
  if (canonicalHash !== expectedCandidateHash) throw new Error(`Approved Gate 3A candidate hash mismatch: expected ${expectedCandidateHash}, got ${canonicalHash}`);
  return { file, candidate, payload, canonicalHash };
}

function integritySql(ownerId) {
  return `select jsonb_build_object(
    'cv_versions', (select count(*) from public.cv_versions where user_id=${sqlText(ownerId)}::uuid),
    'companies', (select count(*) from public.companies where user_id=${sqlText(ownerId)}::uuid),
    'jobs', (select count(*) from public.jobs where user_id=${sqlText(ownerId)}::uuid),
    'job_sources', (select count(*) from public.job_sources where user_id=${sqlText(ownerId)}::uuid),
    'research_runs', (select count(*) from public.research_runs where user_id=${sqlText(ownerId)}::uuid),
    'applications', (select count(*) from public.applications where user_id=${sqlText(ownerId)}::uuid),
    'application_questions', (select count(*) from public.application_questions where user_id=${sqlText(ownerId)}::uuid),
    'application_events', (select count(*) from public.application_events where user_id=${sqlText(ownerId)}::uuid)
  ) as counts;`;
}

async function ownerSnapshot(ownerId, token) {
  const counts = one(await query(integritySql(ownerId), token), "owner counts").counts;
  const cvRows = await query(`select id, name, description, notes, target_roles, active, created_at, updated_at from public.cv_versions where user_id=${sqlText(ownerId)}::uuid order by name, id;`, token);
  const cv = cvRows.map((row) => ({ ...row, positioning: row.description || "", targetRoles: Array.isArray(row.target_roles) ? row.target_roles : [] }));
  const apps = await query(`select id, job_id, cv_version_id, status, applied_at, rejection_stage, rejection_reason, stage_history, job_snapshot, cv_snapshot from public.applications where user_id=${sqlText(ownerId)}::uuid order by id;`, token);
  const ids = {
    cv: cv.map((row) => row.id),
    applications: apps.map((row) => row.id),
    jobs: await query(`select id from public.jobs where user_id=${sqlText(ownerId)}::uuid order by id;`, token).then((rows) => rows.map((row) => row.id)),
    sources: await query(`select id from public.job_sources where user_id=${sqlText(ownerId)}::uuid order by id;`, token).then((rows) => rows.map((row) => row.id)),
    researchRuns: await query(`select id from public.research_runs where user_id=${sqlText(ownerId)}::uuid order by id;`, token).then((rows) => rows.map((row) => row.id)),
  };
  const applicationMap = apps.map((row) => ({ id: row.id, jobId: row.job_id, cvVersionId: row.cv_version_id, status: row.status, appliedAt: row.applied_at, stageHistory: row.stage_history, snapshotHash: crypto.createHash("sha256").update(JSON.stringify({ job: row.job_snapshot, cv: row.cv_snapshot })).digest("hex") }));
  return { counts, cv, applications: applicationMap, ids };
}

async function applySchema(token) {
  const migration = await fs.readFile(path.join(root, "supabase/migrations/202609160001_career_profile_foundation.sql"), "utf8");
  await query(migration, token);
}

async function activateProfile(ownerId, payload, token) {
  const payloadSql = sqlText(JSON.stringify(payload));
  const sql = `with cfg as materialized (select set_config('request.jwt.claim.sub', ${sqlText(ownerId)}, true) as configured),
  p as materialized (select public.career_profile_create() as profile from cfg),
  d as materialized (select public.career_profile_create_draft((p.profile->>'id')::uuid, true) as draft from p),
  s as materialized (select public.career_profile_save_draft((p.profile->>'id')::uuid, (d.draft->>'id')::uuid, ${payloadSql}::jsonb, null) as saved from p, d),
  u as materialized (select public.career_profile_publish_draft((p.profile->>'id')::uuid, (d.draft->>'id')::uuid, (s.saved->>'updated_at')::timestamptz) as published from p, d, s)
  select jsonb_build_object('profile', p.profile, 'draft', d.draft, 'saved', s.saved, 'published', u.published) as activation from p, d, s, u;`;
  return one(await query(sql, token), "activation result").activation;
}

async function readProfile(ownerId, token) {
  const rows = await query(`select jsonb_build_object('profile', p, 'revision', r) as value from public.career_profiles p left join public.career_profile_revisions r on r.id=p.current_revision_id where p.user_id=${sqlText(ownerId)}::uuid;`, token);
  return rows[0]?.value || null;
}

async function verifySchema(token) {
  const tables = await query("select table_name from information_schema.tables where table_schema='public' and table_name in ('career_profiles','career_profile_revisions') order by table_name;", token);
  const columns = await query("select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name in ('career_profiles','career_profile_revisions') order by table_name,ordinal_position;", token);
  const policies = await query("select tablename,policyname,roles,cmd from pg_policies where schemaname='public' and tablename in ('career_profiles','career_profile_revisions') order by tablename,policyname;", token);
  const indexes = await query("select tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename in ('career_profiles','career_profile_revisions') order by tablename,indexname;", token);
  const functions = await query("select p.proname,pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'career_profile_%' order by p.proname;", token);
  return { tables, columns, policies, indexes, functions };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const execute = args.has("--execute");
  const env = await loadDotEnv();
  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required in .env for the Management API preflight.");
  const candidate = await loadCandidate();
  const users = await query(`select id,email,email_confirmed_at,created_at from auth.users where lower(email)=lower(${sqlText(ownerEmail)});`, token);
  if (users.length !== 1) throw new Error(`Expected exactly one owner account for ${ownerEmail}; found ${users.length}.`);
  const ownerId = users[0].id;
  const before = await ownerSnapshot(ownerId, token);
  const schemaPresent = (await query("select to_regclass('public.career_profiles') as career_profiles, to_regclass('public.career_profile_revisions') as career_profile_revisions;", token))[0]?.career_profiles;
  const existing = schemaPresent ? await query(`select id,current_revision_id,onboarding_status from public.career_profiles where user_id=${sqlText(ownerId)}::uuid;`, token) : [];
  const backupDir = path.join(root, "private/gate3b");
  await fs.mkdir(backupDir, { recursive: true });
  const backup = { generatedAt: new Date().toISOString(), ownerEmail, counts: before.counts, cv: before.cv, applications: before.applications, ids: before.ids };
  const backupPath = path.join(backupDir, "owner-v1-backup-gate3b.json");
  await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), { flag: "w" });
  const backupHash = crypto.createHash("sha256").update(await fs.readFile(backupPath)).digest("hex");
  if (existing.length > 1) throw new Error("More than one career profile exists for the owner; stopping safely.");
  if (existing.length === 1 && existing[0].current_revision_id) {
    const persisted = await readProfile(ownerId, token);
    const semantic = persisted?.revision ? profileRevisionPayloadSchema.parse({ schemaVersion: persisted.revision.schema_version, structuredJson: persisted.revision.structured_json, freeformNotes: persisted.revision.freeform_notes, sourceMapJson: persisted.revision.source_map_json, createdBy: persisted.revision.created_by }) : null;
    if (!semantic || revisionContentHash(semantic) !== candidate.canonicalHash) throw new Error("Owner profile already exists but does not match the approved Gate 3A candidate.");
    const report = { generatedAt: new Date().toISOString(), mode: "verification-only", ownerEmail, candidateHash: candidate.canonicalHash, backup: { path: backupPath, sha256: backupHash, generatedAt: backup.generatedAt }, before, activation: { profileId: existing[0].id, revisionId: existing[0].current_revision_id, revisionNumber: 1, status: "published" }, semanticMatch: true, note: "Already activated; no duplicate profile or revision was created." };
    await fs.writeFile(path.join(backupDir, "gate3b-activation-report.json"), JSON.stringify(report, null, 2));
    await fs.writeFile(path.join(backupDir, "gate3b-activation-report.md"), `# Gate 3B Production Activation\n\n- Status: verification-only (already activated)\n- Candidate hash: ${candidate.canonicalHash}\n- Profile ID: ${existing[0].id}\n- Revision 1 ID: ${existing[0].current_revision_id}\n- Semantic match: true\n- V1 integrity: read-only preflight snapshot retained\n- Backup SHA-256: ${backupHash}\n\nNo duplicate profile or revision was created. This report contains no credentials.\n`);
    const packs = compileValidationPacks({ ...persisted.revision, schema_version: persisted.revision.schema_version, structured_json: persisted.revision.structured_json, freeform_notes: persisted.revision.freeform_notes, source_map_json: persisted.revision.source_map_json, created_by: persisted.revision.created_by }, before.cv);
    report.compiler = packs.map((pack) => ({ taskType: pack.json.metadata.taskType, packId: pack.json.metadata.packId, includedSections: pack.manifest.includedSections, lint: pack.lint }));
    await fs.writeFile(path.join(backupDir, "gate3b-activation-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (!execute) {
    console.log(JSON.stringify({ mode: "preflight-only", ownerEmail, ownerId, candidateHash: candidate.canonicalHash, backupPath, backupHash, before, existing, schemaPresent: Boolean(schemaPresent) }, null, 2));
    return;
  }
  if (!schemaPresent) await applySchema(token);
  const schema = await verifySchema(token);
  if (schema.tables.length !== 2 || schema.functions.length < 5 || schema.policies.length < 2) throw new Error("V2 schema verification failed; profile publication was not attempted.");
  await activateProfile(ownerId, candidate.payload, token);
  const persisted = await readProfile(ownerId, token);
  if (!persisted?.revision || persisted.revision.status !== "published" || persisted.revision.revision_number !== 1) throw new Error("Published revision 1 could not be verified.");
  const after = await ownerSnapshot(ownerId, token);
  if (JSON.stringify(before.counts) !== JSON.stringify(after.counts) || JSON.stringify(before.ids) !== JSON.stringify(after.ids) || JSON.stringify(before.applications) !== JSON.stringify(after.applications)) throw new Error("V1 integrity changed during activation; investigate before declaring success.");
  const persistedPayload = profileRevisionPayloadSchema.parse({ schemaVersion: persisted.revision.schema_version, structuredJson: persisted.revision.structured_json, freeformNotes: persisted.revision.freeform_notes, sourceMapJson: persisted.revision.source_map_json, createdBy: persisted.revision.created_by });
  const packs = compileValidationPacks(persisted.revision, before.cv);
  const report = { generatedAt: new Date().toISOString(), ownerEmail, candidateHash: candidate.canonicalHash, backup: { path: backupPath, sha256: backupHash, generatedAt: backup.generatedAt }, before, after, schema, activation: { profileId: persisted.profile.id, revisionId: persisted.revision.id, revisionNumber: persisted.revision.revision_number, status: persisted.revision.status, persistedHash: persisted.revision.content_hash }, semanticMatch: revisionContentHash(persistedPayload) === candidate.canonicalHash, compiler: packs.map((pack) => ({ taskType: pack.json.metadata.taskType, packId: pack.json.metadata.packId, includedSections: pack.manifest.includedSections, lint: pack.lint })) };
  await fs.writeFile(path.join(backupDir, "gate3b-activation-report.json"), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(backupDir, "gate3b-activation-report.md"), `# Gate 3B Production Activation\n\n- Status: completed\n- Candidate hash: ${candidate.canonicalHash}\n- Profile ID: ${persisted.profile.id}\n- Revision 1 ID: ${persisted.revision.id}\n- Semantic match: ${report.semanticMatch}\n- V1 integrity: unchanged\n- Backup SHA-256: ${backupHash}\n\nThis report contains no credentials. The owner profile was activated only after read-only reconciliation, backup, schema/RLS verification and V1 integrity checks.\n`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
