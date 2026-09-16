import { describe, expect, it } from "vitest";
import { deriveGettingStarted, deriveRecommendedAction } from "../lib/guidance";
import { emptyData } from "../lib/domain";
import { readTutorialState, markTutorialSeen, resetTutorialState } from "../lib/tutorial-state";

const job = (overrides = {}) => ({ id: "job-1", review_status: "Found", recommendation: "", ...overrides });

describe("first-run guidance", () => {
  it("derives checklist milestones from canonical records", () => {
    const data = emptyData();
    data.jobs = [job({ review_status: "Ready to Apply" })];
    expect(deriveGettingStarted(data, { current: { id: "profile" } }).map((item) => item.complete)).toEqual([true, true, true, false]);
    data.applications = [{ id: "app-1", job_id: "job-1", status: "Preparing" }];
    expect(deriveGettingStarted(data, { current: { id: "profile" } }).every((item) => item.complete)).toBe(true);
  });

  it("prioritizes operational work, then preparation, decisions and review", () => {
    const data = emptyData();
    data.jobs = [job({ review_status: "Ready to Apply" })];
    expect(deriveRecommendedAction({ data, profile: { current: null }, attention: [] }).kind).toBe("decision");
    data.applications = [{ id: "app-1", job_id: "job-1", status: "Preparing" }];
    expect(deriveRecommendedAction({ data, profile: { current: null }, attention: [] }).kind).toBe("application");
    expect(deriveRecommendedAction({ data, profile: { current: null }, attention: [{ type: "Deadline", title: "Application deadline", job_id: "job-1", detail: "Role" }] }).kind).toBe("operational");
  });

  it("scopes tutorial state by user and can reset it", () => {
    const storage = { values: new Map(), getItem(key) { return this.values.get(key) || null; }, setItem(key, value) { this.values.set(key, value); }, removeItem(key) { this.values.delete(key); } };
    expect(readTutorialState(storage, "a")).toEqual({});
    markTutorialSeen(storage, "a", "home");
    expect(readTutorialState(storage, "a")).toEqual({ seen: { home: true } });
    expect(readTutorialState(storage, "b")).toEqual({});
    resetTutorialState(storage, "a");
    expect(readTutorialState(storage, "a")).toEqual({});
  });
});
