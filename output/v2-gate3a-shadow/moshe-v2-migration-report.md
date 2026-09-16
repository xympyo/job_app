# Moshe V2 Shadow Migration Report

- Status: **awaiting_owner_review**
- Mode: read-only shadow migration
- Candidate hash: fnv1a64:8dfc4141079a9c34
- Deterministic repeat: yes

## Sources used
- Canonical user profile — docs/02_USER_PROFILE.md (user_confirmed)
- Accepted CV strategy — docs/CV_STRATEGY.md (user_confirmed)
- Current timing and triage rules — docs/TRIAGE.md (source_material)
- Locked V2 contract — docs/v2/V2_PRODUCT_CONTRACT.md (source_material)

## Source limitations
- No authorized current owner V1 export or cloud snapshot was available in the repository.

## Semantic diff
### Accepted-equivalent
- identity
- education
- experiences
- projects
- leadership
- skills
- career direction
### Owner confirmed
- Primary employment goal: Full-time work
- Preferred locations: Jakarta, Cikarang, Bekasi, Jabodetabek
- Work modes: Onsite, Hybrid, Remote acceptable where appropriate
- Relocation: Case-by-case
### Normalized
- careerStage.graduation: Expected graduation retained without inferring pre-graduation unavailability.
- experiences: Mattel remains internship; Homize remains freelance/project.
### Newly represented
- stable item IDs
- area-level migration provenance
### Unresolved
- Exact Mattel role wording and internship date boundaries
- Exact Homize dates and preferred title wording
- Future document versions for the three CV variants
### Excluded
- Work authorisation
- Historical job/application counts
- Legacy filesystem paths
- Assistant-generated career interpretations
- Unsupported salary preferences and older targets

## CV compatibility
- Master (ID unavailable): legacy/missing-file metadata until explicit upload
- Analyst (ID unavailable): legacy/missing-file metadata until explicit upload
- Management/Product (ID unavailable): legacy/missing-file metadata until explicit upload

## Operational history compatibility
- No V1 jobs, sources, research runs, applications, questions, events, outcomes or snapshots are recreated.
- Snapshot status: no authorized current snapshot; live IDs/counts remain unresolved.

## Gate 1 fixture comparison
- Preserved: PT Mattel Indonesia, Homize, EDEN, OMNI, Pyomanizer, Deep Learning Product Package Verification
- Added: none
- Removed: none
- Normalized: Expected graduation is retained without an availability inference.
- Normalized: Mattel internship and Homize freelance/project boundaries are explicit.
- Fixture-only exclusion: Fixture-only contact placeholder and any unsupported availability/work-authorisation implication.

## Compiler validation
- career: pass; 4008 approximate tokens
- research: pass; 4942 approximate tokens

## Safety boundary
- No database writes, production migrations, owner mutations, document uploads, credentials, secrets or local paths were used.
- Gate 3B remains blocked on explicit owner review.
