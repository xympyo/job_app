import { z } from "zod";
import { sourceSchema, jobSchema } from "./schema";
import { normalize, normalizeTitle, now, put, saveJob } from "./domain";

// Researchers often describe the provenance more precisely than the compact
// categories stored by the app. Keep the persisted vocabulary stable while
// accepting common labels from curated research batches.
const sourceTypeAliases = new Map([
  ["official careers", "Official careers"],
  ["official career page", "Official careers"],
  ["official posting", "Official posting"],
  ["official recruiter posting", "Official posting"],
  ["company recruiter posting", "Official posting"],
  ["job platform", "Job platform"],
  ["university career center", "Secondary"],
  ["university job platform", "Secondary"],
  ["secondary", "Secondary"],
  ["unknown", "Unknown"],
]);

export function normalizeSourceType(value) {
  if (!value) return value;
  return sourceTypeAliases.get(value.trim().toLowerCase()) || value;
}

const researchJob = z
  .object(jobSchema.shape)
  .omit({
    company_id: true,
    normalized_title: true,
    recommended_cv_id: true,
    research_run_id: true,
    review_status: true,
  })
  .extend({
    company: z.string().trim().min(1).max(500),
    sources: z
      .array(sourceSchema.omit({ job_id: true }).strict())
      .max(30)
      .default([]),
    recommended_cv: z
      .enum(["Master", "Analyst", "Management/Product", "Custom", ""])
      .default(""),
  })
  .strict()
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
export const importSchema = z
  .object({
    version: z.literal(1),
    research_run: z
      .object({
        goal: z.string().trim().min(1).max(2000),
        query_summary: z.string().max(10000).default(""),
        notes: z.string().max(20000).default(""),
      })
      .strict(),
    jobs: z
      .array(researchJob)
      .min(1, "Add at least one researched job")
      .max(200),
  })
  .strict();
