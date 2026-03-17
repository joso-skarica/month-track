import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPeriod, formatCroatianMonth, isOverdue } from '@/lib/utils/months';
import { CLIENT_TYPES } from '@/lib/constants/client-presets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function getClientTypeLabel(value: string): string {
  return CLIENT_TYPES.find((ct) => ct.value === value)?.labelHr ?? value;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { year, month } = getCurrentPeriod();
  const monthLabel = formatCroatianMonth(month, year);
  const overdue = isOverdue(year, month);

  const [
    activeClientsResult,
    periodsResult,
    remindersResult,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('monthly_periods')
      .select(`
        id,
        client_id,
        status,
        last_reminder_sent_at,
        clients!inner(company_name, oib, client_type, is_active),
        monthly_document_statuses(id, status)
      `)
      .eq('year', year)
      .eq('month', month),
    supabase
      .from('reminders')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', `${year}-${String(month).padStart(2, '0')}-01`)
      .lt(
        'sent_at',
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, '0')}-01`,
      ),
  ]);

  const activeClientsCount = activeClientsResult.count ?? 0;
  const remindersCount = remindersResult.count ?? 0;
  type PeriodRow = {
    id: string;
    client_id: string;
    status: string;
    last_reminder_sent_at: string | null;
    clients: {
      company_name: string;
      oib: string;
      client_type: string;
      is_active: boolean;
    };
    monthly_document_statuses: Array<{ id: string; status: string }>;
  };

  const periods = (periodsResult.data ?? []) as unknown as PeriodRow[];

  const incompleteCount = periods.filter((p) => p.status === 'incomplete').length;
  const readyCount = periods.filter((p) => p.status === 'ready').length;
  const overdueCount = overdue
    ? periods.filter((p) => p.status === 'incomplete').length
    : 0;

  const stats = [
    { label: 'Aktivnih klijenata', value: activeClientsCount },
    { label: 'Nepotpuno', value: incompleteCount },
    { label: 'Spremno', value: readyCount },
    { label: 'Zakašnjelo', value: overdueCount },
    { label: 'Podsjetnika', value: remindersCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pregled za {monthLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Klijenti — {monthLabel}</h2>

        {periods.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground">
              Nema otvorenih mjeseci za {monthLabel}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Otvorite tekući mjesec za pojedinog klijenta na stranici klijenta.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/clients">Pregledaj klijente</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klijent</TableHead>
                  <TableHead>OIB</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-center">Nedostaje</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zadnji podsjetnik</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => {
                  const missingCount =
                    period.monthly_document_statuses.filter(
                      (d) => d.status === 'missing',
                    ).length;
                  const totalDocs = period.monthly_document_statuses.length;

                  return (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/clients/${period.client_id}`}
                          className="hover:underline"
                        >
                          {period.clients.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {period.clients.oib}
                      </TableCell>
                      <TableCell>
                        {getClientTypeLabel(period.clients.client_type)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {missingCount > 0 ? (
                          <span className="font-medium text-destructive">
                            {missingCount}/{totalDocs}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            0/{totalDocs}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {period.status === 'ready' ? (
                          <Badge variant="secondary">Spremno</Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">Zakašnjelo</Badge>
                        ) : (
                          <Badge variant="outline">Nepotpuno</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {period.last_reminder_sent_at
                          ? new Date(
                              period.last_reminder_sent_at,
                            ).toLocaleDateString('hr-HR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/clients/${period.client_id}/months/${period.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Otvori
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
