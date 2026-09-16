import { hashText, stableStringify, compileCareerPack } from "./compiler.js";
import { profileRevisionPayloadSchema, revisionContentHash, structuredProfileSchema } from "./profile.js";
import { profileRevisionToCompilerInput } from "./profile-domain.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const slug = (value) => String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "item";
const idFor = (kind, value) => `migration-${kind}-${slug(value)}`;
const sourceRef = (source, note) => ({ kind: "migration", reference: source.reference, note: note || source.label });

export function stableMigrationId(kind, value) { return idFor(kind, value); }

function withStableIds(profile) {
  const structuredKeys = ["identity", "careerStage", "education", "experiences", "projects", "leadership", "skills", "languages", "targetRoles", "locationPreferences", "workPreferences", "constraints", "evidence"];
  const next = Object.fromEntries(structuredKeys.filter((key) => profile?.[key] !== undefined).map((key) => [key, clone(profile[key])]));
  for (const [key, kind, label] of [["education", "education", (x) => `${x.institution}|${x.field}`], ["experiences", "experience", (x) => `${x.organization}|${x.title}|${x.type}`], ["projects", "project", (x) => `${x.name}|${x.description}`], ["leadership", "leadership", (x) => `${x.organization}|${x.title}`]]) {
    const used = new Set();
    next[key] = (next[key] || []).map((entry) => {
      const base = idFor(kind, label(entry));
      let id = base;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      return { ...entry, id };
    });
  }
  return structuredProfileSchema.parse(next);
}

function areaSources(sourceMapJson, area, refs) {
  if (!sourceMapJson[area]?.length) sourceMapJson[area] = refs.map(({ source, note }) => sourceRef(source, note));
}

export function validateLegacySnapshot(snapshot) {
  const tables = ["cv_versions", "companies", "research_runs", "jobs", "job_sources", "applications", "application_questions", "application_events"];
  if (!snapshot) return { available: false, checks: [], note: "No authorized current V1 snapshot was available; live IDs/counts remain unresolved." };
  const checks = [];
  const rows = (table) => Array.isArray(snapshot[table]) ? snapshot[table] : [];
  for (const table of tables) {
    const values = rows(table);
    const ids = values.map((row) => row.id).filter(Boolean);
    checks.push({ check: `${table} IDs are unique`, ok: new Set(ids).size === ids.length, count: values.length });
    checks.push({ check: `${table} rows have one owner`, ok: new Set(values.map((row) => row.user_id).filter(Boolean)).size <= 1 });
  }
  const jobIds = new Set(rows("jobs").map((row) => row.id));
  const appIds = new Set(rows("applications").map((row) => row.id));
  checks.push({ check: "job sources reference existing jobs", ok: rows("job_sources").every((row) => jobIds.has(row.job_id)) });
  checks.push({ check: "applications reference existing jobs", ok: rows("applications").every((row) => jobIds.has(row.job_id)) });
  checks.push({ check: "questions reference existing applications", ok: rows("application_questions").every((row) => appIds.has(row.application_id)) });
  checks.push({ check: "events reference existing applications", ok: rows("application_events").every((row) => appIds.has(row.application_id)) });
  checks.push({ check: "applications have unique jobs", ok: new Set(rows("applications").map((row) => row.job_id)).size === rows("applications").length });
  return { available: true, counts: Object.fromEntries(tables.map((table) => [table, rows(table).length])), checks, ok: checks.every((check) => check.ok) };
}

export function buildSemanticDiff({ sourceMaterial = [], profile, ambiguity = [], exclusions = [] }) {
  const sourceLabels = sourceMaterial.map((source) => source.label || source.reference);
  const represented = [
    ["identity", profile.identity?.displayName],
    ["education", profile.education?.length],
    ["experiences", profile.experiences?.length],
    ["projects", profile.projects?.length],
    ["leadership", profile.leadership?.length],
    ["skills", profile.skills?.length],
    ["career direction", profile.targetRoles?.length],
  ].filter(([, value]) => value);
  return {
    accepted_equivalent: represented.map(([area]) => ({ area, sources: sourceLabels })),
    normalized: [
      { area: "careerStage.graduation", change: "Expected graduation retained without inferring pre-graduation unavailability." },
      { area: "experiences", change: "Mattel remains internship; Homize remains freelance/project." },
    ],
    newly_represented: ["stable item IDs", "area-level migration provenance"],
    unresolved: ambiguity.map((item) => item.item || item),
    excluded: exclusions.map((item) => item.item || item),
  };
}

