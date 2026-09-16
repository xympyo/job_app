# Onboarding and user journeys

Onboarding should get a new user to a trustworthy first task without forcing an AI account, a perfect CV, or a long form. The account may exist before the profile is complete; the UI must distinguish “empty,” “draft,” and “ready.”

## 1. Initialization states

```text
new account
  → choose setup method
       ├── import Markdown / resume
       ├── guided manual setup
       └── AI-assisted setup using a user-approved Career Pack
  → review proposed profile
  → publish first profile revision
  → choose first task
```

No path creates Moshe records. A new user starts with no jobs, no companies, no applications, no CV paths, and no achievements until they supply or import them.

## 2. Journey: Moshe, existing V1 user

**Goal:** keep all history and gain portable AI context.

1. Sign in to the existing account; the system identifies the authenticated owner.
2. V2 detects a legacy workspace and shows a migration preview: three CV metadata records, jobs, applications, events, research runs, and local/cloud status.
3. Existing records are imported by owner-aware ID; no new profile facts are invented.
4. Moshe reviews proposed structured claims against the supplied source material, confirms December 2026 timing and distinctions between Mattel internship, Homize freelance work, and leadership, then accepts the canonical facts.
5. The system publishes profile revision 1 only after review and records the migration event.
6. Normal work starts in contextual Home, Jobs, Application, or Career actions. `/guide` remains secondary help/orientation and may launch the same tasks, but the operational loop does not require returning to it.
7. Moshe can copy a minimal task pack, download the full pack, or continue using V1 workflows.

**Success:** old application snapshots and outcomes are unchanged; a pack opened in a text editor is intelligible without this repository.

## 3. Journey: new student

**Goal:** create a credible starter profile without over-claiming experience.

1. Create and verify an account.
2. Choose “I am studying or recently graduated.”
3. Enter education, expected graduation, locations, target role families, and work authorisation.
4. Add projects, internships, student leadership, and skills using explicit type labels.
5. Optionally upload a CV; the app stores private metadata and offers an extraction proposal.
6. Review structured facts, provenance, and any retained freeform notes; generated Markdown is an optional projection/export and unresolved fields are marked unknown.
7. Publish profile revision 1 and open a first opportunity import or manual job entry.

**Success:** “no full-time experience” is not converted into a blank or inflated work history, and the first task is possible before the profile is perfect.

## 4. Journey: career changer

**Goal:** represent transferable evidence and a target transition honestly.

1. Choose a target function and optional transition reason.
2. Import or write a profile with prior roles, projects, domain knowledge, and transferable skills.
3. Let the assistant suggest a structured projection, but require the user to approve every changed claim and source pointer.
4. Define gap areas and preferred learning evidence separately from completed experience.
5. Create role-specific CV variants and use the document/CV-routing task pack.
6. Triage opportunities using target role fit, not an experience-years shortcut alone.

**Success:** the profile can explain a transition without erasing previous work or making a certificate look like professional experience.

## 5. Journey: AI-assisted onboarding

**Goal:** use an external AI without surrendering account control.

1. User selects “Help me structure my profile.”
2. PyoLoker shows the exact resume/Markdown sections that will be shared, with a private-minimum default.
3. The user copies/downloads the onboarding task pack.
4. The AI returns a proposed structured profile and questions for missing facts.
5. User pastes/imports the result, or manually enters the same information.
6. PyoLoker highlights new, changed, unsupported, and conflicting claims with source references.
7. User accepts selected changes into a new draft, edits them, and publishes a profile revision.

**Never:** send a private CV automatically, let an AI publish a profile, or hide the original user text behind a generated summary.

## 6. Journey: manual onboarding without AI

**Goal:** preserve a first-class path for users who do not use AI.

1. User enters identity, preferences, education, experience, projects, leadership, and target roles through small sections.
2. The app generates a Markdown projection/export for review; structured facts remain canonical.
3. User edits structured facts or freeform notes. Imported source material creates proposed claims with provenance; no permanent two-way synchronization is required.
4. User publishes a revision and adds a job manually or imports a valid V1/V2 file.
5. The same Jobs → application workspace → Progress workflow is available with no pack step.

**Success:** AI is an accelerator, never an onboarding requirement.

## 7. Journey: mobile-only user

**Goal:** complete a useful task on a narrow screen and defer heavy editing safely.

1. A compact Home screen shows one next action and one status summary.
2. The user opens a task card and sees a short context checklist, not a full long prompt wall.
3. `Review what will be shared` is a bottom sheet/step, with large toggles for profile, job, documents, and history.
4. Copy and download controls are sticky and accessible; a QR/deep-link handoff is deferred unless it can be privacy-safe.
5. The user can paste an AI result into a large text area and save to review later.
6. Dense profile editing and document management are available but not required to finish the task.

**Success:** no horizontal overflow, no essential action hidden behind hover, no copied context without a visible confirmation, and no accidental disclosure caused by a fixed mobile control.

## 8. Onboarding guardrails

- Ask for the smallest useful set of facts first: identity/name, target direction, timing/location, evidence, and preferred next task.
- Explain why a field matters and whether it is required.
- Allow “unknown,” “not applicable,” and “prefer not to share.”
- Never infer a user’s country, graduation date, salary, or work authorisation from browser locale.
- Distinguish “not provided” from “none.”
- Keep a draft profile private until published.
- Provide a complete export and delete path before encouraging a user to upload documents.


## Gate 2B implementation status — 2026-09-16

The manual onboarding journey described here is now implemented locally at `/career`. It is the first-class no-AI path: a new account can start from Home, skip setup, create a private draft, autosave changes, review a human-readable summary, publish explicitly, edit through a copied draft, discard with confirmation and inspect published revision history. The minimum publish rule is one target direction plus one evidence entry; all other sections remain optional.

The current Gate 2B UI deliberately does not implement the planned AI-assisted onboarding, source/Markdown/resume import, document upload, Career Pack handoff or cloud migration flows. Those remain later gates and must not be implied by the editor copy.

This paragraph records the Gate 2B boundary at the time. Gate 2C below now implements the limited local source/Markdown review and portable Profile Builder Pack described next; document upload, binary extraction, cloud enablement and migration remain deferred.

## Gate 2C source and AI profile journey — 2026-09-16

Career setup now offers three compact choices: set up manually, import existing information, or build a portable Profile Builder Pack for the user's AI. Import accepts pasted text/Markdown and `.txt`/`.md`; deterministic extraction produces suggestions only. A strict proposal envelope can be pasted back, reviewed by concept with current/proposed values and source evidence, selectively accepted into a private draft, edited in the normal editor, and published explicitly. Empty, conflicting, stale, or unsupported claims remain visible for review. The normal manual path remains first-class and does not require AI.
