import { z } from "zod";
import { profileRevisionPayloadSchema, revisionContentHash } from "./profile.js";

export const PROFILE_PROPOSAL_FORMAT = "pyoloker.profile-proposal";
export const PROFILE_PROPOSAL_VERSION = "1.0";
export const PROPOSAL_OPERATIONS = ["add", "change", "remove"];
export const PROPOSAL_TARGETS = [
  "identity.displayName", "careerStage.status", "careerStage.graduation", "targetRoles", "locationPreferences",
  "workPreferences", "constraints", "freeformNotes", "education", "experiences", "projects", "leadership", "skills", "languages",
];
export const PROPOSAL_CONCEPTS = {
  "identity.displayName": "Identity",
  "careerStage.status": "Career stage",
  "careerStage.graduation": "Timing",
  targetRoles: "Career direction",
  locationPreferences: "Location preferences",
  workPreferences: "Work preferences",
  constraints: "Constraints",
  freeformNotes: "Your notes",
  education: "Education",
  experiences: "Experience",
  projects: "Projects",
  leadership: "Leadership",
  skills: "Skills",
  languages: "Languages",
};

const evidenceSchema = z.object({ source_id: z.string().min(1).max(200), excerpt: z.string().min(1).max(5000), location: z.string().max(300).optional() }).strict();
const proposalSchema = z.object({
  proposal_id: z.string().min(1).max(120), operation: z.enum(PROPOSAL_OPERATIONS), target: z.enum(PROPOSAL_TARGETS),
  item_id: z.string().min(1).max(120).optional(), current_value: z.unknown().optional(), proposed_value: z.unknown().optional(),
  reason: z.string().min(1).max(5000), evidence: z.array(evidenceSchema).min(1).max(20),
}).strict();
export const profileProposalEnvelopeSchema = z.object({
  format: z.literal(PROFILE_PROPOSAL_FORMAT), format_version: z.literal(PROFILE_PROPOSAL_VERSION), source_pack_id: z.string().min(1).max(200),
  source_profile_revision: z.string().max(200).optional(), source_profile_hash: z.string().max(200).optional(), source_draft_revision: z.string().max(200).optional(), source_draft_hash: z.string().max(200).optional(),
  proposals: z.array(proposalSchema).max(500), unresolved: z.array(z.string().max(5000)).max(100).default([]), warnings: z.array(z.string().max(5000)).max(100).default([]),
}).strict();

export function parseProfileProposal(input) {
  const raw = typeof input === "string" ? JSON.parse(input) : input;
  return profileProposalEnvelopeSchema.parse(raw);
}

export function proposalConcept(target) { return PROPOSAL_CONCEPTS[target] || target; }

const listTargets = new Set(["targetRoles", "locationPreferences", "skills", "languages"]);
const itemTargets = new Set(["education", "experiences", "projects", "leadership"]);

function targetValue(profile, target, itemId) {
  if (target.includes(".")) { const [key, field] = target.split("."); return profile?.[key]?.[field]; }
  if (itemTargets.has(target)) return itemId ? profile?.[target]?.find((item) => item.id === itemId) : profile?.[target];
  return profile?.[target];
}
function setTarget(profile, target, value, itemId, operation) {
  const next = structuredClone(profile);
  if (target.includes(".")) { const [key, field] = target.split("."); next[key] = { ...(next[key] || {}), [field]: value }; return next; }
  if (itemTargets.has(target)) {
    const entries = next[target] || [];
    if (operation === "add") {
      if (listTargets.has(target)) return { ...next, [target]: [...entries, ...(Array.isArray(value) ? value : [value])] };
      const added = { id: value?.id || `proposal-${target}-${Date.now()}`, ...value };
      return { ...next, [target]: [...entries, added] };
    }
    const index = entries.findIndex((item) => item.id === itemId);
    if (index < 0) throw new Error(`Proposal item ${itemId || "(missing id)"} was not found in ${target}.`);
    const updated = operation === "remove" ? entries.filter((_, i) => i !== index) : entries.map((item, i) => i === index ? value : item);
    return { ...next, [target]: updated };
  }
  next[target] = operation === "remove" ? (Array.isArray(next[target]) ? [] : target === "freeformNotes" ? "" : undefined) : value;
  return next;
}

export function validateProposalForProfile(envelope, { profile, profileRevision, draftRevision, draftHash, freeformNotes = "", sourceMapJson = {} } = {}) {
  const parsed = parseProfileProposal(envelope);
  const errors = [];
  const duplicateIds = new Set();
  const conflicts = [];
  for (const proposal of parsed.proposals) {
    if (duplicateIds.has(proposal.proposal_id)) errors.push(`Duplicate proposal_id ${proposal.proposal_id}.`);
    duplicateIds.add(proposal.proposal_id);
    if (proposal.operation === "add" && ![...itemTargets, ...listTargets].includes(proposal.target)) errors.push(`${proposal.target} cannot use add.`);
    if (proposal.operation !== "add" && itemTargets.has(proposal.target) && !proposal.item_id) errors.push(`${proposal.target} changes require item_id.`);
    if (proposal.operation === "remove" && proposal.proposed_value !== undefined) errors.push(`${proposal.proposal_id} removal must omit proposed_value.`);
    if (proposal.operation !== "remove" && proposal.proposed_value === undefined) errors.push(`${proposal.proposal_id} requires proposed_value.`);
    if (profile && proposal.operation !== "add" && JSON.stringify(targetValue(profile, proposal.target, proposal.item_id)) === "undefined") errors.push(`${proposal.proposal_id} targets a value that is not present.`);
    if (profile && proposal.current_value !== undefined && proposal.operation !== "add" && JSON.stringify(proposal.current_value) !== JSON.stringify(targetValue(profile, proposal.target, proposal.item_id))) {
      conflicts.push({ proposal_id: proposal.proposal_id, target: proposal.target, current: targetValue(profile, proposal.target, proposal.item_id), expected: proposal.current_value });
    }
  }
  let currentHash = null;
  if (profile) { try { currentHash = revisionContentHash({ structuredJson: profile, freeformNotes, sourceMapJson }); } catch { currentHash = null; } }
  const stale = Boolean((parsed.source_profile_revision && profileRevision && parsed.source_profile_revision !== profileRevision) || (parsed.source_draft_revision && draftRevision && parsed.source_draft_revision !== draftRevision) || (parsed.source_draft_hash && draftHash && parsed.source_draft_hash !== draftHash) || (parsed.source_profile_hash && currentHash && parsed.source_profile_hash !== currentHash));
  return { ok: !errors.length, errors, stale, conflicts, parsed };
}

