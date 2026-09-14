import { describe, expect, it } from "vitest";
import { emptyData, saveJob } from "../lib/domain";
import { applyTriage, parseTriage, previewTriage, triageExport } from "../lib/triage";
import { put } from "../lib/domain";

const uid = "00000000-0000-4000-8000-000000000009";
function fixture() {
  const data = emptyData();
  put(data, "cv_versions", { name: "Analyst", slug: "analyst", description: "" }, uid);
  const job = saveJob(data, { company_name: "Traveloka", title: "Product Analyst", location_text: "Jakarta", work_mode: "Hybrid", role_family: "Product", description: "", requirements: "", preferred_requirements: "", fit_score: null, fit_label: "", fit_reason: "", strengths: [], gaps: [], red_flags: [], recommendation: "", recommended_cv_id: "", review_status: "Found", posting_status: "Unknown", deadline: "", found_at: "2026-09-15", last_verified_at: "", sources: [] }, uid);
  return { data, job };
}

describe("bulk triage contract", () => {
  it("exports stable IDs and applies a strict existing-job update", () => {
    const { data, job } = fixture();
    const packet = triageExport(data);
    expect(packet.version).toBe(1);
    expect(packet.jobs[0].job_id).toBe(job.id);
    const payload = parseTriage(JSON.stringify({ version: 1, triage_run: { goal: "Review" }, decisions: [{ job_id: job.id, decision: "Apply", review_status: "Ready to Apply", recommendation: "Apply", reason: "Strong fit", recommended_cv: "Analyst", fit_score: 88, fit_label: "Strong Fit", fit_reason: "Strong fit", strengths: ["Product"], gaps: [], red_flags: [], priority_reason: "Apply this week" }] }));
    expect(previewTriage(data, payload)[0].changed).toContain("review_status");
    expect(applyTriage(data, payload, {}, uid).updated).toBe(1);
    expect(data.jobs[0].review_status).toBe("Ready to Apply");
    expect(data.jobs[0].recommended_cv_id).toBe(data.cv_versions[0].id);
    expect(data.applications).toHaveLength(0);
  });

  it("flags unknown, duplicate, invalid decision, and unknown keys", () => {
    const { data, job } = fixture();
    expect(() => parseTriage(JSON.stringify({ version: 1, triage_run: { goal: "x" }, decisions: [{ job_id: job.id, decision: "Apply Immediately", review_status: "Ready to Apply", recommendation: "Apply", extra: true }] }))).toThrow();
    const payload = parseTriage(JSON.stringify({ version: 1, triage_run: { goal: "x" }, decisions: [{ job_id: job.id, decision: "Skip", review_status: "Skipped", recommendation: "Skip" }, { job_id: job.id, decision: "Skip", review_status: "Skipped", recommendation: "Skip" }] }));
    const rows = previewTriage(data, payload);
    expect(rows[1].errors.join(" ")).toMatch(/more than once/);
  });

  it("rejects unknown job IDs and unverifiable timestamps", () => {
    const { data, job } = fixture();
    const missing = crypto.randomUUID();
    const payload = parseTriage(JSON.stringify({ version: 1, triage_run: { goal: "x" }, decisions: [{ job_id: missing, decision: "Skip", review_status: "Skipped", recommendation: "Skip" }, { job_id: job.id, decision: "Research First", review_status: "Reviewing", recommendation: "Research first", last_verified_at: "2026-09-15T00:00:00+00:00" }] }));
    const rows = previewTriage(data, payload);
    expect(rows[0].errors.join(" ")).toMatch(/does not exist/);
    expect(rows[1].errors.join(" ")).toMatch(/verification_note/);
    expect(() => applyTriage(data, payload, {}, uid)).toThrow();
    expect(data.jobs[0].review_status).toBe("Found");
  });
});
