'use client';

import { useState, useTransition } from 'react';
import {
  updateReminderSettings,
  type ReminderSettingsFormData,
} from '@/app/(protected)/settings/reminders/actions';
import {
  DEFAULT_OVERDUE_THRESHOLD_DAY,
  OVERDUE_THRESHOLD_DAY_MAX,
  OVERDUE_THRESHOLD_DAY_MIN,
  normalizeOverdueThresholdDay,
} from '@/lib/utils/months';
import type { ReminderSettings } from '@/types/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const textareaClass =
  'w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

type Props = {
  settings: ReminderSettings;
};

export function ReminderSettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [defaultSubject, setDefaultSubject] = useState(
    settings.default_subject ?? '',
  );
  const [defaultBody, setDefaultBody] = useState(
    settings.default_body ?? '',
  );
  const [followUpSubject, setFollowUpSubject] = useState(
    settings.follow_up_subject ?? '',
  );
  const [followUpBody, setFollowUpBody] = useState(
    settings.follow_up_body ?? '',
  );
  const [signature, setSignature] = useState(settings.signature ?? '');
  const [autoSend, setAutoSend] = useState(settings.auto_send_enabled);
  const [overdueDayStr, setOverdueDayStr] = useState(() =>
    String(
      normalizeOverdueThresholdDay(
        settings.overdue_threshold_day ?? DEFAULT_OVERDUE_THRESHOLD_DAY,
      ),
    ),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const overdueParsed = Number.parseInt(overdueDayStr.trim(), 10);
    if (
      Number.isNaN(overdueParsed) ||
      !Number.isInteger(overdueParsed) ||
      overdueParsed < OVERDUE_THRESHOLD_DAY_MIN ||
      overdueParsed > OVERDUE_THRESHOLD_DAY_MAX
    ) {
      setError(
        `Dan u mjesecu mora biti cijeli broj od ${OVERDUE_THRESHOLD_DAY_MIN} do ${OVERDUE_THRESHOLD_DAY_MAX}.`,
      );
      return;
    }

    const data: ReminderSettingsFormData = {
      default_subject: defaultSubject.trim(),
      default_body: defaultBody.trim(),
      follow_up_subject: followUpSubject.trim(),
      follow_up_body: followUpBody.trim(),
      signature: signature.trim(),
      auto_send_enabled: autoSend,
      overdue_threshold_day: overdueParsed,
    };

    startTransition(async () => {
      const result = await updateReminderSettings(data);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset disabled={isPending} className="space-y-8">
        <div className="space-y-3 rounded-lg border bg-muted/30 px-4 py-3">
          <h3 className="text-sm font-medium">Rok za zakašnjenje (dashboard)</h3>
          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="overdue_threshold_day">
              Dan u sljedećem mjesecu
            </Label>
            <Input
              id="overdue_threshold_day"
              type="number"
              inputMode="numeric"
              min={OVERDUE_THRESHOLD_DAY_MIN}
              max={OVERDUE_THRESHOLD_DAY_MAX}
              value={overdueDayStr}
              onChange={(e) => setOverdueDayStr(e.target.value)}
              aria-describedby="overdue_threshold_day_help"
            />
            <p
              id="overdue_threshold_day_help"
              className="text-xs text-muted-foreground leading-snug"
            >
              Nepotpuni tekući mjesec na dashboardu označit će se kao zakašnjelo
              nakon kraja ovog dana u sljedećem kalendarskom mjesecu (npr.{' '}
              {OVERDUE_THRESHOLD_DAY_MIN}–{OVERDUE_THRESHOLD_DAY_MAX}: veljača za
              siječanj). Koristi se samo za prikaz; ograničenje do 28. izbjegava
              probleme s kratkim mjesecima.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Predložak prvog podsjetnika</h3>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default_subject">Predmet</Label>
            <Input
              id="default_subject"
              value={defaultSubject}
              onChange={(e) => setDefaultSubject(e.target.value)}
              placeholder="Podsjetnik: nedostajuća dokumentacija za {{company_name}} — {{month_name}} {{year}}"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default_body">Tekst poruke</Label>
            <textarea
              id="default_body"
              rows={6}
              value={defaultBody}
              onChange={(e) => setDefaultBody(e.target.value)}
              placeholder="Poštovani,&#10;&#10;za {{company_name}} još uvijek nedostaje sljedeća dokumentacija za {{month_name}} {{year}}:&#10;&#10;{{missing_documents_list}}&#10;&#10;Molimo dostavite navedenu dokumentaciju.&#10;&#10;{{firm_signature}}"
              className={textareaClass}
            />
            <p className="text-xs text-muted-foreground">
              Dostupne varijable: {'{{company_name}}'}, {'{{month_name}}'},{' '}
              {'{{year}}'}, {'{{missing_documents_list}}'},{' '}
              {'{{firm_signature}}'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Predložak follow-up podsjetnika</h3>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="follow_up_subject">Predmet</Label>
            <Input
              id="follow_up_subject"
              value={followUpSubject}
              onChange={(e) => setFollowUpSubject(e.target.value)}
              placeholder="Urgentno: nedostajuća dokumentacija za {{company_name}}"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="follow_up_body">Tekst poruke</Label>
            <textarea
              id="follow_up_body"
              rows={6}
              value={followUpBody}
              onChange={(e) => setFollowUpBody(e.target.value)}
              placeholder="Poštovani,&#10;&#10;ovo je ponovljeni podsjetnik..."
              className={textareaClass}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Potpis</h3>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="signature">
              Potpis (koristi se kao {'{{firm_signature}}'})
            </Label>
            <textarea
              id="signature"
              rows={3}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="S poštovanjem,&#10;Vaš računovodstveni ured"
              className={textareaClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="auto_send"
            checked={autoSend}
            onCheckedChange={(checked) => setAutoSend(checked === true)}
            disabled
          />
          <Label htmlFor="auto_send" className="cursor-default text-muted-foreground">
            Automatsko slanje podsjetnika (dolazi uskoro)
          </Label>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p role="status" className="text-sm text-emerald-600">
          Postavke su uspješno spremljene.
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Spremanje...' : 'Spremi postavke'}
      </Button>
    </form>
  );
}
