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

function navLinkClass(active: boolean, compact: boolean) {
  return cn(
    'rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    compact
      ? 'flex-1 px-2 py-2 text-center text-[11px] leading-tight'
      : 'px-3.5 py-2 text-sm',
    active
      ? 'bg-blue-50/80 text-blue-900'
      : 'text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground',
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const linkItems = links.map((link) => {
    const active = pathname.startsWith(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={navLinkClass(active, false)}
      >
        {link.label}
      </Link>
    );
  });

  const linkItemsCompact = links.map((link) => {
    const active = pathname.startsWith(link.href);
    return (
      <Link
        key={`m-${link.href}`}
        href={link.href}
        className={navLinkClass(active, true)}
      >
        {link.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-card/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 print:hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Mobile: logo + odjava, then full-width link bar */}
        <div className="flex flex-col gap-2 py-2.5 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <Logo size="sm" />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 font-medium"
              onClick={handleLogout}
            >
              Odjava
            </Button>
          </div>
          <nav
            className="flex gap-0.5 rounded-lg border border-border/60 bg-muted/25 p-0.5"
            aria-label="Glavna navigacija"
          >
            {linkItemsCompact}
          </nav>
        </div>

        {/* Desktop / tablet: single row */}
        <div className="hidden min-h-14 items-center justify-between sm:flex">
          <div className="flex min-w-0 items-center gap-6">
            <Logo size="sm" />
            <nav className="flex items-center gap-1" aria-label="Glavna navigacija">
              {linkItems}
            </nav>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 font-medium"
            onClick={handleLogout}
          >
            Odjava
          </Button>
        </div>
      </div>
    </header>
  );
}
