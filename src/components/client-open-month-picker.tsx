'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CROATIAN_MONTHS } from '@/lib/constants/client-presets';
import {
  OPEN_MONTH_YEAR_MAX,
  OPEN_MONTH_YEAR_MIN,
} from '@/lib/utils/months';
import { openMonthForClient } from '@/app/(protected)/clients/[id]/months/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  clientId: string;
  defaultYear: number;
  defaultMonth: number;
};

export function ClientOpenMonthPicker({
  clientId,
  defaultYear,
  defaultMonth,
}: Props) {
  const router = useRouter();
  const [yearStr, setYearStr] = useState(String(defaultYear));
  const [monthStr, setMonthStr] = useState(String(defaultMonth));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      setError('Unesite ispravnu godinu i mjesec.');
      return;
    }
    startTransition(async () => {
      const result = await openMonthForClient(clientId, year, month);
      if (result.success) {
        router.push(`/clients/${clientId}/months/${result.monthlyPeriodId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="open-month-year">Godina</Label>
          <Input
            id="open-month-year"
            type="number"
            inputMode="numeric"
            min={OPEN_MONTH_YEAR_MIN}
            max={OPEN_MONTH_YEAR_MAX}
            className="w-32"
            value={yearStr}
            onChange={(e) => setYearStr(e.target.value)}
            aria-label="Godina"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="open-month-month">Mjesec</Label>
          <Select value={monthStr} onValueChange={setMonthStr}>
            <SelectTrigger id="open-month-month" className="w-48">
              <SelectValue placeholder="Mjesec" />
            </SelectTrigger>
            <SelectContent>
              {CROATIAN_MONTHS.map((name, i) => (
                <SelectItem key={name} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Otvaranje…' : 'Otvori mjesec'}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
