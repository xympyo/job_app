import { profileRevisionPayloadSchema, emptyStructuredProfile, revisionContentHash, validateProfileRevisionPayload, profilePreferencesSchema, PROFILE_SCHEMA_VERSION } from "./profile.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const isoNow = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const ownerError = () => new Error("Profile does not belong to this user.");

export function createProfileState() { return { profiles: [], revisions: [] }; }

function profileFor(state, profileId, userId) {
  const profile = state.profiles.find((row) => row.id === profileId);
  if (!profile || profile.userId !== userId) throw ownerError();
  return profile;
}
function revisionFor(state, revisionId, userId) {
  const revision = state.revisions.find((row) => row.id === revisionId);
  if (!revision || revision.userId !== userId) throw ownerError();
  return revision;
}
function nextRevisionNumber(state, profileId) {
  return Math.max(0, ...state.revisions.filter((row) => row.profileId === profileId).map((row) => row.revisionNumber)) + 1;
}
function assertRevisionPayload(payload) {
  const parsed = validateProfileRevisionPayload(payload);
  return { ...parsed, contentHash: revisionContentHash(parsed) };
}

export function createCareerProfile(state, userId, { profileId = id(), now = isoNow, preferences = {} } = {}) {
  const existing = state.profiles.find((row) => row.userId === userId);
  if (existing) return clone(existing);
  const at = now();
  const profile = { id: profileId, userId, onboardingStatus: "not_started", currentRevisionId: null, preferencesJson: profilePreferencesSchema.parse(preferences), createdAt: at, updatedAt: at };
  state.profiles.push(profile);
  return clone(profile);
}

export function getCurrentPublishedRevision(state, profileId, userId) {
  const profile = profileFor(state, profileId, userId);
  return profile.currentRevisionId ? clone(revisionFor(state, profile.currentRevisionId, userId)) : null;
}
export function getCurrentDraft(state, profileId, userId) {
  profileFor(state, profileId, userId);
  const draft = state.revisions.find((row) => row.profileId === profileId && row.userId === userId && row.status === "draft");
  return draft ? clone(draft) : null;
}
export function getRevisionHistory(state, profileId, userId) {
  profileFor(state, profileId, userId);
  return state.revisions.filter((row) => row.profileId === profileId && row.userId === userId).sort((a, b) => a.revisionNumber - b.revisionNumber).map(clone);
}

export function createDraft(state, profileId, userId, { copyCurrent = true, revisionId = id(), now = isoNow, createdBy = "user" } = {}) {
  const profile = profileFor(state, profileId, userId);
  const existing = getCurrentDraft(state, profileId, userId);
  if (existing) return existing;
  const current = copyCurrent && profile.currentRevisionId ? revisionFor(state, profile.currentRevisionId, userId) : null;
  const payload = assertRevisionPayload({ schemaVersion: PROFILE_SCHEMA_VERSION, structuredJson: current ? current.structuredJson : emptyStructuredProfile(), freeformNotes: current?.freeformNotes || "", sourceMapJson: current?.sourceMapJson || {}, createdBy });
  const at = now();
  const revision = { id: revisionId, userId, profileId, revisionNumber: nextRevisionNumber(state, profileId), status: "draft", schemaVersion: payload.schemaVersion, structuredJson: payload.structuredJson, freeformNotes: payload.freeformNotes, sourceMapJson: payload.sourceMapJson, contentHash: payload.contentHash, createdBy: payload.createdBy, createdAt: at, updatedAt: at, publishedAt: null };
  state.revisions.push(revision);
  profile.onboardingStatus = profile.onboardingStatus === "not_started" ? "draft" : profile.onboardingStatus;
  profile.updatedAt = at;
  return clone(revision);
}

export function saveDraft(state, profileId, revisionId, userId, payload, { expectedUpdatedAt, now = isoNow } = {}) {
  const profile = profileFor(state, profileId, userId);
  const revision = revisionFor(state, revisionId, userId);
  if (revision.profileId !== profile.id || revision.status !== "draft") throw new Error("Only the current draft can be edited.");
  if (expectedUpdatedAt && revision.updatedAt !== expectedUpdatedAt) throw new Error("Draft changed elsewhere. Reload before saving.");
  const parsed = assertRevisionPayload(payload);
  const at = now();
  Object.assign(revision, { schemaVersion: parsed.schemaVersion, structuredJson: parsed.structuredJson, freeformNotes: parsed.freeformNotes, sourceMapJson: parsed.sourceMapJson, contentHash: parsed.contentHash, createdBy: parsed.createdBy, updatedAt: at });
  profile.updatedAt = at;
  return clone(revision);
}

export function publishDraft(state, profileId, revisionId, userId, { expectedUpdatedAt, now = isoNow } = {}) {
  const profile = profileFor(state, profileId, userId);
  const revision = revisionFor(state, revisionId, userId);
  if (revision.profileId !== profile.id || revision.status !== "draft") throw new Error("Only a draft revision can be published.");
  if (expectedUpdatedAt && revision.updatedAt !== expectedUpdatedAt) throw new Error("Draft changed elsewhere. Reload before publishing.");
  const payload = assertRevisionPayload({ schemaVersion: revision.schemaVersion, structuredJson: revision.structuredJson, freeformNotes: revision.freeformNotes, sourceMapJson: revision.sourceMapJson, createdBy: revision.createdBy });
  const at = now();
  Object.assign(revision, { ...payload, status: "published", publishedAt: at, updatedAt: at });
  profile.currentRevisionId = revision.id;
  profile.onboardingStatus = "ready";
  profile.updatedAt = at;
  return clone(revision);
}

export function discardDraft(state, profileId, revisionId, userId) {
  const profile = profileFor(state, profileId, userId);
  const revision = revisionFor(state, revisionId, userId);
  if (revision.profileId !== profile.id || revision.status !== "draft") throw new Error("Only a draft revision can be discarded.");
  state.revisions = state.revisions.filter((row) => row.id !== revision.id);
  profile.updatedAt = isoNow();
  return true;
}

export function profileRevisionToCompilerInput(revision, cvVariants = []) {
  if (!revision || revision.status !== "published") throw new Error("A published profile revision is required.");
  const payload = profileRevisionPayloadSchema.parse({ schemaVersion: revision.schemaVersion, structuredJson: revision.structuredJson, freeformNotes: revision.freeformNotes, sourceMapJson: revision.sourceMapJson, createdBy: revision.createdBy });
  return { profile: { ...clone(payload.structuredJson), freeformNotes: payload.freeformNotes, revision: revision.id, provenance: clone(payload.sourceMapJson) }, cvVariants: clone(cvVariants) };
}
