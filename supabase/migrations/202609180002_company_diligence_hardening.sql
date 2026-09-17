begin;

alter table public.company_diligence_sources
  add constraint company_diligence_sources_https_url
  check (source_url = '' or source_url ~ '^https://');

commit;
