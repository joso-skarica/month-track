-- =============================================================================
-- DEMO DATA CLEANUP (idempotent)
-- Use this after seeding/demo imports to replace legacy placeholder client names.
-- Safe to run multiple times.
-- =============================================================================

begin;

update public.clients as c
set
  company_name = v.new_company_name,
  contact_person = v.new_contact_person,
  email = v.new_email
from (
  values
    (
      'Nova firma 2023',
      'Jadran Servis d.o.o.',
      'Marta Bencic',
      'marta.bencic@example.com'
    ),
    (
      'Nova firma 2027',
      'Adriatic Komerc j.d.o.o.',
      'Luka Pavic',
      'luka.pavic@example.com'
    ),
    (
      'Obrt 2026',
      'Obrt Klaric',
      'Nina Klaric',
      'nina.klaric@example.com'
    ),
    (
      'Obrt 2027',
      'Obrt Peric',
      'Ivan Peric',
      'ivan.peric@example.com'
    )
) as v(old_company_name, new_company_name, new_contact_person, new_email)
where lower(trim(c.company_name)) = lower(v.old_company_name);

commit;
