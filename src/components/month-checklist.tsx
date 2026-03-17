'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DocumentStatus, MonthlyPeriod, Reminder } from '@/types/db';
import {
  updateDocumentStatus,
  markMonthReady,
  sendReminder,
} from '@/app/(protected)/clients/[id]/months/actions';
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
  missing: 'text-destructive',
  received: 'text-muted-foreground',
  reviewed: 'text-foreground',
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
  first: 'Prvi',
  follow_up: 'Follow-up',
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
    <div className="space-y-6">
      {/* Document checklist table */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            Nema definiranih dokumenata za ovaj mjesec.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dodajte zahtjeve za dokumentima u postavkama klijenta.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <a href={`/clients/${clientId}/edit`}>Uredi zahtjeve klijenta</a>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokument</TableHead>
                  <TableHead className="w-44">Status</TableHead>
                  <TableHead>Bilješke</TableHead>
                  <TableHead className="w-40">Zadnje ažuriranje</TableHead>
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
                          className={cn('w-40', STATUS_TRIGGER_CLASS[row.status])}
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
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(row.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary + feedback */}
          <div className="space-y-3">
            {hasMissing && (
              <p className="text-sm text-muted-foreground">
                {missingCount} od {sorted.length} dokumenata još nedostaje.
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            )}
            {successMsg && (
              <p role="status" className="text-sm text-emerald-600">{successMsg}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex flex-col gap-1">
              <Button
                onClick={handleMarkReady}
                disabled={isPending || hasMissing || isReady}
              >
                {isPending && !hasMissing && !isReady
                  ? 'Označavanje...'
                  : isReady
                    ? 'Već označeno kao spremno'
                    : 'Označi kao spremno'}
              </Button>
              {hasMissing && !isReady && (
                <p className="text-xs text-muted-foreground">
                  Dostupno kada svi dokumenti budu zaprimljeni ili pregledani.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
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
                <p className="text-xs text-muted-foreground">
                  Nema dokumenata koji nedostaju — podsjetnik nije potreban.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reminder history */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Povijest podsjetnika</h3>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Za ovaj mjesec još nisu poslani podsjetnici.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Primatelj</TableHead>
                  <TableHead>Vrsta</TableHead>
                  <TableHead>Poslano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.recipient_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {REMINDER_TYPE_LABELS[r.reminder_type] ?? r.reminder_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(r.sent_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
