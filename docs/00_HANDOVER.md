ASTRA HANDOVER — PERSONAL CAREER COMMAND CENTER
You are taking over implementation of a new software project for Moshe Dayan.
You are the implementation engineer for this project.
The product/business decisions in this prompt are authoritative unless technical constraints make something impossible or materially unsafe. Do not casually reinterpret the product, redesign its purpose, add speculative features, or broaden scope.
Your first responsibility is to understand and document the system completely. Your second responsibility is to implement the approved V1.
Do not rush directly into coding.
1. PROJECT PURPOSE
Build a private, responsive Personal Career Command Center for one user.
This is not simply a job application tracker.
Its purpose is to become the persistent operational workspace connecting:
- job discovery
- job research
- candidate-job fit analysis
- CV selection
- vacancy review
- application tracking
- application questions
- assessments
- recruiter interactions
- interview stages
- rejection / offer outcomes
- career-search history
The system exists because finding appropriate vacancies, evaluating whether they genuinely fit the candidate, remembering which CV was used, tracking forms/interviews, and learning from application outcomes becomes difficult when spread across LinkedIn, Jobstreet, company career sites, chat conversations, notes, and spreadsheets.
The application must therefore serve as the persistent operational database and user interface.
AI systems such as ChatGPT or Astra perform research and reasoning on demand, but there is intentionally no background autonomous scraping service.
2. CORE OPERATING MODEL
There are three actors.
User — Moshe
Moshe is the final decision-maker.
He decides whether to:
- apply
- save
- skip
- withdraw
- accept/reject an offer
- change career priorities
- modify application answers
- override recommendations
The system must never behave as though an AI recommendation is authoritative over the user.
ChatGPT / AI Researcher
The AI may be asked manually to:
- search the public web for vacancies
- investigate companies
- verify vacancy freshness
- compare jobs against Moshe’s profile
- recommend whether he should apply
- recommend which CV variant to use
- identify requirement gaps
- help interpret application forms
- draft application answers
- prepare for assessments
- help prepare interviews
- analyze rejection patterns
- provide career mentorship
Research happens when explicitly requested, not continuously.
Astra / Coding Agent
Astra implements and maintains the software.
Astra should not redefine career strategy without explicit instruction.
3. ABSOLUTE SCOPE RULE
NO AUTONOMOUS JOB SCRAPING OR BACKGROUND AUTOMATION IN V1.
Do not create:
- cron jobs
- continuously running crawlers
- background search agents
- LinkedIn scrapers
- Jobstreet scrapers
- browser automation
- auto-apply bots
- cloud workers for vacancy harvesting
- automated application submission
- automated recruiter messaging
Vacancies will enter the application through:
1. manual user entry
2. structured AI research results
3. later import mechanisms
4. possibly a direct database integration with ChatGPT/Supabase
This architectural decision is intentional.
The product is the workspace, not the crawler.
4. TARGET TECHNOLOGY STACK
Use:
- React
- Vite
- JavaScript
- Tailwind CSS v4
- Supabase
- PostgreSQL through Supabase
- Supabase Auth
- Vercel deployment
- Git
Do not switch to Next.js unless explicitly approved.
Do not introduce TypeScript merely because you personally prefer it.
This user is comfortable with React + Vite + JavaScript.
The application must run locally before Supabase production connection is required.
Environment-specific secrets must use environment variables.
Never commit secrets.
Expected environment convention may include:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
Add an .env.example.
5. DOCUMENTATION IS PART OF THE PRODUCT
Before substantial implementation, create:
/docs
  00_HANDOVER.md
  01_PRODUCT.md
  02_USER_PROFILE.md
  03_UX_WORKFLOWS.md
  04_DATABASE.md
  05_JOB_SCORING.md
  06_RESEARCH_RULES.md
  07_APPLICATION_WORKFLOW.md
  08_ARCHITECTURE.md
  09_DECISIONS.md
  10_CURRENT_STATE.md
Also create at repository root:
README.md
AGENTS.md
These files are extremely important.
Future ChatGPT/Astra sessions should be able to receive the instruction:
Read /docs, especially 00_HANDOVER.md and 10_CURRENT_STATE.md, then continue the project.

