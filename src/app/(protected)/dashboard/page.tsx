import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Mail,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  getCurrentPeriod,
  formatCroatianMonth,
  isOverdue,
  normalizeOverdueThresholdDay,
} from '@/lib/utils/months';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
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
    {
      label: 'Aktivnih klijenata',
      value: activeClientsCount,
      icon: Users,
      iconClass: 'text-slate-500',
      valueClass: 'text-foreground',
      cardClass: '',
      detail: null as string | null,
    },
    {
      label: 'Nepotpuno',
      value: incompleteCount,
      icon: ClipboardList,
      iconClass: 'text-amber-600',
      valueClass:
        incompleteCount > 0 ? 'text-amber-900' : 'text-muted-foreground',
      cardClass: incompleteCount > 0 ? 'border-amber-200/70' : '',
      detail: null as string | null,
    },
    {
      label: 'Spremno',
      value: readyCount,
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      valueClass: readyCount > 0 ? 'text-emerald-900' : 'text-muted-foreground',
      cardClass: readyCount > 0 ? 'border-emerald-200/70' : '',
      detail: null as string | null,
    },
    {
      label: 'Zakašnjelo',
      value: overdueCount,
      icon: AlertTriangle,
      iconClass: 'text-red-600',
      valueClass:
        overdueCount > 0 ? 'text-red-800' : 'text-muted-foreground',
      cardClass: overdueCount > 0 ? 'border-red-200/70' : '',
      detail: overdueCount > 0 ? `rok: ${overdueThresholdDay}. u mjesecu` : null,
    },
    {
      label: 'Podsjetnika',
      value: remindersCount,
      icon: Mail,
      iconClass: 'text-blue-600',
      valueClass: 'text-foreground',
      cardClass: '',
      detail: null as string | null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Pregled"
        title="Nadzorna ploča"
        subtitle={
          <p>
            Tekuće razdoblje:{' '}
            <span className="font-medium text-foreground/90">{monthLabel}</span>
            {overdue ? (
              <span className="ml-2 inline-block rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
                rok za nepotpune mjesece je prošao
              </span>
            ) : null}
          </p>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} size="sm" className={cn('shadow-sm', stat.cardClass)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium leading-tight text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon
                  className={cn('size-4 shrink-0 opacity-90', stat.iconClass)}
                  aria-hidden
                />
              </CardHeader>
              <CardContent className="pt-0">
                <p
                  className={cn(
                    'text-2xl font-semibold tabular-nums tracking-tight',
                    stat.valueClass,
                  )}
                >
                  {stat.value}
                </p>
                {stat.detail && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {stat.detail}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Klijenti — {monthLabel}
        </h2>

        {periods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 py-10 text-center">
            <p className="text-sm font-medium text-foreground/70">
              Nema otvorenih mjeseci za {monthLabel}.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Otvorite tekući mjesec za pojedinog klijenta na stranici klijenta.
            </p>
            <Button asChild variant="outline" className="mt-6">
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