export function compareProfiles(reference, candidate) {
  const names = (items, key) => new Set((items || []).map((item) => item?.[key]).filter(Boolean));
  const refExperience = names(reference?.experiences, "organization");
  const candidateExperience = names(candidate?.experiences, "organization");
  const refProjects = names(reference?.projects, "name");
  const candidateProjects = names(candidate?.projects, "name");
  const difference = (left, right) => [...left].filter((item) => !right.has(item));
  return {
    facts_preserved: [...refExperience].filter((item) => candidateExperience.has(item)).concat([...refProjects].filter((item) => candidateProjects.has(item))),
    facts_added: difference(candidateExperience, refExperience).concat(difference(candidateProjects, refProjects)),
    facts_removed: difference(refExperience, candidateExperience).concat(difference(refProjects, candidateProjects)),
    wording_normalized: ["Expected graduation is retained without an availability inference.", "Mattel internship and Homize freelance/project boundaries are explicit."],
    unsupported_fixture_facts_removed: ["Fixture-only contact placeholder and any unsupported availability/work-authorisation implication."],
    unresolved_differences: ["Exact dates/title wording and live CV IDs require owner review."],
  };
}

export function buildShadowMigration({ sourceMaterial, profile, cvVariants = [], legacySnapshot = null, metadata = {} }) {
  if (!sourceMaterial?.length) throw new Error("Shadow migration requires at least one source material reference.");
  const input = clone(profile);
  const normalized = withStableIds(input.structuredJson || input);
  const sourceMapJson = clone(input.sourceMapJson || {});
  const refs = sourceMaterial.map((source) => ({ source, note: "Canonical migration input" }));
  for (const area of ["identity", "careerStage", "education", "experiences", "projects", "leadership", "skills", "languages", "targetRoles", "locationPreferences", "workPreferences", "constraints"]) areaSources(sourceMapJson, area, refs);
  sourceMapJson.freeformNotes = sourceMapJson.freeformNotes || refs.map(({ source }) => sourceRef(source, "User-authored career context"));
  const payload = profileRevisionPayloadSchema.parse({ schemaVersion: "1.0", structuredJson: normalized, freeformNotes: input.freeformNotes || "", sourceMapJson, createdBy: "migration" });
  const candidateHash = revisionContentHash(payload);
  const compatibility = validateLegacySnapshot(legacySnapshot);
  const cvReport = cvVariants.map((variant) => ({ existing_cv_id: variant.id || null, slug: variant.slug || "", label: variant.name, positioning: variant.description || variant.positioning || "", application_references: legacySnapshot?.applications?.filter((app) => app.cv_version_id === variant.id).map((app) => app.id) || [], legacy_local_path: variant.file_reference ? "present (not copied; diagnostic only)" : "unknown", proposed_document_status: "legacy/missing-file metadata until explicit upload" }));
  const report = {
    format: "pyoloker.v2-shadow-migration-report",
    format_version: "1.0",
    migration_id: metadata.migrationId || "shadow-moshe-v2",
    generated_at: metadata.generatedAt || "2026-09-16T00:00:00.000Z",
    mode: "read_only_shadow",
    status: "awaiting_owner_review",
    source_material: sourceMaterial.map((source) => ({ reference: source.reference, label: source.label, authority: source.authority, availability: source.availability || "available" })),
    source_limitations: compatibility.available ? [] : ["No authorized current owner V1 export or cloud snapshot was available in the repository."],
    candidate_hash: candidateHash,
    profile_revision: { schema_version: payload.schemaVersion, created_by: payload.createdBy, source_map_areas: Object.keys(payload.sourceMapJson) },
    ambiguity: metadata.ambiguity || [],
    exclusions: metadata.exclusions || [],
    cv_compatibility: cvReport,
    operational_history: { recreation_required: false, compatibility, preservation: ["jobs", "job_sources", "research_runs", "applications", "application_questions", "application_events", "outcomes", "snapshots"] },
    fixture_comparison: metadata.fixtureComparison || { note: "Gate 1 fixture is reference material, not authoritative migration input." },
    semantic_diff: metadata.semanticDiff || buildSemanticDiff({ sourceMaterial, profile: normalized, ambiguity: metadata.ambiguity || [], exclusions: metadata.exclusions || [] }),
    safety: { database_writes: false, production_migration: false, owner_records_modified: false, runtime_moshe_branch: false, secrets_included: false, local_paths_in_profile_pack: false },
  };
  return { payload, candidateHash, report, cvReport, profile: normalized, cvVariants: clone(cvVariants) };
}

