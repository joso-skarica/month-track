import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientForm } from '@/components/client-form';
import type { Client, DocumentType } from '@/types/db';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [clientResult, docTypesResult, requirementsResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single<Client>(),
    supabase
      .from('document_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .returns<DocumentType[]>(),
    supabase
      .from('client_document_requirements')
      .select('document_type_id')
      .eq('client_id', id)
      .eq('is_required', true),
  ]);

  if (!clientResult.data) {
    notFound();
  }

  const requirementIds = (requirementsResult.data ?? []).map(
    (r) => r.document_type_id,
  );

  const initialData = {
    ...clientResult.data,
    requirementIds,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Uredi klijenta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {clientResult.data.company_name}
        </p>
      </div>
      <ClientForm
        documentTypes={docTypesResult.data ?? []}
        initialData={initialData}
      />
    </div>
  );
}
