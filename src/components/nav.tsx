'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Month-Track
          </Link>
          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Odjava
        </Button>
      </div>
    </header>
  );
}
