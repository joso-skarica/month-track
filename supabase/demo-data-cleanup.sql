-- =============================================================================
-- DEMO DATA CLEANUP — removes all demo data before reseeding.
-- Run in Supabase SQL Editor (postgres role) BEFORE seed-demo.sql.
-- =============================================================================
-- Two-pass approach:
--   Pass 1: Delete by the demo user resolved from auth.users (catches any
--           rows created through the app by the demo account).
--   Pass 2: Delete by the hardcoded seed IDs (catches stale rows from
--           previous seed runs that may belong to an old/different user).
-- Safe to run multiple times. Does not touch schema or other users' data.
-- =============================================================================

begin;

do $$
declare
  v_demo_user_id uuid;
begin

  -- ── Pass 1: by demo user identity ──────────────────────────────────────
  select id into v_demo_user_id
    from auth.users
    where email = 'demo@month-track.com'
    limit 1;

  if v_demo_user_id is not null then
    delete from public.monthly_document_statuses
    where monthly_period_id in (
      select mp.id from public.monthly_periods mp
      join public.clients c on c.id = mp.client_id
      where c.owner_user_id = v_demo_user_id
    );

    delete from public.reminders
    where client_id in (
      select id from public.clients where owner_user_id = v_demo_user_id
    );

    delete from public.monthly_periods
    where client_id in (
      select id from public.clients where owner_user_id = v_demo_user_id
    );

    delete from public.client_document_requirements
    where client_id in (
      select id from public.clients where owner_user_id = v_demo_user_id
    );

    delete from public.clients
    where owner_user_id = v_demo_user_id;

    delete from public.reminder_settings
    where owner_user_id = v_demo_user_id;

    raise notice 'Pass 1: cleaned data for user % (demo@month-track.com)', v_demo_user_id;
  else
    raise notice 'Pass 1: demo@month-track.com not found in auth.users — skipped.';
  end if;

  -- ── Pass 2: by hardcoded seed IDs (catches stale rows from old runs) ───
  -- These are the deterministic UUIDs used in seed-demo.sql.

  -- Reminders (c1… and c2… series)
  delete from public.reminders
  where id::text like 'c1000000-0000-0000-0000-%'
     or id::text like 'c2000000-0000-0000-0000-%';

  -- Monthly document statuses (via period IDs b1… and b2…)
  delete from public.monthly_document_statuses
  where monthly_period_id::text like 'b1000000-0000-0000-0000-%'
     or monthly_period_id::text like 'b2000000-0000-0000-0000-%';

  -- Monthly periods (b1… and b2… series)
  delete from public.monthly_periods
  where id::text like 'b1000000-0000-0000-0000-%'
     or id::text like 'b2000000-0000-0000-0000-%';

  -- Client document requirements (via client IDs a1…)
  delete from public.client_document_requirements
  where client_id::text like 'a1000000-0000-0000-0000-%';

  -- Clients (a1… series)
  delete from public.clients
  where id::text like 'a1000000-0000-0000-0000-%';

  raise notice 'Pass 2: cleaned stale seed rows by hardcoded ID prefixes.';

end $$;

commit;
