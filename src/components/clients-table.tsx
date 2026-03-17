'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Client } from '@/types/db';
import { CLIENT_TYPES } from '@/lib/constants/client-presets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

function getClientTypeLabel(value: string): string {
  return CLIENT_TYPES.find((ct) => ct.value === value)?.labelHr ?? value;
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.oib.includes(search);
    const matchesType = typeFilter === ALL_TYPES || c.client_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const hasFilters = search !== '' || typeFilter !== ALL_TYPES;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <Input
            placeholder="Pretraži po nazivu ili OIB-u..."
            aria-label="Pretraži klijente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44" aria-label="Filtriraj po tipu klijenta">
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
        </div>
        <Button asChild>
          <Link href="/clients/new">Novi klijent</Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          {clients.length === 0 ? (
            <>
              <p className="text-muted-foreground">
                Nemate još klijenata.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dodajte prvog klijenta da biste započeli praćenje dokumentacije.
              </p>
              <Button asChild className="mt-4">
                <Link href="/clients/new">Dodaj klijenta</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Nema rezultata za zadane filtere.
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter(ALL_TYPES);
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
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv tvrtke</TableHead>
                  <TableHead>OIB</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Kontakt osoba</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {client.oib}
                    </TableCell>
                    <TableCell>{getClientTypeLabel(client.client_type)}</TableCell>
                    <TableCell>{client.contact_person ?? '—'}</TableCell>
                    <TableCell className="text-sm">{client.email}</TableCell>
                    <TableCell>
                      {client.is_active ? (
                        <Badge variant="secondary">Aktivan</Badge>
                      ) : (
                        <Badge variant="outline">Neaktivan</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground">
              Prikazano {filtered.length} od {clients.length} klijenata.
            </p>
          )}
        </>
      )}
    </div>
  );
}
