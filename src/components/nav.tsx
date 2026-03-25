'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Nadzorna ploča' },
  { href: '/clients', label: 'Klijenti' },
  { href: '/settings/reminders', label: 'Postavke' },
] as const;

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-card/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:min-h-14 sm:flex-nowrap sm:gap-0 sm:px-6 sm:py-0">
        <div className="flex min-w-0 flex-wrap items-center gap-4 sm:gap-6">
          <Logo size="sm" />
          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 font-medium" onClick={handleLogout}>
          Odjava
        </Button>
      </div>
    </header>
  );
}
