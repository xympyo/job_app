const cv = (name, positioning, targetRoles, notes = "") => ({
  name,
  positioning,
  targetRoles,
  active: true,
  notes,
});

export const mosheFixture = {
  fixture: "moshe-v1",
  revision: "fixture-moshe-v1",
  identity: { displayName: "Moshe Dayan", contact: { email: "moshe@example.invalid" } },
  careerStage: { status: "final-year student", graduation: "December 2026" },
  education: [{ institution: "President University", field: "Informatics / Computer Science", studyPeriod: "August 2023 – expected graduation December 2026", gpa: "approximately 3.80", expectedGraduation: "December 2026", scholarship: "Jababeka Scholarship: 75%" }],
  experiences: [
    { organization: "PT Mattel Indonesia", title: "Process Engineering Intern | Data & Software Development", type: "internship", dates: "August 2025 – August 2026 (completed)", evidence: ["EDEN internal engineering information system centralizing 267,000+ records", "replaced selected 4+ hour Excel/manual workflows with API-driven processing in under 30 seconds", "OMNI manufacturing-layout optimization: selected workflows from days to approximately 60 minutes and approximately 4% throughput improvement", "ASP.NET Core, SQL, Python, APIs, IBM i/AS400 and enterprise integration", "presented solutions/results to engineering users, regional directors, VPs and global manufacturing leadership", "Champion — Mattel Global Manufacturing Internship Project Competition 2026"] },
    { organization: "Homize", title: "Freelance Software Developer / Technical Project Lead", type: "freelance/project", evidence: ["two-person development team", "translated ambiguous client needs into scope and architecture", "built a service marketplace with booking, chat, vouchers, RBAC, service management and workflow/state transitions", "public project value approximately IDR 25 million"] },
  ],
  projects: [
    { name: "EDEN", description: "Internal manufacturing/engineering information system.", evidence: ["centralized 267,000+ records for capacity planning, tooling readiness, milestone tracking, workload visibility and engineering-data management"] },
    { name: "OMNI", description: "Optigrid Metaheuristics Nesting Intelligence manufacturing-layout optimization.", evidence: ["selected planning workflows reduced from days to approximately 60 minutes", "approximately 4% throughput improvement"] },
    { name: "Pyomanizer", description: "Public AI/text-rephrasing web application.", evidence: ["approximately 1.1M+ characters and 1,500+ documents of usage", "product ownership, deployment and software delivery"] },
    { name: "Deep Learning Product Package Verification", description: "Four-person academic proof of concept.", evidence: ["pipeline design and dataset/data work", "YOLO, Hi-SAM, Parseq OCR and Llama 4"] },
  ],
  leadership: [{ organization: "PUMA / HIMA Informatics", title: "Senior Treasurer / Treasurer", dates: "Approximately December 2023 – August 2025", evidence: ["managed combined organizational cashflow above IDR 100 million", "standardized treasury workflows and implemented controls", "mentored junior treasurers"] }],
  skills: ["process improvement", "digital transformation", "requirements analysis", "systems integration", "software development", "stakeholder communication"],
  languages: ["Indonesian", "English"],
  targetRoles: ["Management Trainee / Graduate Program", "Product", "Analyst", "Digital Transformation", "Technology Consulting"],
  locationPreferences: ["Jakarta", "Cikarang", "Jabodetabek"],
  workPreferences: { modes: ["Onsite", "Hybrid"], relocation: "open to relevant opportunities" },
  constraints: { expectedGraduation: "December 2026", availabilityBeforeGraduation: "Not specified; evaluate each employer's start-date and eligibility requirement. Do not infer general unavailability before graduation." },
  evidence: ["Mattel internship is an internship, not full-time employment.", "Homize is freelance/project work.", "Expected graduation is not the same as unavailability before graduation."],
  freeformNotes: "I want work at the intersection of technology, operations, products, and leadership.",
  cvVariants: [
    cv("Master", "Broad technical problem-solving, systems, and manufacturing digitalisation.", ["Software Engineering", "Automation", "Technology Consulting"]),
    cv("Analyst", "Requirements, process analysis, systems, workflows, and measurable improvement.", ["Analyst", "Digital Transformation", "Consulting", "Process Improvement"]),
    cv("Management/Product", "Leadership, product thinking, stakeholders, ownership, and business outcomes.", ["Management Trainee / Graduate Program", "Product"]),
  ],
};

export const syntheticFinanceFixture = {
  fixture: "synthetic-finance-v1",
  revision: "fixture-synthetic-finance-v1",
  identity: { displayName: "Rina Santoso", contact: { email: "rina@example.invalid" } },
  careerStage: { status: "final-year student", graduation: "July 2027" },
  education: [{ institution: "Bandung School of Business", field: "Accounting", gpa: 3.62, expectedGraduation: "July 2027" }],
  experiences: [{ organization: "Nusantara Ledger Co.", title: "Audit Intern", type: "internship", evidence: ["reconciliations", "audit workpapers"] }],
  projects: [{ name: "Campus Budget Lab", evidence: ["forecasting", "financial analysis"] }],
  leadership: [{ organization: "Finance Society", evidence: ["treasurer", "event budgeting"] }],
  skills: ["financial modelling", "Excel", "reconciliation", "audit testing", "business writing"],
  languages: ["Indonesian", "English"],
  targetRoles: ["Audit", "Finance", "Accounting", "Banking", "Financial Analyst"],
  locationPreferences: ["Bandung", "Surabaya", "Yogyakarta"],
  workPreferences: { modes: ["Hybrid", "Onsite"], relocation: "open within Indonesia" },
  constraints: { expectedGraduation: "July 2027", availabilityBeforeGraduation: "Not specified; evaluate each employer's start-date and eligibility requirement." },
  evidence: ["Audit internship is internship experience.", "Budget Lab is an academic project."],
  freeformNotes: "I enjoy making financial information understandable for operating teams.",
  cvVariants: [
    cv("General", "Broad accounting and business foundation.", ["Accounting", "Banking"]),
    cv("Audit", "Controls, testing, reconciliations, and audit evidence.", ["Audit", "Risk"]),
    cv("Finance", "Forecasting, modelling, and decision support.", ["Finance", "Financial Analyst"]),
  ],
};

export const mosheJobs = [
  { id: "job-moshe-1", company: "Example Logistics", title: "Operations Analyst", location: "Jakarta", roleFamily: "Analyst", reviewStatus: "Reviewing", postingStatus: "Verified open", foundAt: "2026-09-15", fitScore: 86, sources: [{ sourceName: "Company careers", sourceType: "Official careers", sourceUrl: "https://example.invalid/jobs/1" }] },
  { id: "job-moshe-2", company: "Example Technology", title: "Associate Product Manager", location: "Cikarang", roleFamily: "Product", reviewStatus: "Ready to Apply", postingStatus: "Verified open", foundAt: "2026-09-14", fitScore: 91, sources: [{ sourceName: "Company careers", sourceType: "Official careers", sourceUrl: "https://example.invalid/jobs/2" }] },
];

export const syntheticJobs = [
  { id: "job-synthetic-1", company: "Northwind Bank", title: "Financial Analyst", location: "Bandung", roleFamily: "Financial Analyst", reviewStatus: "Reviewing", postingStatus: "Unknown", foundAt: "2026-09-15", fitScore: 88, sources: [{ sourceName: "Bank careers", sourceType: "Official careers", sourceUrl: "https://example.invalid/finance/1" }] },
];
