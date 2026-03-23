'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addCalendarMonths } from '@/lib/utils/months';
import { openMonthForClient } from '@/app/(protected)/clients/[id]/months/actions';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type Props = {
  clientId: string;
  year: number;
  month: number;
};

export function MonthPeriodNavigation({ clientId, year, month }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function go(delta: number) {
    setError(null);
    const target = addCalendarMonths(year, month, delta);
    startTransition(async () => {
      const result = await openMonthForClient(
        clientId,
        target.year,
        target.month,
      );
      if (result.success) {
        router.push(`/clients/${clientId}/months/${result.monthlyPeriodId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => go(-1)}
          className="gap-1"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Prethodni mjesec
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => go(1)}
          className="gap-1"
        >
          Sljedeći mjesec
          <ChevronRightIcon className="size-4" aria-hidden />
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
