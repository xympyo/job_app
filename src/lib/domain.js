import { CV_SEEDS, POST_SUBMISSION_STAGES, TABLES, TERMINAL } from "./constants";
import { schemas } from "./schema";

export const today = () => new Date().toLocaleDateString("en-CA");
export const now = () => new Date().toISOString();
export const normalize = (s) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export const normalizeTitle = (s) =>
  normalize(s).split(" ").filter(Boolean).sort().join(" ");
export function displayCompanyName(name) {
  const value = (name || "").trim();
  return value.replace(/^(?:PT|CV)\.?\s+/i, "").trim() || value;
}
export const emptyData = () => Object.fromEntries(TABLES.map((t) => [t, []]));
export function put(data, table, values, userId) {
  const old = values.id && data[table].find((r) => r.id === values.id);
  const row = {
    ...schemas[table].parse(values),
    id: old?.id || values.id || crypto.randomUUID(),
    user_id: userId,
    created_at: old?.created_at || now(),
    updated_at: now(),
  };
  const uniqueKey =
    table === "companies"
      ? "normalized_name"
      : table === "cv_versions"
        ? "slug"
        : table === "applications"
          ? "job_id"
          : null;
  if (
    uniqueKey &&
    data[table].some((r) => r.id !== row.id && r[uniqueKey] === row[uniqueKey])
  )
    throw new Error(
      `A ${table === "companies" ? "company with this name" : table === "cv_versions" ? "CV with this identifier" : "record for this application"} already exists`,
    );
  if (old) data[table] = data[table].map((r) => (r.id === old.id ? row : r));
  else data[table].push(row);
  return row;
}
export function seedCVs(data, userId) {
  CV_SEEDS.forEach((cv) => {
    if (!data.cv_versions.some((c) => c.slug === cv.slug))
      put(data, "cv_versions", cv, userId);
  });
}
export function saveJob(data, input, userId) {
  const { company_name, sources = [], ...values } = input;
  if (!company_name?.trim()) throw new Error("Company name is required");
  let company = data.companies.find(
    (c) => c.normalized_name === normalize(company_name),
  );
  if (!company)
    company = put(
      data,
      "companies",
      { name: company_name.trim(), normalized_name: normalize(company_name) },
      userId,
    );
  const row = put(
    data,
    "jobs",
    {
      ...values,
      company_id: company.id,
      normalized_title: normalizeTitle(values.title),
      found_at: values.found_at || today(),
    },
    userId,
  );
  const kept = sources.map(
    (s) => put(data, "job_sources", { ...s, job_id: row.id }, userId).id,
  );
  data.job_sources = data.job_sources.filter(
    (s) => s.job_id !== row.id || kept.includes(s.id),
  );
  return row;
}
export function createApplication(data, jobId, userId) {
  const existing = data.applications.find((a) => a.job_id === jobId);
  if (existing) return existing;
  const job = data.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Vacancy no longer exists");
  const company = data.companies.find((c) => c.id === job.company_id);
  const cv = data.cv_versions.find((c) => c.id === job.recommended_cv_id);
  return put(
    data,
    "applications",
    {
      job_id: jobId,
      cv_version_id: cv?.id || "",
      cv_snapshot: cv || {},
      job_snapshot: {
        ...job,
        company_name: company?.name,
        sources: data.job_sources.filter((s) => s.job_id === jobId),
      },
      stage_history: [{ status: "Preparing", at: now() }],
    },
    userId,
  );
}
export function saveApplication(data, input, userId) {
  const old = data.applications.find((a) => a.id === input.id);
  if (!old) throw new Error("Application no longer exists");
  const appliedAt = input.applied_at ||
    (POST_SUBMISSION_STAGES.includes(input.status)
      ? old.applied_at || (input.status === "Applied" ? today() : "")
      : "");
  if (POST_SUBMISSION_STAGES.includes(input.status) && !appliedAt)
    throw new Error("Record when you applied before saving this stage.");
  if (input.status === "Preparing" && input.applied_at)
    throw new Error("Preparing applications cannot have an applied date.");
  const changed = old.status !== input.status;
  const cv = data.cv_versions.find((c) => c.id === input.cv_version_id);
  return put(
    data,
    "applications",
    {
      ...input,
      job_snapshot: old.job_snapshot,
      cv_snapshot:
        input.cv_version_id === old.cv_version_id ? old.cv_snapshot : cv || {},
      stage_history: changed
        ? [...old.stage_history, { status: input.status, at: now() }]
        : old.stage_history,
      applied_at: appliedAt,
    },
    userId,
  );
}
export function deleteRow(data, table, id) {
  if (table === "jobs") {
    if (data.applications.some((a) => a.job_id === id))
      throw new Error(
        "This vacancy has application history. Archive it instead.",
      );
    data.job_sources = data.job_sources.filter((s) => s.job_id !== id);
  }
  if (table === "companies" && data.jobs.some((j) => j.company_id === id))
    throw new Error("Company is in use. Edit it instead.");
  if (
    table === "cv_versions" &&
    (data.jobs.some((j) => j.recommended_cv_id === id) ||
      data.applications.some((a) => a.cv_version_id === id))
  )
    throw new Error("CV is part of job history. Deactivate it instead.");
  data[table] = data[table].filter((r) => r.id !== id);
}
export function freshness(job, at = new Date()) {
  if (job.posting_status === "Closed") return "Closed";
  if (
    job.posting_status === "Expired" ||
    (job.deadline && job.deadline < at.toLocaleDateString("en-CA"))
  )
    return "Expired";
  if (!job.last_verified_at) return "Unverified";
  const days = (at - new Date(job.last_verified_at)) / 86400000;
  return days <= 7
    ? "Fresh"
    : days <= 14
      ? "Recent"
      : days <= 30
        ? "Aging"
        : "Possibly stale";
}
export function postingLabel(status) {
  return {
    "Verified open": "Open",
    "Possibly open": "Possibly open",
    Closed: "Closed",
    Expired: "Expired",
    Unknown: "Unknown",
  }[status] || "Unknown";
}
export function verificationLabel(job, at = new Date()) {
  if (!job.last_verified_at) return "Not timestamped";
  const days = (at - new Date(job.last_verified_at)) / 86400000;
  if (days <= 7) return "Verified recently";
  if (days <= 14) return "Verified 8–14 days ago";
  if (days <= 30) return "Verified 15–30 days ago";
  return "Possibly stale";
}
export function filterJobs(data, filters = {}) {
  return data.jobs
    .filter((j) => {
      const company = data.companies.find((c) => c.id === j.company_id);
      const application = data.applications.find((a) => a.job_id === j.id);
      const sources = data.job_sources.filter((s) => s.job_id === j.id);
      const triageFilter = filters.triage;
      const lifecycle = filters.lifecycle || filters.view;
      const activeArea = filters.area === "jobs";
      if (activeArea && filters.application === "active" && (!application || TERMINAL.includes(application.status)))
        return false;
      if (
        filters.area === "inbox" && !triageFilter && !filters.status &&
        (application ||
          ["Ready to Apply", "Skipped", "Closed", "Expired"].includes(
            j.review_status,
          ))
      )
        return false;
      if (triageFilter) {
        if (!triageDecisionMatches(j, triageFilter, application)) return false;
      }
      if (
        filters.area === "applications" &&
        !application
      )
        return false;
      if (activeArea && !lifecycle && !filters.status && !triageFilter &&
        (TERMINAL.includes(application?.status) || ["Skipped", "Closed", "Expired"].includes(j.review_status)))
        return false;
      if (
        filters.area === "applications" &&
        application &&
        !filters.status &&
        TERMINAL.includes(application.status)
      )
        return false;
      if (
        filters.query &&
        !normalize(
          [
            company?.name,
            j.title,
            j.notes,
            j.research_notes,
            application?.notes,
          ].join(" "),
        ).includes(normalize(filters.query))
      )
        return false;
      for (const key of [
        "role_family",
        "work_mode",
        "fit_label",
        "recommended_cv_id",
        "company_id",
      ])
        if (filters[key] && j[key] !== filters[key]) return false;
      if (
        filters.status &&
        (application?.status || j.review_status) !== filters.status
      )
        return false;
      if (lifecycle && lifecycle !== "All") {
        const interview = ["HR Interview", "User / Hiring Manager Interview", "Technical / Case Interview", "Final Interview"];
        const matches = lifecycle === "To Review"
          ? !application && ["Found", "Reviewing"].includes(j.review_status)
          : ["Apply ASAP", "Apply", "Research First", "Skip"].includes(lifecycle)
            ? triageDecisionMatches(j, lifecycle, application)
            : lifecycle === "Assessment"
              ? application?.status === "Assessment / OA"
              : lifecycle === "Interview"
                ? interview.includes(application?.status)
                : lifecycle === "Offer"
                  ? application?.status === "Offer"
                  : lifecycle === "Closed"
                    ? TERMINAL.includes(application?.status) || ["Skipped", "Closed", "Expired"].includes(j.review_status)
                    : application?.status === lifecycle;
        if (!matches) return false;
      }
      if (
        filters.location &&
        !normalize(j.location_text).includes(normalize(filters.location))
      )
        return false;
      if (
        filters.source &&
        !sources.some((s) =>
          normalize(s.source_name).includes(normalize(filters.source)),
        )
      )
        return false;
      if (
        filters.freshness &&
        freshness(j) !==
          (filters.freshness === "Not timestamped" ? "Unverified" : filters.freshness)
      )
        return false;
      if (
        filters.deadline &&
        (!j.deadline ||
          j.deadline < today() ||
          j.deadline >
            new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-CA"))
      )
        return false;
      return true;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export function triageDecisionMatches(job, decision, application) {
  if (application) return false;
  const recommendation = job.recommendation || "";
  if (decision === "Apply ASAP") return recommendation === "Apply ASAP";
  if (decision === "Apply") return recommendation === "Apply";
  if (decision === "Research First") return recommendation === "Research first" || (!recommendation && job.review_status === "Reviewing");
  if (decision === "Skip") return recommendation === "Skip" || job.review_status === "Skipped";
  return false;
}

export function currentLifecycle(job, application) {
  if (application?.status) return application.status;
  if (job.recommendation === "Apply ASAP" || job.recommendation === "Apply") return job.recommendation;
  if (job.recommendation === "Research first" || job.recommendation === "Research First") return "Research First";
  if (job.review_status === "Found" || job.review_status === "Reviewing") return "To Review";
  return job.review_status || "To Review";
}
export function attentionItems(data) {
  const items = [];
  for (const job of data.jobs) {
    const app = data.applications.find((a) => a.job_id === job.id);
    if (
      (app && TERMINAL.includes(app.status)) ||
      (!app && ["Skipped", "Closed", "Expired"].includes(job.review_status))
    )
      continue;
    if (job.deadline && (!app || app.status === "Preparing"))
      items.push({
        id: `deadline-${job.id}`,
        job_id: job.id,
        application_id: app?.id || "",
        title: "Application deadline",
        at: `${job.deadline}T23:59:00`,
        type: "Deadline",
        detail: job.title,
      });
    if (!app && job.review_status === "Ready to Apply")
      items.push({
        id: `ready-${job.id}`,
        job_id: job.id,
        application_id: app?.id || "",
        title: "Ready to apply",
        at: "",
        type: "Ready to Apply",
        detail: job.title,
      });
    if (!app) continue;
    if (app.next_action)
      items.push({
        id: `next-${app.id}`,
        job_id: job.id,
        application_id: app.id,
        title: app.next_action,
        at: app.next_action_at,
        type: "Next action",
        detail: job.title,
      });
    for (const event of data.application_events.filter(
      (e) => e.application_id === app.id && e.status === "Planned",
    ))
      items.push({
        id: event.id,
        job_id: job.id,
        application_id: app.id,
        title: event.title,
        at: event.scheduled_at,
        type: event.kind,
        detail: job.title,
      });
    const unfinished = data.application_questions.filter(
      (q) => q.application_id === app.id && q.status !== "Completed",
    ).length;
    if (unfinished)
      items.push({
        id: `questions-${app.id}`,
        job_id: job.id,
        application_id: app.id,
        title: `${unfinished} unfinished answer${unfinished > 1 ? "s" : ""}`,
        at: "",
        type: "Questions",
        detail: job.title,
      });
  }
  return items.sort((a, b) => (a.at || "9999").localeCompare(b.at || "9999"));
}
export function csv(rows) {
  if (!rows.length) return "";
  const columns = [...new Set(rows.flatMap(Object.keys))];
  const cell = (value) => {
    let s =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  return [
    columns.map(cell).join(","),
    ...rows.map((row) => columns.map((k) => cell(row[k])).join(",")),
  ].join("\r\n");
}
