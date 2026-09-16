import fs from "node:fs";
import path from "node:path";
import { buildShadowMigration, compareProfiles, compileShadowPacks, migrationFingerprint, renderMigrationReview } from "../src/v2/shadow-migration.js";
import { mosheShadowMigrationInput } from "../src/v2/migration-fixtures.js";
import { mosheFixture } from "../src/v2/fixtures.js";

const outputDir = path.resolve("output/v2-gate3a-shadow");
fs.mkdirSync(outputDir, { recursive: true });

const metadata = { ...mosheShadowMigrationInput.metadata, fixtureComparison: compareProfiles(mosheFixture, mosheShadowMigrationInput.profile) };
const first = buildShadowMigration({ ...mosheShadowMigrationInput, metadata, legacySnapshot: null });
const second = buildShadowMigration({ ...mosheShadowMigrationInput, metadata, legacySnapshot: null });
const idempotent = JSON.stringify(first.payload) === JSON.stringify(second.payload)
  && JSON.stringify(first.report) === JSON.stringify(second.report)
  && migrationFingerprint(first) === migrationFingerprint(second);
const packs = compileShadowPacks({ payload: first.payload, cvVariants: mosheShadowMigrationInput.cvVariants });
const packChecks = Object.fromEntries(Object.entries(packs).map(([name, pack]) => [name, {
  lint: pack.lint,
  metrics: pack.metrics,
  manifest: pack.manifest,
}]))
const report = {
  ...first.report,
  idempotency: { deterministic: idempotent, candidate_hash_repeat: second.candidateHash, report_hash_repeat: migrationFingerprint(second) },
  compiler_validation: packChecks,
};

fs.writeFileSync(path.join(outputDir, "moshe-v2-profile-candidate.json"), `${JSON.stringify(first.payload, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "moshe-v2-profile-review.md"), `${renderMigrationReview({ profile: first.profile, report, cvReport: first.cvReport })}\n`);
fs.writeFileSync(path.join(outputDir, "moshe-v2-migration-report.json"), `${JSON.stringify(report, null, 2)}\n`);
const reportMarkdown = [
  "# Moshe V2 Shadow Migration Report", "", `- Status: **${report.status}**`, "- Mode: read-only shadow migration", `- Candidate hash: ${report.candidate_hash}`, `- Deterministic repeat: ${report.idempotency.deterministic ? "yes" : "no"}`, "", "## Sources used", ...report.source_material.map((source) => `- ${source.label} — ${source.reference} (${source.authority})`), "", "## Source limitations", ...report.source_limitations.map((item) => `- ${item}`), "", "## Semantic diff", "### Accepted-equivalent", ...report.semantic_diff.accepted_equivalent.map((item) => `- ${item.area}`), "### Normalized", ...report.semantic_diff.normalized.map((item) => `- ${item.area}: ${item.change}`), "### Newly represented", ...report.semantic_diff.newly_represented.map((item) => `- ${item}`), "### Unresolved", ...(report.semantic_diff.unresolved.length ? report.semantic_diff.unresolved.map((item) => `- ${item}`) : ["- None"]), "### Excluded", ...(report.semantic_diff.excluded.length ? report.semantic_diff.excluded.map((item) => `- ${item}`) : ["- None"]), "", "## CV compatibility", ...report.cv_compatibility.map((cv) => `- ${cv.label} (${cv.existing_cv_id || "ID unavailable"}): ${cv.proposed_document_status}`), "", "## Operational history compatibility", "- No V1 jobs, sources, research runs, applications, questions, events, outcomes or snapshots are recreated.", "- No authorized current snapshot was available; live IDs/counts remain unresolved.", "", "## Gate 1 fixture comparison", `- Preserved: ${report.fixture_comparison.facts_preserved.join(", ") || "none"}`, `- Added: ${report.fixture_comparison.facts_added.join(", ") || "none"}`, `- Removed: ${report.fixture_comparison.facts_removed.join(", ") || "none"}`, ...report.fixture_comparison.wording_normalized.map((item) => `- Normalized: ${item}`), ...report.fixture_comparison.unsupported_fixture_facts_removed.map((item) => `- Fixture-only exclusion: ${item}`), "", "## Compiler validation", ...Object.entries(report.compiler_validation).map(([name, result]) => `- ${name}: ${result.lint.ok ? "pass" : "fail"}; ${result.metrics.approximateTokens} approximate tokens`), "", "## Safety boundary", "- No database writes, production migrations, owner mutations, document uploads, credentials, secrets or local paths were used.", "- Gate 3B remains blocked on explicit owner review.",
].join("\n");
fs.writeFileSync(path.join(outputDir, "moshe-v2-migration-report.md"), `${reportMarkdown}\n`);
fs.writeFileSync(path.join(outputDir, "moshe-v2-profile-pack.md"), `${packs.career.markdown}\n`);
fs.writeFileSync(path.join(outputDir, "moshe-v2-research-pack.md"), `${packs.research.markdown}\n`);

console.log(`Generated Gate 3A shadow migration artifacts in ${outputDir}`);
console.log(`Candidate ${first.candidateHash}; deterministic repeat: ${idempotent}`);
