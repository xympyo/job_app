import { describe, expect, it } from "vitest";
import {
  emptyData,
  seedCVs,
  saveJob,
  createApplication,
  saveApplication,
  put,
  deleteRow,
  freshness,
  filterJobs,
  csv,
  attentionItems,
  displayCompanyName,
  today,
  currentLifecycle,
} from "../lib/domain";
import { LOCAL_USER } from "../lib/constants";
import {
  parseImport,
  importErrorMessage,
  previewImport,
  applyImport,
  findDuplicates,
} from "../lib/import";
import {
  createLocalRepository,
  createCloudRepository,
} from "../lib/repository";
import { questionSchema, sourceSchema } from "../lib/schema";

const make = () => {
  const d = emptyData();
  seedCVs(d, LOCAL_USER);
  return d;
};
const add = (d, changes = {}) =>
  saveJob(
    d,
    {
      company_name: "PT Example",
      title: "IT Business Analyst",
      location_text: "Jakarta",
      ...changes,
    },
    LOCAL_USER,
  );
const payload = (jobs) =>
  parseImport(
    JSON.stringify({
      version: 1,
      research_run: { goal: "Find analyst roles" },
      jobs,
    }),
  );

describe("vacancy and application workflow", () => {
  it("creates and edits a vacancy with reusable company and multiple sources", () => {
    const d = make(),
      j = add(d, {
        sources: [
          { source_name: "Careers", source_url: "https://example.com/job/1" },
          {
            source_name: "Job platform",
            source_url: "https://platform.example/job/1",
          },
        ],
      });
    add(d, { ...j, title: "Business Systems Analyst", sources: d.job_sources });
    expect(d.jobs).toHaveLength(1);
    expect(d.companies).toHaveLength(1);
    expect(d.job_sources).toHaveLength(2);
    expect(d.jobs[0].title).toBe("Business Systems Analyst");
  });
  it("captures immutable original vacancy and CV snapshots, flexible stages and rejection stage", () => {
    const d = make(),
      j = add(d, {
        description: "Original requirements",
        recommended_cv_id: d.cv_versions[1].id,
      });
    const a = createApplication(d, j.id, LOCAL_USER);
    expect(createApplication(d, j.id, LOCAL_USER).id).toBe(a.id);
    add(d, { ...j, description: "Changed listing" });
    const applied = saveApplication(d, { ...a, status: "Applied" }, LOCAL_USER);
    expect(applied.applied_at).toBe(today());
    expect(applied.job_snapshot.description).toBe("Original requirements");
    expect(applied.cv_snapshot.name).toBe("Analyst");
    expect(() =>
      saveApplication(d, { ...applied, status: "Rejected" }, LOCAL_USER),
    ).toThrow();
    const rejected = saveApplication(
      d,
      { ...applied, status: "Rejected", rejection_stage: "case study" },
      LOCAL_USER,
    );
    expect(rejected.stage_history.map((s) => s.status)).toEqual([
      "Preparing",
      "Applied",
      "Rejected",
    ]);
    expect(() => deleteRow(d, "jobs", j.id)).toThrow(/history/);
  });
  it("requires an applied date for submitted stages and clears it for preparing", () => {
    const d = make();
    const a = createApplication(d, add(d).id, LOCAL_USER);
    expect(() =>
      saveApplication(d, { ...a, status: "HR Interview" }, LOCAL_USER),
    ).toThrow(/applied/);
    const applied = saveApplication(
      d,
      { ...a, status: "Applied", applied_at: "2026-09-14" },
      LOCAL_USER,
    );
    expect(() =>
      saveApplication(d, { ...applied, status: "Preparing" }, LOCAL_USER),
    ).toThrow(/applied date/);
    const preparing = saveApplication(
      d,
      { ...applied, status: "Preparing", applied_at: "" },
      LOCAL_USER,
    );
    expect(preparing.applied_at).toBe("");
  });
  it("preserves an existing applied date across later stages and allows manual edits", () => {
    const d = make();
    const a = createApplication(d, add(d).id, LOCAL_USER);
    const applied = saveApplication(d, { ...a, status: "Applied" }, LOCAL_USER);
    const original = applied.applied_at;
    const interview = saveApplication(d, { ...applied, status: "HR Interview", applied_at: "" }, LOCAL_USER);
    expect(interview.applied_at).toBe(original);
    const edited = saveApplication(d, { ...interview, applied_at: "2026-01-02" }, LOCAL_USER);
    expect(edited.applied_at).toBe("2026-01-02");
  });
  it("normalizes legal prefixes for display without changing stored names", () => {
    expect(displayCompanyName("PT. Mowilex")).toBe("Mowilex");
    expect(displayCompanyName("CV Nusantara")).toBe("Nusantara");
    expect(displayCompanyName("PT Technology Partners")).toBe("Technology Partners");
    expect(displayCompanyName("The PT Group")).toBe("The PT Group");
  });
  it("keeps draft and final answers separate and enforces completion limits", () => {
    const d = make(),
      a = createApplication(d, add(d).id, LOCAL_USER);
    const q = put(
      d,
      "application_questions",
      {
        application_id: a.id,
        question_text: "Why this role?",
        required: true,
        character_limit: 5,
        draft_answer: "Long working draft",
      },
      LOCAL_USER,
    );
    expect(q.final_answer).toBe("");
    expect(
      questionSchema.safeParse({ ...q, status: "Completed" }).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse({
        ...q,
        status: "Ready",
        final_answer: "Too long",
      }).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse({
        ...q,
        status: "Completed",
        final_answer: "Fits",
      }).success,
    ).toBe(true);
  });
  it("computes freshness without inventing dates or treating expired listings as open", () => {
    expect(
      freshness({ posting_status: "Unknown" }, new Date("2026-09-14")),
    ).toBe("Unverified");
    expect(
      freshness(
        {
          posting_status: "Verified open",
          last_verified_at: "2026-09-13T00:00:00Z",
        },
        new Date("2026-09-14"),
      ),
    ).toBe("Fresh");
    expect(
      freshness(
        { deadline: "2026-09-01", last_verified_at: "2026-09-13T00:00:00Z" },
        new Date("2026-09-14"),
      ),
    ).toBe("Expired");
  });
  it("filters companies/titles/notes, stage, source, work mode and applications", () => {
    const d = make(),
      j = add(d, {
        notes: "SQL and API strengths",
        work_mode: "Hybrid",
        sources: [{ source_name: "Official careers" }],
      });
    expect(
      filterJobs(d, { query: "SQL", work_mode: "Hybrid", source: "official" }),
    ).toHaveLength(1);
    expect(filterJobs(d, { query: "missing" })).toHaveLength(0);
    createApplication(d, j.id, LOCAL_USER);
    expect(filterJobs(d, { area: "inbox" })).toHaveLength(0);
    expect(
      filterJobs(d, { area: "applications", status: "Preparing" }),
    ).toHaveLength(1);
  });
  it("keeps ready vacancies in Inbox until an application record exists", () => {
    const d = make();
    add(d, { review_status: "Ready to Apply" });
    expect(filterJobs(d, { area: "applications" })).toHaveLength(0);
    expect(filterJobs(d, { area: "inbox" })).toHaveLength(0);
  });
  it("enforces unique company names locally, matching PostgreSQL", () => {
    const d = make();
    add(d);
    expect(() =>
      put(
        d,
        "companies",
        { name: "PT Example", normalized_name: "pt example" },
        LOCAL_USER,
      ),
    ).toThrow(/already exists/);
  });
  it("attention includes unfinished answers, deadlines, interviews and next actions but excludes terminal applications", () => {
    const d = make(),
      a = createApplication(
        d,
        add(d, { deadline: "2026-12-31" }).id,
        LOCAL_USER,
      );
    saveApplication(d, { ...a, next_action: "Prepare case" }, LOCAL_USER);
    put(
      d,
      "application_questions",
      { application_id: a.id, question_text: "Why?" },
      LOCAL_USER,
    );
    put(
      d,
      "application_events",
      { application_id: a.id, kind: "HR interview", title: "HR call" },
      LOCAL_USER,
    );
    expect(attentionItems(d)).toHaveLength(4);
    saveApplication(
      d,
      { ...d.applications[0], status: "Applied", applied_at: "2026-09-14" },
      LOCAL_USER,
    );
    saveApplication(
      d,
      { ...d.applications[0], status: "Withdrawn", applied_at: "2026-09-14" },
      LOCAL_USER,
    );
    expect(attentionItems(d)).toHaveLength(0);
  });
  it("shows ready vacancies before preparation and stops prompting after submission", () => {
    const d = make();
    const job = add(d, { review_status: "Ready to Apply" });
    expect(
      attentionItems(d).filter((i) => i.type === "Ready to Apply"),
    ).toHaveLength(1);
    const app = createApplication(d, job.id, LOCAL_USER);
    expect(
      attentionItems(d).filter((i) => i.type === "Ready to Apply"),
    ).toHaveLength(0);
    saveApplication(d, { ...app, status: "Applied" }, LOCAL_USER);
    expect(
      attentionItems(d).filter((i) => i.type === "Ready to Apply"),
    ).toHaveLength(0);
  });
});
describe("research validation and deduplication", () => {
  it("rejects malformed, empty, oversized and unknown-key imports", () => {
    expect(() => parseImport("{")).toThrow(/Malformed/);
    expect(() => payload([])).toThrow();
    expect(() =>
      payload([{ company: "Example", title: "Role", injected_script: "x" }]),
    ).toThrow();
    expect(() => parseImport(" ".repeat(2_000_001))).toThrow(/large/);
  });
  it("translates nested import validation into job-specific repair guidance", () => {
    const raw = JSON.stringify({
      version: 1,
      research_run: { goal: "QA" },
      jobs: [
        {
          company: "Paper",
          title: "Associate Product Manager",
          sources: [{ source_name: "Recruiter", source_type: "Recruiter blog" }],
        },
      ],
    });
    let error;
    try {
      parseImport(raw);
    } catch (e) {
      error = e;
    }
    expect(importErrorMessage(error, raw)).toMatch(
      /Job 1 — Paper \/ Associate Product Manager.*Source type.*Accepted values/s,
    );
  });
  it("blocks script URLs and requires explanations for numeric scores", () => {
    expect(
      sourceSchema.safeParse({
        source_name: "x",
        source_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(() =>
      payload([{ company: "x", title: "y", fit_score: 86 }]),
    ).toThrow();
  });
  it("accepts explicit null for unknown optional research facts", () => {
    const p = payload([
      {
        company: "Unknown facts",
        title: "Analyst",
        deadline: null,
        last_verified_at: null,
        fit_score: null,
      },
    ]);
    expect(p.jobs[0].deadline).toBe("");
    expect(p.jobs[0].fit_score).toBeNull();
  });
  it("normalizes descriptive source labels from curated research batches", () => {
    const p = payload([
      {
        company: "BCA",
        title: "Management Development Program",
        sources: [
          {
            source_name: "University career center",
            source_type: "University career center",
            source_url: "https://example.com/university",
          },
          {
            source_name: "LinkedIn recruiter",
            source_type: "Official recruiter posting",
            source_url: "https://example.com/recruiter",
          },
        ],
      },
    ]);
    expect(p.jobs[0].sources.map((source) => source.source_type)).toEqual([
      "Secondary",
      "Official posting",
    ]);
  });
  it("accepts the realistic seven-role batch shape", () => {
    const roles = [
      ["PT Bank Central Asia Tbk (BCA)", "Management Trainee / Graduate Program", "Management/Product", "University career center"],
      ["Deliveree Indonesia", "Management Trainee / Graduate Program", "Management/Product", "Official recruiter posting"],
      ["PT. Mowilex", "Management Trainee / Graduate Program", "Management/Product", "Official recruiter posting"],
      ["Traveloka", "Product", "Management/Product", "Official careers"],
      ["Paper", "Product", "Management/Product", "Official recruiter posting"],
      ["Krom", "Product", "Management/Product", "Official recruiter posting"],
      ["Deloitte", "Consulting", "Analyst", "Official careers"],
    ];
    const parsed = payload(
      roles.map(([company, role_family, recommended_cv, source_type], index) => ({
        company,
        title: `${company} opportunity`,
        location_text: index % 2 ? "Jakarta, Indonesia" : "Indonesia",
        role_family,
        work_mode: index === 1 ? "Onsite" : "Unknown",
        description: "Curated role description with operational and product context.",
        requirements: index === 2 ? "" : "Analytical thinking and stakeholder communication.",
        deadline: index === 0 ? "2026-12-31" : "",
        posting_status: "Verified open",
        fit_score: 82 + index,
        fit_label: index < 3 ? "Excellent Fit" : "Strong Fit",
        fit_reason: "The role connects Moshe's management, product, systems or transformation goals.",
        strengths: ["Process improvement", "Cross-functional communication"],
        gaps: index === 2 ? ["Eligibility details unknown"] : [],
        red_flags: [],
        recommended_cv,
        research_notes: "Curated batch entry; verify details before applying.",
        sources: [{
          source_name: `${company} source`,
          source_type,
          source_url: `https://example.com/roles/${index}`,
          apply_url: index % 2 ? `https://example.com/apply/${index}` : "",
          is_primary: true,
        }],
      })),
    );
    expect(parsed.jobs).toHaveLength(7);
    expect(parsed.jobs[1].sources[0].source_type).toBe("Official posting");
    expect(parsed.jobs[0].sources[0].source_type).toBe("Secondary");
    expect(parsed.jobs[2].requirements).toBe("");
    expect(parsed.jobs[0].deadline).toBe("2026-12-31");
    expect(parsed.jobs[6].recommended_cv).toBe("Analyst");
  });
  it("recognizes reordered title tokens and canonical URL matches", () => {
    const d = make();
    add(d, {
      sources: [
        {
          source_name: "Careers",
          source_url: "https://example.com/job/1?utm_source=li",
        },
      ],
    });
    expect(
      findDuplicates(d, {
        company: "Example",
        title: "Business Analyst - IT",
        location_text: "Jakarta",
      }),
    ).toHaveLength(1);
    expect(
      findDuplicates(d, {
        company: "Different",
        title: "Different",
        sources: [{ source_url: "https://example.com/job/1" }],
      }),
    ).toHaveLength(1);
  });
  it("previews without mutation, skips duplicates, merges sources without changing job content", () => {
    const d = make(),
      j = add(d, { description: "Keep this" });
    const p = payload([
      {
        company: "PT Example",
        title: "Business Analyst IT",
        location_text: "Jakarta",
        sources: [
          { source_name: "Official", source_url: "https://example.com/role" },
        ],
      },
    ]);
    expect(previewImport(d, p)[0].duplicates).toHaveLength(1);
    expect(d.research_runs).toHaveLength(0);
    expect(applyImport(d, p, {}, LOCAL_USER).count).toBe(0);
    expect(d.jobs).toHaveLength(1);
    applyImport(d, p, { 0: `merge:${j.id}` }, LOCAL_USER);
    expect(d.job_sources).toHaveLength(1);
    expect(d.jobs[0].description).toBe("Keep this");
  });
  it("detects duplicates within a batch and supports intentional separate records", () => {
    const d = make(),
      p = payload([
        { company: "New", title: "Business Analyst" },
        { company: "New", title: "Analyst Business" },
      ]);
    expect(previewImport(d, p)[1].duplicates).toHaveLength(1);
    expect(applyImport(d, p, {}, LOCAL_USER).count).toBe(1);
    expect(applyImport(d, p, { 0: "keep", 1: "keep" }, LOCAL_USER).count).toBe(
      2,
    );
  });
});
describe("persistence, ownership and export", () => {
  it("survives reload including application questions", async () => {
    const repo = createLocalRepository(),
      before = await repo.load(LOCAL_USER),
      after = structuredClone(before);
    const a = createApplication(after, add(after).id, LOCAL_USER);
    put(
      after,
      "application_questions",
      {
        application_id: a.id,
        question_text: "Why?",
        draft_answer: "Working",
        final_answer: "Final",
      },
      LOCAL_USER,
    );
    await repo.commit(before, after);
    expect(
      (await repo.load(LOCAL_USER)).application_questions[0],
    ).toMatchObject({ draft_answer: "Working", final_answer: "Final" });
  });
  it("rejects stale tab saves and surfaces quota errors without changing prior records", async () => {
    const repo = createLocalRepository(),
      before = await repo.load(LOCAL_USER),
      after = structuredClone(before);
    add(after);
    await repo.commit(before, after);
    await expect(repo.commit(before, structuredClone(before))).rejects.toThrow(
      /another tab/,
    );
    const broken = createLocalRepository({
      getItem: () => null,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    });
    await expect(broken.commit(before, after)).rejects.toThrow(/Quota/);
  });
  it("does not replace corrupted local data", async () => {
    localStorage.setItem("career-command-center:v1", "{broken");
    await expect(createLocalRepository().load(LOCAL_USER)).rejects.toThrow(
      /could not be read/,
    );
    expect(localStorage.getItem("career-command-center:v1")).toBe("{broken");
  });
  it("cloud failures do not fall back to browser storage", async () => {
    const client = {
        rpc: async () => ({ error: new Error("Network unavailable") }),
      },
      before = make(),
      after = structuredClone(before);
    add(after);
    await expect(
      createCloudRepository(client).commit(before, after, LOCAL_USER),
    ).rejects.toThrow(/Network/);
    expect(localStorage.length).toBe(0);
  });
  it("neutralizes spreadsheet formula cells and escapes CSV quotes/newlines", () => {
    const result = csv([
      { title: "=SUM(A1)", notes: 'a,"quote"\nsecond line' },
    ]);
    expect(result).toContain("'=SUM(A1)");
    expect(result).toContain('""quote""');
  });
});
describe("triage browsing filters", () => {
  it("maps user-facing decisions to recommendation/status and keeps counts consistent", () => {
    const d = make();
    const asap = add(d); put(d, "jobs", { ...asap, recommendation: "Apply ASAP", review_status: "Ready to Apply" }, LOCAL_USER);
    const apply = add(d); put(d, "jobs", { ...apply, recommendation: "Apply", review_status: "Ready to Apply" }, LOCAL_USER);
    const research = add(d); put(d, "jobs", { ...research, recommendation: "Research first", review_status: "Reviewing" }, LOCAL_USER);
    const skipped = add(d); put(d, "jobs", { ...skipped, recommendation: "", review_status: "Skipped" }, LOCAL_USER);
    expect(filterJobs(d, { area: "inbox", triage: "Apply ASAP" })).toHaveLength(1);
    expect(filterJobs(d, { area: "inbox", triage: "Apply" })).toHaveLength(1);
    expect(filterJobs(d, { area: "inbox", triage: "Research First" })).toHaveLength(1);
    expect(filterJobs(d, { area: "inbox", triage: "Skip" })).toHaveLength(1);
    expect(filterJobs(d, { area: "inbox", status: "Ready to Apply" })).toHaveLength(2);
    expect(filterJobs(d, { area: "inbox", triage: "Apply ASAP", query: "" })).toHaveLength(1);
  });
  it("hides terminal application records by default but returns them for an explicit status", () => {
    const d = make();
    const activeJob = add(d, { title: "Active role" });
    const closedJob = add(d, { title: "Closed role" });
    const readyJob = add(d, { title: "Ready but not prepared", review_status: "Ready to Apply" });
    const active = createApplication(d, activeJob.id, LOCAL_USER);
    createApplication(d, closedJob.id, LOCAL_USER);
    saveApplication(d, { ...active, status: "Applied" }, LOCAL_USER);
    const closed = d.applications.find((a) => a.job_id === closedJob.id);
    saveApplication(d, { ...closed, status: "Rejected", applied_at: "2026-09-15", rejection_stage: "unknown" }, LOCAL_USER);
    expect(filterJobs(d, { area: "applications" }).map((j) => j.id)).toEqual([activeJob.id]);
    expect(filterJobs(d, { area: "applications" }).map((j) => j.id)).not.toContain(readyJob.id);
    expect(filterJobs(d, { area: "applications", status: "Rejected" }).map((j) => j.id)).toEqual([closedJob.id]);
    expect(filterJobs(d, { area: "applications", status: "Applied" }).map((j) => j.id)).toEqual([activeJob.id]);
  });
  it("supports the unified Jobs lifecycle views with application status priority", () => {
    const d = make();
    const review = add(d, { review_status: "Found" });
    const ready = add(d, { review_status: "Ready to Apply", recommendation: "Apply ASAP" });
    const appliedJob = add(d, { review_status: "Ready to Apply", recommendation: "Apply" });
    const app = createApplication(d, appliedJob.id, LOCAL_USER);
    saveApplication(d, { ...app, status: "Applied" }, LOCAL_USER);
    expect(filterJobs(d, { area: "jobs", lifecycle: "To Review" }).map((j) => j.id)).toEqual([review.id]);
    expect(filterJobs(d, { area: "jobs", lifecycle: "Apply ASAP" }).map((j) => j.id)).toEqual([ready.id]);
    expect(filterJobs(d, { area: "jobs", lifecycle: "Applied" }).map((j) => j.id)).toEqual([appliedJob.id]);
    expect(filterJobs(d, { area: "jobs" }).map((j) => j.id)).toEqual(expect.arrayContaining([review.id, ready.id, appliedJob.id]));
    expect(filterJobs(d, { area: "jobs" })).toHaveLength(3);
    expect(currentLifecycle(ready, null)).toBe("Apply ASAP");
    expect(currentLifecycle(appliedJob, d.applications.find((a) => a.job_id === appliedJob.id))).toBe("Applied");
  });
});
