import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReminderSettingsForm } from '@/components/reminder-settings-form';
import { PageHeader } from '@/components/page-header';
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Konfiguracija"
        title="Postavke podsjetnika"
        subtitle="Predlošci e-pošte, potpis, prag zakašnjenja i pravila automatskih podsjetnika. Promjene vrijede za sve buduće podsjetnike."
      />
      <ReminderSettingsForm settings={settings} />
    </div>
  );
}
