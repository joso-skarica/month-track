import { createClient } from '@/lib/supabase/server';
import { ClientsTable } from '@/components/clients-table';
import type { Client } from '@/types/db';

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('company_name')
    .returns<Client[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Klijenti</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upravljanje klijentima i njihovim dokumentacijskim zahtjevima.
        </p>
      </div>
      <ClientsTable clients={clients ?? []} />
    </div>
  );
}
