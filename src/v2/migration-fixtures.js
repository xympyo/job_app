/* Explicit migration inputs are source-bounded configuration, not runtime user branches. */
const sourceMaterial = [
  { reference: "docs/02_USER_PROFILE.md", label: "Canonical user profile", authority: "user_confirmed", availability: "available" },
  { reference: "docs/CV_STRATEGY.md", label: "Accepted CV strategy", authority: "user_confirmed", availability: "available" },
  { reference: "docs/TRIAGE.md", label: "Current timing and triage rules", authority: "source_material", availability: "available" },
  { reference: "docs/v2/V2_PRODUCT_CONTRACT.md", label: "Locked V2 contract", authority: "source_material", availability: "available" },
];

const profile = {
  identity: { displayName: "Moshe Dayan" },
  careerStage: { status: "final-year Informatics / Computer Science student", graduation: "December 2026" },
  education: [{ institution: "President University", field: "Informatics / Computer Science", studyPeriod: "August 2023 – expected graduation December 2026", gpa: 3.8, expectedGraduation: "December 2026", scholarship: "Jababeka Scholarship: 75%" }],
  experiences: [
    { organization: "PT Mattel Indonesia", title: "Process Engineering Intern | Data & Software Development", type: "internship", dates: "August 2025 – August 2026 (completed)", evidence: [
      "Built and improved EDEN, an internal manufacturing information system centralizing 267,000+ records.",
      "Replaced selected 4+ hour Excel/manual workflows with API-driven processing in under 30 seconds.",
      "Supported OMNI manufacturing-layout optimization, reducing selected workflows from days to approximately 60 minutes and improving throughput by approximately 4%.",
      "Worked across ASP.NET Core, SQL, Python, APIs, IBM i/AS400 and enterprise integration.",
      "Presented solutions and results to engineering users, regional directors, VPs and global manufacturing leadership.",
      "Champion — Mattel Global Manufacturing Internship Project Competition 2026.",
    ] },
    { organization: "Homize", title: "Freelance Software Developer / Technical Project Lead", type: "freelance/project", evidence: [
      "Worked in a two-person development team translating ambiguous client needs into scope and architecture.",
      "Built a service marketplace with booking, chat, vouchers, RBAC, service management and workflow/state transitions.",
      "Public project value was approximately IDR 25 million.",
    ] },
  ],
  projects: [
    { name: "EDEN", description: "Internal manufacturing/engineering information system.", context: "PT Mattel Indonesia — Process Engineering Intern", evidence: ["Centralized 267,000+ records for capacity planning, tooling readiness, milestone tracking, workload visibility and engineering-data management."] },
    { name: "OMNI", description: "Optigrid Metaheuristics Nesting Intelligence manufacturing-layout optimization.", context: "PT Mattel Indonesia — Process Engineering Intern", evidence: ["Selected planning workflows reduced from days to approximately 60 minutes.", "Approximately 4% throughput improvement."] },
    { name: "Pyomanizer", description: "Public AI/text-rephrasing web application.", evidence: ["Approximately 1.1M+ characters and 1,500+ documents of usage.", "Product ownership, deployment and software delivery."] },
    { name: "Deep Learning Product Package Verification", description: "Four-person academic proof of concept.", evidence: ["Pipeline design and dataset/data work.", "YOLO, Hi-SAM, Parseq OCR and Llama 4."] },
  ],
  leadership: [{ organization: "PUMA / HIMA Informatics", title: "Senior Treasurer / Treasurer", dates: "Approximately December 2023 – August 2025", evidence: [
    "Managed combined organizational cashflow above IDR 100 million.",
    "Standardized treasury workflows and implemented controls.",
    "Mentored junior treasurers; Compsphere budget was above IDR 70 million.",
  ] }],
  skills: ["process improvement", "digital transformation", "requirements analysis", "systems integration", "software development", "stakeholder communication", "product delivery", "technical project leadership"],
  languages: ["Indonesian", "English"],
  targetRoles: ["Management Trainee / Graduate Program", "Product", "Analyst", "Digital Transformation", "Technology Consulting"],
  locationPreferences: ["Jakarta", "Cikarang", "Bekasi", "Jabodetabek"],
  workPreferences: { employmentType: { primary: "Full-time", secondary: ["Internship", "Freelance", "Contract"], rule: "Prioritize full-time work; consider other types when explicitly requested, unusually strategic, or suitable while still a student." }, modes: ["Onsite", "Hybrid", "Remote acceptable where appropriate"], relocation: "Case-by-case" },
  constraints: { expectedGraduation: "December 2026", availabilityBeforeGraduation: "Unknown; evaluate each employer's actual start-date and eligibility requirement. Do not infer general unavailability before graduation." },
  evidence: ["Mattel is an internship, not full-time employment.", "Homize is freelance/project work, not ordinary full-time employment.", "PUMA/HIMA evidence is leadership, separate from employment.", "Expected graduation does not establish general unavailability before graduation.", "No supported work-authorisation claim is included."],
  freeformNotes: "I want work at the intersection of technology, operations, products, and leadership. I use coding as a tool for solving broader business and process problems, and I want to grow toward work with wider ownership.",
};

