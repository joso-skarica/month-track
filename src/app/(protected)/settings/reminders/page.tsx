import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReminderSettingsForm } from '@/components/reminder-settings-form';
import type { ReminderSettings } from '@/types/db';

export default async function ReminderSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: settings } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('owner_user_id', user.id)
    .single<ReminderSettings>();

  if (!settings) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Postavke podsjetnika
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Predlošci e-pošte, potpis, prag zakašnjenja na dashboardu i pravila
          automatskih podsjetnika. Promjene vrijede za sve buduće podsjetnike.
          Gumb &quot;Pokreni sada&quot; u postavkama izvršava istu logiku kao
          budući zakazani posao.
        </p>
      </div>
      <ReminderSettingsForm settings={settings} />
    </div>
  );
}
