import { z } from "zod";
import { RECOMMENDATIONS, REVIEW_STATES } from "./constants";
import { now, put } from "./domain";

const triageDecision = z.enum(["Apply ASAP", "Apply", "Research First", "Skip"]);
const triageReview = z.enum(REVIEW_STATES);
const cvName = z.enum(["Master", "Analyst", "Management/Product", "Custom", ""]);
export const triageSchema = z.object({
  version: z.literal(1),
  triage_run: z.object({
    goal: z.string().max(2000).default(""),
    researched_at: z.string().max(100).default(""),
    notes: z.string().max(20000).default(""),
  }).strict(),
  decisions: z.array(z.object({
    job_id: z.uuid(),
    decision: triageDecision,
    review_status: triageReview,
    recommendation: z.enum(RECOMMENDATIONS).or(z.literal("")),
    reason: z.string().max(60000).default(""),
    fit_score: z.number().int().min(0).max(100).nullable().optional(),
    fit_label: z.string().max(100).optional(),
    fit_reason: z.string().max(60000).optional(),
    strengths: z.array(z.string().max(5000)).max(100).optional(),
    gaps: z.array(z.string().max(5000)).max(100).optional(),
    red_flags: z.array(z.string().max(5000)).max(100).optional(),
    recommended_cv: cvName.optional(),
    priority_reason: z.string().max(60000).default(""),
    verification_note: z.string().max(60000).default(""),
    last_verified_at: z.union([z.iso.datetime({ offset: true }), z.literal("")]).optional(),
  }).strict()),
}).strict();

const decisionMap = {
  "Apply ASAP": { review_status: "Ready to Apply", recommendation: "Apply ASAP" },
  Apply: { review_status: "Ready to Apply", recommendation: "Apply" },
  "Research First": { review_status: "Reviewing", recommendation: "Research first" },
  Skip: { review_status: "Skipped", recommendation: "Skip" },
};

export function triageExport(data) {
  const jobs = data.jobs
    .filter((job) => !["Skipped", "Expired", "Closed"].includes(job.review_status))
    .map((job) => {
      const company = data.companies.find((c) => c.id === job.company_id);
      const sources = data.job_sources.filter((s) => s.job_id === job.id);
      return {
        job_id: job.id,
        company: company?.name || "",
        title: job.title,
        location: job.location_text,
        work_mode: job.work_mode,
        role_family: job.role_family,
        review_status: job.review_status,
        posting_status: job.posting_status,
        deadline: job.deadline,
        found_at: job.found_at,
        last_verified_at: job.last_verified_at,
        fit_score: job.fit_score,
        fit_label: job.fit_label,
        fit_reason: job.fit_reason,
        strengths: job.strengths,
        gaps: job.gaps,
        red_flags: job.red_flags,
        recommended_cv: data.cv_versions.find((c) => c.id === job.recommended_cv_id)?.name || "",
        research_notes: job.research_notes,
        description: job.description,
        requirements: job.requirements,
        preferred_requirements: job.preferred_requirements,
        recommendation: job.recommendation,
        sources: sources.map((s) => ({
          source_name: s.source_name,
          source_type: s.source_type,
          source_url: s.source_url,
          apply_url: s.apply_url,
          external_job_id: s.external_job_id,
        })),
      };
    });
  return { version: 1, exported_at: now(), purpose: "job_triage", jobs };
}

export function parseTriage(raw) {
  if (raw.length > 2_000_000) throw new Error("Triage file is too large. Use a file smaller than 2 MB.");
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Malformed JSON. Check quotes, commas and brackets."); }
  return triageSchema.parse(parsed);
}

export function triageErrorMessage(error, raw = "") {
  if (!error?.issues) return error?.message || "Triage results could not be read. Please retry.";
  let parsed = null; try { parsed = JSON.parse(raw); } catch { /* parse error already explained */ }
  return error.issues.map((issue) => {
    const path = issue.path || [];
    const i = path[0] === "decisions" && Number.isInteger(path[1]) ? path[1] : null;
    const item = i === null ? null : parsed?.decisions?.[i];
    const subject = item ? `Decision ${i + 1} — ${item.job_id}` : "Triage results";
    if (path[2] === "decision") return `${subject}: "${item?.decision || "(missing)"}" is not a supported triage decision. Use Apply ASAP, Apply, Research First, or Skip.`;
    return `${subject}: ${path.slice(2).join(".") || path.join(".") || "Input"}: ${issue.message}`;
  }).join("\n");
}