export function applyAcceptedProposals(payload, envelope, acceptedIds, { allowStale = false, sourcePackId, sourceProfileRevision, sourceDraftRevision, sourceDraftHash } = {}) {
  const parsedPayload = profileRevisionPayloadSchema.parse(payload);
  const parsedEnvelope = parseProfileProposal(envelope);
  if (sourcePackId && parsedEnvelope.source_pack_id !== sourcePackId) throw new Error("This proposal does not belong to the selected source pack.");
  const check = validateProposalForProfile(parsedEnvelope, { profile: parsedPayload.structuredJson, freeformNotes: parsedPayload.freeformNotes, sourceMapJson: parsedPayload.sourceMapJson });
  if (!check.ok) throw new Error(check.errors.join(" "));
  const stale = Boolean((parsedEnvelope.source_profile_revision && sourceProfileRevision && parsedEnvelope.source_profile_revision !== sourceProfileRevision) || (parsedEnvelope.source_draft_revision && sourceDraftRevision && parsedEnvelope.source_draft_revision !== sourceDraftRevision) || (parsedEnvelope.source_draft_hash && sourceDraftHash && parsedEnvelope.source_draft_hash !== sourceDraftHash));
  if ((check.stale || stale) && !allowStale) throw new Error("This proposal was built from an older profile draft. Review the current draft before accepting it.");
  let structuredJson = structuredClone(parsedPayload.structuredJson);
  let freeformNotes = parsedPayload.freeformNotes;
  const sourceMapJson = structuredClone(parsedPayload.sourceMapJson || {});
  for (const proposal of check.parsed.proposals.filter((item) => acceptedIds.includes(item.proposal_id))) {
    if (proposal.target === "freeformNotes") freeformNotes = proposal.operation === "remove" ? "" : String(proposal.proposed_value ?? "");
    else structuredJson = setTarget(structuredJson, proposal.target, proposal.proposed_value, proposal.item_id, proposal.operation);
    const key = proposal.item_id ? `${proposal.target}.${proposal.item_id}` : proposal.target;
    sourceMapJson[key] = [...(sourceMapJson[key] || []), { kind: "accepted_ai_proposal", reference: `${check.parsed.source_pack_id}:${proposal.proposal_id}`, note: proposal.evidence.map((e) => `${e.source_id}: ${e.excerpt}`).join(" | ") }];
  }
  const result = profileRevisionPayloadSchema.parse({ schemaVersion: parsedPayload.schemaVersion, structuredJson, freeformNotes, sourceMapJson, createdBy: "assistant_proposal" });
  return { ...result, acceptedIds: [...acceptedIds] };
}

export function deterministicClaimsToProposals(claims, source) {
  const evidence = (excerpt) => ({ source_id: source.source_id, excerpt: String(excerpt).slice(0, 5000) });
  const proposals = [];
  const addList = (target, values, line) => values?.length && proposals.push({ proposal_id: `source-${target}-${proposals.length + 1}`, operation: "add", target, proposed_value: values, reason: "Explicitly stated in the imported source.", evidence: [evidence(line)] });
  addList("targetRoles", claims.targetRoles, claims.targetRoles.join(", "));
  addList("locationPreferences", claims.locationPreferences, claims.locationPreferences.join(", "));
  addList("skills", claims.skills, claims.skills.join(", "));
  addList("languages", claims.languages, claims.languages.join(", "));
  if (claims.careerStage?.graduation) proposals.push({ proposal_id: `source-graduation-${proposals.length + 1}`, operation: "change", target: "careerStage.graduation", proposed_value: claims.careerStage.graduation, reason: "Explicit graduation timing in the imported source.", evidence: [evidence(claims.careerStage.graduation)] });
  for (const key of ["education", "experiences", "projects", "leadership"]) for (const item of claims[key] || []) proposals.push({ proposal_id: `source-${key}-${proposals.length + 1}`, operation: "add", target: key, proposed_value: item, reason: "Explicitly stated in the imported source.", evidence: [evidence(item.evidence?.[0] || JSON.stringify(item))] });
  if (claims.identity?.displayName) proposals.push({ proposal_id: `source-name-${proposals.length + 1}`, operation: "change", target: "identity.displayName", proposed_value: claims.identity.displayName, reason: "Explicit preferred/name field in the imported source.", evidence: [evidence(claims.identity.displayName)] });
  return proposals;
}

export function proposalTargetValue(profile, proposal) { return targetValue(profile, proposal.target, proposal.item_id); }
