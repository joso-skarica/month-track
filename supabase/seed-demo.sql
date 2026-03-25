-- =============================================================================
-- DEMO DATA ONLY — not for production.
-- Run in Supabase SQL Editor after supabase/seed.sql (document_types).
-- Requires a demo user in auth.users / public.profiles (same id).
-- =============================================================================
-- 1. If needed, change v_demo_user_id in the DO block to match your Supabase user.
-- 2. Run the whole script (BEGIN … COMMIT).
--
-- Snimke zaslona (nadzorna ploča / mjesec / klijenti / postavke):
--   • Nepotpuno + nedostajući dokumenti (npr. Marinović, Petrović).
--   • Nepotpuno + 0 nedostaje — Jadranski Vrtovi (svi dokumenti pregledani/zaprimljeni).
--   • Spremno (Udruga Zeleni Krug, Obrt Baković).
--   • Zadnji podsjetnik s datumom; povijest: prvi + naknadni tip.
-- =============================================================================

begin;

do $$
declare
  -- Demo user UUID (Supabase Auth / profiles.id)
  v_demo_user_id uuid := '5ca0ecf5-e534-48f2-8aa9-43c4bbe84d7f'::uuid;

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

  -- ─── Clients ────────────────────────────────────────────────────────────
  insert into public.clients
    (id, owner_user_id, company_name, oib, contact_person, email, phone, client_type, is_active)
  values
    ('a1000000-0000-0000-0000-000000000001', v_demo_user_id,
     'Marinović Građevina d.o.o.', '12345678901', 'Ivan Marinović',
     'ivan.marinovic@example.com', '+385 91 234 5678', 'doo', true),
    ('a1000000-0000-0000-0000-000000000002', v_demo_user_id,
     'Jadranski Vrtovi j.d.o.o.', '23456789012', 'Ana Horvat',
     'ana.horvat@example.com', '+385 98 765 4321', 'doo', true),
    ('a1000000-0000-0000-0000-000000000003', v_demo_user_id,
     'Obrt Kovačević', '34567890123', 'Marko Kovačević',
     'marko.kovacevic@example.com', '+385 95 111 2222', 'obrt', true),
    ('a1000000-0000-0000-0000-000000000004', v_demo_user_id,
     'Udruga Zeleni Krug', '45678901234', 'Petra Novak',
     'petra.novak@example.com', '+385 91 333 4444', 'udruga', true),
    ('a1000000-0000-0000-0000-000000000005', v_demo_user_id,
     'Petrović Transport d.o.o.', '56789012345', 'Tomislav Petrović',
     'tomislav.petrovic@example.com', '+385 99 555 6666', 'doo', true),
    ('a1000000-0000-0000-0000-000000000006', v_demo_user_id,
     'Obrt Baković — Frizerski salon', '67890123456', 'Lana Baković',
     'lana.bakovic@example.com', '+385 92 777 8888', 'pausalni_obrt', true)
  on conflict (id) do nothing;

  -- ─── Document requirements ───────────────────────────────────────────────
  insert into public.client_document_requirements (client_id, document_type_id, is_required) values
    ('a1000000-0000-0000-0000-000000000001', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000001', v_dt_pdv, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000002', v_dt_pdv, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_blagajna, true),
    ('a1000000-0000-0000-0000-000000000003', v_dt_evidencija, true),
    ('a1000000-0000-0000-0000-000000000004', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000004', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_izlazni, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_putni, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_obracun, true),
    ('a1000000-0000-0000-0000-000000000005', v_dt_joppd, true),
    ('a1000000-0000-0000-0000-000000000006', v_dt_ulazni, true),
    ('a1000000-0000-0000-0000-000000000006', v_dt_izvod, true),
    ('a1000000-0000-0000-0000-000000000006', v_dt_evidencija, true)
  on conflict (client_id, document_type_id) do nothing;

  -- ─── Monthly periods ─────────────────────────────────────────────────────
  insert into public.monthly_periods
    (id, client_id, year, month, status, last_reminder_sent_at)
  values
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
     2026, 3, 'incomplete', '2026-03-10T09:00:00+01:00'),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
     2026, 3, 'incomplete', null),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
     2026, 3, 'incomplete', '2026-03-15T14:30:00+01:00'),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
     2026, 3, 'ready', null),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005',
     2026, 3, 'incomplete', '2026-03-12T11:00:00+01:00'),
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006',
     2026, 3, 'ready', null)
  on conflict (id) do nothing;

  -- ─── Monthly document statuses ──────────────────────────────────────────
  insert into public.monthly_document_statuses (monthly_period_id, document_type_id, status) values
    ('b1000000-0000-0000-0000-000000000001', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_izlazni, 'received'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_izvod, 'missing'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_obracun, 'missing'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_joppd, 'missing'),
    ('b1000000-0000-0000-0000-000000000001', v_dt_pdv, 'missing'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_izvod, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000002', v_dt_pdv, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_izlazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_blagajna, 'received'),
    ('b1000000-0000-0000-0000-000000000003', v_dt_evidencija, 'missing'),
    ('b1000000-0000-0000-0000-000000000004', v_dt_ulazni, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000004', v_dt_izvod, 'reviewed'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_izlazni, 'received'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_putni, 'missing'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_obracun, 'missing'),
    ('b1000000-0000-0000-0000-000000000005', v_dt_joppd, 'missing'),
    ('b1000000-0000-0000-0000-000000000006', v_dt_ulazni, 'received'),
    ('b1000000-0000-0000-0000-000000000006', v_dt_izvod, 'received'),
    ('b1000000-0000-0000-0000-000000000006', v_dt_evidencija, 'received')
  on conflict (monthly_period_id, document_type_id) do nothing;

  -- ─── Reminders (fixed ids for idempotent re-runs) ─────────────────────────
  insert into public.reminders
    (id, monthly_period_id, client_id, recipient_email, subject, body, sent_at, reminder_type)
  values
    ('c1000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000001',
     'ivan.marinovic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Marinović Građevina d.o.o. — ožujak 2026',
     'Poštovani, za Marinović Građevina d.o.o. još uvijek nedostaje sljedeća dokumentacija za ožujak 2026.',
     '2026-03-10T09:00:00+01:00',
     'first'),
    ('c1000000-0000-0000-0000-000000000002',
     'b1000000-0000-0000-0000-000000000005',
     'a1000000-0000-0000-0000-000000000005',
     'tomislav.petrovic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Petrović Transport d.o.o. — ožujak 2026',
     'Poštovani, za Petrović Transport d.o.o. još uvijek nedostaje sljedeća dokumentacija za ožujak 2026.',
     '2026-03-12T11:00:00+01:00',
     'first'),
    ('c1000000-0000-0000-0000-000000000003',
     'b1000000-0000-0000-0000-000000000003',
     'a1000000-0000-0000-0000-000000000003',
     'marko.kovacevic@example.com',
     'Podsjetnik: nedostajuća dokumentacija za Obrt Kovačević — ožujak 2026',
     'Poštovani, za Obrt Kovačević još uvijek nedostaje sljedeća dokumentacija za ožujak 2026.',
     '2026-03-15T14:30:00+01:00',
     'follow_up')
  on conflict (id) do nothing;

end $$;

commit;
