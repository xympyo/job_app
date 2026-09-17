# Fit and recommendation scoring

Fit is explainable advice entered by Moshe or an external researcher. It is not a
scientific probability, keyword auto-score or automatic application gate.

## Required assessment

Consider role alignment, experience match, qualification/eligibility, career interest,
and practical/location fit. Also note posting freshness, deadline, competition, friction,
company/career quality and any evidence that is unusually strong for Moshe. A nullable
integer `fit_score` from 0–100 is allowed only with a human-readable `fit_reason`.

Allowed labels are `Excellent Fit`, `Strong Fit`, `Possible Fit`, `Stretch` and `Weak Fit`.
Allowed recommendations are `Apply ASAP`, `Apply`, `Apply if interested`, `Research first`,
`Low priority` and `Skip`. These fields are editable and never override Moshe's decision.

Every assessment should answer:

- Why this role fits Moshe's technology + operations + systems direction.
- Which concrete evidence supports it (for example EDEN, OMNI, SQL/API work, leadership
  or stakeholder delivery).
- Which requirements are missing, uncertain or only preferred.
- What red flags or verification gaps need attention.
- Which CV narrative is recommended and why.

Keep employer facts, research inference and user notes visibly distinct. Do not treat a
researcher's recommendation as an employer statement.

## Independent employer-quality assessment

Role fit is not employer quality. Before recommending substantial application effort,
evaluate both dimensions independently. A strong fit can remain HOLD / RESEARCH or
CAUTION when legitimacy, stability, culture, compensation, team conditions or contract
terms are unresolved. Employer due diligence uses the statuses and evidence classes in
`15_EMPLOYER_DUE_DILIGENCE.md`; it is explainable, source-backed and never a numeric
proxy for role fit. `Ready to Apply` records Moshe's opportunity decision and does not
mean the employer is cleared.

## Eligibility guardrails

Use `TRIAGE.md` for Confirmed, Likely, Uncertain but applyable and Hard block. In
particular, expected graduation is December 2026, so an earlier date is not after
graduation. A Bachelor's requirement without an explicit completed-before-start gate is
not alone a hard block. Mattel is relevant internship experience, not full-time employment.

## Triage relationship

P0/P1/P2/DROP are agent execution tiers, not stored database fields. Use
`TRIAGE.md` for their mapping to the existing recommendation/review fields. Keep the
reason and uncertainty so a later agent can explain a priority change without reverse-
engineering an unexplained number.
