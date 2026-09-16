import { z } from "zod";
import { hashText, stableStringify } from "./compiler.js";

export const PROFILE_SCHEMA_VERSION = "1.0";
export const PROFILE_ONBOARDING_STATUSES = ["not_started", "draft", "ready", "migrating", "blocked"];
export const REVISION_STATUSES = ["draft", "published", "archived"];
export const EXPERIENCE_TYPES = ["employment", "internship", "freelance", "contract", "freelance/project", "project", "volunteer", "leadership", "other"];
export const PROVENANCE_KINDS = ["user_entry", "user_confirmation", "migration", "source_material", "accepted_ai_proposal"];

const boundedText = (max = 60000) => z.string().max(max);
const itemId = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "Use a stable opaque item identifier");
const optionalText = (max = 60000) => z.string().max(max).optional();
const list = z.array(boundedText(5000)).max(200).default([]);
const evidence = z.array(boundedText(10000)).max(200).default([]);

const identitySchema = z.object({ displayName: optionalText(200) }).passthrough().optional();
const careerStageSchema = z.object({ status: optionalText(100), graduation: optionalText(100) }).passthrough().optional();
const educationItemSchema = z.object({ id: itemId, institution: boundedText(500).optional(), field: boundedText(500).optional(), studyPeriod: boundedText(500).optional(), gpa: z.union([z.string().max(100), z.number().finite()]).optional(), expectedGraduation: boundedText(100).optional(), scholarship: boundedText(500).optional() }).passthrough();
const experienceItemSchema = z.object({ id: itemId, organization: boundedText(500).optional(), title: boundedText(500).optional(), type: z.enum(EXPERIENCE_TYPES), dates: boundedText(500).optional(), evidence }).passthrough();
const projectItemSchema = z.object({ id: itemId, name: boundedText(500).optional(), description: boundedText(10000).optional(), evidence }).passthrough();
const leadershipItemSchema = z.object({ id: itemId, organization: boundedText(500).optional(), title: boundedText(500).optional(), dates: boundedText(500).optional(), evidence }).passthrough();

export const structuredProfileSchema = z.object({
  identity: identitySchema,
  careerStage: careerStageSchema,
  education: z.array(educationItemSchema).max(100).default([]),
  experiences: z.array(experienceItemSchema).max(200).default([]),
  projects: z.array(projectItemSchema).max(200).default([]),
  leadership: z.array(leadershipItemSchema).max(200).default([]),
  skills: list,
  languages: list,
  targetRoles: list,
  locationPreferences: list,
  workPreferences: z.record(z.string(), z.unknown()).default({}),
  constraints: z.record(z.string(), z.unknown()).default({}),
  evidence: evidence,
}).strict().superRefine((value, ctx) => {
  for (const key of ["education", "experiences", "projects", "leadership"]) {
    const ids = value[key].map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: [key], message: `Duplicate stable item id in ${key}` });
  }
});

export const provenanceSourceSchema = z.object({
  kind: z.enum(PROVENANCE_KINDS),
  reference: boundedText(1000).min(1),
  note: boundedText(5000).optional(),
}).strict();
export const sourceMapSchema = z.record(z.string().min(1).max(500), z.array(provenanceSourceSchema).min(1).max(20));
export const profilePreferencesSchema = z.record(z.string(), z.unknown()).default({});
export const freeformNotesSchema = z.string().max(30000).default("");

export const profileRevisionPayloadSchema = z.object({
  schemaVersion: z.string().min(1).max(20).default(PROFILE_SCHEMA_VERSION),
  structuredJson: structuredProfileSchema,
  freeformNotes: freeformNotesSchema,
  sourceMapJson: sourceMapSchema.default({}),
  createdBy: z.enum(["user", "import", "assistant_proposal", "migration"]).default("user"),
}).strict();
export const careerProfileSchema = structuredProfileSchema;
export const careerProfileRevisionPayloadSchema = profileRevisionPayloadSchema;

export function canonicalProfileContent({ structuredJson, freeformNotes = "", sourceMapJson = {} }) {
  const parsed = profileRevisionPayloadSchema.parse({ structuredJson, freeformNotes, sourceMapJson, createdBy: "user" });
  return { schemaVersion: parsed.schemaVersion, structuredJson: parsed.structuredJson, freeformNotes: parsed.freeformNotes, sourceMapJson: parsed.sourceMapJson };
}

export function revisionContentHash(content) {
  return hashText(stableStringify(canonicalProfileContent(content)));
}

export function emptyStructuredProfile() {
  return structuredProfileSchema.parse({});
}

export function addStableItemIds(profile, prefix = "item") {
  const keys = ["identity", "careerStage", "education", "experiences", "projects", "leadership", "skills", "languages", "targetRoles", "locationPreferences", "workPreferences", "constraints", "evidence"];
  const copy = Object.fromEntries(keys.filter((key) => profile?.[key] !== undefined).map((key) => [key, profile[key]]));
  for (const key of ["education", "experiences", "projects", "leadership"]) {
    copy[key] = (copy[key] || []).map((entry, index) => ({ ...entry, id: entry.id || `${prefix}-${key}-${index + 1}` }));
  }
  return structuredProfileSchema.parse(copy);
}

export function validateProfileRevisionPayload(payload) {
  return profileRevisionPayloadSchema.parse(payload);
}
