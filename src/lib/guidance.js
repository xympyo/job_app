import { TERMINAL } from "./constants";
import { attentionItems } from "./domain";

const REVIEWED = new Set(["Saved", "Ready to Apply", "Skipped", "Closed", "Expired"]);

export const guidanceMilestones = {
  home: "home",
  jobDetail: "job-detail",
  readyToApply: "ready-to-apply",
  preparing: "preparing",
  applied: "applied",
  attention: "attention",
  career: "career",
};

export function deriveGettingStarted(data, profile) {
  const jobs = data?.jobs || [];
  const applications = data?.applications || [];
  return [
    { id: "profile", label: "Set up your career context", complete: Boolean(profile?.current), href: "/career?start=1" },
    { id: "opportunity", label: "Add or import an opportunity", complete: jobs.length > 0, href: jobs.length ? "/jobs" : "/research" },
    {
      id: "evaluation",
      label: "Evaluate an opportunity",
      complete: jobs.some((job) => REVIEWED.has(job.review_status) || Boolean(job.recommendation)),
      href: "/jobs?lifecycle=To%20Review",
    },
    {
      id: "application",
      label: "Prepare your first application",
      complete: applications.some((application) => application.status === "Preparing" || !TERMINAL.includes(application.status)),
      href: "/jobs?lifecycle=Preparing",
    },
  ];
}

export function deriveRecommendedAction({ data, profile, attention } = {}) {
  const workspace = data || { jobs: [], applications: [] };
  const items = attention || attentionItems(workspace);
  const urgent = items.find((item) => item.type === "Deadline" || item.type === "Next action" || item.type === "Assessment" || item.type === "Interview");
  if (urgent) {
    return {
      kind: "operational",
      title: urgent.title,
      description: urgent.detail || "Open the related record and take the next step.",
      actionLabel: "Open next action",
      href: `/jobs/${urgent.job_id}`,
      reason: "An active deadline, next action or scheduled event should be handled first.",
      tutorialMilestone: "progress",
    };
  }
  const preparing = workspace.applications.find((application) => application.status === "Preparing");
  if (preparing) {
    return {
      kind: "application",
      title: "Continue preparing your application",
      description: "Choose the CV, capture questions and finish the parts you want ready before submitting externally.",
      actionLabel: "Continue preparing",
      href: `/jobs/${preparing.job_id}`,
      reason: "An application workspace is open and can move forward.",
      tutorialMilestone: "preparing",
    };
  }
  const ready = workspace.jobs.find((job) => !workspace.applications.some((application) => application.job_id === job.id) && job.review_status === "Ready to Apply");
  if (ready) {
    return {
      kind: "decision",
      title: "Prepare an opportunity you chose",
      description: "Ready to Apply means you decided this opportunity is worth pursuing. It has not been submitted yet.",
      actionLabel: "Open ready opportunity",
      href: `/jobs/${ready.id}`,
      reason: "A decided opportunity is the shortest path to a real application.",
      tutorialMilestone: "ready-to-apply",
    };
  }
  const review = workspace.jobs.find((job) => !workspace.applications.some((application) => application.job_id === job.id) && ["Found", "Reviewing"].includes(job.review_status));
  if (review) {
    return {
      kind: "evaluate",
      title: "Evaluate one opportunity",
      description: "Check the employer facts, research assessment and fit before deciding what to do.",
      actionLabel: "Review an opportunity",
      href: `/jobs/${review.id}`,
      reason: "A researched opportunity still needs a user decision.",
      tutorialMilestone: "job-detail",
    };
  }
  if (!profile?.current) {
    return {
      kind: "profile",
      title: "Set up your career context",
      description: "A few trusted facts help PyoLoker explain fit and prepare work. You can leave unknown fields blank.",
      actionLabel: "Set up my profile",
      href: "/career?start=1",
      reason: "No published profile is available yet.",
      tutorialMilestone: "career",
    };
  }
  if (!workspace.jobs.length) {
    return {
      kind: "find",
      title: "Find your first opportunity",
      description: "Add one vacancy or import a researched batch. PyoLoker will keep the facts and your decisions together.",
      actionLabel: "Add or import a job",
      href: "/research",
      reason: "There are no tracked opportunities yet.",
      tutorialMilestone: "home",
    };
  }
  return {
    kind: "help",
    title: "Keep your search moving",
    description: "Jobs holds the full pipeline; Attention shows what needs action now.",
    actionLabel: "Open Jobs",
    href: "/jobs",
    reason: "No higher-priority action is currently detected.",
    tutorialMilestone: "home",
  };
}
