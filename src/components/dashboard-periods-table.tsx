'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { CLIENT_TYPES } from '@/lib/constants/client-presets';
import { cn } from '@/lib/utils';
import {
  sendBulkReminders,
  type BulkReminderSkipCode,
} from '@/app/(protected)/clients/[id]/months/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ALL_TYPES = 'all';
const ALL_STATUS = 'all';

export type DashboardPeriodRow = {
  id: string;
  client_id: string;
  status: string;
  company_name: string;
  oib: string;
  client_type: string;
  last_reminder_sent_at: string | null;
  missingCount: number;
  totalDocs: number;
};

type Props = {
  periods: DashboardPeriodRow[];
  overdue: boolean;
};

function getClientTypeLabel(value: string): string {
  return CLIENT_TYPES.find((ct) => ct.value === value)?.labelHr ?? value;
}

const SKIP_LABELS: Record<BulkReminderSkipCode, string> = {
  no_settings: 'nedostaju postavke podsjetnika',
  not_found: 'period nije pronađen ili nije dostupan',
  wrong_client: 'period ne odgovara klijentu',
  month_ready: 'mjesec je već označen kao spreman',
  no_missing_docs: 'nema nedostajućih dokumenata',
  email_failed: 'slanje e-pošte nije uspjelo',
  reminder_insert_failed: 'spremanje zapisa podsjetnika nije uspjelo',
};

function formatBulkSummary(
  sent: number,
  skipped: number,
  skipCounts: Partial<Record<BulkReminderSkipCode, number>>,
): string {
  const parts: string[] = [];

  if (sent > 0) {
    parts.push(
      `Poslano je ${sent} ${sent === 1 ? 'podsjetnik' : 'podsjetnika'}.`,
    );
  } else {
    parts.push('Nije poslan nijedan podsjetnik.');
  }

  if (skipped > 0) {
    parts.push(`Preskočeno: ${skipped} ${skipped === 1 ? 'redak' : 'retka'}.`);
    const detailLines = (Object.entries(skipCounts) as [BulkReminderSkipCode, number][])
      .filter(([, n]) => n > 0)
      .map(([code, n]) => {
        const label = SKIP_LABELS[code] ?? 'drugi razlog';
        return `${n}× ${label}`;
      });
    if (detailLines.length > 0) {
      parts.push(`Razlozi: ${detailLines.join('; ')}.`);
    }
  }

  return parts.join(' ');
}

export function DashboardPeriodsTable({ periods, overdue }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periods.filter((p) => {
      const matchesSearch =
        !q ||
        p.company_name.toLowerCase().includes(q) ||
        p.oib.includes(search.trim());
      const matchesType =
        typeFilter === ALL_TYPES || p.client_type === typeFilter;
      const matchesStatus =
        statusFilter === ALL_STATUS ||
        (statusFilter === 'incomplete' && p.status === 'incomplete') ||
        (statusFilter === 'ready' && p.status === 'ready');
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [periods, search, typeFilter, statusFilter]);

  const visibleIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);
  const visibleSelectedCount = useMemo(
    () => visibleIds.filter((id) => selected.has(id)).length,
    [visibleIds, selected],
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  // Keep bulk selection scoped to the currently filtered rows to avoid hidden-row carryover.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIdSet.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [visibleIdSet]);

  function toggleSelectAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function handleBulkSend() {
    const ids = visibleIds.filter((id) => selected.has(id));
    if (ids.length === 0) return;
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await sendBulkReminders(ids);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setFeedback(
        formatBulkSummary(result.sent, result.skipped, result.skipCounts),
      );
      setSelected(new Set());
      router.refresh();
    });
  }

  const hasFilters =
    search !== '' || typeFilter !== ALL_TYPES || statusFilter !== ALL_STATUS;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border/90 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Input
            placeholder="Pretraži po nazivu ili OIB-u..."
            aria-label="Pretraži klijente na dashboardu"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              className="w-44"
              aria-label="Filtriraj po tipu klijenta"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>Svi tipovi</SelectItem>
              {CLIENT_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  {ct.labelHr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44" aria-label="Filtriraj po statusu">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS}>Svi statusi</SelectItem>
              <SelectItem value="incomplete">Nepotpuno</SelectItem>
              <SelectItem value="ready">Spremno</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || visibleIds.length === 0 || allVisibleSelected}
            onClick={() => toggleSelectAllVisible(true)}
          >
            Odaberi sve vidljive
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending || visibleSelectedCount === 0}
            onClick={() => setSelected(new Set())}
          >
            Očisti odabir
          </Button>
          {visibleSelectedCount > 0 ? (
            <span className="text-sm tabular-nums text-muted-foreground">
              Odabrano: {visibleSelectedCount}/{visibleIds.length}
            </span>
          ) : null}
          <Button
            type="button"
            disabled={visibleSelectedCount === 0 || isPending}
            onClick={handleBulkSend}
          >
            {isPending ? 'Šaljem…' : 'Pošalji podsjetnike'}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p
          className="rounded-lg border border-border/80 bg-slate-50/80 px-3 py-2.5 text-sm text-foreground/90"
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/90 bg-card/60 py-8 text-center shadow-sm">
          {periods.length === 0 ? (
            <p className="text-sm font-medium text-foreground/70">Nema otvorenih mjeseci.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground/70">
                Nema rezultata za zadane filtere.
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter(ALL_TYPES);
                    setStatusFilter(ALL_STATUS);
                  }}
                >
                  Poništi filtere
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      aria-label="Odaberi sve vidljive retke"
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={(v) =>
                        toggleSelectAllVisible(v === true)
                      }
                    />
                  </TableHead>
                  <TableHead>Klijent</TableHead>
                  <TableHead>OIB</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-center tabular-nums">
                    Nedostaje
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zadnji podsjetnik</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((period) => (
                  <TableRow
                    key={period.id}
                    className={cn(
                      period.status === 'ready' && 'bg-emerald-50/30',
                      period.status === 'incomplete' &&
                        period.missingCount > 0 &&
                        'bg-red-50/30',
                      period.status === 'incomplete' &&
                        period.missingCount === 0 &&
                        'bg-amber-50/20',
                    )}
                  >
                    <TableCell className="w-12 align-middle">
                      <Checkbox
                        aria-label={`Odaberi ${period.company_name}`}
                        checked={selected.has(period.id)}
                        onCheckedChange={(v) =>
                          toggleRow(period.id, v === true)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${period.client_id}`}
                        className="text-primary hover:underline"
                      >
                        {period.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {period.oib}
                    </TableCell>
                    <TableCell>
                      {getClientTypeLabel(period.client_type)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {period.missingCount > 0 ? (
                        <span className="font-semibold text-red-700">
                          {period.missingCount}/{period.totalDocs}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          0/{period.totalDocs}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {period.status === 'ready' ? (
                        <Badge variant="success">Spremno</Badge>
                      ) : overdue ? (
                        <Badge variant="destructive">Zakašnjelo</Badge>
                      ) : (
                        <Badge variant="warning">Nepotpuno</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {period.last_reminder_sent_at ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />
                          {new Date(
                            period.last_reminder_sent_at,
                          ).toLocaleDateString('hr-HR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        '—'
                      )}
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
                ))}
              </TableBody>
            </Table>
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground">
              Prikazano {filtered.length} od {periods.length} redaka.
            </p>
          )}
        </>
      )}
    </div>
  );
}
