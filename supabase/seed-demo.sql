-- =============================================================================
-- DEMO DATA ONLY — not for production.
-- Run in Supabase SQL Editor after supabase/seed.sql (document_types).
-- Requires a demo user (demo@month-track.com) in auth.users / public.profiles.
-- =============================================================================
-- The demo user is resolved by email — no hardcoded UUID needed.
-- Run the whole script (BEGIN … COMMIT).
--
-- Target demo state:
--   • 11 clients (10 active, 1 inactive — Likovna udruga Monet)
--   • Ožujak 2026: 6 Nepotpuno, 5 Spremno, 8 Podsjetnika (history month)
--   • Travanj 2026: 7 Nepotpuno, 4 Spremno, 3 Podsjetnika (current month)
--   • Mix of statuses, missing doc counts, reminder dates
--   • Believable Croatian company names and contacts
--   • reminder_settings with overdue day 10, auto reminders enabled
-- =============================================================================

begin;

do $$
declare
  v_demo_user_id uuid;

  v_dt_ulazni     uuid;
  v_dt_izlazni    uuid;
  v_dt_izvod      uuid;
  v_dt_blagajna   uuid;
  v_dt_putni      uuid;
  v_dt_obracun    uuid;
  v_dt_joppd      uuid;
  v_dt_evidencija uuid;
  v_dt_pdv        uuid;
