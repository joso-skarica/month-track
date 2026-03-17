export type ClientType =
  | 'pausalni_obrt'
  | 'obrt'
  | 'doo'
  | 'udruga'
  | 'other';

export type MonthStatus = 'incomplete' | 'ready';

export type DocumentStatus = 'missing' | 'received' | 'reviewed';

export type ReminderType = 'manual' | 'first' | 'follow_up' | 'final';

export interface Profile {
  id: string;
  firm_name: string | null;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  owner_user_id: string;
  company_name: string;
  oib: string;
  contact_person: string | null;
  email: string;
  phone: string | null;
  client_type: ClientType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  id: string;
  code: string;
  label_hr: string;
  sort_order: number;
  is_active: boolean;
}

export interface ClientDocumentRequirement {
  id: string;
  client_id: string;
  document_type_id: string;
  is_required: boolean;
  created_at: string;
}

export interface MonthlyPeriod {
  id: string;
  client_id: string;
  year: number;
  month: number;
  status: MonthStatus;
  last_reminder_sent_at: string | null;
  ready_at: string | null;
  created_at: string;
}

export interface MonthlyDocumentStatus {
  id: string;
  monthly_period_id: string;
  document_type_id: string;
  status: DocumentStatus;
  notes: string | null;
  updated_at: string;
}

export interface Reminder {
  id: string;
  monthly_period_id: string;
  client_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
  reminder_type: ReminderType;
}

export interface ReminderSettings {
  id: string;
  owner_user_id: string;
  default_subject: string | null;
  default_body: string | null;
  follow_up_subject: string | null;
  follow_up_body: string | null;
  signature: string | null;
  auto_send_enabled: boolean;
  created_at: string;
  updated_at: string;
}
