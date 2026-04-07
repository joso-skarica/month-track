import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCroatianMonth } from '@/lib/utils/months';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
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
      <PageHeader
        eyebrow={client.company_name}
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {monthLabel}
            {period.status === 'ready' ? (
              <>
                <Badge variant="success">Spremno</Badge>
                {period.ready_at && (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {new Date(period.ready_at).toLocaleDateString('hr-HR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </>
            ) : (
              <Badge variant="warning">Nepotpuno</Badge>
            )}
          </span>
        }
        subtitle={
          <p>
            OIB:{' '}
            <span className="font-mono tabular-nums text-foreground/85">
              {client.oib}
            </span>
          </p>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}/months/${monthId}/summary`}>
                Ispis / sažetak mjeseca
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}`}>Natrag na klijenta</Link>
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-border/90 bg-card px-5 py-4 shadow-sm sm:px-6">
        <MonthPeriodNavigation
          clientId={clientId}
          year={period.year}
          month={period.month}
        />
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
