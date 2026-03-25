'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, ClientType, DocumentType } from '@/types/db';
import {
  CLIENT_TYPES,
  DEFAULT_DOCUMENT_PRESETS,
} from '@/lib/constants/client-presets';
import {
  createClientAction,
  updateClientAction,
  type ClientFormData,
} from '@/app/(protected)/clients/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  documentTypes: DocumentType[];
  initialData?: Client & { requirementIds: string[] };
};

function getPresetIds(
  clientType: ClientType,
  documentTypes: DocumentType[],
): string[] {
  const codes = DEFAULT_DOCUMENT_PRESETS[clientType];
  return documentTypes
    .filter((dt) => codes.includes(dt.code as never))
    .map((dt) => dt.id);
}

function isValidOib(oib: string): boolean {
  return /^\d{11}$/.test(oib);
}

export function ClientForm({ documentTypes, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialData;

  const [companyName, setCompanyName] = useState(
    initialData?.company_name ?? '',
  );
  const [oib, setOib] = useState(initialData?.oib ?? '');
  const [contactPerson, setContactPerson] = useState(
    initialData?.contact_person ?? '',
  );
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [clientType, setClientType] = useState<ClientType>(
    initialData?.client_type ?? 'doo',
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
    initialData?.requirementIds ??
      getPresetIds('doo', documentTypes),
  );

  function handleClientTypeChange(value: ClientType) {
    setClientType(value);
    if (!isEdit) {
      setSelectedDocIds(getPresetIds(value, documentTypes));
    }
  }

  function toggleDoc(docId: string) {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId],
    );
  }

  function resetToPresets() {
    setSelectedDocIds(getPresetIds(clientType, documentTypes));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedOib = oib.trim();
    if (!isValidOib(trimmedOib)) {
      setError('OIB mora sadržavati točno 11 znamenki.');
      return;
    }

    const formData: ClientFormData = {
      company_name: companyName.trim(),
      oib: trimmedOib,
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      client_type: clientType,
      is_active: isActive,
      document_type_ids: selectedDocIds,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateClientAction(initialData.id, formData)
        : await createClientAction(formData);

      if (result.success) {
        router.push(`/clients/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm"
    >
      <div className="space-y-8 p-6 sm:p-8">
      <fieldset disabled={isPending} className="space-y-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company_name">Naziv tvrtke *</Label>
            <Input
              id="company_name"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Naziv tvrtke d.o.o."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="oib">OIB *</Label>
            <Input
              id="oib"
              required
              inputMode="numeric"
              pattern="\d{11}"
              maxLength={11}
              value={oib}
              onChange={(e) => setOib(e.target.value)}
              placeholder="12345678901"
            />
            <p className="text-xs text-muted-foreground">
              Osobni identifikacijski broj — 11 znamenki.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client_type">Tip klijenta *</Label>
            <Select value={clientType} onValueChange={handleClientTypeChange}>
              <SelectTrigger id="client_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.labelHr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-pošta *</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="klijent@tvrtka.hr"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact_person">Kontakt osoba</Label>
            <Input
              id="contact_person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Ime Prezime"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+385 1 234 5678"
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="is_active" className="cursor-pointer font-medium">
                Aktivan klijent
              </Label>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground sm:pl-6">
              Klijenti se u sustavu ne brišu kako bi ostala povijest mjeseci i
              podsjetnika. Isključite aktivnost ako suradnja prestaje — klijent
              će biti označen kao neaktivan.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Potrebni dokumenti</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToPresets}
            >
              Vrati zadane
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {documentTypes.map((dt) => (
              <label
                key={dt.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border/90 bg-card px-3 py-2.5 text-sm transition-colors hover:bg-slate-50/90"
              >
                <Checkbox
                  checked={selectedDocIds.includes(dt.id)}
                  onCheckedChange={() => toggleDoc(dt.id)}
                />
                {dt.label_hr}
              </label>
            ))}
          </div>
          {selectedDocIds.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nije odabran nijedan dokument. Klijent neće imati stavke za praćenje.
            </p>
          )}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border/80 pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Spremanje...'
            : isEdit
              ? 'Spremi promjene'
              : 'Dodaj klijenta'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Odustani
        </Button>
      </div>
      </div>
    </form>
  );
}
