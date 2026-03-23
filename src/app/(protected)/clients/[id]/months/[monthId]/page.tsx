import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCroatianMonth } from '@/lib/utils/months';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MonthChecklist } from '@/components/month-checklist';
import { MonthPeriodNavigation } from '@/components/month-period-navigation';
import type { Client, MonthlyPeriod } from '@/types/db';

export default async function MonthPage({
  params,
}: {
  params: Promise<{ id: string; monthId: string }>;
}) {
  const { id: clientId, monthId } = await params;
  const supabase = await createClient();

  const [clientResult, periodResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single<Client>(),
    supabase
      .from('monthly_periods')
      .select('*')
      .eq('id', monthId)
      .eq('client_id', clientId)
      .single<MonthlyPeriod>(),
  ]);

  if (!clientResult.data || !periodResult.data) {
    notFound();
  }

  const client = clientResult.data;
  const period = periodResult.data;

  const [statusesResult, remindersResult] = await Promise.all([
    supabase
      .from('monthly_document_statuses')
      .select('id, document_type_id, status, notes, updated_at, document_types(label_hr, sort_order)')
      .eq('monthly_period_id', monthId),
    supabase
      .from('reminders')
      .select('id, recipient_email, sent_at, reminder_type')
      .eq('monthly_period_id', monthId)
      .order('sent_at', { ascending: false }),
  ]);

  const statuses = statusesResult.data;
  const reminders = remindersResult.data ?? [];
  const monthLabel = formatCroatianMonth(period.month, period.year);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {monthLabel}
            </h1>
            {period.status === 'ready' ? (
              <Badge variant="secondary">Spremno</Badge>
            ) : (
              <Badge variant="outline">Nepotpuno</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.company_name} &middot; OIB: {client.oib}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/clients/${clientId}`}>Natrag na klijenta</Link>
        </Button>
      </div>

      <MonthPeriodNavigation
        clientId={clientId}
        year={period.year}
        month={period.month}
      />

      <MonthChecklist
        monthlyPeriod={period}
        statuses={
          (statuses ?? []).map((s) => ({
            ...s,
            document_types: s.document_types as unknown as {
              label_hr: string;
              sort_order: number;
            },
          }))
        }
        clientId={clientId}
        reminders={reminders}
      />
    </div>
  );
}
