# Triage and execution policy

Triage turns evaluated opportunities into a small action queue. It is a decision aid, not
a claim of mathematical precision. Use the candidate profile, current evidence and
application effort together.

## Portfolio labels

- **Reach** — highly competitive and/or constrained funnel. Fame alone is not enough.
- **Target** — strong fit with a realistic screening probability.
- **Safer** — quality career progression with lower pedigree/experience barriers and an
  unusually close match to Moshe's evidence.

Use approximately 20% Reach / 55% Target / 25% Safer as a batch-shaping guide, not a
quota. A realistic Indonesian industrial or technology role can outrank a famous
consulting funnel when it offers higher interview value. Prestige is not priority.

## Action tiers

- **P0 — Apply next:** highest expected value, strongest fit or urgent deadline. Use an
  existing CV and submit promptly after a final open-status check.
- **P1 — Apply this week:** worth doing soon, but below P0 on expected value, urgency,
  fit or effort.
- **P2 — Backlog / optional:** legitimate but lower expected value, weaker fit, higher
  effort or lower urgency.
- **DROP:** hard blocked, stale/closed, misleading, materially misaligned or not worth
  current effort. Preserve the record and reason; do not delete history.

Assess, in order:

1. screening plausibility;
2. substantive role fit and career direction;
3. graduation and experience eligibility;
4. source freshness, deadline and urgency;
5. location and work mode;
6. company/career quality and learning value;
7. application friction and competition;
8. unusually strong evidence Moshe has versus typical applicants.

Use the qualitative model:

`expected value ≈ interview plausibility × role quality × fit × urgency ÷ application effort`

Do not manufacture a number from this expression. Explain the decisive evidence and the
main uncertainty instead.

## Eligibility policy

Graduation is expected in **December 2026**. Use actual calendar dates: 19 October 2026
is before graduation. Classify:

- **Confirmed** — final-year/completing-degree/2026 graduate wording or clearly compatible
  start timing explicitly permits Moshe.
- **Likely** — fresh-graduate wording and timing appear compatible with no visible conflict.
- **Uncertain but applyable** — Bachelor's/S1 wording exists, final-semester eligibility
  is unstated, no hard timing conflict exists and the fit is strong.
- **Hard block** — completed degree before Moshe can satisfy it, an incompatible mandatory
  start gate rejects students, or mandatory seniority/experience clearly cannot be met.

“Bachelor's degree required” alone is not a hard block for a strong final-semester fit.
Disclose expected graduation accurately and let the employer decide.

Mattel is one year of highly relevant internship experience, not one year of full-time
professional employment. Fresh-graduate, 0–1, 0–2 and many 1–2-year preferred roles are
applyable. A mandatory 3+ years or Senior/Lead/Manager role is normally a DROP.

## PyoLoker mapping

The app does not store a P0/P1/P2 field. Store the actionable decision using the existing
recommendation/review fields and keep the tier in the agent's report or triage rationale:

| Agent decision | PyoLoker recommendation | PyoLoker review status |
| --- | --- | --- |
| P0 — Apply next | `Apply ASAP` | `Ready to Apply` |
| P1 — Apply this week | `Apply` | `Ready to Apply` |
| P2 — Backlog / optional | `Research first` or `Apply if interested` | usually `Reviewing` or `Saved` |
| DROP | `Skip` | `Skipped` |

The strict triage interchange supports only `Apply ASAP`, `Apply`, `Research First` and
`Skip`; `Research First` maps to the stored recommendation `Research first`. Do not add a
new database enum for P0/P1/P2 without a separate product decision.

## Anti-procrastination rule

“Research first” is justified only when one unresolved fact can change Apply versus Skip:
final-year eligibility, Informatics acceptance, whether the vacancy is still open, or
whether employment status is misleading. Imperfect information alone is not a blocker.
Cover letters are needed only when required or strategically valuable. The objective is
completed applications, not endless optimization.

