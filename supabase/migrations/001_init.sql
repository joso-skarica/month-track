-- ============================================================
-- Month-Track V1: Initial migration
-- ============================================================

-- Helper: auto-set updated_at on row update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- 1. profiles
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  firm_name   text,
  full_name   text,
  email       text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- 2. clients
-- ============================================================
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references public.profiles(id) on delete cascade,
  company_name    text not null,
  oib             text not null,
  contact_person  text,
  email           text not null,
  phone           text,
  client_type     text not null check (client_type in ('pausalni_obrt','obrt','doo','udruga','other')),
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  unique (owner_user_id, oib)
);

create index idx_clients_owner on public.clients (owner_user_id);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

alter table public.clients enable row level security;

create policy "Users can view own clients"
  on public.clients for select
  using (auth.uid() = owner_user_id);

create policy "Users can insert own clients"
  on public.clients for insert
  with check (auth.uid() = owner_user_id);

create policy "Users can update own clients"
  on public.clients for update
  using (auth.uid() = owner_user_id);

create policy "Users can delete own clients"
  on public.clients for delete
  using (auth.uid() = owner_user_id);

-- ============================================================
-- 3. document_types (global reference table)
-- ============================================================
create table public.document_types (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  label_hr    text not null,
  sort_order  int not null,
  is_active   boolean default true
);

alter table public.document_types enable row level security;

create policy "Authenticated users can view document types"
  on public.document_types for select
  to authenticated
  using (true);

-- ============================================================
-- 4. client_document_requirements
-- ============================================================
create table public.client_document_requirements (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  document_type_id  uuid not null references public.document_types(id) on delete cascade,
  is_required       boolean default true,
  created_at        timestamptz default now(),

  unique (client_id, document_type_id)
);

create index idx_cdr_client on public.client_document_requirements (client_id);
create index idx_cdr_document_type on public.client_document_requirements (document_type_id);

alter table public.client_document_requirements enable row level security;

create policy "Users can view own client document requirements"
  on public.client_document_requirements for select
  using (
    exists (
      select 1 from public.clients
      where clients.id = client_document_requirements.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can insert own client document requirements"
  on public.client_document_requirements for insert
  with check (
    exists (
      select 1 from public.clients
      where clients.id = client_document_requirements.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can update own client document requirements"
  on public.client_document_requirements for update
  using (
    exists (
      select 1 from public.clients
      where clients.id = client_document_requirements.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can delete own client document requirements"
  on public.client_document_requirements for delete
  using (
    exists (
      select 1 from public.clients
      where clients.id = client_document_requirements.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. monthly_periods
-- ============================================================
create table public.monthly_periods (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  year                  int not null,
  month                 int not null check (month between 1 and 12),
  status                text not null default 'incomplete' check (status in ('incomplete','ready')),
  last_reminder_sent_at timestamptz,
  ready_at              timestamptz,
  created_at            timestamptz default now(),

  unique (client_id, year, month)
);

create index idx_mp_client on public.monthly_periods (client_id);

alter table public.monthly_periods enable row level security;

create policy "Users can view own monthly periods"
  on public.monthly_periods for select
  using (
    exists (
      select 1 from public.clients
      where clients.id = monthly_periods.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can insert own monthly periods"
  on public.monthly_periods for insert
  with check (
    exists (
      select 1 from public.clients
      where clients.id = monthly_periods.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can update own monthly periods"
  on public.monthly_periods for update
  using (
    exists (
      select 1 from public.clients
      where clients.id = monthly_periods.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can delete own monthly periods"
  on public.monthly_periods for delete
  using (
    exists (
      select 1 from public.clients
      where clients.id = monthly_periods.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. monthly_document_statuses
-- ============================================================
create table public.monthly_document_statuses (
  id                uuid primary key default gen_random_uuid(),
  monthly_period_id uuid not null references public.monthly_periods(id) on delete cascade,
  document_type_id  uuid not null references public.document_types(id) on delete cascade,
  status            text not null default 'missing' check (status in ('missing','received','reviewed')),
  notes             text,
  updated_at        timestamptz default now(),

  unique (monthly_period_id, document_type_id)
);

create index idx_mds_period on public.monthly_document_statuses (monthly_period_id);
create index idx_mds_document_type on public.monthly_document_statuses (document_type_id);

alter table public.monthly_document_statuses enable row level security;

create policy "Users can view own monthly document statuses"
  on public.monthly_document_statuses for select
  using (
    exists (
      select 1 from public.monthly_periods
        join public.clients on clients.id = monthly_periods.client_id
      where monthly_periods.id = monthly_document_statuses.monthly_period_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can insert own monthly document statuses"
  on public.monthly_document_statuses for insert
  with check (
    exists (
      select 1 from public.monthly_periods
        join public.clients on clients.id = monthly_periods.client_id
      where monthly_periods.id = monthly_document_statuses.monthly_period_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can update own monthly document statuses"
  on public.monthly_document_statuses for update
  using (
    exists (
      select 1 from public.monthly_periods
        join public.clients on clients.id = monthly_periods.client_id
      where monthly_periods.id = monthly_document_statuses.monthly_period_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can delete own monthly document statuses"
  on public.monthly_document_statuses for delete
  using (
    exists (
      select 1 from public.monthly_periods
        join public.clients on clients.id = monthly_periods.client_id
      where monthly_periods.id = monthly_document_statuses.monthly_period_id
        and clients.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. reminders
-- ============================================================
create table public.reminders (
  id                uuid primary key default gen_random_uuid(),
  monthly_period_id uuid not null references public.monthly_periods(id) on delete cascade,
  client_id         uuid not null references public.clients(id) on delete cascade,
  recipient_email   text not null,
  subject           text not null,
  body              text not null,
  sent_at           timestamptz default now(),
  reminder_type     text not null default 'manual' check (reminder_type in ('manual','first','follow_up','final'))
);

create index idx_reminders_period on public.reminders (monthly_period_id);
create index idx_reminders_client on public.reminders (client_id);

alter table public.reminders enable row level security;

create policy "Users can view own reminders"
  on public.reminders for select
  using (
    exists (
      select 1 from public.clients
      where clients.id = reminders.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

create policy "Users can insert own reminders"
  on public.reminders for insert
  with check (
    exists (
      select 1 from public.clients
      where clients.id = reminders.client_id
        and clients.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. reminder_settings
-- ============================================================
create table public.reminder_settings (
  id                uuid primary key default gen_random_uuid(),
  owner_user_id     uuid not null unique references public.profiles(id) on delete cascade,
  default_subject   text,
  default_body      text,
  follow_up_subject text,
  follow_up_body    text,
  signature         text,
  auto_send_enabled boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create trigger reminder_settings_updated_at
  before update on public.reminder_settings
  for each row execute function public.handle_updated_at();

alter table public.reminder_settings enable row level security;

create policy "Users can view own reminder settings"
  on public.reminder_settings for select
  using (auth.uid() = owner_user_id);

create policy "Users can insert own reminder settings"
  on public.reminder_settings for insert
  with check (auth.uid() = owner_user_id);

create policy "Users can update own reminder settings"
  on public.reminder_settings for update
  using (auth.uid() = owner_user_id);

-- ============================================================
-- Trigger: auto-create profile + reminder_settings on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into public.reminder_settings (owner_user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
