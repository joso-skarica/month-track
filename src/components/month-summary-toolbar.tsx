'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  clientId: string;
  monthId: string;
};

export function MonthSummaryToolbar({ clientId, monthId }: Props) {
  return (
    <div className="mb-8 flex flex-wrap gap-2 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        Ispis
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/clients/${clientId}/months/${monthId}`}>
          Natrag na mjesec
        </Link>
      </Button>
    </div>
  );
}
