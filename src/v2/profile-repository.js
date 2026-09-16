import { createCareerProfile, createDraft, saveDraft, publishDraft, discardDraft, getCurrentPublishedRevision, getCurrentDraft, getRevisionHistory } from "./profile-domain.js";

const PROFILE_STORAGE_KEY = "career-command-center:v2-profile";
export function createLocalProfileRepository(storage = globalThis.localStorage, initialState) {
  if (storage && Array.isArray(storage.profiles) && Array.isArray(storage.revisions) && !initialState) {
    initialState = storage;
    storage = null;
  }
  let state = initialState || { profiles: [], revisions: [] };
  if (!initialState && storage) {
    const raw = storage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.version === 1 && Array.isArray(parsed.state?.profiles) && Array.isArray(parsed.state?.revisions)) state = parsed.state;
      } catch { /* Corrupt V2 profile data is ignored until the user starts a fresh draft. */ }
    }
  }
  const persist = () => storage?.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ version: 1, state }));
  const run = (operation) => { const result = operation(); persist(); return result; };
  return {
    state,
    createProfile: (userId, options) => run(() => createCareerProfile(state, userId, options)),
    createDraft: (profileId, userId, options) => run(() => createDraft(state, profileId, userId, options)),
    saveDraft: (profileId, revisionId, userId, payload, options) => run(() => saveDraft(state, profileId, revisionId, userId, payload, options)),
    publishDraft: (profileId, revisionId, userId, options) => run(() => publishDraft(state, profileId, revisionId, userId, options)),
    discardDraft: (profileId, revisionId, userId) => run(() => discardDraft(state, profileId, revisionId, userId)),
    current: (profileId, userId) => getCurrentPublishedRevision(state, profileId, userId),
    draft: (profileId, userId) => getCurrentDraft(state, profileId, userId),
    history: (profileId, userId) => getRevisionHistory(state, profileId, userId),
  };
}

export function createCloudProfileRepository(client) {
  if (!client) throw new Error("A Supabase client is required.");
  return {
    async createProfile() { const { data, error } = await client.rpc("career_profile_create"); if (error) throw error; return data; },
    async createDraft(profileId, _userId, { copyCurrent = true } = {}) { const { data, error } = await client.rpc("career_profile_create_draft", { p_profile_id: profileId, p_copy_current: copyCurrent }); if (error) throw error; return data; },
    async saveDraft(profileId, revisionId, _userId, payload, { expectedUpdatedAt = null } = {}) { const { data, error } = await client.rpc("career_profile_save_draft", { p_profile_id: profileId, p_revision_id: revisionId, p_payload: payload, p_expected_updated_at: expectedUpdatedAt }); if (error) throw error; return data; },
    async publishDraft(profileId, revisionId, _userId, { expectedUpdatedAt = null } = {}) { const { data, error } = await client.rpc("career_profile_publish_draft", { p_profile_id: profileId, p_revision_id: revisionId, p_expected_updated_at: expectedUpdatedAt }); if (error) throw error; return data; },
    async discardDraft(profileId, revisionId, _userId) { const { data, error } = await client.rpc("career_profile_discard_draft", { p_profile_id: profileId, p_revision_id: revisionId }); if (error) throw error; return data; },
    async current(profileId) {
      const { data: profile, error: profileError } = await client.from("career_profiles").select("current_revision_id").eq("id", profileId).maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.current_revision_id) return null;
      const { data, error } = await client.from("career_profile_revisions").select("*").eq("id", profile.current_revision_id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async draft(profileId) {
      const { data, error } = await client.from("career_profile_revisions").select("*").eq("profile_id", profileId).eq("status", "draft").maybeSingle();
      if (error) throw error;
      return data;
    },
    async history(profileId) {
      const { data, error } = await client.from("career_profile_revisions").select("*").eq("profile_id", profileId).order("revision_number");
      if (error) throw error;
      return data || [];
    },
  };
}
