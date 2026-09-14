begin;

alter table public.applications
  drop constraint applications_status_check;

alter table public.applications
  add constraint applications_status_check check (status in (
    'Preparing','Applied','Assessment / OA','HR Interview',
    'User / Hiring Manager Interview','Technical / Case Interview',
    'Final Interview','Offer','Withdrawn','Rejected','Expired','Closed',
    'Offer Declined','Offer Accepted'
  ));

alter table public.applications alter column status set default 'Preparing';

-- Ready to Apply is a vacancy decision. Existing application workspaces that
-- used the old value are preparing workspaces and retain their timeline.
update public.applications
set
  status = 'Preparing',
  stage_history = (
    select coalesce(jsonb_agg(
      case
        when value->>'status' = 'Ready to Apply'
          then jsonb_set(value, '{status}', '"Preparing"'::jsonb)
        else value
      end
      order by ordinality
    ), '[]'::jsonb)
    from jsonb_array_elements(stage_history) with ordinality
  )
where status = 'Ready to Apply';

alter table public.applications
  add constraint applications_submitted_date_check check (
    (status in (
      'Applied','Assessment / OA','HR Interview',
      'User / Hiring Manager Interview','Technical / Case Interview',
      'Final Interview','Offer','Rejected','Withdrawn','Offer Declined',
      'Offer Accepted'
    ) and applied_at is not null)
    or (status not in (
      'Applied','Assessment / OA','HR Interview',
      'User / Hiring Manager Interview','Technical / Case Interview',
      'Final Interview','Offer','Rejected','Withdrawn','Offer Declined',
      'Offer Accepted'
    ) and (status <> 'Preparing' or applied_at is null))
  );

commit;
