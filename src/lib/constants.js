export const REVIEW_STATES = [
  "Found",
  "Reviewing",
  "Saved",
  "Ready to Apply",
  "Skipped",
  "Expired",
  "Closed",
];
export const STAGES = [
  "Preparing",
  "Applied",
  "Assessment / OA",
  "HR Interview",
  "User / Hiring Manager Interview",
  "Technical / Case Interview",
  "Final Interview",
  "Offer",
  "Withdrawn",
  "Rejected",
  "Expired",
  "Closed",
  "Offer Declined",
  "Offer Accepted",
];
export const POST_SUBMISSION_STAGES = [
  "Applied",
  "Assessment / OA",
  "HR Interview",
  "User / Hiring Manager Interview",
  "Technical / Case Interview",
  "Final Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
  "Offer Declined",
  "Offer Accepted",
];
export const TERMINAL = [
  "Withdrawn",
  "Rejected",
  "Expired",
  "Closed",
  "Offer Declined",
  "Offer Accepted",
];
export const ROLE_FAMILIES = [
  "Analyst",
  "Digital Transformation",
  "Product",
  "Management Trainee / Graduate Program",
  "Consulting",
  "Process Improvement / Operational Excellence",
  "Solutions / Technical Consulting",
  "Software Engineering",
  "Automation",
  "AI / Data",
  "Other",
];
export const FIT_LABELS = [
  "Excellent Fit",
  "Strong Fit",
  "Possible Fit",
  "Stretch",
  "Weak Fit",
];
export const RECOMMENDATIONS = [
  "Apply ASAP",
  "Apply",
  "Apply if interested",
  "Research first",
  "Low priority",
  "Skip",
];
export const POSTING_STATES = [
  "Unknown",
  "Verified open",
  "Possibly open",
  "Closed",
  "Expired",
];
export const STATUS_HELP = {
  Found: "New opportunity not reviewed yet.",
  Reviewing: "You are evaluating whether this role fits.",
  Saved: "Worth keeping in your shortlist for later.",
  "Ready to Apply": "You decided this opportunity is worth applying to.",
  Preparing: "You are preparing the application; it has not been submitted.",
  Applied: "You submitted the application externally.",
  "Possibly open": "The posting may still be available; verify before applying.",
  Unverified: "No verification timestamp is recorded for this posting.",
  "Not timestamped": "The posting state is recorded, but no verification date is stored.",
};
export const WORK_MODES = ["Onsite", "Hybrid", "Remote", "Unknown"];
export const QUESTION_TYPES = [
  "motivation",
  "behavioral",
  "leadership",
  "technical",
  "scenario",
  "compensation",
  "relocation",
  "eligibility",
  "free_text",
  "multiple_choice",
  "other",
];
export const REJECTION_STAGES = [
  "CV screening",
  "initial application",
  "online assessment",
  "HR interview",
  "hiring manager interview",
  "technical interview",
  "case study",
  "final interview",
  "unknown",
];
export const TABLES = [
  "cv_versions",
  "companies",
  "research_runs",
  "jobs",
  "job_sources",
  "applications",
  "application_questions",
  "application_events",
];
export const LOCAL_USER = "00000000-0000-4000-8000-000000000001";
export const CV_SEEDS = [
  {
    name: "Master",
    slug: "master",
    description:
      "A broad foundation for technical problem-solving, systems and manufacturing digitalization.",
    target_roles: [
      "Software Engineering",
      "Automation",
      "Solutions / Technical Consulting",
    ],
    file_reference:
      "D:\\Moshe\\CV_Revised\\MosheDayan_CV_Full_Revised_Sep2026.pdf",
  },
  {
    name: "Analyst",
    slug: "analyst",
    description:
      "Requirements → process analysis → systems and workflows → measurable improvement.",
    target_roles: [
      "Analyst",
      "Digital Transformation",
      "Consulting",
      "Process Improvement / Operational Excellence",
    ],
    file_reference:
      "D:\\Moshe\\CV_Revised\\Analyst\\MosheDayan_CV_Full_Revised_Sep2026.pdf",
  },
  {
    name: "Management/Product",
    slug: "management-product",
    description:
      "Leadership, product thinking, stakeholders, ownership and business outcomes.",
    target_roles: ["Management Trainee / Graduate Program", "Product"],
    file_reference:
      "D:\\Moshe\\CV_Revised\\Managerial\\MosheDayan_CV_Full_Revised_Sep2026.pdf",
  },
];
