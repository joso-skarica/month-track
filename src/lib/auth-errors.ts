export type LoginLocale = 'hr' | 'en';

/**
 * Maps Supabase Auth API messages to user-friendly product copy.
 * Supports Croatian and English; unknown messages fall back to a generic line.
 */
export function authErrorMessage(raw: string, locale: LoginLocale = 'hr'): string {
  const m = raw.trim();
  const lower = m.toLowerCase();

  const hr: Record<string, string> = {
    'Invalid login credentials': 'Neispravna adresa e-pošte ili lozinka.',
    'Email not confirmed':
      'Potvrdite adresu e-pošte prije prijave (provjerite pristiglu poruku).',
    'User already registered': 'Račun s tom adresom e-pošte već postoji.',
    'User already exists': 'Račun s tom adresom e-pošte već postoji.',
    'Signup requires a valid password':
      'Lozinka ne ispunjava uvjete. Koristite najmanje 6 znakova.',
    'Password should be at least 6 characters':
      'Lozinka mora imati najmanje 6 znakova.',
    'Unable to validate email address: invalid format':
      'Neispravan oblik adrese e-pošte.',
    'Invalid email': 'Neispravan oblik adrese e-pošte.',
    'Email rate limit exceeded':
      'Previše pokušaja. Pričekajte trenutak pa pokušajte ponovo.',
    'For security purposes, you can only request this after':
      'Pričekajte trenutak prije novog pokušaja.',
    'Signups not allowed for this instance':
      'Registracija novih računa trenutno nije omogućena.',
    'Email signups are disabled':
      'Registracija putem e-pošte trenutno nije omogućena.',
  };

  const en: Record<string, string> = {
    'Invalid login credentials': 'Invalid email address or password.',
    'Email not confirmed':
      'Please confirm your email address before signing in.',
    'User already registered': 'An account with this email already exists.',
    'User already exists': 'An account with this email already exists.',
    'Signup requires a valid password':
      'Password does not meet requirements. Use at least 6 characters.',
    'Password should be at least 6 characters':
      'Password must be at least 6 characters.',
    'Unable to validate email address: invalid format':
      'Invalid email address format.',
    'Invalid email': 'Invalid email address format.',
    'Email rate limit exceeded':
      'Too many attempts. Please wait a moment and try again.',
    'For security purposes, you can only request this after':
      'Please wait a moment before trying again.',
    'Signups not allowed for this instance':
      'New account registration is currently disabled.',
    'Email signups are disabled':
      'Email registration is currently disabled.',
  };

  const exact = locale === 'hr' ? hr : en;
  if (exact[m]) return exact[m];

  if (locale === 'hr') return resolveHr(lower);
  return resolveEn(lower);
}

function resolveHr(lower: string): string {
  if (lower.includes('invalid login credentials'))
    return 'Neispravna adresa e-pošte ili lozinka.';
  if (lower.includes('email') && lower.includes('confirm'))
    return 'Potvrdite adresu e-pošte prije prijave (provjerite pristiglu poruku).';
  if (lower.includes('already registered') || lower.includes('already exists'))
    return 'Račun s tom adresom e-pošte već postoji.';
  if (lower.includes('password') && lower.includes('6'))
    return 'Lozinka mora imati najmanje 6 znakova.';
  if (lower.includes('invalid') && lower.includes('email'))
    return 'Neispravan oblik adrese e-pošte.';
  if (lower.includes('rate limit') || lower.includes('too many'))
    return 'Previše pokušaja. Pričekajte trenutak pa pokušajte ponovo.';
  if (lower.includes('signup') && lower.includes('not allowed'))
    return 'Registracija novih računa trenutno nije omogućena.';
  if (lower.includes('weak') && lower.includes('password'))
    return 'Lozinka je preslaba. Koristite jaču lozinku (npr. više znakova i miješane vrste znakova).';
  return 'Nešto je pošlo po krivu. Pokušajte ponovo.';
}

function resolveEn(lower: string): string {
  if (lower.includes('invalid login credentials'))
    return 'Invalid email address or password.';
  if (lower.includes('email') && lower.includes('confirm'))
    return 'Please confirm your email address before signing in.';
  if (lower.includes('already registered') || lower.includes('already exists'))
    return 'An account with this email already exists.';
  if (lower.includes('password') && lower.includes('6'))
    return 'Password must be at least 6 characters.';
  if (lower.includes('invalid') && lower.includes('email'))
    return 'Invalid email address format.';
  if (lower.includes('rate limit') || lower.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (lower.includes('signup') && lower.includes('not allowed'))
    return 'New account registration is currently disabled.';
  if (lower.includes('weak') && lower.includes('password'))
    return 'Password is too weak. Use a stronger password with mixed characters.';
  return 'Something went wrong. Please try again.';
}

/** @deprecated Use authErrorMessage(raw, 'hr') instead. Kept for existing call sites. */
export function croatianAuthErrorMessage(raw: string): string {
  return authErrorMessage(raw, 'hr');
}
