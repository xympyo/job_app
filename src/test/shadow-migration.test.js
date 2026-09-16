import { describe, expect, it } from "vitest";
import { buildShadowMigration, compileShadowPacks, migrationFingerprint, renderMigrationReview, stableMigrationId, validateLegacySnapshot } from "../v2/shadow-migration.js";
import { mosheShadowMigrationInput } from "../v2/migration-fixtures.js";
import { profileRevisionPayloadSchema } from "../v2/profile.js";
import { compileCareerPack } from "../v2/compiler.js";
import { syntheticFinanceFixture } from "../v2/fixtures.js";
import { preferenceQuestionForTask } from "../v2/tasks.js";

const build = () => buildShadowMigration({ ...mosheShadowMigrationInput, legacySnapshot: null });

describe("Gate 3A shadow Moshe migration", () => {
  it("builds a generic schema-valid candidate with correct experience boundaries", () => {
    const result = build();
    expect(() => profileRevisionPayloadSchema.parse(result.payload)).not.toThrow();
    expect(result.profile.experiences.find((item) => item.organization === "PT Mattel Indonesia").type).toBe("internship");
    expect(result.profile.experiences.find((item) => item.organization === "Homize").type).toBe("freelance/project");
    expect(result.profile.leadership[0].organization).toMatch(/PUMA/);
    expect(result.profile.careerStage.graduation).toBe("December 2026");
    expect(result.profile.constraints.availabilityBeforeGraduation).toMatch(/do not infer general unavailability/i);
    expect(result.profile.constraints.workAuthorization).toBeUndefined();
  });

  it("assigns deterministic stable IDs and is idempotent", () => {
    const first = build();
    const second = build();
    expect(first.candidateHash).toBe(second.candidateHash);
    expect(migrationFingerprint(first)).toBe(migrationFingerprint(second));
    for (const key of ["education", "experiences", "projects", "leadership"]) {
      const ids = first.profile[key].map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(second.profile[key].map((item) => item.id));
    }
    expect(stableMigrationId("experience", "PT Mattel Indonesia|Process Engineering Intern|internship")).toMatch(/^migration-experience-/);
  });

  it("provides provenance, ambiguity, exclusions and preserves CV variants without paths", () => {
    const result = build();
    expect(result.payload.createdBy).toBe("migration");
    expect(Object.keys(result.payload.sourceMapJson)).toContain("experiences");
    expect(["user_confirmation", "migration", "source_material"]).toContain(result.payload.sourceMapJson.experiences[0].kind);
    expect(result.report.ambiguity.length).toBeGreaterThan(0);
    expect(result.report.exclusions.some((item) => item.item === "Work authorisation")).toBe(true);
    expect(result.cvReport.map((item) => item.label)).toEqual(["Master", "Analyst", "Management/Product"]);
    expect(JSON.stringify(result.payload)).not.toMatch(/[A-Z]:\\/);
    expect(JSON.stringify(result.payload)).not.toMatch(/password|token|secret/i);
  });

  it("renders an owner-review document without implementation artifacts", () => {
    const result = build();
    const review = renderMigrationReview({ profile: result.profile, report: result.report, cvReport: result.cvReport });
    expect(review).toContain("Primary employment goal: Full-time");
    expect(review).toContain("Relocation: Case-by-case");
    expect(review).toContain("I want work at the intersection of technology, operations, products, and leadership.");
    expect(review).toContain("### Homize — Freelance Software Developer / Technical Project Lead");
    expect(review).toContain("Dates: Not provided");
    expect(review).toContain("## Owner-confirmed preferences");
    expect(review).toContain("## Needs confirmation");
    expect(review).not.toContain("[object Object]");
    expect(review).not.toMatch(/undefined|null/);
    expect(result.report.ambiguity.some((item) => /location|relocation|work-mode/i.test(item.item))).toBe(false);
    expect(result.report.semantic_diff.owner_confirmed.map((item) => item.item)).toContain("Primary employment goal");
  });

  it("keeps preference provenance and applies the generic materiality rule", () => {
    const result = build();
    expect(result.payload.sourceMapJson.workPreferences[0].kind).toBe("user_confirmation");
    expect(result.profile.workPreferences.employmentType.primary).toBe("Full-time");
    expect(preferenceQuestionForTask({ preference: "employmentType", materiallyRelevant: true })).toMatch(/employment type/);
    expect(preferenceQuestionForTask({ preference: "relocation", materiallyRelevant: false })).toBeNull();
    expect(preferenceQuestionForTask({ preference: "relocation", value: "Bali for this role", materiallyRelevant: true })).toBeNull();
  });

  it("reports that operational history is preserved without an authorized snapshot", () => {
    const result = build();
    expect(result.report.operational_history.recreation_required).toBe(false);
    expect(result.report.operational_history.compatibility.available).toBe(false);
    expect(validateLegacySnapshot(null).note).toMatch(/live IDs\/counts remain unresolved/);
  });

  it("validates an optional read-only legacy snapshot without writing it", () => {
    const snapshot = { jobs: [{ id: "job-1", user_id: "u" }], job_sources: [{ id: "source-1", user_id: "u", job_id: "job-1" }], applications: [{ id: "app-1", user_id: "u", job_id: "job-1" }], application_questions: [{ id: "q-1", user_id: "u", application_id: "app-1" }], application_events: [{ id: "e-1", user_id: "u", application_id: "app-1" }], cv_versions: [], companies: [], research_runs: [] };
    const before = JSON.stringify(snapshot);
    const result = buildShadowMigration({ ...mosheShadowMigrationInput, legacySnapshot: snapshot });
    expect(result.report.operational_history.compatibility.available).toBe(true);
    expect(result.report.operational_history.compatibility.ok).toBe(true);
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it("feeds the real compiler adapter and produces safe reviewable packs", () => {
    const result = build();
    const packs = compileShadowPacks({ payload: result.payload, cvVariants: mosheShadowMigrationInput.cvVariants });
    expect(packs.career.lint.ok).toBe(true);
    expect(packs.research.lint.ok).toBe(true);
    expect(packs.career.markdown).toContain("## Education");
    expect(packs.career.markdown).toContain("## Experience");
    expect(packs.research.markdown).toContain("full-time graduate");
    expect(packs.research.markdown).toContain("Unknown stays unknown");
    expect(packs.career.markdown).toContain("Context: PT Mattel Indonesia — Process Engineering Intern");
    expect(packs.career.markdown).not.toMatch(/[A-Z]:\\/);
    expect(packs.career.markdown).not.toContain("docs/02_USER_PROFILE.md");
    expect(renderMigrationReview({ profile: result.profile, report: result.report, cvReport: result.cvReport })).toContain("## Needs confirmation");
  });

  it("does not alter synthetic/new-user compiler behavior", () => {
    const pack = compileCareerPack({ profile: syntheticFinanceFixture, cvVariants: syntheticFinanceFixture.cvVariants, taskType: "career_discussion", task: { userRequest: "What direction fits?" }, privacyPreset: "working_context", generatedAt: "2026-09-16T00:00:00.000Z", packId: "synthetic-shadow-regression" });
    expect(pack.lint.ok).toBe(true);
    expect(pack.markdown).not.toMatch(/Moshe|Mattel|Homize|President University/i);
  });
});
