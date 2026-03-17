'use server';

import { createClient } from '@/lib/supabase/server';
import type { ClientType } from '@/types/db';

export type ClientFormData = {
  company_name: string;
  oib: string;
  contact_person: string;
  email: string;
  phone: string;
  client_type: ClientType;
  is_active: boolean;
  document_type_ids: string[];
};

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function createClientAction(
  data: ClientFormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      owner_user_id: user.id,
      company_name: data.company_name,
      oib: data.oib,
      contact_person: data.contact_person || null,
      email: data.email,
      phone: data.phone || null,
      client_type: data.client_type,
      is_active: data.is_active,
    })
    .select('id')
    .single();

  if (clientError) {
    if (clientError.code === '23505') {
      return {
        success: false,
        error: 'Klijent s ovim OIB-om već postoji.',
      };
    }
    return { success: false, error: clientError.message };
  }

  if (data.document_type_ids.length > 0) {
    const rows = data.document_type_ids.map((dtId) => ({
      client_id: client.id,
      document_type_id: dtId,
      is_required: true,
    }));

    const { error: reqError } = await supabase
      .from('client_document_requirements')
      .insert(rows);

    if (reqError) {
      return { success: false, error: reqError.message };
    }
  }

  return { success: true, id: client.id };
}

export async function updateClientAction(
  clientId: string,
  data: ClientFormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Niste prijavljeni.' };
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      company_name: data.company_name,
      oib: data.oib,
      contact_person: data.contact_person || null,
      email: data.email,
      phone: data.phone || null,
      client_type: data.client_type,
      is_active: data.is_active,
    })
    .eq('id', clientId)
    .eq('owner_user_id', user.id);

  if (updateError) {
    if (updateError.code === '23505') {
      return {
        success: false,
        error: 'Klijent s ovim OIB-om već postoji.',
      };
    }
    return { success: false, error: updateError.message };
  }

  // Sync document requirements: delete old, insert new
  const { error: deleteError } = await supabase
    .from('client_document_requirements')
    .delete()
    .eq('client_id', clientId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  if (data.document_type_ids.length > 0) {
    const rows = data.document_type_ids.map((dtId) => ({
      client_id: clientId,
      document_type_id: dtId,
      is_required: true,
    }));

    const { error: reqError } = await supabase
      .from('client_document_requirements')
      .insert(rows);

    if (reqError) {
      return { success: false, error: reqError.message };
    }
  }

  return { success: true, id: clientId };
}
