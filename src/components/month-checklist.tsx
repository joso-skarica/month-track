'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DocumentStatus, MonthlyPeriod, Reminder } from '@/types/db';
import {
  updateDocumentStatus,
  markMonthReady,
  sendReminder,
} from '@/app/(protected)/clients/[id]/months/actions';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const STATUS_TRIGGER_CLASS: Record<DocumentStatus, string> = {
  missing:
    'border-red-200 bg-red-50/50 font-medium text-red-900 focus-visible:ring-red-200/40',
  received:
    'border-amber-200 bg-amber-50/60 font-medium text-amber-950 focus-visible:ring-amber-200/40',
  reviewed:
    'border-blue-200 bg-blue-50/60 font-medium text-blue-950 focus-visible:ring-blue-200/40',
};

type DocStatusRow = {
  id: string;
  document_type_id: string;
  status: DocumentStatus;
  notes: string | null;
  updated_at: string;
  document_types: {
    label_hr: string;
    sort_order: number;
  };
};

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: 'missing', label: 'Nedostaje' },
  { value: 'received', label: 'Zaprimljeno' },
  { value: 'reviewed', label: 'Pregledano' },
];

const REMINDER_TYPE_LABELS: Record<string, string> = {
  manual: 'Ručni',
  first: 'Prvi automatski',
  follow_up: 'Naknadni',
  final: 'Završni',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  monthlyPeriod: MonthlyPeriod;
  statuses: DocStatusRow[];
  clientId: string;
  reminders: Pick<Reminder, 'id' | 'recipient_email' | 'sent_at' | 'reminder_type'>[];
};

