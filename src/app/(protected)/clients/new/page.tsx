import { createClient } from '@/lib/supabase/server';
import { ClientForm } from '@/components/client-form';
import type { DocumentType } from '@/types/db';

export default async function NewClientPage() {
  const supabase = await createClient();

  const { data: documentTypes } = await supabase
    .from('document_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .returns<DocumentType[]>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Novi klijent
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Dodajte novog klijenta i odaberite potrebne dokumente.
        </p>
      </div>
      <ClientForm documentTypes={documentTypes ?? []} />
    </div>
  );
}
