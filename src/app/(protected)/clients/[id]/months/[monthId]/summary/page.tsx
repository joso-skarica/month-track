import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCroatianMonth } from '@/lib/utils/months';
import { CLIENT_TYPES } from '@/lib/constants/client-presets';
import { Badge } from '@/components/ui/badge';
import { MonthSummaryToolbar } from '@/components/month-summary-toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  Client,
  DocumentStatus,
  MonthlyPeriod,
  ReminderType,
} from '@/types/db';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  missing: 'Nedostaje',
  received: 'Zaprimljeno',
  reviewed: 'Pregledano',
};

const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  manual: 'Ručni',
  first: 'Prvi automatski',
  follow_up: 'Naknadni',
  final: 'Završni',
};

function getClientTypeLabel(value: string): string {
  return CLIENT_TYPES.find((ct) => ct.value === value)?.labelHr ?? value;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeVariant(
  status: DocumentStatus,
): 'destructive' | 'warning' | 'info' {
  if (status === 'missing') return 'destructive';
  if (status === 'received') return 'warning';
  return 'info';
}

type StatusRow = {
  id: string;
  status: DocumentStatus;
  notes: string | null;
  updated_at: string;
  document_types: { label_hr: string; sort_order: number };
};

export default async function MonthSummaryPage({
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
      .select(
        'id, status, notes, updated_at, document_types(label_hr, sort_order)',
      )
      .eq('monthly_period_id', monthId),
    supabase
      .from('reminders')
      .select('id, recipient_email, sent_at, reminder_type')
      .eq('monthly_period_id', monthId)
      .order('sent_at', { ascending: false }),
  ]);

  const rawStatuses = statusesResult.data ?? [];
  const statuses: StatusRow[] = rawStatuses.map((s) => ({
    id: s.id,
    status: s.status as DocumentStatus,
    notes: s.notes,
    updated_at: s.updated_at,
    document_types: s.document_types as unknown as {
      label_hr: string;
      sort_order: number;
    },
  }));

  statuses.sort(
    (a, b) => a.document_types.sort_order - b.document_types.sort_order,
  );

  const reminders = remindersResult.data ?? [];
  const monthLabel = formatCroatianMonth(period.month, period.year);

  return (
    <div className="summary-print-root mx-auto max-w-4xl print:max-w-none">
      <MonthSummaryToolbar clientId={clientId} monthId={monthId} />

      <article className="rounded-xl border border-border/90 bg-card p-6 shadow-sm print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="border-b border-border pb-6 print:border-slate-300 print:pb-4">
          <p className="text-xs font-medium text-muted-foreground print:text-slate-600">
            Month-Track · Sažetak mjeseca
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground print:text-black">
            {client.company_name}
          </h1>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 print:gap-2">
            <div>
              <span className="text-muted-foreground print:text-slate-600">
                OIB:{' '}
              </span>
              <span className="font-mono tabular-nums text-foreground print:text-black">
                {client.oib}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-slate-600">
                Tip klijenta:{' '}
              </span>
              <span className="text-foreground print:text-black">
                {getClientTypeLabel(client.client_type)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-slate-600">
                Razdoblje:{' '}
              </span>
              <span className="font-medium text-foreground print:text-black">
                {monthLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground print:text-slate-600">
                Status:{' '}
              </span>
              {period.status === 'ready' ? (
                <Badge
                  variant="success"
                  className="print:border print:border-slate-400 print:bg-white print:text-black normal-case"
                >
                  Spremno
                </Badge>
              ) : (
                <Badge
                  variant="warning"
                  className="print:border print:border-slate-400 print:bg-white print:text-black normal-case"
                >
                  Nepotpuno
                </Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground print:text-slate-600">
                Označeno spremnim:{' '}
              </span>
              <span className="tabular-nums text-foreground print:text-black">
                {formatDateTime(period.ready_at)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-slate-600">
                Zadnji podsjetnik:{' '}
              </span>
              <span className="tabular-nums text-foreground print:text-black">
                {formatDateTime(period.last_reminder_sent_at)}
              </span>
            </div>
          </div>
        </header>

        <section className="mt-8 print:mt-6 print:break-inside-avoid">
          <h2 className="mb-3 text-sm font-semibold text-foreground print:text-black">
            Potrebni dokumenti
          </h2>
          {statuses.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/90 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground print:border-slate-300 print:bg-white print:text-slate-700">
              Nema stavki dokumentacije za ovaj mjesec. Provjerite zahtjeve
              klijenta ili otvorite mjesec ponovno nakon što budu definirani.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/90 print:rounded-none print:border-slate-400">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent print:hover:bg-transparent">
                    <TableHead>Dokument</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bilješke</TableHead>
                    <TableHead className="tabular-nums">Ažurirano</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-[12rem] font-medium print:text-black">
                        {row.document_types.label_hr}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant(row.status)}
                          className="normal-case print:border print:border-slate-500 print:bg-white print:text-black"
                        >
                          {STATUS_LABELS[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal text-muted-foreground print:text-slate-800">
                        {row.notes?.trim() ? row.notes : '—'}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs text-muted-foreground print:text-slate-800">
                        {formatDateTime(row.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="mt-10 print:mt-8 print:break-inside-avoid">
          <h2 className="mb-3 text-sm font-semibold text-foreground print:text-black">
            Povijest podsjetnika
          </h2>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground print:text-slate-700">
              Za ovaj mjesec nema zapisa o poslanim podsjetnicima.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/90 print:rounded-none print:border-slate-400">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent print:hover:bg-transparent">
                    <TableHead>Primatelj</TableHead>
                    <TableHead>Vrsta</TableHead>
                    <TableHead className="tabular-nums">Poslano</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[14rem] truncate text-sm print:max-w-none print:whitespace-normal print:text-black">
                        {r.recipient_email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="info"
                          className="normal-case print:border print:border-slate-500 print:bg-white print:text-black"
                        >
                          {REMINDER_TYPE_LABELS[
                            r.reminder_type as ReminderType
                          ] ?? r.reminder_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-xs text-muted-foreground print:text-slate-800">
                        {formatDateTime(r.sent_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground print:mt-8 print:border-slate-300 print:text-slate-600 print:hidden">
          <p>
            Izvještaj generiran iz Month-Track. Za rad na mjesecu vratite se na{' '}
            <Link
              href={`/clients/${clientId}/months/${monthId}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              kontrolnu listu
            </Link>
            .
          </p>
        </footer>
      </article>
    </div>
  );
}
