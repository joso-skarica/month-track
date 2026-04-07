import { createClient } from '@/lib/supabase/server';
import { ClientsTable } from '@/components/clients-table';
import { PageHeader } from '@/components/page-header';
import type { Client } from '@/types/db';

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('company_name')
    .returns<Client[]>();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Upravljanje"
        title="Klijenti"
        subtitle="Upravljanje klijentima i njihovim dokumentacijskim zahtjevima."
      />
      <ClientsTable clients={clients ?? []} />
    </div>
  );
}
