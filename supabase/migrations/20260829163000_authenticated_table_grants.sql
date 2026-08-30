-- RLS decides which rows an authenticated user may access. PostgreSQL table
-- privileges are still required before those policies can be evaluated.
grant select, insert, update, delete on table
  public.profiles,
  public.projects,
  public.phase_entries,
  public.decisions,
  public.prd_snapshots,
  public.app_builds,
  public.feedback_entries,
  public.journal_snapshots
to authenticated;

-- Keep future app tables consistent when migrations run as the postgres owner.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

