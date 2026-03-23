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

  const { error } = await supabase
    .from('reminder_settings')
    .update({
      default_subject: data.default_subject || null,
      default_body: data.default_body || null,
      follow_up_subject: data.follow_up_subject || null,
      follow_up_body: data.follow_up_body || null,
      signature: data.signature || null,
      auto_send_enabled: data.auto_send_enabled,
      overdue_threshold_day: day,
    })
    .eq('owner_user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
