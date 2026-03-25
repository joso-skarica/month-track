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
    <div className="space-y-5">
      <div className="rounded-xl border border-border/90 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {monthLabel}
              </h1>
              {period.status === 'ready' ? (
                <Badge variant="success">Spremno</Badge>
              ) : (
                <Badge variant="warning">Nepotpuno</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/90">
                {client.company_name}
              </span>
              <span className="text-border"> · </span>
              OIB:{' '}
              <span className="font-mono tabular-nums text-foreground/85">
                {client.oib}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/clients/${clientId}/months/${monthId}/summary`}
              >
                Ispis / sažetak mjeseca
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}`}>Natrag na klijenta</Link>
            </Button>
          </div>
        </div>
        <div className="mt-5 border-t border-border/80 pt-4">
          <MonthPeriodNavigation
            clientId={clientId}
            year={period.year}
            month={period.month}
          />
        </div>
      </div>

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