export function parseImport(raw) {
  if (raw.length > 2_000_000)
    throw new Error(
      "Import is too large. Use batches up to 2 MB and 200 jobs.",
    );
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Malformed JSON. Check quotes, commas and brackets.");
  }
  // External researchers commonly represent unknown optional facts with null.
  // Omit null properties so schema defaults represent them consistently; required
  // company/title fields still fail validation if missing.
  const unknownsToDefaults = (value) =>
    Array.isArray(value)
      ? value.map(unknownsToDefaults)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([, v]) => v !== null)
              .map(([k, v]) => [k, unknownsToDefaults(v)]),
          )
        : value;
  const normalized = unknownsToDefaults(parsed);
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized))
    return importSchema.parse(normalized);
  if (Array.isArray(normalized.jobs))
    normalized.jobs = normalized.jobs.map((job) => ({
      ...job,
      sources: (job.sources || []).map((source) => ({
        ...source,
        source_type: normalizeSourceType(source.source_type),
      })),
    }));
  return importSchema.parse(normalized);
}
export function importErrorMessage(error, raw = "") {
  if (!error?.issues) return error?.message || "Import could not be read. Please retry.";
  let input = null;
  try {
    input = JSON.parse(raw);
  } catch {
    /* parseImport already reports malformed JSON */
  }
  return error.issues
    .map((issue) => {
      const path = issue.path || [];
      const jobIndex = path[0] === "jobs" && Number.isInteger(path[1]) ? path[1] : null;
      const job = jobIndex === null ? null : input?.jobs?.[jobIndex];
      const subject = job
        ? `Job ${jobIndex + 1} — ${job.company || "Unknown company"} / ${job.title || "Untitled role"}`
        : "Research import";
      const field =
        jobIndex === null ? path[0] : path[2] === "sources" ? path[4] : path[2];
      const value =
        field && job
          ? path[2] === "sources"
            ? job.sources?.[path[3]]?.[field]
            : job[field]
          : undefined;
      let detail = issue.message;
      if (field === "source_type") {
        detail = `Source type "${value ?? "(missing)"}" is not recognized. Accepted values: Official careers, Official posting, Job platform, Secondary, Unknown. Suggested correction: choose the closest accepted value.`;
      } else if (field) {
        detail = `${field}: ${issue.message}`;
      }
      return `${subject}: ${detail}`;
    })
    .join("\n");
}
export function canonicalUrl(s) {
  if (!s) return "";
  try {
    const u = new URL(s);
    u.hash = "";
    for (const key of [...u.searchParams.keys()])
      if (/^(utm_|ref$|source$)/i.test(key)) u.searchParams.delete(key);
    u.searchParams.sort();
    return u.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}
export function findDuplicates(data, candidate) {
  const inputSources = candidate.sources || [];
  const urls = inputSources
    .flatMap((s) => [s.source_url, s.apply_url])
    .map(canonicalUrl)
    .filter(Boolean);
  return data.jobs.flatMap((job) => {
    const company = data.companies.find((c) => c.id === job.company_id);
    const sameCompany =
      normalize(company?.name).replace(/^pt /, "") ===
      normalize(candidate.company).replace(/^pt /, "");
    const sources = data.job_sources.filter((s) => s.job_id === job.id);
    const urlMatch = sources.some((s) =>
      [s.source_url, s.apply_url].some(
        (u) => u && urls.includes(canonicalUrl(u)),
      ),
    );
    const requisition =
      sameCompany &&
      sources.some(
        (s) =>
          s.external_job_id &&
          inputSources.some((x) => x.external_job_id === s.external_job_id),
      );
    const title =
      sameCompany &&
      normalizeTitle(job.title) === normalizeTitle(candidate.title) &&
      (!job.location_text ||
        !candidate.location_text ||
        normalize(job.location_text) === normalize(candidate.location_text));
    return urlMatch || requisition || title
      ? [
          {
            job,
            reason: urlMatch
              ? "Matching source or application URL"
              : requisition
                ? "Matching company and requisition ID"
                : "Similar company, title and location",
          },
        ]
      : [];
  });
}
export function previewImport(data, payload) {
  const temp = structuredClone(data);
  return payload.jobs.map((job, index) => {
    const duplicates = findDuplicates(temp, job);
    const added = saveJob(
      temp,
      { ...job, company_name: job.company },
      "preview",
    );
    return { index, job, duplicates, previewId: added.id };
  });
}
export function applyImport(data, payload, choices, userId) {
  const run = put(
    data,
    "research_runs",
    {
      research_goal: payload.research_run.goal,
      query_summary: payload.research_run.query_summary,
      notes: payload.research_run.notes,
      started_at: now(),
      completed_at: now(),
      result_count: payload.jobs.length,
      created_jobs_count: 0,
    },
    userId,
  );
  let count = 0;
  payload.jobs.forEach((job, index) => {
    const duplicates = findDuplicates(data, job);
    const choice = choices[index] || "skip";
    if (duplicates.length && choice === "skip") return;
    if (duplicates.length && choice.startsWith("merge:")) {
      const targetId = choice.slice(6);
      const target = duplicates.find((d) => d.job.id === targetId);
      if (!target)
        throw new Error("Duplicate target changed. Preview the import again.");
      for (const source of job.sources) {
        const already = data.job_sources.some(
          (s) =>
            s.job_id === targetId &&
            canonicalUrl(s.source_url) === canonicalUrl(source.source_url) &&
            canonicalUrl(s.apply_url) === canonicalUrl(source.apply_url),
        );
        if (!already)
          put(
            data,
            "job_sources",
            { ...source, is_primary: false, job_id: targetId },
            userId,
          );
      }
      return;
    }
    if (duplicates.length && choice !== "keep")
      throw new Error("Resolve duplicate choices before importing");
    const cv = data.cv_versions.find((c) => c.name === job.recommended_cv);
    saveJob(
      data,
      {
        ...job,
        company_name: job.company,
        recommended_cv_id: cv?.id || "",
        custom_tailoring: job.recommended_cv === "Custom",
        research_run_id: run.id,
      },
      userId,
    );
    count++;
  });
  put(data, "research_runs", { ...run, created_jobs_count: count }, userId);
  return { count, total: payload.jobs.length };
}
