# Rezervo — booking infrastructure for Kosovo

Rezervo is a multi-tenant reservation SaaS designed for Kosovo businesses. It provides a public booking flow, tenant-isolated business operations, a platform-admin surface, and provider abstractions for payments, messaging, storage, and maps.

## What is implemented

- PostgreSQL/Prisma domain model with tenant-owned records, indexes, soft deletion, audit trail, subscriptions, notifications, reviews, support, and feature flags.
- Secure API foundation: signed HTTP-only session cookie, Argon2 password hashes, role checks, request validation, rate limits, secure headers, CORS, centralized errors, health endpoint, and audit logging.
- Booking core: UTC storage, Europe/Pristina display rules, working hours, staff service assignment, exceptions, blocked time, buffers, booking lead time/horizon, transactional final availability check, and a PostgreSQL exclusion constraint that prevents overlapping active bookings per staff member.
- Functional React booking flow and business dashboard, using React Router, React Query, React Hook Form, Zod, Tailwind, responsive layouts, Albanian/English translations, and dark mode.
- Seed data for fictional Kosovo businesses, API documentation, test coverage for availability and permission rules, deployment configuration, and environment documentation.

## Architecture

```
apps/
  api/       Express + Prisma REST API
  web/       Vite React customer and business application
packages/
  shared/    shared roles, API contracts and booking types
```

The authenticated session determines the tenant on every protected request. A request body can never select a `businessId` for tenant-owned operations. Admin endpoints use a separate platform-role guard.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (or `docker compose up -d postgres`)

## Local setup

```bash
copy .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Web app: `http://localhost:5173`  
API: `http://localhost:4000`  
OpenAPI: `http://localhost:4000/api/docs`

Seed accounts (development only):

| Account | Email | Password |
| --- | --- | --- |
| Platform admin | admin@example.com | `DemoPassword123!` |
| Blend Barber owner | business@example.com | `DemoPassword123!` |
| Customer | customer@example.com | `DemoPassword123!` |

## Commands

```bash
npm run dev       # API and web
npm run build     # production build
npm run test      # API unit/integration-level tests
npm run lint      # type and lint checks
npm run format    # prettier
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Production deployment

1. Provision managed PostgreSQL with automatic backups, set `DATABASE_URL`, and run `npm run db:migrate` during deployment.
2. Deploy `apps/web` to Vercel with `VITE_API_URL` set to the API origin.
3. Deploy `apps/api` to Render, Railway, Fly.io, or an equivalent Node host. Set a long unique `JWT_SECRET`, `COOKIE_SECRET`, `WEB_ORIGIN`, HTTPS-only cookies, and all provider secrets.
4. Use a real S3-compatible storage adapter and email provider before enabling uploads or delivery. Payment/SMS/WhatsApp adapters must remain disabled until provider credentials and verified webhooks are configured.
5. Configure API CORS only for trusted web origins and run migrations before each compatible release. Verify `/health` and database backup restoration periodically.

## Important booking guarantee

The API recalculates price and availability immediately before booking. The initial migration adds PostgreSQL `btree_gist` plus an exclusion constraint over each staff member's active time range, so simultaneous booking requests cannot create an overlap even when application instances scale horizontally.

## API

The OpenAPI document is served at `/api/docs` and static source is at `apps/api/openapi.json`. Standard error responses are:

```json
{ "success": false, "error": { "code": "BOOKING_UNAVAILABLE", "message": "This time slot is no longer available." } }
```

## Legal and providers

Legal pages are structured product drafts and require review by qualified Kosovo counsel before launch. Analytics, payment, SMS, WhatsApp, email, storage, map, and calendar integrations are expressed as adapters: nothing claims to send, charge, or integrate until the matching provider is configured.
