import type { createClient } from '@/lib/supabase/server';
import { formatCroatianMonthNameOnly } from '@/lib/utils/months';
import { renderTemplate } from '@/lib/utils/reminders';
import { sendEmail } from '@/lib/email';
import type { ReminderSettings, Client, MonthlyPeriod, ReminderType } from '@/types/db';

export type ReminderSupabase = Awaited<ReturnType<typeof createClient>>;

export type SendPeriodReminderSkipCode =
  | 'no_settings'
  | 'not_found'
  | 'wrong_client'
  | 'month_ready'
  | 'no_missing_docs'
  | 'email_failed'
  | 'reminder_insert_failed';

export type SendPeriodReminderResult =
  | { ok: true }
  | { ok: false; code: SendPeriodReminderSkipCode; message: string };

const DEFAULT_SUBJECT =
  'Podsjetnik: nedostajuća dokumentacija za {{company_name}} — {{month_name}} {{year}}';
const DEFAULT_BODY =
  'Poštovani,\n\nZa {{company_name}} još uvijek nedostaje sljedeća dokumentacija za {{month_name}} {{year}}:\n\n{{missing_documents_list}}\n\nMolimo dostavite navedenu dokumentaciju.\n\n{{firm_signature}}';

function subjectBodyForType(
  settings: ReminderSettings,
  reminderType: ReminderType,
): { subjectTemplate: string; bodyTemplate: string } {
  if (reminderType === 'follow_up' || reminderType === 'final') {
    return {
      subjectTemplate:
        settings.follow_up_subject ||
        settings.default_subject ||
        DEFAULT_SUBJECT,
      bodyTemplate:
        settings.follow_up_body || settings.default_body || DEFAULT_BODY,
    };
  }
  return {
    subjectTemplate: settings.default_subject || DEFAULT_SUBJECT,
    bodyTemplate: settings.default_body || DEFAULT_BODY,
  };
}

/**
 * Loads settings when omitted. Sends email, inserts reminder row, updates last_reminder_sent_at.
 */
export async function sendPeriodReminder(
  supabase: ReminderSupabase,
  userId: string,
  monthlyPeriodId: string,
  reminderType: ReminderType,
  options?: {
    expectedClientId?: string;
    settings?: ReminderSettings | null;
  },
): Promise<SendPeriodReminderResult> {
  let settings = options?.settings;
  if (settings === undefined) {
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

  if (!settings) {
    return {
      ok: false,
      code: 'no_settings',
      message: 'Postavke podsjetnika nisu pronađene.',
    };
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

  const monthName = formatCroatianMonthNameOnly(period.month);
  const missingList = missingDocs
    .map(
      (d) =>
        `- ${(d.document_types as unknown as { label_hr: string }).label_hr}`,
    )
    .join('\n');

  const { subjectTemplate, bodyTemplate } = subjectBodyForType(
    settings,
    reminderType,
  );

  const trimmedSignature = settings.signature?.trim() ?? '';
  const vars = {
    company_name: client.company_name,
    month_name: monthName,
    year: period.year,
    missing_documents_list: missingList,
    firm_signature: trimmedSignature || 'Month-Track',
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
      message:
        'Slanje na vanjske adrese trenutno nije omogućeno dok nije potvrđena domena za e-poštu.',
    };
  }

  const { error: insertError } = await supabase.from('reminders').insert({
    monthly_period_id: monthlyPeriodId,
    client_id: client.id,
    recipient_email: client.email,
    subject,
    body,
    reminder_type: reminderType,
  });

  if (insertError) {
    console.error('[reminder] Insert error:', insertError.message);
    return {
      ok: false,
      code: 'reminder_insert_failed',
      message: 'Zapis podsjetnika nije uspješno spremljen. Pokušajte ponovo.',
    };
  }

  await supabase
    .from('monthly_periods')
    .update({ last_reminder_sent_at: new Date().toISOString() })
    .eq('id', monthlyPeriodId);

  return { ok: true };
}
