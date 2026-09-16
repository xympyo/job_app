import { describe, expect, it } from "vitest";
import {
  addStableItemIds,
  emptyStructuredProfile,
  PROFILE_SCHEMA_VERSION,
  profileRevisionToCompilerInput,
  createLocalProfileRepository,
} from "../v2/index.js";
import { compileCareerPack, mosheFixture } from "../v2/index.js";

const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const payload = (profile = emptyStructuredProfile(), notes = "") => ({ schemaVersion: PROFILE_SCHEMA_VERSION, structuredJson: profile, freeformNotes: notes, sourceMapJson: { "identity.displayName": [{ kind: "user_entry", reference: "onboarding" }] }, createdBy: "user" });

describe("Gate 2A profile foundation", () => {
  it("creates one empty profile per user and keeps users isolated", () => {
    const repo = createLocalProfileRepository();
    const first = repo.createProfile(user);
    expect(repo.createProfile(user).id).toBe(first.id);
    expect(repo.createProfile(other).id).not.toBe(first.id);
    expect(first.onboardingStatus).toBe("not_started");
    expect(repo.state.revisions).toHaveLength(0);
  });

  it("creates one editable draft, publishes explicitly, and preserves immutable history", () => {
    const repo = createLocalProfileRepository();
    const profile = repo.createProfile(user);
    const draft = repo.createDraft(profile.id, user, { now: () => "2026-09-16T00:00:00.000Z" });
    expect(repo.createDraft(profile.id, user).id).toBe(draft.id);
    const updated = repo.saveDraft(profile.id, draft.id, user, payload({ identity: { displayName: "Rina" } }, "A note"), { expectedUpdatedAt: draft.updatedAt, now: () => "2026-09-16T01:00:00.000Z" });
    const published = repo.publishDraft(profile.id, draft.id, user, { expectedUpdatedAt: updated.updatedAt, now: () => "2026-09-16T02:00:00.000Z" });
    expect(published.status).toBe("published");
    expect(repo.current(profile.id, user).structuredJson.identity.displayName).toBe("Rina");
    expect(repo.history(profile.id, user)).toHaveLength(1);
    expect(() => repo.saveDraft(profile.id, draft.id, user, payload())).toThrow(/Only the current draft/);
    const second = repo.createDraft(profile.id, user, { now: () => "2026-09-17T00:00:00.000Z" });
    expect(second.revisionNumber).toBe(2);
    repo.discardDraft(profile.id, second.id, user);
    expect(repo.current(profile.id, user).id).toBe(published.id);
  });

  it("rejects cross-owner and concurrent edits without changing data", () => {
    const repo = createLocalProfileRepository();
    const profile = repo.createProfile(user);
    const draft = repo.createDraft(profile.id, user);
    expect(() => repo.saveDraft(profile.id, draft.id, other, payload())).toThrow(/does not belong/);
    expect(() => repo.saveDraft(profile.id, draft.id, user, payload(), { expectedUpdatedAt: "old" })).toThrow(/changed elsewhere/);
    expect(repo.draft(profile.id, user).contentHash).toBe(draft.contentHash);
  });

  it("requires stable item IDs and preserves experience type and unknown semantics", () => {
    const profile = addStableItemIds({ experiences: [{ organization: "Example", type: "internship", evidence: [] }], constraints: { expectedGraduation: "December 2026" } }, "qa");
    expect(profile.experiences[0].id).toBe("qa-experiences-1");
    expect(profile.experiences[0].type).toBe("internship");
    expect(profile.constraints).toEqual({ expectedGraduation: "December 2026" });
    expect(() => addStableItemIds({ experiences: [{ id: "dup", type: "project" }, { id: "dup", type: "project" }] })).toThrow(/Duplicate stable item id/);
  });

  it("adapts a published revision into an equivalent Gate 1 compiler input", () => {
    const repo = createLocalProfileRepository();
    const profile = repo.createProfile(user);
    const draft = repo.createDraft(profile.id, user);
    const canonical = addStableItemIds(mosheFixture, "moshe");
    const saved = repo.saveDraft(profile.id, draft.id, user, payload(canonical, mosheFixture.freeformNotes));
    const published = repo.publishDraft(profile.id, saved.id, user);
    const input = profileRevisionToCompilerInput(published, mosheFixture.cvVariants);
    const fromPersisted = compileCareerPack({ ...input, taskType: "career_discussion", task: { userRequest: "Discuss direction" }, privacyPreset: "working_context", generatedAt: "2026-09-16T00:00:00.000Z", packId: "persisted" });
    const fromFixture = compileCareerPack({ profile: mosheFixture, cvVariants: mosheFixture.cvVariants, taskType: "career_discussion", task: { userRequest: "Discuss direction" }, privacyPreset: "working_context", generatedAt: "2026-09-16T00:00:00.000Z", packId: "fixture" });
    expect(fromPersisted.json.profile.identity).toEqual(fromFixture.json.profile.identity);
    expect(fromPersisted.json.profile.experiences.map((entry) => entry.organization)).toEqual(fromFixture.json.profile.experiences.map((entry) => entry.organization));
    expect(fromPersisted.json.profile.freeformNotes).toBe(fromFixture.json.profile.freeformNotes);
  });
});
