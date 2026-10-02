# October 2026 PyoLoker Pipeline Refresh

**Research date:** 2 October 2026 (Asia/Jakarta)  
**Owner workspace:** Moshe Dayan  
**Mode:** production reconciliation plus curated manual research; no scraping, auto-apply or destructive history changes.

## Executive summary

The refresh read the live owner workspace before any write: **45 companies, 47 jobs,
58 job sources, 3 research runs, 11 applications, 3 CV variants, 0 questions and 0
application events**. All 47 existing jobs were reverified against their primary source
where reachable. Stale or closed listings were preserved and marked with the existing
`Expired`, `Closed` or `Possibly open` semantics. Traveloka's current official Product
Analyst posting requires approximately 3–5 years of product-management experience, so it
was moved to `Skipped`/`Skip` with a documented fit correction.

The new run added **11 genuinely new records** after duplicate-source protection (the
remote Deliveree idea used the same source URL as the existing listing and was not
duplicated). New opportunities prioritize Tangerang/western Jabodetabek, then selective
Jakarta and one explicit international-relocation exception. Existing applications,
CVs, jobs, sources and historical records were not deleted or recreated.

## Funnel reconciliation

The owner currently has 11 application records. Ten remain in their existing stages and
one documented progression was added:

- **Sea Global MAP:** application remains `Applied`; an `Assessment` event records that
  the online assessment was completed on 19 September 2026. `next_action` now says to
  await the result. No pass/fail outcome was inferred.
- Other `Applied` records remain applied even when the source listing is now closed or
  expired. Silence is not treated as rejection.
- `Preparing` records remain preparing. No unconfirmed manual interactions were turned
  into applications.

The response data supports only cautious conclusions. **Evidence-supported:** Sea's
structured graduate program explicitly accepted Moshe's final-year timing and produced
an assessment invitation. **Plausible hypotheses:** clear 2027 timing, leadership
evidence and the technology/operations narrative helped; employer recruiting cadence and
competition also matter. **Insufficient evidence:** that management-trainee programs are
the only successful path, or that any single CV change caused the Sea progression.

Practical adjustment: prioritize explicit final-year/2027 graduate eligibility, structured
programs with clear timelines, and roles where Mattel's operational systems evidence is
directly legible. Keep analyst, product, transformation and technical-consulting paths in
parallel rather than overfitting to one response.

## Existing inventory reverified

All 47 existing jobs received a 2 October verification timestamp. The following records
were moved out of the active queue based on current source/deadline evidence while their
history remains intact:

- BNI ODP Data Analytics — stored 20 September deadline passed; `Expired`.
- BCG Business Analyst 2027 — stored 23 September deadline passed; `Expired`.
- Oliver Wyman entry-level role — stored 28 September deadline passed/current page closed; `Expired`.
- Knauf LEAP — stored 30 September deadline passed/current careers page no longer open; `Expired`.
- Paper APM and EDTS APM — current LinkedIn pages did not provide an actionable open listing; `Expired`.
- Krom APM and Noraa ERP Consultant — current source did not provide an actionable open listing; `Expired`.
- Ukirama Junior ERP Consultant — current source indicated closed; `Closed`, while the Preparing record remains.
- Toyota Astra Financial Services IT Business Process Analyst — current source indicated closed; `Closed`, while the terminal application remains.
- BCA Digital Business Analyst — current source indicated closed; `Closed`, while the Applied record remains.
- Traveloka Product Analyst — source remains reachable, but the current official page requires approximately 3–5 years of PM experience; `Skipped`/`Skip` with fit score reduced to 52.

Deliveree's current university listing extended the deadline to 31 October 2026, so the
existing on-site record was updated rather than closed. BCA MDP was aligned to the
current 31 October event window. FrieslandCampina's old 30 September deadline was cleared
because the current official page remained live without a reliable current deadline; the
Applied record was preserved.

Listings without enough direct current evidence remain `Possibly open` rather than being
presented as verified open. This is intentional uncertainty handling.

## New retained opportunities

### Tier 1 — Tangerang / western Jabodetabek

| Company | Role | State | Fit / CV | Employer diligence |
|---|---|---|---|---|
| PT Paradise Perkasa | Management Trainee, Dadap | Ready to Apply | 84 / Management/Product | Caution, medium |
| SPE Solution | IT Business Analyst - Product Development, Green Lake City | Ready to Apply | 84 / Analyst | Hold, low |
| Tada | Product Support & Sysadmin, BSD | Research first | 76 / Master | Hold, low |
| PT Hino Finance Indonesia | Credit Analyst, Kota Tangerang | Saved | 68 / Analyst | Hold, low |
| ATI Business Group | Finance & Operations Associate, BSD/Central Jakarta | Research first | 77 / Analyst | Hold, low |

