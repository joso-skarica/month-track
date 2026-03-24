alter table public.reminder_settings
  add column if not exists first_reminder_day_offset integer not null default 3,
  add column if not exists follow_up_reminder_day_offset integer not null default 7,
  add column if not exists final_reminder_day_offset integer not null default 10;

alter table public.reminder_settings
  drop constraint if exists reminder_settings_first_offset_check,
  drop constraint if exists reminder_settings_follow_up_offset_check,
  drop constraint if exists reminder_settings_final_offset_check,
  drop constraint if exists reminder_settings_offset_order_check;

alter table public.reminder_settings
  add constraint reminder_settings_first_offset_check
    check (first_reminder_day_offset between 1 and 28),
  add constraint reminder_settings_follow_up_offset_check
    check (follow_up_reminder_day_offset between 1 and 28),
  add constraint reminder_settings_final_offset_check
    check (final_reminder_day_offset between 1 and 28),
  add constraint reminder_settings_offset_order_check
    check (
      first_reminder_day_offset <= follow_up_reminder_day_offset
      and follow_up_reminder_day_offset <= final_reminder_day_offset
    );

comment on column public.reminder_settings.first_reminder_day_offset is
  'End of this calendar day in the month after the period: first auto reminder may send after this instant.';

comment on column public.reminder_settings.follow_up_reminder_day_offset is
  'Same anchor as first_reminder_day_offset; follow-up auto reminder.';

comment on column public.reminder_settings.final_reminder_day_offset is
  'Same anchor; final auto reminder (uses follow-up email templates).';