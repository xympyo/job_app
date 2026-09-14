import { z } from "zod";
import {
  FIT_LABELS,
  POSTING_STATES,
  QUESTION_TYPES,
  RECOMMENDATIONS,
  REVIEW_STATES,
  STAGES,
  WORK_MODES,
  REJECTION_STAGES,
  POST_SUBMISSION_STAGES,
} from "./constants";

const text = z.string().max(60000).default("");
const short = z.string().max(500).default("");
const required = z.string().trim().min(1, "This field is required").max(500);
export const url = z
  .string()
  .max(3000)
  .refine(
    (v) =>
      !v ||
      (/^https?:\/\//i.test(v) &&
        (() => {
          try {
            const u = new URL(v);
            return !!u.hostname && !u.username && !u.password;
          } catch {
            return false;
          }
        })()),
    "Use a full http:// or https:// URL",
  )
  .default("");
export const date = z.union([z.iso.date(), z.literal("")]).default("");
export const timestamp = z
  .union([z.iso.datetime({ offset: true }), z.literal("")])
  .default("");
const list = z.array(z.string().max(5000)).max(100).default([]);
const ref = z.union([z.uuid(), z.literal("")]).default("");
const optionalNumber = z
  .number()
  .finite()
  .nonnegative()
  .nullable()
  .default(null);
export const companySchema = z.object({
  name: required,
  normalized_name: short,
  website: url,
  careers_url: url,
  industry: short,
  size: short,
  headquarters: short,
  notes: text,
});
export const sourceSchema = z.object({
  job_id: ref,
  source_name: required,
  source_type: z
    .enum([
      "Official careers",
      "Official posting",
      "Job platform",
      "Secondary",
      "Unknown",
    ])
    .default("Unknown"),
  source_url: url,
  apply_url: url,
  external_job_id: short,
  is_primary: z.boolean().default(false),
  verified_at: timestamp,
});
export const jobSchema = z
  .object({
    company_id: z.uuid(),
    title: required,
    normalized_title: short,
    location_text: short,
    city: short,
    country: short,
    work_mode: z.enum(WORK_MODES).default("Unknown"),
    employment_type: short,
    role_family: short,
    seniority: short,
    description: text,
    responsibilities: text,
    requirements: text,
    preferred_requirements: text,
    salary_min: optionalNumber,
    salary_max: optionalNumber,
    salary_currency: short,
    salary_period: short,
    deadline: date,
    published_at: date,
    found_at: date,
    last_verified_at: timestamp,
    posting_status: z.enum(POSTING_STATES).default("Unknown"),
    source_confidence: short,
    review_status: z.enum(REVIEW_STATES).default("Found"),
    fit_score: z.number().int().min(0).max(100).nullable().default(null),
    fit_label: z.enum([...FIT_LABELS, ""]).default(""),
    fit_reason: text,
    strengths: list,
    gaps: list,
    red_flags: list,
    recommendation: z.enum([...RECOMMENDATIONS, ""]).default(""),
    recommended_cv_id: ref,
    custom_tailoring: z.boolean().default(false),
    research_notes: text,
    notes: text,
    research_run_id: ref,
  })
  .refine((v) => v.fit_score === null || !!v.fit_reason.trim(), {
    message: "Explain the fit when providing a score",
    path: ["fit_reason"],
  })
  .refine(
    (v) =>
      v.salary_min === null ||
      v.salary_max === null ||
      v.salary_max >= v.salary_min,
    {
      message: "Maximum salary must be at least the minimum",
      path: ["salary_max"],
    },
  );
export const applicationSchema = z
  .object({
    job_id: z.uuid(),
    status: z.enum(STAGES).default("Preparing"),
    applied_at: date,
    cv_version_id: ref,
    cv_snapshot: z.record(z.string(), z.unknown()).default({}),
    job_snapshot: z.record(z.string(), z.unknown()).default({}),
    stage_history: z
      .array(z.object({ status: z.enum(STAGES), at: z.string() }))
      .default([]),
    cover_letter_used: text,
    next_action: short,
    next_action_at: timestamp,
    recruiter_name: short,
    recruiter_contact: short,
    rejection_stage: z.enum([...REJECTION_STAGES, ""]).default(""),
    rejection_reason: text,
    offer_details: text,
    notes: text,
  })
  .refine((v) => v.status !== "Rejected" || !!v.rejection_stage, {
    message: "Choose a rejection stage (unknown is valid)",
    path: ["rejection_stage"],
  })
  .refine((v) => !POST_SUBMISSION_STAGES.includes(v.status) || !!v.applied_at, {
    message: "Record when the application was submitted",
    path: ["applied_at"],
  })
  .refine((v) => v.status !== "Preparing" || !v.applied_at, {
    message: "Preparing applications cannot have an applied date",
    path: ["applied_at"],
  });
export const questionSchema = z
  .object({
    application_id: z.uuid(),
    question_text: required,
    question_type: z.enum(QUESTION_TYPES).default("free_text"),
    required: z.boolean().default(false),
    character_limit: z
      .number()
      .int()
      .min(1)
      .max(100000)
      .nullable()
      .default(null),
    draft_answer: text,
    final_answer: text,
    reasoning_notes: text,
    status: z.enum(["Draft", "Ready", "Completed"]).default("Draft"),
  })
  .refine(
    (v) => v.status !== "Completed" || !v.required || !!v.final_answer.trim(),
    {
      message: "A completed required question needs a final answer",
      path: ["final_answer"],
    },
  )
  .refine(
    (v) =>
      v.status === "Draft" ||
      !v.character_limit ||
      v.final_answer.length <= v.character_limit,
    {
      message: "Final answer exceeds the character limit",
      path: ["final_answer"],
    },
  );
export const eventSchema = z.object({
  application_id: z.uuid(),
  kind: z.enum([
    "Assessment",
    "HR interview",
    "Hiring manager interview",
    "Technical / case interview",
    "Final interview",
    "Recruiter contact",
    "Other",
  ]),
  title: required,
  scheduled_at: timestamp,
  status: z.enum(["Planned", "Completed", "Cancelled"]).default("Planned"),
  notes: text,
});
export const cvSchema = z.object({
  name: required,
  slug: required,
  description: text,
  target_roles: list,
  active: z.boolean().default(true),
  file_reference: short,
  notes: text,
});
export const runSchema = z.object({
  research_goal: required,
  query_summary: text,
  started_at: timestamp,
  completed_at: timestamp,
  result_count: z.number().int().nonnegative(),
  created_jobs_count: z.number().int().nonnegative(),
  notes: text,
});
export const schemas = {
  companies: companySchema,
  jobs: jobSchema,
  job_sources: sourceSchema,
  applications: applicationSchema,
  application_questions: questionSchema,
  application_events: eventSchema,
  cv_versions: cvSchema,
  research_runs: runSchema,
};
export const errorMessage = (e) =>
  e.issues
    ? e.issues
        .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
        .join("; ")
    : e.message || "Something went wrong. Please retry.";
