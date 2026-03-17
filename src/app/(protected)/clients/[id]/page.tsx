import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CLIENT_TYPES } from '@/lib/constants/client-presets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpenMonthButton } from '@/components/open-month-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Client } from '@/types/db';

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

  const typeLabel =
    CLIENT_TYPES.find((ct) => ct.value === client.client_type)?.labelHr ??
    client.client_type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {client.company_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            OIB: {client.oib}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/clients/${client.id}/edit`}>Uredi klijenta</Link>
          </Button>
          <OpenMonthButton clientId={client.id} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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
                    <Badge variant="secondary">Aktivan</Badge>
                  ) : (
                    <Badge variant="outline">Neaktivan</Badge>
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
                      className="flex items-center gap-2 before:block before:size-1.5 before:rounded-full before:bg-primary"
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
    </div>
  );
}
