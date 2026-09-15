export const PROMPTS = {
  research: {
    title: "Research new jobs",
    when: "Use when you need a fresh batch of realistic opportunities.",
    provide: "No attachment needed when Astra is working in this repository.",
    text: `Read docs/README.md first.\n\nFollow the documented Job Research reading path and inspect the current PyoLoker workspace before researching. Find a fresh batch of realistic current opportunities for Moshe, applying the documented eligibility, verification, source, deduplication and CV-routing rules. Do not mutate owner or application data. Return a concise research report and a version-1 PyoLoker research import JSON. Stop after producing reviewable artifacts.`
  },
  triage: {
    title: "Triage my current jobs",
    when: "Use after exporting jobs when you want a ranked execution queue.",
    provide: "Attach the triage export you just downloaded.",
    text: `Read docs/README.md first.\n\nFollow the documented Triage reading path. Inspect the attached PyoLoker triage export and current workspace. Triage current unapplied opportunities using the documented scoring, freshness, CV-routing and anti-procrastination rules. Do not research replacement jobs or mutate application history. Return a concise ranked queue, the top three applications to execute next, and valid PyoLoker version-1 triage-results JSON using the exported UUIDs. Stop after triage.`
  },
  apply: {
    title: "What should I apply to today?",
    when: "Use when you are ready to spend time submitting applications.",
    provide: "Use the current PyoLoker workspace; do not attach a new research batch.",
    text: `Read docs/README.md and follow the documented “What should I apply to today?” workflow. Inspect the current PyoLoker workspace. Do not perform fresh job-market research. Use current application state, triage decisions, deadlines, freshness, effort and CV strategy. Tell me the maximum three applications to work on next, with company/role, CV, why it is next, material blocker and exact next action. The objective is to submit applications.`
  },
  analyze: {
    title: "Analyze one job",
    when: "Use for a specific vacancy when the decision is unclear.",
    provide: "Paste the vacancy URL/text or identify the PyoLoker job.",
    text: `Read docs/README.md and the documented candidate profile, CV strategy, fit/scoring and triage policies. Analyze this specific opportunity for Moshe: actual work, eligibility, matching evidence, material gaps, red flags, CV, Reach/Target/Safer position and recommended action. Separate employer facts from inference. Do not reject solely because final-year eligibility is not explicit unless there is a real timing gate. Keep it concise and decision-oriented.`
  },
  prepare: {
    title: "Prepare an application",
    when: "Use after opening a PyoLoker application workspace.",
    provide: "Use the selected PyoLoker job/application record and paste any missing employer question.",
    text: `Read docs/README.md and follow the documented Application Preparation workflow. Use the selected PyoLoker job/application record and canonical candidate profile. Help complete the application truthfully, preserving Mattel internship, Homize project work and leadership as distinct evidence. Do not invent experience. Use the selected CV unless there is a material reason to recommend another. Help only with the fields/questions needed.`
  },
  interview: {
    title: "Prepare for an interview",
    when: "Use when an interview or assessment appears in Attention.",
    provide: "Use the selected PyoLoker application/job record and the scheduled stage.",
    text: `Read docs/README.md, the canonical candidate profile and the selected PyoLoker application/job record. Prepare me for the next recorded interview stage: why this role/company, likely behavioral and role-specific questions, the strongest Mattel/Homize/leadership examples, concise STAR structure, gaps to explain and questions to ask. Do not invent experiences. Prioritize practical rehearsal.`
  },
  progress: {
    title: "Review my job-search progress",
    when: "Use for a concise review of current momentum and next actions.",
    provide: "Use the current PyoLoker workspace; no new research is needed.",
    text: `Read docs/README.md and inspect the current PyoLoker workspace. Review progress across active jobs, applications, Attention items and recent outcomes. Identify what is blocking momentum, the three most useful next actions and any process mistake to avoid. Keep the review grounded in current records and do not start fresh research.`
  }
};
