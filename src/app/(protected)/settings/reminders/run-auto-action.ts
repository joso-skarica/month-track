'use server';

import { createClient } from '@/lib/supabase/server';
import { runAutomaticRemindersForUser } from '@/lib/reminders/run-automatic-reminders';

export type TriggerAutomaticRemindersResult =
  | {
      success: true;
      sentCount: number;
      failedCount: number;
    }
  | { success: false; error: string };

/**
 * Manual trigger for the same pipeline a future cron job would call (per user).
 */
export async function triggerAutomaticRemindersNow(): Promise<TriggerAutomaticRemindersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const result = await runAutomaticRemindersForUser(supabase, user.id);

  if (!result.ran) {
    if (result.reason === 'no_settings') {
      return {
        success: false,
        error: 'Postavke podsjetnika nisu pronađene.',
      };
    }
    return {
      success: false,
      error:
        'Automatsko slanje je isključeno. Uključite ga u postavkama ispod.',
    };
  }

  return {
    success: true,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
  };
}
