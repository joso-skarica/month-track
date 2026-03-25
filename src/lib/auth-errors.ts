/**
 * Maps Supabase Auth API messages to Croatian product copy.
 * Unknown messages fall back to a generic message (no raw English in UI).
 */
export function croatianAuthErrorMessage(raw: string): string {
  const m = raw.trim();
  const lower = m.toLowerCase();

  const exact: Record<string, string> = {
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
  };

  if (exact[m]) return exact[m];

  if (lower.includes('invalid login credentials')) {
    return 'Neispravna adresa e-pošte ili lozinka.';
  }
  if (lower.includes('email') && lower.includes('confirm')) {
    return 'Potvrdite adresu e-pošte prije prijave (provjerite pristiglu poruku).';
  }
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Račun s tom adresom e-pošte već postoji.';
  }
  if (lower.includes('password') && lower.includes('6')) {
    return 'Lozinka mora imati najmanje 6 znakova.';
  }
  if (lower.includes('invalid') && lower.includes('email')) {
    return 'Neispravan oblik adrese e-pošte.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Previše pokušaja. Pričekajte trenutak pa pokušajte ponovo.';
  }

  return 'Nešto je pošlo po krivu. Pokušajte ponovo.';
}
