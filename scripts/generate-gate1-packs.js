import fs from "node:fs";
import path from "node:path";
import { compileCareerPack, mosheFixture, syntheticFinanceFixture, mosheJobs, syntheticJobs } from "../src/v2/index.js";

const outputDir = path.resolve("output/v2-gate1-samples");
fs.mkdirSync(outputDir, { recursive: true });
const jobs = [{ id: "job-moshe-2", company: "Example Technology", title: "Associate Product Manager", location: "Cikarang", roleFamily: "Product", sources: [{ sourceName: "Company careers", sourceUrl: "https://example.invalid/jobs/2" }] }];
const samples = [
  ["moshe-career-discussion", mosheFixture, "career_discussion", { userRequest: "What career direction fits my evidence?" }],
  ["moshe-research-jobs", mosheFixture, "research_jobs", { userRequest: "Find current roles", existingOpportunityFingerprints: ["job-moshe-2"] }],
  ["moshe-analyze-job", mosheFixture, "analyze_job", { userRequest: "Should I apply?", selectedJob: jobs[0], relevantEvidence: mosheFixture.experiences[0].evidence }],
  ["moshe-triage-jobs", mosheFixture, "triage_jobs", { userRequest: "Rank these roles", selectedJobs: mosheJobs }],
  ["synthetic-career-discussion", syntheticFinanceFixture, "career_discussion", { userRequest: "What direction fits?" }],
  ["synthetic-research-jobs", syntheticFinanceFixture, "research_jobs", { userRequest: "Find current finance roles", existingOpportunityFingerprints: syntheticJobs.map((job) => job.id), searchPreferences: { market: "Indonesia" } }],
];
for (const [name, profile, taskType, task] of samples) {
  const pack = compileCareerPack({ profile, cvVariants: profile.cvVariants, taskType, task, privacyPreset: "working_context", generatedAt: "2026-09-16T00:00:00.000Z", packId: `sample-${name}` });
  fs.writeFileSync(path.join(outputDir, `${name}.md`), pack.markdown);
  fs.writeFileSync(path.join(outputDir, `${name}.json`), `${JSON.stringify(pack.json, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, `${name}.manifest.json`), `${JSON.stringify({ ...pack.manifest, metrics: pack.metrics, lint: pack.lint }, null, 2)}\n`);
}
console.log(`Generated ${samples.length} Gate 1 samples in ${outputDir}`);
