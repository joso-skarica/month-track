'use server';

import { createClient } from '@/lib/supabase/server';

export type ReminderSettingsFormData = {
  default_subject: string;
  default_body: string;
  follow_up_subject: string;
  follow_up_body: string;
  signature: string;
  auto_send_enabled: boolean;
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

  const { error } = await supabase
    .from('reminder_settings')
    .update({
      default_subject: data.default_subject || null,
      default_body: data.default_body || null,
      follow_up_subject: data.follow_up_subject || null,
      follow_up_body: data.follow_up_body || null,
      signature: data.signature || null,
      auto_send_enabled: data.auto_send_enabled,
    })
    .eq('owner_user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