The official Summarecon Business Analyst record already in the portfolio remains the
strongest near-home deadline opportunity, with a 31 October deadline and Gading Serpong
location. The official listing describes fresh-graduate eligibility and analytics,
dashboard and cross-functional work ([Summarecon careers](https://career.summarecon.com/vacancy-detail/pZG6w-business-analyst)).

### Tier 2 — selective Jakarta / commuter opportunities

| Company | Role | State | Fit / CV | Employer diligence |
|---|---|---|---|---|
| Danone Indonesia | STAR & GREAT Graduate Program 2027 | Ready to Apply | 93 / Management/Product | Cleared, medium |
| Accenture Indonesia | Graduate Analyst Talent Advancement | Ready to Apply | 89 / Analyst | Cleared, medium |
| ATI Business Group | Business Analyst, Central Jakarta | Research first | 82 / Analyst | Hold, low |
| Indodana | Business Intelligence Analyst | Research first | 82 / Analyst | Hold, low |
| Indodana | Data Analyst - Operations | Research first | 83 / Analyst | Hold, low |

Danone's current graduate-program page showed a late-September/October posting and
Jakarta-based graduate entry; public JobStreet evidence was positive but workload varies
by team ([Danone careers](https://careers.danone.com/), [JobStreet reviews](https://www.jobstreet.co.id/companies/danone/reviews)).
Accenture's official graduate analyst page remains a strong technology/transformation
route ([Accenture careers](https://www.accenture.com/id-en/careers/jobsearch)).

### Tier 3 / explicit relocation exception

| Company | Role | State | Fit / CV | Employer diligence |
|---|---|---|---|---|
| Lalamove Indonesia | Global Trainee Program 2027, Hong Kong/global placement | Research first | 82 / Management/Product | Caution, medium |
| Deliveree Indonesia | Fresh Graduate Management Training — Remote | Research first | 78 / Management/Product | Existing Caution |

Lalamove's official program starts in August 2027 and requires mobility/relocation, so it
is not a default local recommendation ([Lalamove careers](https://www.lalamove.com/en-id/career/global-trainee-programme)).

## Employer diligence

New canonical diligence was imported for nine employers. No new employer was classified
`avoid`.

**Cleared:** Danone Indonesia; Accenture Indonesia.  
**Caution:** PT Paradise Perkasa; Lalamove Indonesia.  
**Hold / Research:** ATI Business Group; SPE Solution; Tada; PT Hino Finance Indonesia;
Indodana.  
**Avoid:** none.

The completed September audit remains authoritative for existing employers. The refresh
did not overwrite those classifications unless the new source evidence was specifically
for a new role/company. Employer quality remains independent of role fit: a role may be
Ready to Apply while its employer is Caution or Hold, with the required verification
questions visible in the application workspace.

## Follow-up queue

1. Sea Global MAP — check for assessment result; do not send repeated messages without a
   legitimate channel.
2. BNI ODP, TikTok GDP/GTL, BCA Digital, FrieslandCampina, 99 Group, Noraa, Oliver
   Wyman — review recruiter/application channels for one concise follow-up where a real
   channel exists; silence is not a rejection.
3. Preparing Ukirama and BNI records — decide whether to continue preparation only if a
   current opening or application channel remains available.
4. New Tier 1 queue — inspect Paradise Perkasa and SPE Solution first, with employer
   questions ready; then compare Summarecon and other local options.

## Production writeback

The new research run is recorded as `d20482a1-fe50-5500-b7bf-2594dedf01f1`. Post-refresh
counts are:

- 54 companies
- 58 jobs
- 69 job sources
- 4 research runs
- 11 applications
- 1 application event
- 0 application questions
- 3 CV variants
- 47 employer-diligence records and 48 diligence sources

Existing application IDs, job IDs, source IDs, CV IDs and historical records were
preserved. No job, application, CV, question, event or history record was deleted. The
only application-related mutation was the Sea `next_action`/note plus one completed
assessment event.

## Sources and limitations

Current-vacancy sources were checked manually through official career pages and selected
LinkedIn/university listings. JobStreet/Glassdoor/Indeed pages were used only where
accessible; login-gated or blocked pages were treated as unavailable. Search snippets
are discovery leads, not proof. Salary is not recorded when a reliable public band was
not available. Exact commute time is intentionally not fabricated; all new jobs carry a
broad location/commute assessment in their research notes.

The dated report is a refresh snapshot, not a permanent assertion that every listing
will remain open. Reverify before submitting an application.