const sourceMapJson = {
  identity: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md", note: "Name and professional identity are explicitly documented." }],
  careerStage: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md", note: "Final-year status and expected graduation are documented." }, { kind: "source_material", reference: "docs/TRIAGE.md", note: "Timing rule prevents inferring general unavailability." }],
  education: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }],
  experiences: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md", note: "Mattel internship and Homize freelance/project boundaries." }],
  projects: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }],
  leadership: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }],
  skills: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }, { kind: "source_material", reference: "docs/CV_STRATEGY.md" }],
  languages: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }],
  targetRoles: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }, { kind: "source_material", reference: "docs/CV_STRATEGY.md" }],
  locationPreferences: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }],
  workPreferences: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }],
  constraints: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md" }, { kind: "source_material", reference: "docs/TRIAGE.md" }],
  freeformNotes: [{ kind: "user_confirmation", reference: "docs/02_USER_PROFILE.md", note: "Preserved as freeform user-authored context." }],
};

const cvVariants = [
  { id: null, slug: "master", name: "Master", positioning: "Broad technical problem-solving, systems, and manufacturing digitalisation.", targetRoles: ["Software Engineering", "Automation", "Technology Consulting"], active: true, notes: "Existing semantic V1 variant; preserve its V1 ID and history when an authorized snapshot is available." },
  { id: null, slug: "analyst", name: "Analyst", positioning: "Requirements, process analysis, systems, workflows, and measurable improvement.", targetRoles: ["Analyst", "Digital Transformation", "Consulting", "Process Improvement"], active: true, notes: "Existing semantic V1 variant; preserve its V1 ID and history when an authorized snapshot is available." },
  { id: null, slug: "management-product", name: "Management/Product", positioning: "Leadership, product thinking, stakeholders, ownership, and business outcomes.", targetRoles: ["Management Trainee / Graduate Program", "Product"], active: true, notes: "Existing semantic V1 variant; preserve its V1 ID and history when an authorized snapshot is available." },
];

export const mosheShadowMigrationInput = {
  sourceMaterial,
  profile: { ...profile, sourceMapJson },
  cvVariants,
  metadata: {
    migrationId: "shadow-moshe-v2",
    generatedAt: "2026-09-16T00:00:00.000Z",
    ambiguity: [
      { item: "Exact Mattel role wording and internship date boundaries", reason: "Current documents support the internship boundary but should be confirmed before publication." },
      { item: "Exact Homize dates and preferred title wording", reason: "Current documents support freelance/project technical leadership but do not establish a complete date range." },
      { item: "Future document versions for the three CV variants", reason: "Legacy local files are not uploaded into V2 and require explicit user action." },
    ],
    exclusions: [
      { item: "Work authorisation", reason: "No current canonical evidence supports a work-authorisation claim." },
      { item: "Historical job/application counts", reason: "Documented counts are stale snapshots and no authorized live export is available." },
      { item: "Legacy filesystem paths", reason: "Paths are diagnostic metadata only and are excluded from the candidate and Career Packs." },
      { item: "Assistant-generated career interpretations", reason: "Interpretations such as 'strong product manager' are not factual evidence." },
      { item: "Unsupported salary preferences and older targets", reason: "Not present in current accepted source material." },
    ],
    ownerConfirmedPreferences: [
      { item: "Primary employment goal", value: "Full-time work", source: "owner confirmation" },
      { item: "Preferred locations", value: "Jakarta, Cikarang, Bekasi, Jabodetabek", source: "owner confirmation" },
      { item: "Work modes", value: "Onsite, Hybrid, Remote acceptable where appropriate", source: "owner confirmation" },
      { item: "Relocation", value: "Case-by-case", source: "owner confirmation" },
    ],
  },
};

export { sourceMaterial, profile, cvVariants };
