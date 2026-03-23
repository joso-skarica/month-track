import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getCurrentPeriod,
  formatCroatianMonth,
  isOverdue,
  normalizeOverdueThresholdDay,
} from '@/lib/utils/months';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardPeriodsTable } from '@/components/dashboard-periods-table';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { year, month } = getCurrentPeriod();
  const monthLabel = formatCroatianMonth(month, year);

  const [
    settingsResult,
    activeClientsResult,
    periodsResult,
    remindersResult,
  ] = await Promise.all([
    supabase
      .from('reminder_settings')
      .select('overdue_threshold_day')
      .eq('owner_user_id', user.id)
      .maybeSingle(),
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

  const overdueThresholdDay = normalizeOverdueThresholdDay(
    settingsResult.data?.overdue_threshold_day,
  );
  const overdue = isOverdue(year, month, overdueThresholdDay);

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

  const tableRows = periods.map((p) => ({
    id: p.id,
    client_id: p.client_id,
    status: p.status,
    company_name: p.clients.company_name,
    oib: p.clients.oib,
    client_type: p.clients.client_type,
    last_reminder_sent_at: p.last_reminder_sent_at,
    missingCount: p.monthly_document_statuses.filter((d) => d.status === 'missing')
      .length,
    totalDocs: p.monthly_document_statuses.length,
  }));

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
          <DashboardPeriodsTable periods={tableRows} overdue={overdue} />
        )}
      </div>
    </div>
  );
}