…and recover the project correctly.
Documentation rules
02_USER_PROFILE.md is the canonical candidate profile.
Do not duplicate changing profile facts throughout many files unnecessarily.
Reference the canonical profile when possible.
09_DECISIONS.md is append-oriented.
Important architectural/product decisions should include:
- date
- decision
- rationale
- implications
If a decision changes later, preserve the old decision and append the replacement rather than silently rewriting history.
10_CURRENT_STATE.md must remain concise and operational.
Use approximately:
# Current State

Last Updated:
YYYY-MM-DD

## Current Phase

## Completed

## In Progress

## Next

## Blockers

## Important Recent Decisions
Update this file after meaningful implementation milestones.
AGENTS.md should instruct future coding agents to read the documentation before making changes.
6. CANDIDATE PROFILE — CANONICAL STARTING POINT
Populate 02_USER_PROFILE.md using the following.
Identity
Name: Moshe Dayan
Location: Cikarang / Jakarta metropolitan area, Indonesia
Education:
Bachelor of Informatics
President University
Aug 2023 – expected Dec 2026
Current GPA: approximately 3.80 / 4.00
Jababeka Scholarship 75% Awardee
Career stage:
Final-year student / fresh-graduate candidate with significant internship and project experience.
Professional identity
Do not reduce Moshe to merely:
- software developer
- AI engineer
- web developer
- process engineer
His preferred professional identity is:
Technical problem-solver who turns messy business and operational problems into systems, processes, products, and practical solutions.

He enjoys ambiguous problems where the first response is effectively:
“Hmm… what the fuck is actually happening here?”

He wants to investigate, brainstorm, understand constraints, talk to stakeholders, model problems, evaluate alternatives, and help determine what should be built or changed.
He does not want his career centered around being a pure “code monkey” executing endless implementation tickets.
He is comfortable coding and wants to remain technically capable, but coding is a tool rather than the entirety of his desired professional identity.
Long-term ambition:
leadership / management

