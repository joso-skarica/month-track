-- Per-user deadline day in the following month for marking incomplete months as overdue (dashboard).
alter table public.reminder_settings
  add column overdue_threshold_day integer not null default 10
    constraint reminder_settings_overdue_threshold_day_check
    check (overdue_threshold_day >= 1 and overdue_threshold_day <= 28);

comment on column public.reminder_settings.overdue_threshold_day is
  'Day of the following calendar month (1–28) after which an incomplete month is shown as overdue on the dashboard.';
