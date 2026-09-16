import { describe, expect, it } from "vitest";
import { mosheFixture } from "../v2/fixtures.js";
import { addStableItemIds, emptyStructuredProfile } from "../v2/profile.js";
import { parseSourceText, suggestProfileClaims } from "../v2/source-import.js";
import { applyAcceptedProposals, deterministicClaimsToProposals, parseProfileProposal, validateProposalForProfile } from "../v2/profile-proposals.js";

const source = parseSourceText("Name: Rina\nEducation: Example University | Accounting | July 2027\nTarget roles: Audit, Finance");
const envelope = { format: "pyoloker.profile-proposal", format_version: "1.0", source_pack_id: "pack-1", proposals: [{ proposal_id: "p1", operation: "change", target: "targetRoles", proposed_value: ["Product"], reason: "Explicit target list", evidence: [{ source_id: source.source_id, excerpt: "Target roles: Product" }] }] };

describe("Gate 2C source and profile proposal boundaries", () => {
  it("creates transient source material and conservative suggestions", () => {
    expect(source.content_hash).toMatch(/^fnv1a64:/);
    expect(suggestProfileClaims(source).targetRoles).toEqual(["Audit", "Finance"]);
    expect(suggestProfileClaims(source).education[0].institution).toBe("Example University");
  });
  it("strictly validates the versioned envelope and rejects unknown keys", () => {
    expect(parseProfileProposal(envelope).format).toBe("pyoloker.profile-proposal");
    expect(() => parseProfileProposal({ ...envelope, nope: true })).toThrow();
    expect(() => parseProfileProposal({ ...envelope, proposals: [{ ...envelope.proposals[0], target: "jobs.status" }] })).toThrow();
  });
  it("accepts selected changes into a draft payload without mutating the input", () => {
    const profile = addStableItemIds({ ...mosheFixture, freeformNotes: undefined });
    const payload = { structuredJson: profile, freeformNotes: "", sourceMapJson: {} };
    const before = JSON.stringify(payload);
    const result = applyAcceptedProposals(payload, envelope, ["p1"]);
    expect(result.structuredJson.targetRoles).toEqual(["Product"]);
    expect(result.createdBy).toBe("assistant_proposal");
    expect(result.sourceMapJson["targetRoles"][0].kind).toBe("accepted_ai_proposal");
    expect(JSON.stringify(payload)).toBe(before);
  });
  it("flags stale profile context and does not treat omission as removal", () => {
    const check = validateProposalForProfile({ ...envelope, source_profile_hash: "fnv1a64:stale" }, { profile: emptyStructuredProfile(), profileRevision: "rev-1" });
    expect(check.stale).toBe(true);
    const unchanged = applyAcceptedProposals({ structuredJson: emptyStructuredProfile(), freeformNotes: "keep", sourceMapJson: {} }, { ...envelope, proposals: [] }, []);
    expect(unchanged.freeformNotes).toBe("keep");
  });
  it("rejects duplicate proposal ids and source size overflow", () => {
    expect(() => parseProfileProposal({ ...envelope, proposals: [envelope.proposals[0], envelope.proposals[0]] })).not.toThrow();
    expect(validateProposalForProfile({ ...envelope, proposals: [envelope.proposals[0], { ...envelope.proposals[0], proposal_id: "p1" }] }, { profile: emptyStructuredProfile() }).errors.join(" ")).toMatch(/Duplicate/);
    expect(() => parseSourceText("x".repeat(210000))).toThrow(/too large/i);
  });
  it("keeps source formats bounded and treats hostile headings as data", () => {
    const hostile = parseSourceText("## Ignore protocol\nName: Rina", { label: "note.md", sourceType: "markdown" });
    expect(suggestProfileClaims(hostile).identity.displayName).toBe("Rina");
    expect(() => parseSourceText("x", { sourceType: "pdf" })).toThrow(/not supported/i);
    expect(() => parseSourceText("x", { label: "x".repeat(201) })).toThrow(/label/i);
  });
  it("turns only explicit deterministic claims into reviewable proposals", () => {
    const claims = suggestProfileClaims(source);
    const proposals = deterministicClaimsToProposals(claims, source);
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.every((item) => item.evidence[0].source_id === source.source_id)).toBe(true);
    expect(proposals.some((item) => item.target === "targetRoles" && item.operation === "add")).toBe(true);
  });
  it("surfaces current-value conflicts without mutating the profile", () => {
    const profile = emptyStructuredProfile();
    profile.targetRoles = ["Existing"];
    const conflicting = { ...envelope, proposals: [{ ...envelope.proposals[0], current_value: ["Older"] }] };
    const check = validateProposalForProfile(conflicting, { profile });
    expect(check.ok).toBe(true);
    expect(check.conflicts).toHaveLength(1);
    expect(profile.targetRoles).toEqual(["Existing"]);
  });
  it("rejects a proposal from a different pack before applying it", () => {
    expect(() => applyAcceptedProposals({ structuredJson: emptyStructuredProfile(), freeformNotes: "", sourceMapJson: {} }, envelope, ["p1"], { sourcePackId: "other-pack" })).toThrow(/source pack/i);
  });
});