begin
  -- Resolve demo user by email (no hardcoded UUID)
  select id into v_demo_user_id
    from auth.users
    where email = 'demo@month-track.com'
    limit 1;

  if v_demo_user_id is null then
    raise exception 'DEMO SEED: User demo@month-track.com not found in auth.users. Create the account first.';
  end if;

  select id into v_dt_ulazni     from public.document_types where code = 'ulazni_racuni';
  select id into v_dt_izlazni    from public.document_types where code = 'izlazni_racuni';
  select id into v_dt_izvod      from public.document_types where code = 'izvod_banke';
  select id into v_dt_blagajna   from public.document_types where code = 'blagajna';
  select id into v_dt_putni      from public.document_types where code = 'putni_nalozi';
  select id into v_dt_obracun    from public.document_types where code = 'obracun_place';
  select id into v_dt_joppd      from public.document_types where code = 'joppd';
  select id into v_dt_evidencija from public.document_types where code = 'evidencija_prometa';
  select id into v_dt_pdv        from public.document_types where code = 'pdv_dokumentacija';

  if v_dt_ulazni is null
     or v_dt_izlazni is null
     or v_dt_izvod is null
     or v_dt_blagajna is null
     or v_dt_putni is null
     or v_dt_obracun is null
     or v_dt_joppd is null
     or v_dt_evidencija is null
     or v_dt_pdv is null
  then
    raise exception
      'DEMO SEED: One or more document_types rows are missing. Run supabase/seed.sql first (codes: ulazni_racuni, izlazni_racuni, izvod_banke, blagajna, putni_nalozi, obracun_place, joppd, evidencija_prometa, pdv_dokumentacija).';
  end if;

  -- ─── Clients (11 total: 10 active, 1 inactive) ──────────────────────────
  insert into public.clients
    (id, owner_user_id, company_name, oib, contact_person, email, phone, client_type, is_active)
  values
    -- 1. Marinović Građevina d.o.o.
    ('a1000000-0000-0000-0000-000000000001', v_demo_user_id,
     'Marinović Građevina d.o.o.', '12345678901', 'Ivan Marinović',
     'ivan.marinovic@example.com', '+385 91 234 5678', 'doo', true),
    -- 2. Jadranski Vrtovi j.d.o.o.
    ('a1000000-0000-0000-0000-000000000002', v_demo_user_id,
     'Jadranski Vrtovi j.d.o.o.', '23456789012', 'Ana Horvat',
     'ana.horvat@example.com', '+385 98 765 4321', 'doo', true),
    -- 3. Obrt Kovačević
    ('a1000000-0000-0000-0000-000000000003', v_demo_user_id,
     'Obrt Kovačević', '34567890123', 'Marko Kovačević',
     'marko.kovacevic@example.com', '+385 95 111 2222', 'obrt', true),
    -- 4. Udruga Zeleni Krug
    ('a1000000-0000-0000-0000-000000000004', v_demo_user_id,
     'Udruga Zeleni Krug', '45678901234', 'Petra Novak',
     'petra.novak@example.com', '+385 91 333 4444', 'udruga', true),
    -- 5. Petrović Transport d.o.o.
    ('a1000000-0000-0000-0000-000000000005', v_demo_user_id,
     'Petrović Transport d.o.o.', '56789012345', 'Tomislav Petrović',
     'tomislav.petrovic@example.com', '+385 99 555 6666', 'doo', true),
    -- 6. Obrt Baković — Frizerski salon
    ('a1000000-0000-0000-0000-000000000006', v_demo_user_id,
     'Obrt Baković — Frizerski salon', '67890123456', 'Lana Baković',
     'lana.bakovic@example.com', '+385 92 777 8888', 'pausalni_obrt', true),
    -- 7. Jadran Servis d.o.o.
    ('a1000000-0000-0000-0000-000000000007', v_demo_user_id,
     'Jadran Servis d.o.o.', '44556678811', 'Marta Bencic',
     'marta.bencic@example.com', '+385 91 445 5668', 'doo', true),
    -- 8. Adriatic Komerc j.d.o.o.
    ('a1000000-0000-0000-0000-000000000008', v_demo_user_id,
     'Adriatic Komerc j.d.o.o.', '44556678813', 'Luka Pavic',
     'luka.pavic@example.com', '+385 91 223 4456', 'doo', true),
    -- 9. Obrt Klaric
    ('a1000000-0000-0000-0000-000000000009', v_demo_user_id,
     'Obrt Klaric', '44556678812', 'Nina Klaric',
     'nina.klaric@example.com', '+385 95 667 8899', 'obrt', true),
    -- 10. Obrt Peric
    ('a1000000-0000-0000-0000-000000000010', v_demo_user_id,
     'Obrt Peric', '44556678814', 'Ivan Peric',
     'ivan.peric@example.com', '+385 95 778 8901', 'doo', true),
    -- 11. Likovna udruga Monet (INACTIVE)
    ('a1000000-0000-0000-0000-000000000011', v_demo_user_id,
     'Likovna udruga Monet', '93516678824', 'Maja Zanovski',
     'maja.zanovski@udrugamonet.hr', '+385 91 887 6543', 'udruga', false)
  on conflict (id) do nothing;

  -- ─── Document requirements ───────────────────────────────────────────────
  -- 1. Marinović Građevina d.o.o. — 6 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000001', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_pdv, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 2. Jadranski Vrtovi j.d.o.o. — 4 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000002', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_pdv, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 3. Obrt Kovačević — 5 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000003', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_evidencija, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 4. Udruga Zeleni Krug — 2 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000004', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000004', v_dt_izvod, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 5. Petrović Transport d.o.o. — 6 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000005', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_putni, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_joppd, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 6. Obrt Baković — Frizerski salon — 3 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000006', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000006', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000006', v_dt_evidencija, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 7. Jadran Servis d.o.o. — 8 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000007', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_putni, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000007', v_dt_pdv, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 8. Adriatic Komerc j.d.o.o. — 9 docs (all types)
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000008', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_putni, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_evidencija, true),
    ('a1000000-0000-0000-0000-000000000008', v_dt_pdv, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 9. Obrt Klaric — 6 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000009', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000009', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000009', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000009', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000009', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000009', v_dt_joppd, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 10. Obrt Peric — 8 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000010', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_putni, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000010', v_dt_pdv, true)
  on conflict (client_id, document_type_id) do nothing;

  -- 11. Likovna udruga Monet — 8 docs
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000011', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_putni, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000011', v_dt_pdv, true)
  on conflict (client_id, document_type_id) do nothing;

  -- ─── Monthly periods (Ožujak 2026) ─────────────────────────────────────
  -- Dashboard target: 6 incomplete, 5 ready, reminder dates on 4 rows
  insert into public.monthly_periods
    (id, client_id, year, month, status, last_reminder_sent_at)
  values
    -- Marinović Građevina — incomplete, 4/6 missing, reminder sent (latest: follow-up 18.03.)
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
     2026, 3, 'incomplete', '2026-03-18T09:00:00+01:00'),
    -- Jadranski Vrtovi — incomplete, 1/4 missing (PDV), no reminder
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
     2026, 3, 'incomplete', null),
    -- Obrt Kovačević — incomplete, 1/5 missing, reminder sent (latest: follow-up 22.03.)
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
     2026, 3, 'incomplete', '2026-03-22T09:30:00+01:00'),
    -- Udruga Zeleni Krug — ready, 0/2 missing
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
     2026, 3, 'ready', null),
    -- Petrović Transport — incomplete, 3/6 missing, reminder sent (latest: follow-up 20.03.)
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005',
     2026, 3, 'incomplete', '2026-03-20T10:00:00+01:00'),
    -- Obrt Baković — ready, 0/3 missing
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006',
     2026, 3, 'ready', null),
    -- Jadran Servis — ready, 0/8 missing
    ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007',
     2026, 3, 'ready', null),
    -- Adriatic Komerc — ready, 0/9 missing
    ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008',
     2026, 3, 'ready', null),
    -- Obrt Klaric — incomplete, 1/6 missing, reminder sent
    ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009',
     2026, 3, 'incomplete', '2026-03-24T10:15:00+01:00'),
    -- Obrt Peric — ready (was incomplete, now all reviewed), 0/8 missing
    -- (dashboard screenshot shows Spremno with 0/8)
    ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010',
     2026, 3, 'ready', null),
    -- Likovna udruga Monet — incomplete, 8/8 missing (inactive client, no docs submitted)
    ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000011',
     2026, 3, 'incomplete', null)
  on conflict (id) do nothing;

  -- ─── Monthly document statuses ──────────────────────────────────────────

  -- 1. Marinović Građevina — 4/6 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000001', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_izlazni, 'received'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_izvod, 'missing'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_obracun, 'missing'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_joppd, 'missing'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 2. Jadranski Vrtovi — 1/4 missing (matches month-checklist screenshot)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000002', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 3. Obrt Kovačević — 1/5 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000003', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_blagajna, 'received'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_evidencija, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 4. Udruga Zeleni Krug — 0/2 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000004', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000004', v_dt_izvod, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 5. Petrović Transport — 3/6 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000005', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_izlazni, 'received'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_putni, 'missing'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_obracun, 'missing'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_joppd, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 6. Obrt Baković — 0/3 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000006', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000006', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000006', v_dt_evidencija, 'received')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 7. Jadran Servis — 0/8 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000007', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_izvod, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_blagajna, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_putni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_obracun, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_joppd, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000007', v_dt_pdv, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 8. Adriatic Komerc — 0/9 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000008', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_izvod, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_blagajna, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_putni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_obracun, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_joppd, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_evidencija, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000008', v_dt_pdv, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 9. Obrt Klaric — 1/6 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000009', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000009', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000009', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000009', v_dt_blagajna, 'received'),
    ('b1000000-0000-0000-0000-000000000009', v_dt_obracun, 'received'),
    ('b1000000-0000-0000-0000-000000000009', v_dt_joppd, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 10. Obrt Peric — 0/8 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000010', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_izvod, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_blagajna, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_putni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_obracun, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_joppd, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000010', v_dt_pdv, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 11. Likovna udruga Monet — 8/8 missing (inactive, nothing submitted)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000011', v_dt_ulazni, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_izlazni, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_izvod, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_blagajna, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_putni, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_obracun, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_joppd, 'missing'),
    ('b1000000-0000-0000-0000-000000000011', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- ─── Reminders (8 total to match dashboard Podsjetnika count) ────────────
  insert into public.reminders
    (id, monthly_period_id, client_id, recipient_email, subject, body, sent_at, reminder_type)
  values
    -- Marinović — first reminder
    ('c1000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000001',
     'ivan.marinovic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Marinović Građevina d.o.o. — ožujak 2026',
     'Poštovani, za Marinović Građevina d.o.o. još uvijek nedostaje sljedeća dokumentacija za ožujak 2026: Izvod banke, Obračun plaća, JOPPD, PDV dokumentacija.',
     '2026-03-10T09:00:00+01:00',
     'first'),
    -- Marinović — follow-up reminder
    ('c1000000-0000-0000-0000-000000000002',
     'b1000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000001',
     'ivan.marinovic@example.com',
     'Naknadni podsjetnik: Marinović Građevina d.o.o. — ožujak 2026',
     'Poštovani, još uvijek nedostaje dokumentacija za Marinović Građevina d.o.o. za ožujak 2026. Molimo vas da dostavite: Izvod banke, Obračun plaća, JOPPD, PDV dokumentacija.',
     '2026-03-18T09:00:00+01:00',
     'follow_up'),
    -- Petrović Transport — first reminder
    ('c1000000-0000-0000-0000-000000000003',
     'b1000000-0000-0000-0000-000000000005',
     'a1000000-0000-0000-0000-000000000005',
     'tomislav.petrovic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Petrović Transport d.o.o. — ožujak 2026',
     'Poštovani, za Petrović Transport d.o.o. još uvijek nedostaje sljedeća dokumentacija za ožujak 2026: Putni nalozi, Obračun plaća, JOPPD.',
     '2026-03-12T11:00:00+01:00',
     'first'),
    -- Obrt Kovačević — first reminder
    ('c1000000-0000-0000-0000-000000000004',
     'b1000000-0000-0000-0000-000000000003',
     'a1000000-0000-0000-0000-000000000003',
     'marko.kovacevic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Obrt Kovačević — ožujak 2026',
     'Poštovani, za Obrt Kovačević još uvijek nedostaje sljedeća dokumentacija za ožujak 2026: Evidencija prometa.',
     '2026-03-15T14:30:00+01:00',
     'first'),
    -- Obrt Kovačević — follow-up reminder
    ('c1000000-0000-0000-0000-000000000005',
     'b1000000-0000-0000-0000-000000000003',
     'a1000000-0000-0000-0000-000000000003',
     'marko.kovacevic@example.com',
     'Naknadni podsjetnik: Obrt Kovačević — ožujak 2026',
     'Poštovani, još uvijek nedostaje dokumentacija za Obrt Kovačević za ožujak 2026. Molimo vas da dostavite: Evidencija prometa.',
     '2026-03-22T09:30:00+01:00',
     'follow_up'),
    -- Obrt Klaric — first reminder
    ('c1000000-0000-0000-0000-000000000006',
     'b1000000-0000-0000-0000-000000000009',
     'a1000000-0000-0000-0000-000000000009',
     'nina.klaric@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Obrt Klaric — ožujak 2026',
     'Poštovani, za Obrt Klaric još uvijek nedostaje sljedeća dokumentacija za ožujak 2026: JOPPD.',
     '2026-03-24T10:15:00+01:00',
     'first'),
    -- Petrović Transport — follow-up reminder
    ('c1000000-0000-0000-0000-000000000007',
     'b1000000-0000-0000-0000-000000000005',
     'a1000000-0000-0000-0000-000000000005',
     'tomislav.petrovic@example.com',
     'Naknadni podsjetnik: Petrović Transport d.o.o. — ožujak 2026',
     'Poštovani, još uvijek nedostaje dokumentacija za Petrović Transport d.o.o. za ožujak 2026. Molimo vas da dostavite: Putni nalozi, Obračun plaća, JOPPD.',
     '2026-03-20T10:00:00+01:00',
     'follow_up'),
    -- Jadranski Vrtovi — manual reminder
    ('c1000000-0000-0000-0000-000000000008',
     'b1000000-0000-0000-0000-000000000002',
     'a1000000-0000-0000-0000-000000000002',
     'ana.horvat@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Jadranski Vrtovi j.d.o.o. — ožujak 2026',
     'Poštovani, za Jadranski Vrtovi j.d.o.o. još uvijek nedostaje sljedeća dokumentacija za ožujak 2026: PDV dokumentacija.',
     '2026-03-25T08:45:00+01:00',
     'manual')
  on conflict (id) do nothing;

  -- ─── Monthly periods (Travanj / April 2026 — current month) ─────────────
  -- This is the month that will show on the dashboard when demo is used in April 2026.
  -- Similar distribution: mix of incomplete and ready, some reminders.
  insert into public.monthly_periods
    (id, client_id, year, month, status, last_reminder_sent_at)
  values
    -- Marinović Građevina — incomplete, some missing
    ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
     2026, 4, 'incomplete', null),
    -- Jadranski Vrtovi — incomplete, 1 missing
    ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
     2026, 4, 'incomplete', null),
    -- Obrt Kovačević — incomplete, some missing, reminder sent
    ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
     2026, 4, 'incomplete', '2026-04-05T09:00:00+02:00'),
    -- Udruga Zeleni Krug — ready
    ('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
     2026, 4, 'ready', null),
    -- Petrović Transport — incomplete, several missing, reminder sent
    ('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005',
     2026, 4, 'incomplete', '2026-04-06T11:30:00+02:00'),
    -- Obrt Baković — ready
    ('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006',
     2026, 4, 'ready', null),
    -- Jadran Servis — ready
    ('b2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007',
     2026, 4, 'ready', null),
    -- Adriatic Komerc — incomplete, some docs pending
    ('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008',
     2026, 4, 'incomplete', null),
    -- Obrt Klaric — incomplete, 1 missing, reminder sent
    ('b2000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009',
     2026, 4, 'incomplete', '2026-04-05T14:00:00+02:00'),
    -- Obrt Peric — ready
    ('b2000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010',
     2026, 4, 'ready', null),
    -- Likovna udruga Monet — incomplete (inactive, nothing submitted)
    ('b2000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000011',
     2026, 4, 'incomplete', null)
  on conflict (id) do nothing;

  -- ─── April 2026 document statuses ──────────────────────────────────────

  -- 1. Marinović Građevina — 3/6 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000001', v_dt_ulazni, 'received'),
    ('b2000000-0000-0000-0000-000000000001', v_dt_izlazni, 'received'),
    ('b2000000-0000-0000-0000-000000000001', v_dt_izvod, 'received'),
    ('b2000000-0000-0000-0000-000000000001', v_dt_obracun, 'missing'),
    ('b2000000-0000-0000-0000-000000000001', v_dt_joppd, 'missing'),
    ('b2000000-0000-0000-0000-000000000001', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 2. Jadranski Vrtovi — 1/4 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000002', v_dt_ulazni, 'received'),
    ('b2000000-0000-0000-0000-000000000002', v_dt_izlazni, 'received'),
    ('b2000000-0000-0000-0000-000000000002', v_dt_izvod, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000002', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 3. Obrt Kovačević — 2/5 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000003', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000003', v_dt_izlazni, 'received'),
    ('b2000000-0000-0000-0000-000000000003', v_dt_izvod, 'received'),
    ('b2000000-0000-0000-0000-000000000003', v_dt_blagajna, 'missing'),
    ('b2000000-0000-0000-0000-000000000003', v_dt_evidencija, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 4. Udruga Zeleni Krug — 0/2 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000004', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000004', v_dt_izvod, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 5. Petrović Transport — 4/6 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000005', v_dt_ulazni, 'received'),
    ('b2000000-0000-0000-0000-000000000005', v_dt_izlazni, 'received'),
    ('b2000000-0000-0000-0000-000000000005', v_dt_izvod, 'missing'),
    ('b2000000-0000-0000-0000-000000000005', v_dt_putni, 'missing'),
    ('b2000000-0000-0000-0000-000000000005', v_dt_obracun, 'missing'),
    ('b2000000-0000-0000-0000-000000000005', v_dt_joppd, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 6. Obrt Baković — 0/3 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000006', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000006', v_dt_izvod, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000006', v_dt_evidencija, 'received')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 7. Jadran Servis — 0/8 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000007', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_izlazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_izvod, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_blagajna, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_putni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_obracun, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_joppd, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000007', v_dt_pdv, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 8. Adriatic Komerc — 2/9 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000008', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_izlazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_izvod, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_blagajna, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_putni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_obracun, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_joppd, 'missing'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_evidencija, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000008', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 9. Obrt Klaric — 1/6 missing
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000009', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000009', v_dt_izlazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000009', v_dt_izvod, 'received'),
    ('b2000000-0000-0000-0000-000000000009', v_dt_blagajna, 'received'),
    ('b2000000-0000-0000-0000-000000000009', v_dt_obracun, 'received'),
    ('b2000000-0000-0000-0000-000000000009', v_dt_joppd, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 10. Obrt Peric — 0/8 missing (ready)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000010', v_dt_ulazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_izlazni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_izvod, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_blagajna, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_putni, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_obracun, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_joppd, 'reviewed'),
    ('b2000000-0000-0000-0000-000000000010', v_dt_pdv, 'reviewed')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- 11. Likovna udruga Monet — 8/8 missing (inactive)
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b2000000-0000-0000-0000-000000000011', v_dt_ulazni, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_izlazni, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_izvod, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_blagajna, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_putni, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_obracun, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_joppd, 'missing'),
    ('b2000000-0000-0000-0000-000000000011', v_dt_pdv, 'missing')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- ─── April 2026 reminders (3 to give some dashboard activity) ──────────
  insert into public.reminders
    (id, monthly_period_id, client_id, recipient_email, subject, body, sent_at, reminder_type)
  values
    ('c2000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000003',
     'a1000000-0000-0000-0000-000000000003',
     'marko.kovacevic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Obrt Kovačević — travanj 2026',
     'Poštovani, za Obrt Kovačević još uvijek nedostaje sljedeća dokumentacija za travanj 2026: Blagajna, Evidencija prometa.',
     '2026-04-05T09:00:00+02:00',
     'first'),
    ('c2000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000005',
     'a1000000-0000-0000-0000-000000000005',
     'tomislav.petrovic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Petrović Transport d.o.o. — travanj 2026',
     'Poštovani, za Petrović Transport d.o.o. još uvijek nedostaje sljedeća dokumentacija za travanj 2026: Izvod banke, Putni nalozi, Obračun plaća, JOPPD.',
     '2026-04-06T11:30:00+02:00',
     'first'),
    ('c2000000-0000-0000-0000-000000000003',
     'b2000000-0000-0000-0000-000000000009',
     'a1000000-0000-0000-0000-000000000009',
     'nina.klaric@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Obrt Klaric — travanj 2026',
     'Poštovani, za Obrt Klaric još uvijek nedostaje sljedeća dokumentacija za travanj 2026: JOPPD.',
     '2026-04-05T14:00:00+02:00',
     'first')
  on conflict (id) do nothing;

  -- ─── Reminder settings ──────────────────────────────────────────────────
  insert into public.reminder_settings
    (owner_user_id, overdue_threshold_day, auto_send_enabled,
     first_reminder_day_offset, follow_up_reminder_day_offset, final_reminder_day_offset)
  values
    (v_demo_user_id, 10, true, 3, 7, 10)
  on conflict (owner_user_id) do update set
    overdue_threshold_day = excluded.overdue_threshold_day,
    auto_send_enabled = excluded.auto_send_enabled,
    first_reminder_day_offset = excluded.first_reminder_day_offset,
    follow_up_reminder_day_offset = excluded.follow_up_reminder_day_offset,
    final_reminder_day_offset = excluded.final_reminder_day_offset;

end $$;

commit;