He finds managerial roles attractive and wants progressively larger ownership of problems, people, projects, systems, or business outcomes.
7. TARGET CAREER FAMILIES
Primary career tracks:
Analyst / Transformation
Target titles may include:
- System Analyst
- Business Analyst
- IT Business Analyst
- Business Systems Analyst
- Digital Transformation Analyst
- Technology Analyst
- Technology Consultant
- Digitalization roles
- Process Improvement
- Operational Excellence
- Business Process Improvement
Management / Product
Target titles may include:
- Management Trainee
- Management Development Program
- Graduate Development Program
- Graduate Trainee
- Future Leaders Program
- Associate Product Manager
- Product Analyst
- Junior Product roles
- Project / Program graduate roles
Secondary tracks:
- Solutions Engineer
- Technical Consultant
- Automation Engineer
- Manufacturing Systems Engineer
- Software Engineer
- Backend Engineer
- Full-Stack Engineer
Software roles remain valid but are not the central career identity.
AI/ML roles are possible but currently secondary rather than the default target.
8. GEOGRAPHIC STRATEGY
Primary:
Indonesia.
Especially:
- Jakarta
- Greater Jakarta / Jabodetabek
- Bekasi
- Cikarang
- nearby industrial/business centers
Remote opportunities are acceptable and should be considered, including international ones.
However:
Remote should not automatically receive higher priority merely because it is remote.
Career growth, ownership, problem complexity, mentorship, company quality, compensation, and role alignment matter more.
The candidate is willing to consider challenging onsite or hybrid opportunities.
9. PROFESSIONAL EXPERIENCE
PT Mattel Indonesia
Role:
Process Engineering Intern | Data & Software Development
Period:
Aug 2025 – Aug 2026
Internship is finished.
Do not present it as current employment.
Core work included manufacturing digitalization, software systems, process improvement, automation, optimization, data systems, and stakeholder delivery.
Important accomplishments include:
Project EDEN
Internal manufacturing information / engineering system.
Centralized approximately:
267,000+ records
Supported areas including:
- capacity planning
- tooling readiness
- engineering milestone tracking
- workload visibility
- inventory / engineering-data management
- planning workflows
Technology included combinations of:
- ASP.NET Core
- SQL Server
- Python
- REST APIs
- internal systems integration
Moshe worked not merely as a developer.
He investigated operational processes and translated requirements into systems and workflows.
API / demand integration
Replaced a manual Excel-oriented process taking:
4+ hours
with API-driven integration delivering updated information in:
under 30 seconds
Some historical portfolio material may contain slightly different timing such as ~10 seconds.
The conservative CV fact currently used is:
under 30 seconds.
OMNI
Official preferred project identity:
OMNI
Full historical expansion:
Optigrid Metaheuristics Nesting Intelligence
It is a manufacturing layout optimization system.
A public white-label portfolio version was historically called:
Autovas
Autovas and OMNI are the same underlying project / system lineage, not two independent accomplishments.
Prefer OMNI going forward.
The system involved concepts including:
- geometry analysis
- production constraints
- cavity layouts
- SAT collision logic
- 2D packing
- heuristic/metaheuristic optimization
- simulated annealing
- equalization rules
- operator workflow considerations
Validated outcomes include approximately:
planning workflow: days → ~60 minutes
and
~4% throughput improvement in validated cases
Do not inflate these figures.
Legacy automation
Worked with:
- IBM i / AS400
- IBM Personal Communications / PCOMM
- enterprise workflow automation
- modern internal applications / integrations
Stakeholders
Presented solutions/results to:
- engineering users
- regional directors
- VPs
- global manufacturing leadership
Major award
Champion — Mattel Global Manufacturing Internship Project Competition 2026
This is a major career signal.
10. HOMIZE
Homize was not normal employment.
It was a contract/freelance software project.
Preferred framing:
Freelance Software Developer / Technical Project Lead
or suitable equivalent.
Do not falsely portray Homize as if the company employed Moshe full-time.
The client approached the team with a startup-like service marketplace idea.
Moshe helped:
- interpret ambiguous client needs
- scope the system
- negotiate project value
- design architecture
- coordinate development
- build product workflows
- deliver/deploy the system
Team size:
2 developers
Product included:
- multi-vendor services
- real-time chat
- booking
- vouchers
- role-based functionality
- service management
- workflows/state transitions
Approximate final project value to use publicly:
~IDR 25 million
Historical documents contain conflicting 25M / 30M figures.
Use the conservative approximately IDR 25M unless Moshe later confirms otherwise.
Do not repeat the old “12M → 30M” statement as hard fact.
11. LEADERSHIP EXPERIENCE
Moshe served as:
Senior Treasurer & Treasurer
President University Major Association Informatics / HIMA.
Period approximately:
Dec 2023 – Aug 2025
Key evidence:
- managed combined organizational cashflow exceeding IDR 100 million
- managed end-to-end fiscal operations
- Compsphere 2024 budget exceeded IDR 70 million
- standardized treasury workflows
- implemented financial controls
- mentored junior treasurers
- reduced dependency on individual team members
This experience is particularly relevant for:
- Management Trainee
- graduate leadership programs
- product/management roles
- project management
- roles assessing leadership potential
12. SELECTED PROJECTS
Pyomanizer
Public AI/text rephrasing web application.
Built end-to-end.
Usage milestone currently used:
- 1.1M+ characters
- 1,500+ documents
Do not position it as advanced ML if its implementation does not justify that claim.
The important signal is:
- product ownership
- software development
- deployment
- real users
- measurable usage
Deep Learning Product Package Verification
Academic concentration project / proof of concept using a Mattel-themed case study.
Group size:
4
Completed before internship.
Pipeline involved:
- YOLO
- Hi-SAM
- Parseq OCR
- Llama 4
Moshe contributed to end-to-end pipeline design and dataset/data-scraping work.
Keep its academic/proof-of-concept nature clear.
13. CURRENT CV STRATEGY
There are currently three one-page CV variants.
They must be represented in the system as first-class entities.
Do not assume one CV fits every vacancy.
Master CV
Broad baseline / source-of-truth.
Positioning:
technical problem-solving, manufacturing digitalization, process improvement, software systems, automation, optimization.
Analyst / Digital Transformation CV
Optimized for:
- System Analyst
- Business Analyst
- IT Business Analyst
- Digital Transformation
- Technology Analyst
- Technology Consultant
- business systems
- process improvement
Keyword themes include:
- System Analysis
- Requirements Analysis
- Business Process Improvement
- Workflow Design
- System Integration
- Data Analysis
- Automation
- REST APIs
- SQL
This version emphasizes:
requirements → process analysis → system/workflow → integration → measurable improvement.
Management / Product CV
Optimized for:
- Management Trainee
- Graduate Development
- Associate Product Manager
- Product Analyst
- leadership-track roles
Themes include:
- Project Management
- Stakeholder Management
- Product Development
- Requirements Analysis
- Business Process Improvement
- Cross-functional Collaboration
- Data Analysis
- Decision-Making
This version emphasizes:
leadership, coordination, product thinking, stakeholder communication, ownership, business outcomes, and trade-offs.
14. LINKEDIN STRATEGY
LinkedIn should remain a stable umbrella profile.
Do not constantly rewrite LinkedIn for every job.
The targeted CV carries role-specific positioning.
LinkedIn should broadly communicate:
- former Mattel Engineering Intern
- manufacturing digitalization
- software
- automation
- AI
- systems/problem-solving
Avoid making Moshe appear to change professional identity every few days.
LinkedIn factual consistency matters:
- Mattel ended Aug 2026
- GPA approximately 3.80
- Homize approximately IDR 25M
- OMNI and Autovas are the same project lineage
15. RESEARCH PHILOSOPHY
The system must support AI-assisted research, but AI reasoning must remain explainable.
Every researched vacancy should ideally capture:
- company
- exact job title
- location
- work mode
- employment type
- role family
- seniority
- description
- requirements
- preferred requirements
- source
- application URL
- original source URL
- deadline if known
- date found
- last verified timestamp
- freshness/status
- recommended CV
- candidate strengths
- candidate gaps
- potential red flags
- research notes
- fit recommendation
- evidence / explanation
Do not fabricate missing values.
Unknown information should remain null, unknown, or equivalent.
16. SOURCE / VERIFICATION MODEL
Vacancy discovery sources may include:
- official company career pages
- LinkedIn
- Jobstreet
- Glints
- Kalibrr
- Indeed
- university career centers
- reputable recruitment platforms
- other public sources
Preferred confidence hierarchy:
Official company careers