function validateDecisions(data, payload) {
  const seen = new Set();
  return payload.decisions.map((decision, index) => {
    const job = data.jobs.find((j) => j.id === decision.job_id);
    const duplicate = seen.has(decision.job_id);
    seen.add(decision.job_id);
    const errors = [];
    if (!job) errors.push("This job does not exist in your workspace.");
    if (duplicate) errors.push("This job ID appears more than once in the file.");
    if (decision.recommended_cv && decision.recommended_cv !== "Custom" && !data.cv_versions.some((c) => c.name === decision.recommended_cv))
      errors.push(`CV "${decision.recommended_cv}" is not available in your workspace.`);
    if (decision.last_verified_at && !decision.verification_note.trim()) errors.push("Add verification_note when providing a verification timestamp.");
    const mapping = decisionMap[decision.decision];
    if (mapping && decision.review_status !== mapping.review_status) errors.push(`Use review status "${mapping.review_status}" for decision "${decision.decision}".`);
    return { index, decision, job, errors, changed: job ? changedFields(job, decision, data) : [] };
  });
}

function changedFields(job, decision, data) {
  const cvId = decision.recommended_cv ? data.cv_versions.find((c) => c.name === decision.recommended_cv)?.id || "" : job.recommended_cv_id;
  const mapping = decisionMap[decision.decision];
  const checks = {
    review_status: mapping.review_status,
    recommendation: mapping.recommendation,
    ...(Object.hasOwn(decision, "fit_score") ? { fit_score: decision.fit_score } : {}),
    ...(Object.hasOwn(decision, "fit_label") ? { fit_label: decision.fit_label } : {}),
    ...((Object.hasOwn(decision, "fit_reason") || decision.reason) ? { fit_reason: decision.fit_reason || decision.reason } : {}),
    ...(Object.hasOwn(decision, "strengths") ? { strengths: decision.strengths } : {}),
    ...(Object.hasOwn(decision, "gaps") ? { gaps: decision.gaps } : {}),
    ...(Object.hasOwn(decision, "red_flags") ? { red_flags: decision.red_flags } : {}),
    ...(Object.hasOwn(decision, "recommended_cv") ? { recommended_cv_id: cvId } : {}),
    ...(decision.priority_reason ? { research_notes: decision.priority_reason } : {}),
    ...(decision.last_verified_at ? { last_verified_at: decision.last_verified_at } : {}),
  };
  return Object.entries(checks).filter(([key, value]) => JSON.stringify(job[key]) !== JSON.stringify(value)).map(([key]) => key);
}

export function previewTriage(data, payload) {
  return validateDecisions(data, payload).map((row) => ({ ...row, company: data.companies.find((c) => c.id === row.job?.company_id)?.name || "Unknown company" }));
}

export function applyTriage(data, payload, selected = {}, userId) {
  const rows = validateDecisions(data, payload);
  const invalid = rows.filter((r) => r.errors.length);
  if (invalid.length) throw new Error(invalid.map((r) => `Decision ${r.index + 1}: ${r.errors.join(" ")}`).join("\n"));
  rows.forEach(({ index, decision, job }) => {
    if (selected[index] === false) return;
    const mapping = decisionMap[decision.decision];
    const cv = decision.recommended_cv && decision.recommended_cv !== "Custom" ? data.cv_versions.find((c) => c.name === decision.recommended_cv) : null;
    put(data, "jobs", {
      ...job,
      review_status: mapping.review_status,
      recommendation: mapping.recommendation,
      ...(Object.hasOwn(decision, "fit_score") ? { fit_score: decision.fit_score } : {}),
      ...(Object.hasOwn(decision, "fit_label") ? { fit_label: decision.fit_label } : {}),
      ...((Object.hasOwn(decision, "fit_reason") || decision.reason) ? { fit_reason: decision.fit_reason || decision.reason } : {}),
      ...(Object.hasOwn(decision, "strengths") ? { strengths: decision.strengths } : {}),
      ...(Object.hasOwn(decision, "gaps") ? { gaps: decision.gaps } : {}),
      ...(Object.hasOwn(decision, "red_flags") ? { red_flags: decision.red_flags } : {}),
      ...(Object.hasOwn(decision, "recommended_cv") ? { recommended_cv_id: decision.recommended_cv ? cv?.id || "" : "" } : {}),
      ...(decision.priority_reason ? { research_notes: decision.priority_reason } : {}),
      ...(decision.last_verified_at ? { last_verified_at: decision.last_verified_at } : {}),
    }, userId);
  });
  return { updated: rows.filter((r) => selected[r.index] !== false && r.changed.length).length, total: rows.length };
}