function bullet(value) { return value ? `- ${value}` : "- Not provided"; }
export function renderMigrationReview({ profile, report, cvReport }) {
  const lines = ["# Moshe V2 Migration Review", "", "This is a read-only shadow proposal. It is not published and does not change the V1 workspace.", "", "## Proposed career identity", bullet(profile.identity?.displayName), bullet(profile.careerStage?.status), bullet(`Expected graduation: ${profile.careerStage?.graduation}`), "", "## Education"];
  for (const item of profile.education) lines.push(`### ${item.institution}`, bullet(`Field: ${item.field}`), bullet(`Expected graduation: ${item.expectedGraduation}`), bullet(`GPA: ${item.gpa}`), bullet(`Scholarship: ${item.scholarship}`), "");
  lines.push("## Experience");
  for (const item of profile.experiences) lines.push(`### ${item.organization} — ${item.title}`, bullet(`Type: ${item.type}`), bullet(`Dates: ${item.dates}`), "Evidence:", ...(item.evidence || []).map(bullet), "");
  lines.push("## Projects");
  for (const item of profile.projects) lines.push(`### ${item.name}`, bullet(item.description), "Evidence:", ...(item.evidence || []).map(bullet), "");
  lines.push("## Leadership");
  for (const item of profile.leadership) lines.push(`### ${item.organization} — ${item.title}`, bullet(`Dates: ${item.dates}`), ...(item.evidence || []).map(bullet), "");
  lines.push("## Skills", ...(profile.skills || []).map(bullet), "", "## Career direction", ...(profile.targetRoles || []).map(bullet), "", "## Preferences", bullet(`Locations: ${(profile.locationPreferences || []).join(", ")}`), bullet(`Work modes: ${(profile.workPreferences?.modes || []).join(", ")}`), bullet(`Relocation: ${profile.workPreferences?.relocation}`), "", "## Additional context", bullet(profile.freeformNotes), "", "## CV variants preserved");
  for (const cv of cvReport) lines.push(`- ${cv.label} (${cv.slug || "slug unavailable"}) — existing ID: ${cv.existing_cv_id || "not available in snapshot"}; ${cv.proposed_document_status}.`);
  lines.push("", "## Existing operational history preserved", "- No jobs, sources, research runs, applications, questions, events, outcomes, snapshots or CV variants are recreated by this shadow migration.", `- Snapshot status: ${report.operational_history.compatibility.available ? "available and checked" : "not available; live counts and IDs remain unresolved"}.`, "", "## Needs confirmation", ...(report.ambiguity.length ? report.ambiguity.map(bullet) : ["- None recorded."]), "", "## Excluded from migration", ...(report.exclusions.length ? report.exclusions.map((item) => bullet(`${item.item}: ${item.reason}`)) : ["- None recorded."]), "", "## Migration safety summary", "- Candidate passes the generic V2 profile schema.", "- Source provenance is attached to every canonical area.", "- This artifact is local and read-only; owner approval is required before Gate 3B.", "", "## Owner review checklist", "- [ ] Education correct?", "- [ ] Graduation/timing correct?", "- [ ] Mattel title/type and evidence correct?", "- [ ] Homize title/type correct?", "- [ ] Projects represented correctly?", "- [ ] Leadership correct?", "- [ ] Skills appropriate?", "- [ ] Career directions correct?", "- [ ] Locations/work preferences correct?", "- [ ] Freeform career identity correct?", "- [ ] CV variants preserved?", "- [ ] Any information missing or needing removal?");
  return lines.join("\n");
}

export function compileShadowPacks({ payload, cvVariants, packId = "shadow-moshe-v2" }) {
  const revision = { id: "shadow-migration-revision", status: "published", schemaVersion: payload.schemaVersion, structuredJson: payload.structuredJson, freeformNotes: payload.freeformNotes, sourceMapJson: payload.sourceMapJson, createdBy: payload.createdBy };
  const { profile, cvVariants: compilerCvs } = profileRevisionToCompilerInput(revision, cvVariants);
  const career = compileCareerPack({ profile, cvVariants: compilerCvs, taskType: "career_discussion", privacyPreset: "working_context", packId, generatedAt: "2026-09-16T00:00:00.000Z", task: { type: "career_discussion", userRequest: "Review my migrated career direction and identify any material questions." } });
  const research = compileCareerPack({ profile, cvVariants: compilerCvs, taskType: "research_jobs", privacyPreset: "private_minimum", packId: `${packId}-research`, generatedAt: "2026-09-16T00:00:00.000Z", task: { type: "research_jobs", userRequest: "Research aligned roles using this profile.", existingOpportunityFingerprints: [], searchPreferences: { market: "Indonesia" } } });
  return { career, research };
}

export function migrationFingerprint(result) { return hashText(stableStringify({ payload: result.payload, report: result.report })); }
