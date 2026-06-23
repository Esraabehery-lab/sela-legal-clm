# SELA Legal — AI Contract Lifecycle Management (CLM)

An AI-powered **Contract Lifecycle Management** platform for the Legal
department, built from the project BRD and User Stories. This repository is
the **Phase 1 vertical slice**: a runnable, demo-able end-to-end flow from a
contract request (DF) through AI classification, drafting, multi-level
approval, signature and obligation monitoring — fully bilingual
(English / Arabic with RTL).

## Tech stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **TailwindCSS** + shadcn-style UI primitives
- **Server Actions** for all mutations (no separate API layer yet)
- **In-memory data store** seeded with demo data (a clean seam where a real
  database — e.g. Prisma/Postgres — slots in later)
- **Deterministic mock AI engine** standing in for the eventual LLM/OCR
  services

## Run locally

```bash
pnpm install      # or: npm install
pnpm dev          # or: npm run dev
# open http://localhost:3002
```

No database or external services are required. Restarting the dev server
resets the seeded data.

## Deploy a public demo (so anyone can test)

You get a permanent public URL for free — **no credit card required.**

### One-click on Vercel (free, no card)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Esraabehery-lab/sela-legal-clm)

1. Click the button → sign in with **GitHub** (Vercel's *Hobby* plan is free
   and never asks for a credit card).
2. Confirm the import and click **Deploy**. Vercel auto-detects Next.js and
   builds it.
3. After ~1–2 minutes you get a public URL like
   `https://sela-legal-clm.vercel.app` — share it so anyone can test.

> Note: Vercel runs serverless, so the in-memory demo store isn't shared
> across requests — every visitor starts from the same seeded data and can
> click through the flow. That's perfect for showing the project; it just
> doesn't persist changes globally between people.

### Want changes to persist live? Use a free tunnel (no account, no card)

Run the app locally and expose it with a free Cloudflare quick tunnel — the
URL is public and the full workflow state works (it's your local server):

```bash
pnpm build && pnpm start            # runs on http://localhost:3002
npx cloudflared tunnel --url http://localhost:3002
```

Cloudflare prints a public `https://<random>.trycloudflare.com` link. It
stays up while your machine runs the command — great for a live walkthrough.

### Other free options

- **Netlify** — free, no card; import the GitHub repo (same serverless note
  as Vercel).
- **Render** — `render.yaml` is included; New → Blueprint. (Persistent server,
  so state holds, but Render now asks to verify a card on sign-up.)

> To enable auto-sending the third-party contract link by email, set the
> `SMTP_*` environment variables (see `.env.example`) in your host's dashboard.

## Try the flow

1. **Dashboard** — contract-status, approval-bottleneck and compliance views.
2. **New Request** — submit a DF; the AI engine classifies it, decides the
   routing chain, generates a draft contract and runs a compliance pass.
3. **Request detail** — review the AI analysis & routing, edit the draft
   (with version history), upload supporting documents, then **Submit for
   Approval**.
4. Use the **persona switcher** (top-right) to act as *Procurement / Finance /
   Legal Reviewer* and approve each stage.
5. As **Contract Owner**, *Mark as Signed* — obligations are extracted and
   assigned to departments.
6. **Obligations** — track deliverables, payments and renewals; update status.
7. **Audit Trail** — every action and AI decision is logged.
8. Toggle **EN / ع** anywhere to switch language and layout direction.

## Project structure

```
src/
├── app/                    # App Router pages (server components)
│   ├── (app)/              # Authenticated shell: dashboard, requests,
│   │                       #   contracts, obligations, audit
│   └── layout.tsx          # Root layout (sets locale + text direction)
├── components/             # UI + feature components
│   └── ui/                 # shadcn-style primitives
└── lib/
    ├── types.ts            # Domain model (DFRequest, Approval, Obligation…)
    ├── ai.ts               # Mock AI engine (classify, draft, clauses,
    │                       #   compliance, obligation extraction)
    ├── store.ts + seed.ts  # In-memory store + demo data
    ├── actions.ts          # Server actions (the write side)
    ├── i18n.ts             # Bilingual labels + t(locale, en, ar)
    └── roles.ts / prefs.ts # Demo personas + cookie-based preferences
```

## BRD / User-story coverage (Phase 1)

| Epic / Story | Covered by |
|--------------|------------|
| US-001 Create request | `requests/new` + `createRequest` |
| US-002 Upload documents (+OCR) | document panel + `addDocument` / `mockOcr` |
| US-003 Analyze request | `ai.classify` |
| US-004 Auto-route | `ai.classify` routing chain |
| US-005 Generate template | `ai.generateContract` |
| US-006 Recommend clauses | `ai.recommendClauses` (with rationale) |
| US-007 Review & version | `DraftEditor` + version history |
| US-008/009/010 Procurement/Finance/Legal approval | approval workflow + `decideApproval` |
| US-011 Compliance validation | `ai.runCompliance` + risk score |
| US-012 Signature | `signContract` |
| US-013/014/015 Extract & assign obligations | `ai.extractObligations` |
| US-016 Monitor deliverables | `ObligationRow` + `updateObligation` |
| US-017 Alerts | overdue highlighting on dashboard/obligations |
| US-018 Audit trail | `audit` log + `/audit` |
| US-019 Search | `requests` search |
| US-020 Dashboards | `/dashboard` |
| US-021/022 Arabic & English | cookie locale + RTL throughout |

## Roadmap (Phases 2–5)

- Replace the in-memory store with a real database (Prisma/Postgres) + an
  API layer (tRPC).
- Wire the mock AI engine to real LLM/OCR services (e.g. the Anthropic API
  for classification, clause recommendation and obligation extraction; a
  document-AI pipeline for OCR).
- Real authentication and per-department role assignments.
- E-signature integration and notification/escalation jobs.
- Advanced analytics & compliance intelligence.
