import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPeriod, formatCroatianMonth } from '@/lib/utils/months';
import { CLIENT_TYPES } from '@/lib/constants/client-presets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpenMonthButton } from '@/components/open-month-button';
import { ClientOpenMonthPicker } from '@/components/client-open-month-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Client, MonthlyPeriod } from '@/types/db';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single<Client>();

  if (!client) {
    notFound();
  }

  const { data: requirements } = await supabase
    .from('client_document_requirements')
    .select('id, document_type_id, document_types(label_hr)')
    .eq('client_id', id)
    .eq('is_required', true);

  const { data: monthPeriods } = await supabase
    .from('monthly_periods')
    .select('id, year, month, status, last_reminder_sent_at')
    .eq('client_id', id)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  const periods = (monthPeriods ?? []) as Pick<
    MonthlyPeriod,
    'id' | 'year' | 'month' | 'status' | 'last_reminder_sent_at'
  >[];

  const { year: currentYear, month: currentMonth } = getCurrentPeriod();

  const typeLabel =
    CLIENT_TYPES.find((ct) => ct.value === client.client_type)?.labelHr ??
    client.client_type;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {client.company_name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            OIB:{' '}
            <span className="font-mono tabular-nums text-foreground/90">
              {client.oib}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${client.id}/edit`}>Uredi klijenta</Link>
          </Button>
          <OpenMonthButton clientId={client.id} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Podaci o klijentu</CardTitle>
            <CardDescription>Osnovne informacije</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tip</dt>
                <dd>{typeLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Kontakt osoba</dt>
                <dd>{client.contact_person || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{client.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Telefon</dt>
                <dd>{client.phone || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  {client.is_active ? (
                    <Badge variant="success">Aktivan</Badge>
                  ) : (
                    <Badge variant="secondary">Neaktivan</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Potrebni dokumenti</CardTitle>
            <CardDescription>
              Dokumenti koje klijent mora dostaviti mjesečno
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requirements && requirements.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {requirements.map((req) => {
                  const label =
                    (req.document_types as unknown as { label_hr: string })
                      ?.label_hr ?? '—';
                  return (
                    <li
                      key={req.id}
                      className="flex items-center gap-2.5 text-foreground/90 before:block before:size-1.5 before:shrink-0 before:rounded-full before:bg-blue-600"
                    >
                      {label}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nema definiranih zahtjeva za dokumente.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/clients/${client.id}/edit`}>
                    Dodaj zahtjeve
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/80 bg-slate-50/50 pb-4">
          <CardTitle>Mjeseci</CardTitle>
          <CardDescription>
            Povijest otvorenih mjeseci i brzo otvaranje određenog razdoblja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="border-b border-border/80 bg-slate-50/30 px-6 py-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Otvori mjesec po datumu
            </p>
            <ClientOpenMonthPicker
              clientId={client.id}
              defaultYear={currentYear}
              defaultMonth={currentMonth}
            />
          </div>

          <div className="px-6 py-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Povijest mjeseci
            </p>
            {periods.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/90 bg-card py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Još nema otvorenih mjeseci za ovog klijenta.
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Koristite &quot;Otvori tekući mjesec&quot; ili odaberite godinu i
                  mjesec iznad.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/90 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razdoblje</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zadnji podsjetnik</TableHead>
                      <TableHead className="w-28 text-right">Akcija</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {formatCroatianMonth(p.month, p.year)}
                        </TableCell>
                        <TableCell>
                          {p.status === 'ready' ? (
                            <Badge variant="success">Spremno</Badge>
                          ) : (
                            <Badge variant="warning">Nepotpuno</Badge>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm text-muted-foreground">
                          {p.last_reminder_sent_at
                            ? new Date(
                                p.last_reminder_sent_at,
                              ).toLocaleDateString('hr-HR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/clients/${client.id}/months/${p.id}`}>
                              Otvori
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
