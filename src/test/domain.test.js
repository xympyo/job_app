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
} from "../lib/domain";
import { LOCAL_USER } from "../lib/constants";
import {
  parseImport,
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
    expect(applied.applied_at).toBeTruthy();
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
      "Ready to Apply",
      "Applied",
      "Rejected",
    ]);
    expect(() => deleteRow(d, "jobs", j.id)).toThrow(/history/);
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
      filterJobs(d, { area: "applications", status: "Ready to Apply" }),
    ).toHaveLength(1);
  });
  it("puts ready vacancies in Applications before a formal application record exists", () => {
    const d = make();
    add(d, { review_status: "Ready to Apply" });
    expect(filterJobs(d, { area: "applications" })).toHaveLength(1);
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
      { ...d.applications[0], status: "Withdrawn" },
      LOCAL_USER,
    );
    expect(attentionItems(d)).toHaveLength(0);
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
