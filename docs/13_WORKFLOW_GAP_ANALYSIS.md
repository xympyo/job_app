# First usable career workflow — gap analysis

2026-09-14. Based on source, existing migration and live Supabase inspection.

## Already implemented
Manual company/job/source create/edit/delete; detail with fit, requirements, CV and source
links; review states; applications with CV choice, applied date, flexible stages, next
actions, immutable vacancy snapshot and outcomes; separate draft/final questions and
interview records; import validation/preview/duplicate choices and editable JSON input.
Eleven role families match the handover. Production owner has all three CV records.
All eight live application tables have ownership policies and RLS enabled.

## Partially implemented
Dashboard has operational counts and due items but no direct create/import actions.
Cards show the required information but lack review/save/ready/skip/source controls.
Ready jobs are listed under Applications but are absent from Needs Attention.
Detail supports nearly all required fields, but date found is not displayed and its
deadline is below the initial decision area. Needs a complete live browser acceptance run.

## Missing
Direct dashboard entry actions, card quick actions, Ready to Apply attention item,
visible date-found context, and a recorded complete desktop/phone/relogin acceptance case.
No duplicate database tables or replacement authentication flow are needed.

## Conflicting or overstated
Previous status emphasized authentication completion and SMTP. This milestone concerns
actual job-search use; SMTP is explicitly deferred and does not block development.
Prior live browser evidence covers selected interactions rather than the full new
acceptance scenario. Physical phone hardware and inbox email delivery were not verified.
Owner CV records must be preserved; other users must not receive Moshe's personal CVs.

## Implementation order
Make immediate actions visible, complete review/attention/detail gaps, then run a realistic
explicitly labeled QA scenario through live Supabase on desktop and phone layouts.
Keep QA in disposable accounts, preserve the owner's workspace, and record actual results.

## Resolution — 2026-09-14
All missing items above are implemented. The redundant decorative empty-dashboard panel
was removed. Live desktop/phone scenario, import correction/duplicate handling and RLS
acceptance passed; see 12_QA.md. No auth refactor or new migration was required. The owner
workspace remains clean with three CV records. Custom SMTP remains explicitly deferred.
