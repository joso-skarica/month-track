'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { openCurrentMonth } from '@/app/(protected)/clients/[id]/months/actions';
import { Button } from '@/components/ui/button';

export function OpenMonthButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await openCurrentMonth(clientId);
      if (result.success) {
        router.push(`/clients/${clientId}/months/${result.monthlyPeriodId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Učitavanje...' : 'Otvori tekući mjesec'}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
