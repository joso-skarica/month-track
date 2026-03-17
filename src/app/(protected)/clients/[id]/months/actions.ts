'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentPeriod, formatCroatianMonth } from '@/lib/utils/months';
import { renderTemplate } from '@/lib/utils/reminders';
import { sendEmail } from '@/lib/email';
import type { DocumentStatus, ReminderSettings, Client, MonthlyPeriod } from '@/types/db';

type ActionResult =
  | { success: true; monthlyPeriodId: string }
  | { success: false; error: string };

type SimpleResult =
  | { success: true }
  | { success: false; error: string };

export async function openCurrentMonth(
  clientId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const { year, month } = getCurrentPeriod();

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

  // Fetch all needed data in parallel
  const [settingsResult, clientResult, periodResult, missingDocsResult] =
    await Promise.all([
      supabase
        .from('reminder_settings')
        .select('*')
        .eq('owner_user_id', user.id)
        .single<ReminderSettings>(),
      supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single<Client>(),
      supabase
        .from('monthly_periods')
        .select('*')
        .eq('id', monthlyPeriodId)
        .eq('client_id', clientId)
        .single<MonthlyPeriod>(),
      supabase
        .from('monthly_document_statuses')
        .select('document_types(label_hr)')
        .eq('monthly_period_id', monthlyPeriodId)
        .eq('status', 'missing'),
    ]);

  if (!settingsResult.data) {
    return { success: false, error: 'Postavke podsjetnika nisu pronađene.' };
  }
  if (!clientResult.data) {
    return { success: false, error: 'Klijent nije pronađen.' };
  }
  if (!periodResult.data) {
    return { success: false, error: 'Mjesečni period nije pronađen.' };
  }

  const missingDocs = missingDocsResult.data ?? [];
  if (missingDocs.length === 0) {
    return {
      success: false,
      error: 'Nema dokumenata koji nedostaju — podsjetnik nije potreban.',
    };
  }

  const settings = settingsResult.data;
  const client = clientResult.data;
  const period = periodResult.data;
  const monthName = formatCroatianMonth(period.month, period.year);

  const missingList = missingDocs
    .map((d) => `- ${(d.document_types as unknown as { label_hr: string }).label_hr}`)
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
    return { success: false, error: `Slanje neuspješno: ${emailResult.error}` };
  }

  // Log the reminder
  const { error: insertError } = await supabase.from('reminders').insert({
    monthly_period_id: monthlyPeriodId,
    client_id: clientId,
    recipient_email: client.email,
    subject,
    body,
    reminder_type: 'manual',
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Update last_reminder_sent_at
  await supabase
    .from('monthly_periods')
    .update({ last_reminder_sent_at: new Date().toISOString() })
    .eq('id', monthlyPeriodId);

  return { success: true };
}