official company/recruiter posting

major reputable job platform

secondary sources
A vacancy may have multiple sources.
Therefore jobs and job sources must be separate concepts.
Example:
One Unilever role may appear on:
- Jobstreet
- LinkedIn
- Unilever careers
This must remain one job with multiple sources, not three jobs.
17. DEDUPLICATION
V1 must support a sensible deduplication model.
Potential matching factors:
- normalized company name
- normalized job title
- location
- application URL
- official requisition ID if available
- source URLs
Do not rely solely on exact title equality.
Example variations such as:
“IT Business Analyst”
and
“Business Analyst - IT”
may represent the same posting.
V1 can include manual merge/review if automated confidence is uncertain.
Do not create overly complex ML deduplication.
18. FIT SCORING PHILOSOPHY
AI fit scoring must not pretend to be scientifically precise.
A numeric score may be shown, but it must always be accompanied by explanation.
Recommended conceptual dimensions:
- role alignment
- experience match
- qualification match
- career interest
- practical/location fit
Possible normalized score:
0–100.
But the user-facing experience should prominently display categories such as:
- Excellent Fit
- Strong Fit
- Possible Fit
- Stretch
- Weak Fit
Every score should explain:
Why it fits
Examples:
- strong process-improvement experience
- relevant SQL/API experience
- leadership evidence
- digital transformation background
- suitable fresh-graduate seniority
Gaps
Examples:
- asks for SAP
- asks for Power BI
- 2 years of experience preferred
- relocation required
- finance-domain experience preferred
Recommendation
Possible recommendations:
- Apply ASAP
- Apply
- Apply if interested
- Research first
- Low priority
- Skip
CV recommendation
One of:
- Master
- Analyst
- Management/Product
- custom tailoring recommended
19. APPLICATION WORKFLOW
Default job state lifecycle should distinguish discovery from application.
A reasonable workflow:
Found
→ Reviewing
→ Saved
→ Ready to Apply
→ Applied
→ Assessment / OA
→ HR Interview
→ User / Hiring Manager Interview
→ Technical / Case Interview
→ Final Interview
→ Offer
Terminal or alternate states:
Skipped
Withdrawn
Rejected
Expired
Closed
Offer Declined
Offer Accepted
Do not force every company into every stage.
The UI must support flexible transitions.
20. REJECTION STAGE MATTERS
Do not record only:
Rejected
Also preserve where rejection happened.
Examples:
- CV screening
- initial application
- online assessment
- HR interview
- hiring manager interview
- technical interview
- case study
- final interview
- unknown
This supports future analysis such as:
strong at CV screening, weak at case interviews

or
Analyst applications generate interviews more often than MT applications.