export function MonthChecklist({ monthlyPeriod, statuses, clientId, reminders }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const sorted = [...statuses].sort(
    (a, b) => a.document_types.sort_order - b.document_types.sort_order,
  );

  const missingCount = sorted.filter((s) => s.status === 'missing').length;
  const hasMissing = missingCount > 0;
  const isReady = monthlyPeriod.status === 'ready';

  function clearMessages() {
    setError(null);
    setSuccessMsg(null);
  }

  function handleStatusChange(docStatusId: string, newStatus: DocumentStatus) {
    const row = statuses.find((s) => s.id === docStatusId);
    clearMessages();
    startTransition(async () => {
      const result = await updateDocumentStatus(
        docStatusId,
        newStatus,
        row?.notes ?? null,
      );
      if (!result.success) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  function handleNotesBlur(docStatusId: string) {
    const newNotes = editingNotes[docStatusId];
    if (newNotes === undefined) return;

    const row = statuses.find((s) => s.id === docStatusId);
    if (row && newNotes === (row.notes ?? '')) return;

    clearMessages();
    startTransition(async () => {
      const result = await updateDocumentStatus(
        docStatusId,
        row?.status ?? 'missing',
        newNotes || null,
      );
      if (!result.success) {
        setError(result.error);
      }
      setEditingNotes((prev) => {
        const next = { ...prev };
        delete next[docStatusId];
        return next;
      });
      router.refresh();
    });
  }

  function handleNotesKeyDown(
    e: React.KeyboardEvent,
    docStatusId: string,
  ) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNotesBlur(docStatusId);
    }
  }

  function handleMarkReady() {
    clearMessages();
    startTransition(async () => {
      const result = await markMonthReady(monthlyPeriod.id);
      if (!result.success) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  function handleSendReminder() {
    clearMessages();
    startTransition(async () => {
      const result = await sendReminder(monthlyPeriod.id, clientId);
      if (result.success) {
        setSuccessMsg('Podsjetnik je uspješno poslan.');
      } else {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 py-10 text-center">
          <p className="text-sm font-medium text-foreground/70">
            Nema definiranih dokumenata za ovaj mjesec.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Dodajte zahtjeve za dokumentima u postavkama klijenta.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <a href={`/clients/${clientId}/edit`}>Uredi zahtjeve klijenta</a>
          </Button>
        </div>
      ) : (
        <>
          <div>
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Kontrolna lista dokumenata
              </h2>
              <p className="text-sm text-muted-foreground">
                {sorted.length}{' '}
                {sorted.length === 1 ? 'stavka' : 'stavki'}
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
              <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Dokument</TableHead>
                  <TableHead className="w-48">Status</TableHead>
                  <TableHead>Bilješke</TableHead>
                  <TableHead className="w-44 tabular-nums">
                    Zadnje ažuriranje
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.document_types.label_hr}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.status}
                        onValueChange={(val) =>
                          handleStatusChange(row.id, val as DocumentStatus)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger
                          className={cn(
                            'w-full min-w-[10.5rem] max-w-[11rem] shadow-sm',
                            STATUS_TRIGGER_CLASS[row.status],
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Dodaj bilješku..."
                        value={
                          editingNotes[row.id] !== undefined
                            ? editingNotes[row.id]
                            : row.notes ?? ''
                        }
                        onChange={(e) =>
                          setEditingNotes((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        onBlur={() => handleNotesBlur(row.id)}
                        onKeyDown={(e) => handleNotesKeyDown(e, row.id)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {formatDate(row.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>

          <div className="space-y-2.5">
            {hasMissing && (
              <div className="rounded-md border border-amber-200/80 bg-amber-50/50 px-3 py-2">
                <p className="text-xs font-medium text-amber-900">
                  <span className="font-semibold tabular-nums">{missingCount}</span>{' '}
                  od {sorted.length} dokumenata još nedostaje.
                </p>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-200/80 bg-red-50/75 px-3 py-2 text-xs font-medium text-red-800"
              >
                {error}
              </p>
            )}
            {successMsg && (
              <p
                role="status"
                className="rounded-md border border-emerald-200/80 bg-emerald-50/75 px-3 py-2 text-xs font-medium text-emerald-800"
              >
                {successMsg}
              </p>
            )}
          </div>

          <div className={cn(
            "rounded-xl border p-3.5 shadow-sm sm:p-4",
            isReady
              ? "border-emerald-200/60 bg-emerald-50/30"
              : "border-border/90 bg-slate-50/55",
          )}>
            <p className="mb-2 text-sm font-semibold text-foreground">
              Radnje za ovaj mjesec
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
              <div className="flex min-w-[11rem] max-w-sm flex-col gap-1">
                {isReady ? (
                  <Button
                    variant="outline"
                    disabled
                    className="border-emerald-200 bg-emerald-50/60 text-emerald-700 disabled:opacity-100"
                  >
                    <CheckCircle2 className="mr-1.5 size-4" />
                    Označeno kao spremno
                  </Button>
                ) : (
                  <Button
                    onClick={handleMarkReady}
                    disabled={isPending || hasMissing}
                  >
                    {isPending && !hasMissing
                      ? 'Označavanje...'
                      : 'Označi kao spremno'}
                  </Button>
                )}
                {hasMissing && !isReady && (
                  <p className="text-[10px] leading-snug text-muted-foreground/70">
                    Dostupno kada svi dokumenti budu zaprimljeni ili pregledani.
                  </p>
                )}
              </div>

              <div className="flex min-w-[11rem] max-w-sm flex-col gap-1">
                <Button
                  variant="outline"
                  onClick={handleSendReminder}
                  disabled={isPending || !hasMissing}
                >
                  {isPending && hasMissing
                    ? 'Slanje...'
                    : 'Pošalji podsjetnik'}
                </Button>
                {!hasMissing && (
                  <p className="text-[10px] leading-snug text-muted-foreground/70">
                    Nema dokumenata koji nedostaju — podsjetnik nije potreban.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
        <div className="border-b border-border/80 bg-slate-50/60 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-foreground">
            Povijest podsjetnika
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Primatelj, vrsta i vrijeme slanja
          </p>
        </div>
        <div className="p-0">
          {reminders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
              Za ovaj mjesec još nisu poslani podsjetnici.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Primatelj</TableHead>
                  <TableHead>Vrsta</TableHead>
                  <TableHead className="tabular-nums">Poslano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[14rem] truncate text-sm">
                      {r.recipient_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {REMINDER_TYPE_LABELS[r.reminder_type] ?? r.reminder_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {formatDate(r.sent_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
