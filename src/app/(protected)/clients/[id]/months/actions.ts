'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentPeriod, isValidOpenMonthYearMonth } from '@/lib/utils/months';
import {
  sendPeriodReminder,
  type SendPeriodReminderSkipCode,
} from '@/lib/reminders/send-period-reminder';
import type { DocumentStatus, ReminderSettings } from '@/types/db';

type ActionResult =
  | { success: true; monthlyPeriodId: string }
  | { success: false; error: string };

type SimpleResult =
  | { success: true }
  | { success: false; error: string };

export type BulkReminderSkipCode = SendPeriodReminderSkipCode;

export async function openMonthForClient(
  clientId: string,
  year: number,
  month: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  if (!isValidOpenMonthYearMonth(year, month)) {
    return {
      success: false,
      error: 'Neispravna godina ili mjesec.',
    };
  }

  // Check if period already exists
  const { data: existing } = await supabase
    .from('monthly_periods')
    .select('id')
    .eq('client_id', clientId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existing) {
    return { success: true, monthlyPeriodId: existing.id };
  }

  // Create the period
  const { data: period, error: periodError } = await supabase
    .from('monthly_periods')
    .insert({
      client_id: clientId,
      year,
      month,
      status: 'incomplete',
    })
    .select('id')
    .single();

  if (periodError) {
    // Handle race condition: another request created it first
    if (periodError.code === '23505') {
      const { data: raceExisting } = await supabase
        .from('monthly_periods')
        .select('id')
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month)
        .single();
      if (raceExisting) {
        return { success: true, monthlyPeriodId: raceExisting.id };
      }
    }
    return { success: false, error: periodError.message };
  }

  // Fetch required document types for this client
  const { data: requirements } = await supabase
    .from('client_document_requirements')
    .select('document_type_id')
    .eq('client_id', clientId)
    .eq('is_required', true);

  if (requirements && requirements.length > 0) {
    const rows = requirements.map((r) => ({
      monthly_period_id: period.id,
      document_type_id: r.document_type_id,
      status: 'missing' as const,
    }));

    const { error: statusError } = await supabase
      .from('monthly_document_statuses')
      .insert(rows);

    if (statusError) {
      return { success: false, error: statusError.message };
    }
  }

  return { success: true, monthlyPeriodId: period.id };
}

export async function openCurrentMonth(
  clientId: string,
): Promise<ActionResult> {
  const { year, month } = getCurrentPeriod();
  return openMonthForClient(clientId, year, month);
}

export async function updateDocumentStatus(
  docStatusId: string,
  status: DocumentStatus,
  notes: string | null,
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  // Fetch the row first to get monthly_period_id (RLS ensures ownership)
  const { data: docStatus } = await supabase
    .from('monthly_document_statuses')
    .select('monthly_period_id')
    .eq('id', docStatusId)
    .single();

  if (!docStatus) {
    return { success: false, error: 'Dokument nije pronađen.' };
  }

  const { error: updateError } = await supabase
    .from('monthly_document_statuses')
    .update({ status, notes })
    .eq('id', docStatusId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Recalculate month status
  const recalcResult = await recalcMonthStatus(docStatus.monthly_period_id);
  if (!recalcResult.success) {
    return recalcResult;
  }

  return { success: true };
}

export async function markMonthReady(
  monthlyPeriodId: string,
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  // Check that no documents are missing
  const { count } = await supabase
    .from('monthly_document_statuses')
    .select('*', { count: 'exact', head: true })
    .eq('monthly_period_id', monthlyPeriodId)
    .eq('status', 'missing');

  if (count && count > 0) {
    return {
      success: false,
      error: 'Nije moguće označiti kao spremno dok postoje dokumenti koji nedostaju.',
    };
  }

  const { error } = await supabase
    .from('monthly_periods')
    .update({ status: 'ready', ready_at: new Date().toISOString() })
    .eq('id', monthlyPeriodId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function recalcMonthStatus(
  monthlyPeriodId: string,
): Promise<SimpleResult> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('monthly_document_statuses')
    .select('*', { count: 'exact', head: true })
    .eq('monthly_period_id', monthlyPeriodId)
    .eq('status', 'missing');

  const hasMissing = (count ?? 0) > 0;

  if (hasMissing) {
    // Revert to incomplete if currently ready
    const { error } = await supabase
      .from('monthly_periods')
      .update({ status: 'incomplete', ready_at: null })
      .eq('id', monthlyPeriodId)
      .eq('status', 'ready');

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function sendReminder(
  monthlyPeriodId: string,
  clientId: string,
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const result = await sendPeriodReminder(
    supabase,
    user.id,
    monthlyPeriodId,
    'manual',
    { expectedClientId: clientId },
  );

  if (!result.ok) {
    if (result.code === 'wrong_client') {
      return { success: false, error: 'Mjesečni period ne pripada tom klijentu.' };
    }
    return { success: false, error: result.message };
  }

  return { success: true };
}

export type BulkRemindersResult =
  | {
      success: true;
      sent: number;
      skipped: number;
      skipCounts: Partial<Record<BulkReminderSkipCode, number>>;
    }
  | { success: false; error: string };

export async function sendBulkReminders(
  periodIds: string[],
): Promise<BulkRemindersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const { data: settings } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('owner_user_id', user.id)
    .single<ReminderSettings>();

  if (!settings) {
    return {
      success: false,
      error: 'Postavke podsjetnika nisu pronađene. Dopunite ih u postavkama.',
    };
  }

  const uniqueIds = [...new Set(periodIds.filter(Boolean))];
  const skipCounts: Partial<Record<BulkReminderSkipCode, number>> = {};
  let sent = 0;

  for (const monthlyPeriodId of uniqueIds) {
    const result = await sendPeriodReminder(
      supabase,
      user.id,
      monthlyPeriodId,
      'manual',
      { settings },
    );
    if (result.ok) {
      sent += 1;
    } else {
      skipCounts[result.code] = (skipCounts[result.code] ?? 0) + 1;
    }
  }

  return {
    success: true,
    sent,
    skipped: uniqueIds.length - sent,
    skipCounts,
  };
}
