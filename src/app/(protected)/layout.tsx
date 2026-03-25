import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-4 print:py-4">
        {children}
      </main>
    </div>
  );
}