21. APPLICATION QUESTIONS
This is a first-class V1 feature.
Many employers ask questions such as:
- Why do you want to join?
- Tell us about yourself.
- Describe a leadership experience.
- Describe a difficult project.
- Why this role?
- Expected salary?
- Willing to relocate?
- Career aspirations?
- What is your greatest achievement?
- What would you do in scenario X?
Store these questions.
Suggested conceptual fields:
application_question
id
application_id
question_text
question_type
required
character_limit
draft_answer
final_answer
reasoning_notes
status
created_at
updated_at
Possible question_type examples:
- motivation
- behavioral
- leadership
- technical
- scenario
- compensation
- relocation
- eligibility
- free_text
- multiple_choice
- other
Do not over-engineer this taxonomy.
AI may help explain:
- what the employer is testing
- which experience is best
- answer strategy
- draft response
The final submitted answer must remain distinguishable from AI drafts.
22. COMPANY RECORDS
Companies should be reusable entities.
Potential fields:
- id
- name
- normalized_name
- website
- careers_url
- industry
- size if known
- headquarters if known
- notes
- created_at
- updated_at
Do not require enrichment for every company.
Unknown values are acceptable.
23. JOB RECORDS
Design a robust but practical schema.
Conceptual fields may include:
id
company_id
title
normalized_title
location_text
city
country
work_mode
employment_type
role_family
seniority
description
responsibilities
requirements
preferred_requirements
salary_min
salary_max
salary_currency
salary_period
deadline
published_at
found_at
last_verified_at
posting_status
source_confidence
fit_score
fit_label
fit_reason
strengths
gaps
red_flags
recommended_cv_id
research_notes
created_at
updated_at
Not every field must be relational.
Use Postgres types sensibly.
JSONB is acceptable for some structured AI/research information where normalization provides little value.
Do not create dozens of unnecessary relational tables.
24. JOB SOURCES
Suggested fields:
id
job_id
source_name
source_type
source_url
apply_url
external_job_id
is_primary
verified_at
created_at
A job may have many sources.
25. APPLICATION RECORDS
Suggested conceptual fields:
id
job_id
status
applied_at
cv_version_id
cover_letter_used
next_action
next_action_at
recruiter_name
recruiter_contact
rejection_stage
rejection_reason
offer_details
notes
created_at
updated_at
Do not store arbitrary highly sensitive information without need.
26. RESEARCH RUNS
Research itself should be traceable.
Suggested fields:
id
started_at
completed_at
research_goal
query_summary
result_count
notes
created_jobs_count
created_at
Potential future linkage between a research run and discovered jobs is useful.
Do not require this for manual job entry.
27. CV VERSIONS
Suggested fields:
id
name
slug
description
target_roles
active
file_reference
notes
created_at
updated_at
Initial records:
Master
Analyst
Management/Product
Actual CV PDFs may initially remain outside Supabase Storage if unnecessary.
Design so file upload/storage can be added later.
28. USER PROFILE DATABASE
Markdown remains the human-readable canonical project knowledge.
Supabase may also contain a profile record for application features.
Do not make the database version silently contradict Markdown.
If profile editing is implemented later, define the source-of-truth policy explicitly.
For V1, one user is enough.
29. AUTHENTICATION
Use Supabase Auth.
This is a private single-user application initially.
Start with:
- email/password
Google OAuth is not required in V1.
Do not build:
- organizations
- teams
- roles/permissions hierarchy
- billing
- public profiles
- invitations
Security must still be appropriate.
Use Row Level Security.
Authenticated users should only access their own records.
Even though the product initially has one user, data models should include user_id where appropriate rather than globally exposing records.
30. RESPONSIVE UX
The app must work properly on:
- desktop
- laptop
- tablet
- phone
Responsive behavior is not optional.
Moshe expects to check jobs and application status from his phone.
Do not simply shrink a large desktop table.
31. DESKTOP INFORMATION ARCHITECTURE
A useful desktop pattern is:
Navigation
   |
Job/Application list
   |
