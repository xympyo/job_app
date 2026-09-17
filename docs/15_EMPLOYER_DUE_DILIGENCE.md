# Employer due diligence policy

Employer quality is a separate evaluation dimension from role fit. A vacancy can be a
strong match for Moshe and still be a poor or uncertain employer. A recognizable or
prestigious employer is not automatically cleared.

## Required evaluation model

Every substantial evaluation should keep two explicit assessments:

1. **Role fit** — alignment, evidence, eligibility, practical fit, freshness and application effort.
2. **Employer due diligence** — legitimacy/stability, culture and management signals, compensation and benefits, career value, role/team risks and practical trade-offs.

Employer statuses are explainable labels, not a numeric score:

- **CLEARED** — reasonable research found no material concern. This is not a guarantee.
- **CAUTION** — meaningful trade-offs or repeated concerns exist, but the role may still be worth pursuing.
- **HOLD / RESEARCH** — evidence is insufficient or a material issue remains unresolved.
- **AVOID** — only after strong, current and preferably independent evidence of a material problem.

Every status carries confidence: **HIGH**, **MEDIUM** or **LOW**. A low-confidence
rating cannot by itself justify AVOID.

## Evidence standard

Record the source, access date, review sample size, location/office, function and
employment type where available. Classify each point as **FACT**, **REPEATED SIGNAL**,
**ANECDOTE** or **UNKNOWN**. Ratings are one signal only; they must not be treated as
the conclusion. Company-wide reviews must be separated from role-, team- or office-
specific evidence. Search snippets are discovery leads, not proof.

Research should check, where public evidence allows:

- legitimacy, ownership/group, operating history, stability and restructuring;
- management, psychological safety, workload, hours, overtime, turnover and learning;
- compensation, benefits, contract/permanent terms, THR/bonus and allowances;
- training, project quality, mobility and relevance to Moshe's direction;
- office, work mode, placement and commute trade-offs from coarse Tangerang Regency context.

Missing evidence remains unknown. A current applied or preparing record is never deleted
because of a concern; the concern becomes a verification plan for screening or interview.

## Application implications

Use one operational recommendation alongside the status:

- CONTINUE / APPLY
- APPLY WITH CAUTION
- RESEARCH BEFORE APPLYING
- DO NOT PRIORITIZE
- SKIP / AVOID
- CONTINUE EXISTING APPLICATION BUT VERIFY DURING INTERVIEW

`Ready to Apply` means Moshe decided the opportunity deserves effort. It must not be
read as employer clearance. A HOLD blocks an automatic progression recommendation;
CAUTION can remain actionable only when the trade-off is visible and Moshe chooses it.

## Canonical persistence and frontend use

The current `companies` table stores identity and reusable company metadata but has no
safe place for structured due-diligence evidence. Do not overload `companies.notes` or
job fit fields. If persistence is approved, add an owner-scoped one-to-one
`company_diligence` record and child `company_diligence_sources` records:

`company_diligence`: `company_id`, `status`, `confidence`, `summary`, `positive_signals`,
`concerns`, `culture_signal`, `compensation_signal`, `stability_signal`, `career_value`,
`practical_tradeoffs`, `operational_recommendation`, `last_researched_at`.

`company_diligence_sources`: `company_diligence_id`, `source_name`, `source_type`,
`source_url`, `accessed_at`, `evidence_class`, `scope` (company/office/team/role),
`review_sample_size`, and `notes`.

Both tables are implemented by migration `202609180001_company_diligence.sql` with
owner-scoped composite foreign keys, RLS, HTTPS-only source URLs and no writes to
application snapshots. The reviewed 2026-09-17 audit is imported as the current
owner-scoped diligence layer. Job cards, company panels and job detail show a compact
Employer indicator; detail expands the summary, signals, interview questions and
source links. A missing record is explicitly **Not researched**. Diligence never changes
role fit, Ready to Apply, application stages or history.

The import is fail-closed: it matches the audit to exactly one existing canonical
company, uses a deterministic owner/company record id, upserts only the diligence
tables, and reports unresolved mappings instead of guessing. Sources store concise
evidence references rather than copied review text.

## Research policy change

Future research must answer both “Should Moshe apply?” and “Is this an employer he
should want to work for?” before recommending substantial effort. Role fit and employer
quality are reported separately in research notes or the normalized diligence model.
