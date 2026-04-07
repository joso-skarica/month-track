'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage, type LoginLocale } from '@/lib/auth-errors';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DEMO_EMAIL = 'demo@month-track.com';
const DEMO_PASSWORD = 'demo123';

type Mode = 'signin' | 'signup';

const t = {
  hr: {
    signinHeading: 'Prijavite se u svoj račun',
    signupHeading: 'Napravite novi račun',
    emailLabel: 'Adresa e-pošte',
    emailPlaceholder: 'vas@email.hr',
    passwordLabel: 'Lozinka',
    passwordHint: 'Minimalno 6 znakova.',
    submitSignin: 'Prijava',
    submitSignup: 'Registracija',
    loading: 'Učitavanje...',
    noAccount: 'Nemate račun?',
    registerLink: 'Registrirajte se',
    hasAccount: 'Već imate račun?',
    signinLink: 'Prijavite se',
    signupSuccess:
      'Provjerite pristiglu poruku na adresi e-pošte za potvrdu računa.',
    useDemoData: 'Koristi demo podatke',
    demoTitle: 'Demo pristup',
    demoBody: 'Polja su popunjena. Kliknite Prijava za ulaz.',
  },
  en: {
    signinHeading: 'Sign in to your account',
    signupHeading: 'Create an account',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@email.com',
    passwordLabel: 'Password',
    passwordHint: 'Minimum 6 characters.',
    submitSignin: 'Sign in',
    submitSignup: 'Register',
    loading: 'Loading...',
    noAccount: "Don't have an account?",
    registerLink: 'Register',
    hasAccount: 'Already have an account?',
    signinLink: 'Sign in',
    signupSuccess: 'Check your email inbox for a confirmation link.',
    useDemoData: 'Use demo credentials',
    demoTitle: 'Demo access',
    demoBody: 'Fields are prefilled. Click Sign in to enter.',
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<LoginLocale>('hr');
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [rawError, setRawError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const l = t[locale];

  const errorDisplay = rawError ? authErrorMessage(rawError, locale) : null;

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setRawError(null);
    setShowSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRawError(null);
    setShowSuccess(false);
    setLoading(true);

    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setRawError(error.message);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setRawError(error.message);
        setLoading(false);
        return;
      }
      setShowSuccess(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:py-10">
      <div className="w-full max-w-sm space-y-4">
        {/* Language toggle */}
        <div className="flex items-center justify-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setLocale('hr')}
            className={cn(
              'rounded-md px-2.5 py-1 font-medium transition-colors',
              locale === 'hr'
                ? 'bg-foreground/[0.06] text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
          >
            HR
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={cn(
              'rounded-md px-2.5 py-1 font-medium transition-colors',
              locale === 'en'
                ? 'bg-foreground/[0.06] text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
          >
            EN
          </button>
        </div>

        {/* Main login card */}
        <div className="rounded-xl border border-border/90 bg-card p-8 shadow-sm">
          <div className="mb-7 flex flex-col items-center gap-3 text-center">
            <Logo size="lg" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mode === 'signin' ? l.signinHeading : l.signupHeading}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{l.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={l.emailPlaceholder}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{l.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">
                  {l.passwordHint}
                </p>
              )}
            </div>

            {errorDisplay && (
              <div
                role="alert"
                className="rounded-md border border-red-200/80 bg-red-50/75 px-3 py-2.5 text-[13px] leading-snug text-red-800"
              >
                {errorDisplay}
              </div>
            )}
            {showSuccess && (
              <p role="status" className="text-sm text-muted-foreground">
                {l.signupSuccess}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? l.loading
                : mode === 'signin'
                  ? l.submitSignin
                  : l.submitSignup}
            </Button>
          </form>

          {mode === 'signin' && email !== DEMO_EMAIL && (
            <button
              type="button"
              onClick={fillDemo}
              className="mt-3 w-full text-center text-xs text-muted-foreground/70 transition-colors hover:text-primary"
            >
              {l.useDemoData}
            </button>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>
                {l.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setRawError(null);
                    setShowSuccess(false);
                  }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {l.registerLink}
                </button>
              </>
            ) : (
              <>
                {l.hasAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    fillDemo();
                  }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {l.signinLink}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Demo hint — compact and secondary */}
        {mode === 'signin' && (
          <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-center">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/70">
                {l.demoTitle}
              </span>
              {' — '}
              {l.demoBody}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground/60">
              {DEMO_EMAIL} / {DEMO_PASSWORD}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
