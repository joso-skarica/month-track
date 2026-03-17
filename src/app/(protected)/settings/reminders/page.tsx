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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Postavke podsjetnika
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Konfigurirajte predloške i postavke za email podsjetnike.
        </p>
      </div>
      <ReminderSettingsForm settings={settings} />
    </div>
  );
}
