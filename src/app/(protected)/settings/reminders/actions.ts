'use server';

import { createClient } from '@/lib/supabase/server';
import {
  OVERDUE_THRESHOLD_DAY_MAX,
  OVERDUE_THRESHOLD_DAY_MIN,
} from '@/lib/utils/months';

export type ReminderSettingsFormData = {
  default_subject: string;
  default_body: string;
  follow_up_subject: string;
  follow_up_body: string;
  signature: string;
  auto_send_enabled: boolean;
  first_reminder_day_offset: number;
  follow_up_reminder_day_offset: number;
  final_reminder_day_offset: number;
  overdue_threshold_day: number;
};

type Result =
  | { success: true }
  | { success: false; error: string };

export async function updateReminderSettings(
  data: ReminderSettingsFormData,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const day = data.overdue_threshold_day;
  if (
    typeof day !== 'number' ||
    !Number.isInteger(day) ||
    day < OVERDUE_THRESHOLD_DAY_MIN ||
    day > OVERDUE_THRESHOLD_DAY_MAX
  ) {
    return {
      success: false,
      error: `Dan u mjesecu mora biti cijeli broj od ${OVERDUE_THRESHOLD_DAY_MIN} do ${OVERDUE_THRESHOLD_DAY_MAX}.`,
    };
  }

  const firstOff = data.first_reminder_day_offset;
  const followOff = data.follow_up_reminder_day_offset;
  const finalOff = data.final_reminder_day_offset;
  const boundsMsg = `Dani za automatske podsjetnike moraju biti cijeli brojevi od ${OVERDUE_THRESHOLD_DAY_MIN} do ${OVERDUE_THRESHOLD_DAY_MAX}.`;

  for (const [label, n] of [
    ['Prvi podsjetnik', firstOff],
    ['Follow-up', followOff],
    ['Završni podsjetnik', finalOff],
  ] as const) {
    if (
      typeof n !== 'number' ||
      !Number.isInteger(n) ||
      n < OVERDUE_THRESHOLD_DAY_MIN ||
      n > OVERDUE_THRESHOLD_DAY_MAX
    ) {
      return { success: false, error: boundsMsg };
    }
  }

  if (firstOff > followOff || followOff > finalOff) {
    return {
      success: false,
      error:
        'Redoslijed dana mora biti: prvi ≤ follow-up ≤ završni (u sljedećem mjesecu nakon razdoblja).',
    };
  }

  const { error } = await supabase
    .from('reminder_settings')
    .update({
      default_subject: data.default_subject || null,
      default_body: data.default_body || null,
      follow_up_subject: data.follow_up_subject || null,
      follow_up_body: data.follow_up_body || null,
      signature: data.signature || null,
      auto_send_enabled: data.auto_send_enabled,
      first_reminder_day_offset: firstOff,
      follow_up_reminder_day_offset: followOff,
      final_reminder_day_offset: finalOff,
      overdue_threshold_day: day,
    })
    .eq('owner_user_id', user.id);

  if (error) {
    console.error('[updateReminderSettings] Update error:', error.message);
    return { success: false, error: 'Došlo je do pogreške pri spremanju. Pokušajte ponovo.' };
  }

  return { success: true };
}
