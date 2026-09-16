export const TASK_TYPES = [
  "career_discussion",
  "research_jobs",
  "triage_jobs",
  "analyze_job",
  "prepare_application",
  "interview_preparation",
  "progress_review",
];

const researchPolicy = `- Search responsibilities and actual work, not title keywords alone.
- Apply the user's target roles, location/work-mode preferences, timing, and final-year reasoning.
- Keep internship, freelance, project, and leadership experience types intact; assess realistic experience eligibility.
- Use an official employer posting first when available. Search snippets are discovery leads, not proof.
- Open the actual posting/application destination and make a second pass that actively attempts to disprove open status.
- One vacancy may have multiple sources; avoid duplicates and leave missing facts unknown.
- Route CVs by actual work and responsibilities. Classify opportunities as Reach, Target, or Safer; prestige is not priority.
- Do not over-research when uncertainty would not change Apply versus Skip.`;

const triagePolicy = `- Screen plausibility before ranking: substantive fit, eligibility, freshness/deadline, and practical location/work mode.
- Consider career value, application effort, and strong differentiated evidence.
- Use P0 (urgent/high-value action), P1 (important near-term), P2 (useful later), and DROP (not actionable) as workload guidance.
- Exclude already-submitted or terminal work from new-application recommendations unless the user asks for an audit.
- A recommendation is advice for the user, never the user's decision.`;

const evidencePolicy = `- Separate employer/source FACTS from INFERENCE, UNKNOWN, and SUGGESTION.
- Preserve experience boundaries and use only supplied evidence; never invent qualifications or outcomes.
- State source/freshness limitations, decisive gaps, and red flags before recommending an action.`;

export const TASKS = {
  career_discussion: {
    label: "Career discussion",
    required: ["profile", "targetRoles", "cvVariants", "userRequest"],
    contextKeys: [],
    excluded: ["jobs", "applications", "applicationAnswers", "recruiterContacts", "accountMetadata"],
    policy: "Use supplied evidence to explore career direction. Ask focused questions where material facts are missing.",
    instruction: "Help the user think through career direction using the supplied evidence and identify useful next questions.",
    structuredOutput: false,
  },
  research_jobs: {
    label: "Research jobs",
    required: ["profileSummary", "targetRoles", "locationPreferences", "constraints", "cvVariants", "userRequest"],
    contextKeys: ["existingOpportunityFingerprints", "searchPreferences"],
    excluded: ["applicationAnswers", "interviews", "recruiterContacts", "unrelatedJobs", "documentBinaries"],
    policy: researchPolicy,
    instruction: "Research and verify current vacancy facts externally. Do not invent an opening from profile context or an old snippet.",
    structuredOutput: true,
    outputContract: {
      format: "pyoloker.career-interchange",
      format_version: "2.0",
      kind: "research_import",
      required: ["source.pack_id", "research_run.goal", "jobs[].company", "jobs[].title", "jobs[].sources"],
      template: { source: { pack_id: "<pack_id>", task: "research_jobs" }, research_run: { goal: "<goal>", researched_at: "<ISO timestamp>", notes: "<notes>" }, jobs: [{ company: "<company>", title: "<title>", location_text: "<location>", description: "<verified facts>", requirements: "<verified requirements>", sources: [{ source_name: "<name>", source_type: "Official careers|Official posting|Job platform|Secondary|Unknown", source_url: "https://...", apply_url: "https://..." }] }] },
    },
  },
  triage_jobs: {
    label: "Triage jobs",
    required: ["profile", "cvVariants", "selectedJobs", "triagePrinciples", "userRequest"],
    contextKeys: ["selectedJobs"],
    excluded: ["unrelatedJobs", "applicationAnswers", "documentContent"],
    policy: triagePolicy,
    instruction: "Recommend a ranked queue from the selected jobs. Recommendations are not user decisions.",
    structuredOutput: true,
    outputContract: {
      format: "pyoloker.career-interchange",
      format_version: "2.0",
      kind: "triage_result",
      required: ["source.pack_id", "triage_run.researched_at", "decisions[].job_id", "decisions[].decision", "decisions[].reason"],
      template: { source: { pack_id: "<pack_id>", task: "triage_jobs" }, triage_run: { researched_at: "<ISO timestamp>", notes: "<notes>" }, decisions: [{ job_id: "<existing job id>", decision: "Apply ASAP|Apply|Research First|Skip", review_status: "Ready to Apply|Reviewing|Skipped", recommendation: "<same decision>", reason: "<evidence-grounded reason>", recommended_cv: "<variant name>", verification_note: "<what was checked>" }] },
    },
  },
  analyze_job: {
    label: "Analyze one job",
    required: ["selectedJob", "sources", "relevantEvidence", "cvVariants", "userRequest"],
    contextKeys: ["selectedJob", "relevantEvidence"],
    excluded: ["unrelatedJobs", "wholeApplicationHistory"],
    policy: evidencePolicy,
    instruction: "Separate vacancy facts, inference, eligibility, matching evidence, gaps, red flags, recommended CV, and action.",
    structuredOutput: false,
  },
  prepare_application: {
    label: "Prepare an application",
    required: ["selectedJob", "relevantEvidence", "selectedCvVariant", "questions", "userRequest"],
    contextKeys: ["selectedJob", "relevantEvidence", "selectedCvVariant", "questions", "selectedCvText"],
    excluded: ["unrelatedJobs", "unrelatedApplications", "privateNotes", "unusedDocuments"],
    policy: "Draft only from supplied evidence. Keep missing facts visible, preserve experience types, and never claim that an application was submitted.",
    instruction: "Draft application material truthfully and identify missing facts for the user to confirm.",
    structuredOutput: false,
  },
  interview_preparation: {
    label: "Prepare for an interview",
    required: ["selectedJob", "applicationStage", "relevantEvidence", "selectedCvVariant", "userRequest"],
    contextKeys: ["selectedJob", "applicationStage", "relevantEvidence", "selectedCvVariant"],
    excluded: ["unrelatedHistory", "unnecessaryPersonalIdentifiers"],
    policy: "Coach practical rehearsal from supplied evidence. Do not invent experiences, interviewer facts, or outcomes.",
    instruction: "Coach practical rehearsal for the recorded stage using only supplied evidence.",
    structuredOutput: false,
  },
  progress_review: {
    label: "Review progress",
    required: ["activeOpportunities", "activeApplications", "deadlines", "nextActions", "recentEvents", "userRequest"],
    contextKeys: ["activeOpportunities", "activeApplications", "deadlines", "nextActions", "recentEvents"],
    excluded: ["rawProfileDocuments", "staleResearchBatch", "unrelatedHistory"],
    policy: "Identify blockers, three useful next actions, and process observations from the supplied current records only.",
    instruction: "Identify blockers, the three most useful next actions, and process observations.",
    structuredOutput: false,
  },
};

export function getTaskDefinition(type) {
  return TASKS[type] || null;
}