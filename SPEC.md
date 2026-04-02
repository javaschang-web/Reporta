# Reporta MVP Spec

## Product Overview
**Reporta** — AI-powered financial report automation tool for CFOs, IR teams, and compliance professionals.

## Core Problem
Users collect data from multiple sources (ERP, Bloomberg, internal systems, news, Excel files) manually, paste into templates, and generate reports. This is entirely manual and repetitive.

## MVP Solution (Phase 1)
**Excel/CSV upload → Unified Dashboard → Auto-generate report (PPT/Excel/Word)**

---

## Tech Stack
- **Frontend/Backend:** Next.js 14 (App Router)
- **Database/Auth/Storage:** Supabase
- **AI Engine:** OpenAI API (GPT-4o)
- **Payments:** Stripe
- **Deployment:** Vercel
- **Language:** TypeScript

---

## MVP Features (Phase 1 only)

### 1. Authentication
- Email/password sign up & login via Supabase Auth
- Protected dashboard routes

### 2. Data Upload
- Upload multiple Excel (.xlsx) and CSV files
- Parse and store data in Supabase
- Show preview table after upload

### 3. Unified Dashboard
- Display all uploaded data sources in one view
- Simple table/card layout per data source
- Last updated timestamp per source

### 4. Report Generation
- User selects: output format (PPT / Excel / Word)
- User inputs: report title, date range, description
- AI (GPT-4o) analyzes uploaded data and generates report content
- Output: downloadable file

### 5. Report History
- List of previously generated reports
- Download again anytime

---

## Pages / Routes

```
/ (landing page - simple, with CTA to sign up)
/auth/login
/auth/signup
/dashboard (main view - data sources + recent reports)
/upload (upload new data files)
/reports/new (generate new report)
/reports (report history)
```

---

## Database Schema (Supabase)

```sql
-- Users (handled by Supabase Auth)

-- data_sources
id, user_id, name, file_type, file_url, parsed_data (jsonb), created_at

-- reports
id, user_id, title, format (ppt|excel|word), status, file_url, created_at

-- report_data_sources (junction)
report_id, data_source_id
```

---

## UI Style
- Clean, professional, minimal
- Dark sidebar, white content area
- Primary color: #2563EB (blue)
- Font: Inter
- shadcn/ui components

---

## Phase 2 (after beta validation)
- Bloomberg API connector
- ERP integration
- Scheduled auto-report generation
- Team collaboration
- Custom report templates upload

---

## Success Metric
Beta tester completes: upload data → generate report → download file
Without any manual intervention.
