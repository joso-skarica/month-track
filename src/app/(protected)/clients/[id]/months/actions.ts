'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getCurrentPeriod,
  formatCroatianMonth,
  isValidOpenMonthYearMonth,
} from '@/lib/utils/months';
import { renderTemplate } from '@/lib/utils/reminders';
import { sendEmail } from '@/lib/email';
import type { DocumentStatus, ReminderSettings, Client, MonthlyPeriod } from '@/types/db';

type ActionResult =
  | { success: true; monthlyPeriodId: string }
  | { success: false; error: string };

type SimpleResult =
  | { success: true }
  | { success: false; error: string };

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type BulkReminderSkipCode =
  | 'no_settings'
  | 'not_found'
  | 'wrong_client'
  | 'month_ready'
  | 'no_missing_docs'
  | 'email_failed'
  | 'reminder_insert_failed';

type SendPeriodReminderResult =
  | { ok: true }
  | { ok: false; code: BulkReminderSkipCode; message: string };

async function sendReminderForPeriod(
  supabase: SupabaseServer,
  userId: string,
  monthlyPeriodId: string,
  options?: {
    expectedClientId?: string;
    settings?: ReminderSettings;
  },
): Promise<SendPeriodReminderResult> {
  let settings = options?.settings;
  if (!settings) {
    const { data } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('owner_user_id', userId)
      .single<ReminderSettings>();
    if (!data) {
      return {
        ok: false,
        code: 'no_settings',
        message: 'Postavke podsjetnika nisu pronađene.',
      };
    }
    settings = data;
  }

  const { data: periodRow, error: periodError } = await supabase
    .from('monthly_periods')
    .select('*, clients!inner(*)')
    .eq('id', monthlyPeriodId)
    .single();

  if (periodError || !periodRow) {
    return {
      ok: false,
      code: 'not_found',
      message: 'Mjesečni period nije pronađen.',
    };
  }

  const period = periodRow as unknown as MonthlyPeriod;
  const client = periodRow.clients as unknown as Client;

  if (client.owner_user_id !== userId) {
    return {
      ok: false,
      code: 'not_found',
      message: 'Mjesečni period nije pronađen.',
    };
  }

  if (
    options?.expectedClientId !== undefined &&
    period.client_id !== options.expectedClientId
  ) {
    return {
      ok: false,
      code: 'wrong_client',
      message: 'Mjesečni period ne pripada tom klijentu.',
    };
  }

  if (period.status !== 'incomplete') {
    return {
      ok: false,
      code: 'month_ready',
      message: 'Mjesec je označen kao spremno.',
    };
  }

  const { data: missingRows } = await supabase
    .from('monthly_document_statuses')
    .select('document_types(label_hr)')
    .eq('monthly_period_id', monthlyPeriodId)
    .eq('status', 'missing');

  const missingDocs = missingRows ?? [];
  if (missingDocs.length === 0) {
    return {
      ok: false,
      code: 'no_missing_docs',
      message: 'Nema dokumenata koji nedostaju — podsjetnik nije potreban.',
    };
  }

  const monthName = formatCroatianMonth(period.month, period.year);
  const missingList = missingDocs
    .map(
      (d) =>
        `- ${(d.document_types as unknown as { label_hr: string }).label_hr}`,
    )
    .join('\n');

  const subjectTemplate =
    settings.default_subject ||
    'Podsjetnik: nedostajuća dokumentacija za {{company_name}} — {{month_name}} {{year}}';
  const bodyTemplate =
    settings.default_body ||
    'Poštovani,\n\nZa {{company_name}} još uvijek nedostaje sljedeća dokumentacija za {{month_name}} {{year}}:\n\n{{missing_documents_list}}\n\nMolimo dostavite navedenu dokumentaciju.\n\n{{firm_signature}}';

  const vars = {
    company_name: client.company_name,
    month_name: monthName,
    year: period.year,
    missing_documents_list: missingList,
    firm_signature: settings.signature || '',
  };

  const subject = renderTemplate(subjectTemplate, vars);
  const body = renderTemplate(bodyTemplate, vars);

  const emailResult = await sendEmail({
    to: client.email,
    subject,
    text: body,
  });

  if (!emailResult.success) {
    return {
      ok: false,
      code: 'email_failed',
      message: emailResult.error ?? 'Nepoznata greška pri slanju.',
    };
  }

  const { error: insertError } = await supabase.from('reminders').insert({
    monthly_period_id: monthlyPeriodId,
    client_id: client.id,
    recipient_email: client.email,
    subject,
    body,
    reminder_type: 'manual',
  });

  if (insertError) {
    return {
      ok: false,
      code: 'reminder_insert_failed',
      message: insertError.message,
    };
  }

  await supabase
    .from('monthly_periods')
    .update({ last_reminder_sent_at: new Date().toISOString() })
    .eq('id', monthlyPeriodId);

  return { ok: true };
}

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

  const result = await sendReminderForPeriod(supabase, user.id, monthlyPeriodId, {
    expectedClientId: clientId,
  });

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
    const result = await sendReminderForPeriod(
      supabase,
      user.id,
      monthlyPeriodId,
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
