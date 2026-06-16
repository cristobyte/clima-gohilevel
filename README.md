# Clima — Agency Platform (GoHighLevel-style clone)

A multi-tenant agency platform: one agency manages many client **sub-accounts
(locations)**, each with its own CRM, conversations, calendars, and automation.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** (Radix)
- **Prisma 6** + **PostgreSQL 16**
- **Auth.js v5** (NextAuth) — credentials auth, JWT sessions

## Architecture

- **Tenancy in the URL**: `/location/[locationId]/…`, but always **server-enforced**.
  `requireLocation()` (`src/lib/tenant.ts`) re-validates membership on every layout
  and Server Action — the URL alone is never trusted.
- **Server Components** by default; data access lives in `src/server/*`. Mutations are
  **Server Actions** in `src/server/actions/*`. Client Components only where there's
  interactivity (Kanban DnD, message composer, switchers, dialogs).
- **Roles**: `AGENCY_ADMIN` / `AGENCY_USER` (access all locations in the agency) and
  `LOCATION_ADMIN` / `LOCATION_USER` (scoped to one location).

## Local development

The app expects a local Postgres cluster. No Docker required — a setup script runs
the bundled PostgreSQL server under the unprivileged `postgres` user.

```bash
pnpm install
pnpm db:setup       # init + start Postgres, create the clima database
pnpm db:migrate     # apply migrations
pnpm db:seed        # load demo agency, sub-accounts and data
pnpm dev            # http://localhost:3000
```

### Demo login

```
Email:    demo@clima.test
Password: password123
```

## Scripts

| Script            | Purpose                            |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Dev server                         |
| `pnpm build`      | Production build                   |
| `pnpm typecheck`  | `tsc --noEmit`                     |
| `pnpm db:setup`   | Initialize + start local Postgres  |
| `pnpm db:migrate` | `prisma migrate deploy`            |
| `pnpm db:seed`    | Seed demo data                     |
| `pnpm db:studio`  | Prisma Studio                      |

## Claude Code on the web

`.claude/hooks/session-start.sh` provisions the environment automatically in remote
sessions: installs dependencies, starts Postgres, migrates, and seeds once.

## Modules

- **Dashboard** — per-location KPIs and recent activity
- **Contacts** — CRM with tags, sources, detail pages
- **Opportunities** — Kanban pipelines with drag-and-drop
- **Conversations** — unified inbox (SMS / email / chat)
- **Calendars** — appointments and scheduling
- **Automation** — workflow builder + enrollment engine
- **Agency** — sub-account management and overview