Selected item details
A split view is desirable where appropriate.
The user should be able to scan several jobs quickly without excessive navigation.
32. MOBILE INFORMATION ARCHITECTURE
Mobile should emphasize:
- cards
- clear statuses
- major actions
- minimal horizontal scrolling
Primary areas should include:
Inbox
Unreviewed / discovered opportunities.
Applications
Jobs the user has actually applied to or is preparing.
Attention
Items requiring action:
- deadlines
- unfinished forms
- upcoming interviews
- assessments
- recruiter follow-up
- next actions
Do not overload the mobile interface.
33. HOME DASHBOARD
The dashboard should be operational, not decorative.
Useful widgets/cards may include:
- New jobs to review
- Ready to apply
- Applications in progress
- Needs attention
- Upcoming deadlines
- Upcoming interviews
- Recent activity
Avoid meaningless vanity charts.
Analytics can come later.
34. JOB INBOX
Jobs discovered but not yet acted upon should land in the Inbox.
Each card should communicate at minimum:
- company
- role
- location
- fit label
- deadline if known
- freshness
- recommended CV
- review status
Possible quick actions:
- Review
- Save
- Skip
- Apply / Ready
- Open source
35. JOB DETAIL EXPERIENCE
This is one of the most important screens.
It should provide sections such as:
Header
Company
Role
Location
Work mode
Source
Deadline
Posting freshness
Fit
Fit score / label
Recommendation
For example:
Apply
Why this fits
Human-readable explanation.
Candidate strengths
Specific to Moshe.
Gaps
Requirements missing or uncertain.
Red flags
Anything concerning.
Recommended CV
Master / Analyst / Management-Product.
Job description / requirements
Readable formatting.
Sources
All known job sources.
Notes
User and AI notes.
Application status
If already applied.
36. APPLICATION DETAIL EXPERIENCE
Once applied, the workspace should expand into:
- application stage
- date applied
- CV used
- job snapshot
- next action
- application questions
- assessments
- interview records
- recruiter/contact info
- notes
- outcome
Do not destroy original job information if the source listing later disappears.
Consider storing a snapshot of relevant vacancy content at application time.
37. APPLICATION QUESTIONS UX
Users should be able to:
- add question
- edit question
- paste question from application form
- specify character limit
- draft answer
- save final answer
- mark completed
- preserve notes
Draft and final answer should visually differ.
38. RESEARCH IMPORT
V1 should support a structured way for AI research to enter the product.
Do not build autonomous scraping.
A reasonable initial feature may be:
Import researched jobs from JSON
with validation and preview.
Example high-level payload:
{
  "research_run": {
    "goal": "Find fresh System Analyst and MT roles in Jakarta"
  },
  "jobs": [
    {
      "company": "...",
      "title": "...",
      "location": "...",
      "role_family": "...",
      "source_url": "...",
      "apply_url": "...",
      "deadline": null,
      "fit": {
        "score": 85,
        "label": "Strong Fit",
        "recommendation": "Apply",
        "strengths": [],
        "gaps": [],
        "recommended_cv": "Analyst"
      }
    }
  ]
}
Design the actual schema carefully.
Provide:
- validation
- preview
- deduplication warning
- confirm import
This import path is much more important than building a crawler.
39. DIRECT AI/DATABASE INTEGRATION
A Supabase ChatGPT integration may later allow AI to write directly to the database.
Design tables and documentation so this is straightforward.
However:
Do not make V1 dependent on ChatGPT-specific integrations.
The application must function independently with normal CRUD and import.
40. SEARCH AND FILTERS
V1 needs practical filtering.
Potential filters:
- application status
- role family
- fit
- company
- location
- work mode
- recommended CV
- source
- freshness
- deadline
- saved/skipped state
Full-text search across:
- company
- job title
- notes
is desirable.
Avoid overcomplicated query-builder UI.
41. FRESHNESS
Vacancies decay quickly.
Represent freshness visibly.
Potential categories:
- Fresh
- Recent
- Aging
- Possibly stale
- Closed
- Expired
Do not invent deadline dates.
A vacancy may have no known deadline.
last_verified_at should be displayed where relevant.
42. MANUAL VERIFICATION
The user or AI should be able to mark:
- Verified open
- Possibly open
- Closed
- Expired
- Unknown
Do not silently mark something open forever.
43. NO FAKE AI PRECISION
Never render language such as:
92.783% compatible

Use:
Strong Fit — 86/100

