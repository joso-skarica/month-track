import type { ClientType } from '@/types/db';

export const CLIENT_TYPES = [
  { value: 'pausalni_obrt', labelHr: 'Paušalni obrt' },
  { value: 'obrt', labelHr: 'Obrt' },
  { value: 'doo', labelHr: 'd.o.o.' },
  { value: 'udruga', labelHr: 'Udruga' },
  { value: 'other', labelHr: 'Ostalo' },
] as const satisfies readonly { value: ClientType; labelHr: string }[];

export const CROATIAN_MONTHS = [
  'Siječanj',
  'Veljača',
  'Ožujak',
  'Travanj',
  'Svibanj',
  'Lipanj',
  'Srpanj',
  'Kolovoz',
  'Rujan',
  'Listopad',
  'Studeni',
  'Prosinac',
] as const;

export const DOCUMENT_TYPE_CODES = {
  ULAZNI_RACUNI: 'ulazni_racuni',
  IZLAZNI_RACUNI: 'izlazni_racuni',
  IZVOD_BANKE: 'izvod_banke',
  BLAGAJNA: 'blagajna',
  PUTNI_NALOZI: 'putni_nalozi',
  UGOVORI: 'ugovori',
  OBRACUN_PLACE: 'obracun_place',
  JOPPD: 'joppd',
  EVIDENCIJA_PROMETA: 'evidencija_prometa',
  PRIMKE_OTPREMNICE: 'primke_otpremnice',
  PDV_DOKUMENTACIJA: 'pdv_dokumentacija',
  OSTALO: 'ostalo',
} as const;

export type DocumentTypeCode =
  (typeof DOCUMENT_TYPE_CODES)[keyof typeof DOCUMENT_TYPE_CODES];

export const DEFAULT_DOCUMENT_PRESETS: Record<ClientType, DocumentTypeCode[]> =
  {
    pausalni_obrt: [
      DOCUMENT_TYPE_CODES.IZVOD_BANKE,
      DOCUMENT_TYPE_CODES.IZLAZNI_RACUNI,
      DOCUMENT_TYPE_CODES.EVIDENCIJA_PROMETA,
      DOCUMENT_TYPE_CODES.OSTALO,
    ],
    obrt: [
      DOCUMENT_TYPE_CODES.ULAZNI_RACUNI,
      DOCUMENT_TYPE_CODES.IZLAZNI_RACUNI,
      DOCUMENT_TYPE_CODES.IZVOD_BANKE,
      DOCUMENT_TYPE_CODES.BLAGAJNA,
      DOCUMENT_TYPE_CODES.PDV_DOKUMENTACIJA,
      DOCUMENT_TYPE_CODES.OSTALO,
    ],
    doo: [
      DOCUMENT_TYPE_CODES.ULAZNI_RACUNI,
      DOCUMENT_TYPE_CODES.IZLAZNI_RACUNI,
      DOCUMENT_TYPE_CODES.IZVOD_BANKE,
      DOCUMENT_TYPE_CODES.OBRACUN_PLACE,
      DOCUMENT_TYPE_CODES.JOPPD,
      DOCUMENT_TYPE_CODES.PDV_DOKUMENTACIJA,
      DOCUMENT_TYPE_CODES.UGOVORI,
      DOCUMENT_TYPE_CODES.OSTALO,
    ],
    udruga: [
      DOCUMENT_TYPE_CODES.IZVOD_BANKE,
      DOCUMENT_TYPE_CODES.ULAZNI_RACUNI,
      DOCUMENT_TYPE_CODES.UGOVORI,
      DOCUMENT_TYPE_CODES.OSTALO,
    ],
    other: [],
  };
