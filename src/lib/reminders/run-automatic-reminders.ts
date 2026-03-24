import { isPastFollowingMonthDay } from '@/lib/utils/months';
import {
  sendPeriodReminder,
  type ReminderSupabase,
  type SendPeriodReminderResult,
} from '@/lib/reminders/send-period-reminder';
import type { ReminderSettings, ReminderType } from '@/types/db';

export type AutomatedReminderType = Extract<
  ReminderType,
  'first' | 'follow_up' | 'final'
>;

const AUTOMATED_ORDER: readonly AutomatedReminderType[] = [
  'first',
  'follow_up',
  'final',
];

function offsetForType(
  settings: ReminderSettings,
  type: AutomatedReminderType,
): number {
  if (type === 'first') return settings.first_reminder_day_offset;
  if (type === 'follow_up') return settings.follow_up_reminder_day_offset;
  return settings.final_reminder_day_offset;
}

export function nextDueAutomatedReminderType(
  periodYear: number,
  periodMonth: number,
  alreadySent: ReadonlySet<AutomatedReminderType>,
  settings: ReminderSettings,
  now: Date,
): AutomatedReminderType | null {
  for (const type of AUTOMATED_ORDER) {
    if (alreadySent.has(type)) continue;
    const day = offsetForType(settings, type);
    if (isPastFollowingMonthDay(periodYear, periodMonth, day, now)) {
      return type;
    }
  }
  return null;
}

export type AutoReminderRunItem =
  | {
      kind: 'sent';
      monthlyPeriodId: string;
      reminderType: AutomatedReminderType;
    }
  | {
      kind: 'failed';
      monthlyPeriodId: string;
      reminderType: AutomatedReminderType;
      result: Extract<SendPeriodReminderResult, { ok: false }>;
    };

export type RunAutomaticRemindersResult =
  | {
      ran: true;
      items: AutoReminderRunItem[];
      sentCount: number;
      failedCount: number;
    }
  | {
      ran: false;
      reason: 'auto_send_disabled' | 'no_settings';
    };

/**
 * Sends at most one automated reminder per eligible incomplete month (next due step in first → follow_up → final).
 * Respects reminder_settings.auto_send_enabled.
 */
export async function runAutomaticRemindersForUser(
  supabase: ReminderSupabase,
  userId: string,
  now: Date = new Date(),
): Promise<RunAutomaticRemindersResult> {
  const { data: settings, error: settingsError } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('owner_user_id', userId)
    .single<ReminderSettings>();

  if (settingsError || !settings) {
    return { ran: false, reason: 'no_settings' };
  }

  if (!settings.auto_send_enabled) {
    return { ran: false, reason: 'auto_send_disabled' };
  }

  const { data: missingRows } = await supabase
    .from('monthly_document_statuses')
    .select('monthly_period_id')
    .eq('status', 'missing');

  const withMissing = new Set(
    (missingRows ?? []).map((r) => r.monthly_period_id),
  );

  if (withMissing.size === 0) {
    return { ran: true, items: [], sentCount: 0, failedCount: 0 };
  }

  const periodIds = [...withMissing];

  const { data: periods } = await supabase
    .from('monthly_periods')
    .select('id, year, month')
    .in('id', periodIds)
    .eq('status', 'incomplete');

  const eligible = periods ?? [];
  if (eligible.length === 0) {
    return { ran: true, items: [], sentCount: 0, failedCount: 0 };
  }

  const eligibleIds = eligible.map((p) => p.id);

  const { data: reminderRows } = await supabase
    .from('reminders')
    .select('monthly_period_id, reminder_type')
    .in('monthly_period_id', eligibleIds)
    .in('reminder_type', [...AUTOMATED_ORDER]);

  const sentByPeriod = new Map<string, Set<AutomatedReminderType>>();
  for (const row of reminderRows ?? []) {
    const t = row.reminder_type as AutomatedReminderType;
    if (!AUTOMATED_ORDER.includes(t)) continue;
    let set = sentByPeriod.get(row.monthly_period_id);
    if (!set) {
      set = new Set();
      sentByPeriod.set(row.monthly_period_id, set);
    }
    set.add(t);
  }

  const items: AutoReminderRunItem[] = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const period of eligible) {
    const sent = sentByPeriod.get(period.id) ?? new Set();
    const dueType = nextDueAutomatedReminderType(
      period.year,
      period.month,
      sent,
      settings,
      now,
    );
    if (!dueType) continue;

    const result = await sendPeriodReminder(
      supabase,
      userId,
      period.id,
      dueType,
      { settings },
    );

    if (result.ok) {
      sentCount += 1;
      items.push({
        kind: 'sent',
        monthlyPeriodId: period.id,
        reminderType: dueType,
      });
    } else {
      failedCount += 1;
      items.push({
        kind: 'failed',
        monthlyPeriodId: period.id,
        reminderType: dueType,
        result,
      });
    }
  }

  return { ran: true, items, sentCount, failedCount };
}