with explanation.
AI analysis must remain interpretable.
44. UX TONE
Professional, clean, calm, information-dense without becoming cluttered.
This is a serious personal productivity system.
Avoid:
- childish gamification
- excessive gradients
- neon cyberpunk styling
- unnecessary animation
- gigantic dashboard charts
- overly playful copy
- startup-marketing fluff
The user values good UI/UX and dislikes unnecessarily complicated navigation.
Prefer:
- clean hierarchy
- readable typography
- compact cards
- clear status badges
- useful whitespace
- straightforward navigation
- responsive layouts
45. ACCESSIBILITY / INTERACTION
Ensure:
- keyboard-accessible controls
- proper labels
- sufficient contrast
- visible focus states
- buttons have understandable text/tooltips
- mobile tap targets are reasonable
- forms expose validation errors clearly
46. ERROR / EMPTY STATES
Design explicit states for:
- no jobs yet
- no applications yet
- research import empty
- failed database request
- authentication failure
- malformed import
- duplicate detected
- missing job source
- expired job
- job source unavailable
Do not leave blank pages.
47. DATA EXPORT
Long-term data ownership is important.
V1 or an early follow-up should allow export in:
- JSON
- CSV where reasonable
At minimum export:
- jobs
- applications
- application questions
- notes
The user must not become trapped in the software.
Document this even if export is scheduled just after V1.
48. WHAT V1 MUST INCLUDE
V1 completion requires:
- React/Vite project
- Tailwind v4
- responsive UI
- Supabase integration architecture
- Supabase Auth
- Row Level Security
- Job Inbox
- Job CRUD
- Companies
- Job Sources
- Job Detail
- Fit information
- recommended CV
- Application creation
- Application pipeline/status
- Application Detail
- application questions
- notes
- deadlines / next actions
- responsive phone behavior
- structured research import
- filtering/search
- useful empty/error/loading states
- documentation
- migrations/schema
- validation
- reasonable test coverage
- clean build
49. NOT IN V1
Explicitly exclude:
- autonomous scraping
- cron jobs
- auto applying
- email automation
- calendar automation
- browser extension
- salary prediction
- recommendation ML
- embedded paid LLM API
- recruiter CRM
- automatic LinkedIn interactions
- automatic Jobstreet interactions
- mobile native app
- push notifications
- team collaboration
- public accounts
- analytics obsession
- complex reporting dashboards
Do not implement these just because they sound useful.
50. DEVELOPMENT PHASES
Implement in this order.
Phase 0 — Documentation
Create all required Markdown files.
Translate this handover faithfully.
Resolve only technical ambiguities necessary to begin.
Phase 1 — Foundation
Initialize:
- Vite
- React
- JavaScript
- Tailwind CSS v4
- routing
- app layout
- environment config
- linting/testing as appropriate
Phase 2 — Data Architecture
Design Supabase schema.
Create migrations.
Document relationships.
Implement RLS.
Provide local/seed strategy where useful.
Phase 3 — Authentication
Email/password.
Protected application routes.
Session handling.
Logout.
Phase 4 — Core Job Workspace
Companies.
Jobs.
Sources.
Job Inbox.
Job Detail.
Search/filter.
Manual CRUD.
Phase 5 — Fit Analysis Storage
Fit label.
Score.
Why it fits.
Strengths.
Gaps.
Red flags.
Recommendation.
Recommended CV.
Do not require an LLM API.
The user/AI may populate these values externally.
Phase 6 — Applications
Convert job → application.
Application stages.
Next actions.
Dates.
CV used.
Outcome.
Phase 7 — Application Questions
Add/edit/remove questions.
Draft answers.
Final answers.
Character limit.
Status.
Phase 8 — Research Import
Structured JSON.
Preview.
Validation.
Deduplication.
Confirmation.
Phase 9 — Responsive QA
Test common phone widths.
Test tablet.
Test desktop.
Fix overflow.
Phase 10 — Production Readiness
Build.
Tests.
Documentation.
Environment instructions.
Vercel deployment readiness.
51. DATABASE QUALITY RULES
Use migrations rather than undocumented manual schema changes.
Use:
- UUID primary keys
- timestamps
- appropriate foreign keys
- indexes on commonly filtered columns
- sensible delete behaviors
- user_id ownership
- RLS policies
Avoid:
- giant unstructured blob table
- schema over-normalization
- hundreds of tiny lookup tables
- hardcoded statuses scattered across frontend files
Centralize status constants/configuration where appropriate.
52. DATA PRESERVATION
Never destroy historical application information because the source job changed.
Applications represent historical events.
When appropriate, preserve vacancy snapshots.
Rejected applications must remain queryable.
Skipped jobs may remain archived rather than deleted.
53. ROLE TAXONOMY
Initial role families should include approximately:
Analyst
Digital Transformation
Product
Management Trainee / Graduate Program
Consulting
Process Improvement / Operational Excellence
Solutions / Technical Consulting
Software Engineering
Automation
AI / Data
Other
Do not make the taxonomy excessively rigid.
Jobs may reasonably span categories.
54. USER CONTROL
Allow manual overrides of:
- fit
- role family
- recommended CV
- application status
- company
- deadline
- notes
- research assessment
AI-produced data must never become immutable.
55. IMPORTANT PRODUCT PRINCIPLE
The system exists to make Moshe apply to jobs, not to become another programming project that prevents Moshe from applying to jobs.
Whenever deciding whether to build something, ask:
Does this directly help Find → Evaluate → Apply → Progress?

