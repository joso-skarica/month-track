# Month-Track

Document tracking and reminder management for Croatian accounting firms.

## Overview

Month-Track is a B2B web application built for accounting offices in Croatia. It addresses a common operational problem: tracking which monthly documents each client has submitted, which are still missing, and coordinating follow-up when deadlines approach.

The application gives accountants a structured workflow — from onboarding clients and defining their required documents, through month-by-month status tracking, to sending reminder emails and marking months as complete. A central dashboard provides an at-a-glance view of the current period across all clients.

## Core Features

- **Authentication and protected routes** — Supabase Auth with email/password and magic link login. All application routes require authentication.
- **Client management** — Create, edit, and deactivate clients. Each client record includes company name, OIB, contact details, and client type.
- **Croatia-specific client presets** — Built-in client type categories (paušalni obrt, obrt, d.o.o., udruga) with corresponding default document requirements.
- **Lazy month creation** — Monthly periods are created on demand when a user opens a specific month for a client, not generated in bulk.
- **Monthly document checklist** — Per-client, per-month tracking of individual document statuses (missing, received, reviewed) with optional notes.
- **Mark month ready** — When all documents are accounted for, the month can be marked as complete.
- **Dashboard overview** — Summary statistics and a filterable table of all client-month rows for the current period, with status badges and overdue indicators.
- **Single and bulk reminders** — Send email reminders for individual client-months or select multiple rows on the dashboard and send in bulk. Reminders use configurable templates, log each send, and update the last-reminder timestamp.
- **Month history and navigation** — Browse a client's past months, open any month by year/month picker, and navigate between adjacent months with previous/next controls.
- **Configurable overdue threshold** — Per-user setting (1–28) that controls which day of the following month triggers the overdue badge on the dashboard. Defaults to the 10th.
- **Croatian auth email templates** — Production-ready Croatian copy for signup confirmation, magic link, and password reset emails.

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 16 (App Router)             |
| Language       | TypeScript                          |
| Styling        | Tailwind CSS 4                      |
| Components     | shadcn/ui + Radix UI                |
| Auth & DB      | Supabase (Auth + PostgreSQL + RLS)  |
| Email          | Resend                              |
| Deployment     | Railway                             |

## How It Works

1. An accountant creates a client and selects which document types that client must submit each month.
2. When a new month begins (or at any time), the accountant opens that month for the client. This creates the monthly period and seeds the document checklist based on the client's requirements.
3. As documents arrive, the accountant updates each document's status — from missing to received to reviewed — and optionally adds notes.
4. If documents are still outstanding, the accountant sends a reminder email (individually or in bulk from the dashboard). The email uses configurable templates and lists the specific missing documents.
5. Once all documents are accounted for, the month is marked as ready.
6. The dashboard provides a real-time view of the current month across all clients, with overdue indicators, filter/search, and bulk actions.

## Deployment

The application is deployed on [Railway](https://railway.com). Authentication and the PostgreSQL database are hosted on [Supabase](https://supabase.com). Reminder emails are sent via [Resend](https://resend.com).

Email sending currently operates in sandbox/testing mode. To send reminders to real client email addresses, a verified sending domain must be configured in the Resend dashboard.

## Local Development

```bash
git clone <repository-url>
cd month-track
npm install
```

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Current Status

**V1.1** — Operational prototype. The application is deployed, functional, and covers the complete document tracking and reminder workflow. Currently a private repository.

## Roadmap

- Configure a production sender domain for reminder emails.
- Collect real-user feedback from accounting firms.
- Optional monthly export/reporting.
- Further workflow refinement based on usage patterns.

## Notes

- This is a Croatia-only V1. The UI, document types, client categories, and all user-facing copy are in Croatian.
- The current version implements the accountant-side workflow only. There is no client-facing portal.
- No OCR, XML parsing, or third-party accounting system integrations are included in this version.