If not, defer it.
This principle should be included prominently in 01_PRODUCT.md and 09_DECISIONS.md.
56. WORKING STYLE WITH MOSHE
Moshe prefers coding agents to investigate, implement, build, test, and troubleshoot independently instead of repeatedly asking him to execute terminal commands.
Do as much implementation and QA as possible yourself.
Ask Moshe primarily for:
- product/business decisions
- credentials/connections only when genuinely required
- subjective UI feedback
- final acceptance
- actions that truly require his external account
Do not turn him into a human terminal.
When blocked, clearly explain:
- what is blocked
- why
- what exact user action is needed
- what happens afterward
57. SUPABASE CONNECTION
Do not block early development solely because production Supabase has not yet been connected.
Build architecture/configuration appropriately.
When credentials/project connection become necessary, stop at the correct boundary and provide concise connection instructions.
Never request sensitive service-role credentials if the frontend only requires normal anonymous/public configuration.
Never expose service-role credentials to the client.
58. SECURITY
At minimum:
- Supabase Auth
- RLS
- per-user ownership
- no secrets committed
- safe validation
- sanitized rendering
- safe external links
- no dangerously injected vacancy HTML
- no arbitrary script execution from imports
Imported job descriptions should be treated as untrusted data.
59. TESTING
At minimum test critical business flows:
- authenticated route behavior
- creating job
- editing job
- duplicate detection/import behavior
- converting job into application
- application status change
- application question persistence
- filters
- empty/error states
Use appropriate automated tests where useful.
Also perform manual responsive QA.
60. INITIAL PRODUCT SUCCESS CRITERIA
V1 is successful when Moshe can:
1. Sign in from desktop or phone.
2. View discovered vacancies.
3. Add/import a vacancy.
4. Understand why it may or may not fit him.
5. See which CV should be used.
6. Mark a job ready, saved, skipped, etc.
7. Record that he applied.
8. Track the application through stages.
9. Record employer application questions.
10. Save drafts/final answers.
11. Track next actions and deadlines.
12. Preserve rejection/offer outcomes.
13. Search/filter his job history.
14. Leave and return later without losing context.
15. Ask ChatGPT/Astra to read project docs and understand the system again.
61. FIRST TASK
Do not immediately implement random UI.
Perform the following first:
1. Inspect the empty/current workspace.
2. Create the documentation structure described above.
3. Translate this handover into authoritative project documentation.
4. Design the proposed V1 architecture and schema.
5. Record any technical assumptions in 09_DECISIONS.md.
6. Create 10_CURRENT_STATE.md.
7. Create a concise implementation plan.
8. Then begin Phase 1 implementation.
9. Continue autonomously through reasonable development steps.
10. Build/test after meaningful milestones.
If something is genuinely ambiguous and materially changes the product, ask.
Do not ask questions merely because several technically equivalent implementation approaches exist; choose the simplest sound option and document the choice.
62. REPORTING BACK
When you reach a meaningful stopping point, report:
Completed
What was implemented.
Architecture
Important implementation choices.
Database
Tables/migrations/RLS created.
Verification
Build/test results.
Remaining
What V1 still lacks.
User Action Required
Only things Moshe genuinely must do.
Current State
Confirm that docs/10_CURRENT_STATE.md has been updated.
Do not merely say “done” without verification.
63. FINAL CONTEXT
This project originated from a career-planning discussion.
The underlying goal is not software for software’s sake.
Moshe recently completed a one-year Mattel engineering internship and is now entering a fresh-graduate job search while finishing university.
He has three prepared CV variants and a substantial technical/industrial portfolio.
His challenge is not an absence of experience.
His challenge is turning a broad profile into a consistent, disciplined job-search process while discovering opportunities that actually fit what he wants to become.
This software is intended to make that process sustainable.
Build accordingly.
