# T3 Stack — Posts + Auth + tRPC

This repository is a minimal, working example of a modern full‑stack TypeScript app built with the T3 Stack. It shows how to:
- Authenticate users with NextAuth (Discord provider by default)
- Persist data using Prisma + PostgreSQL
- Build type‑safe APIs with tRPC v11 and consume them with React Query
- Hydrate server‑fetched data on the client
- Style with Tailwind CSS 4

It includes one simple feature: a signed‑in user can create a Post (title only) and see their latest post.

## Tech stack
- Next.js 15 (App Router, RSC)
- React 19
- tRPC 11 + @tanstack/react-query 5
- NextAuth.js 5 (beta) with Prisma adapter
- Prisma 6 (PostgreSQL)
- Tailwind CSS 4
- SuperJSON for rich data serialization
- Zod for input validation

Versions are pinned in `package.json`.

## How the app works
1. Authentication
   - NextAuth is configured with PrismaAdapter and the Discord provider in `src/server/auth/config.ts`.
   - Route handlers are mounted at `src/app/api/auth/[...nextauth]/route.ts` (exports `GET` and `POST`).
   - `auth()` is used server‑side (e.g., in `src/app/page.tsx`) to check the current session.

2. Database
   - Prisma client is created in `src/server/db.ts` with dev‑friendly logging.
   - The schema is defined in `prisma/schema.prisma` and includes `User`, `Account`, `Session`, `VerificationToken`, and a simple `Post` model. A `Post` belongs to a `User` via `createdBy`.

3. API layer (tRPC)
   - tRPC server setup lives in `src/server/api/trpc.ts` and creates the context with `{ db, session }`.
   - The root router is in `src/server/api/root.ts`. The `post` router (`src/server/api/routers/post.ts`) exposes:
     - `hello`: public query returning a greeting
     - `create`: protected mutation to create a new post for the current user
     - `getLatest`: protected query returning the latest post for the current user
     - `getSecretMessage`: protected query example

4. Client
   - The home page (`src/app/page.tsx`) is a Server Component that:
     - calls a server tRPC query (`api.post.hello`) and `auth()` to get the session
     - prefetches `post.getLatest` when the user is logged in
     - renders the `LatestPost` client component
   - `LatestPost` (`src/app/_components/post.tsx`) uses the tRPC React hooks to:
     - read `post.getLatest`
     - submit the `post.create` mutation and invalidate the cache on success
   - tRPC + React Query client wiring is in `src/trpc/react.tsx` and `src/trpc/query-client.ts`. Server hydration helpers are in `src/trpc/server`.

## Project structure (high level)
- `src/app` — App Router pages and components
  - `page.tsx` — landing page that displays auth state and latest post
  - `api/auth/[...nextauth]/route.ts` — NextAuth route handlers
- `src/server` — backend code
  - `api` — tRPC routers (`root.ts`, `trpc.ts`, `routers/post.ts`)
  - `auth` — NextAuth configuration (`config.ts`) and exports
  - `db.ts` — Prisma client
- `prisma/schema.prisma` — data model
- `start-database.sh` — helper script to run a local PostgreSQL container (Docker/Podman)

## Running locally
1) Prerequisites
- Node.js 20+
- Docker or Podman (optional but recommended for local DB via the helper script)

2) Configure environment variables
Create a `.env` file in the project root with at least:

```
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/health_tracker_webapp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_a_random_VERY_SECURE_string"

# Discord provider (create an app at https://discord.com/developers)
AUTH_DISCORD_ID="your_discord_client_id"
AUTH_DISCORD_SECRET="your_discord_client_secret"
```

3) Start a local database (optional helper)
- Run `./start-database.sh` to spin up a postgres container that matches your `DATABASE_URL`.

4) Apply the database schema
- Install dependencies: `npm install`
- Generate and apply migrations: `npm run db:generate` (interactive) or `npm run db:push` (push schema without migrations)

5) Start the app
- Dev server: `npm run dev` (http://localhost:3000)
- Production preview: `npm run preview`

## Common scripts
- `npm run dev` — start Next.js in dev mode
- `npm run build` — build for production
- `npm run preview` — build and start
- `npm run db:generate` — create/apply a new migration (dev)
- `npm run db:migrate` — apply migrations in deploy environments
- `npm run db:push` — push Prisma schema without migrations
- `npm run db:studio` — open Prisma Studio

## Data model
Post model (simplified):
- id (Int, auto‑increment)
- name (String)
- createdAt / updatedAt
- createdById (FK to User)

## Walkthrough
- Visit the home page
- Sign in with Discord (or any configured provider)
- Create a post using the form; your latest post will display above the form

## Notes and tips
- Access control: use `protectedProcedure` for authenticated routes and `publicProcedure` otherwise.
- Validation: use Zod in your procedures (see `postRouter`).
- Serialization: SuperJSON is configured for both server and client to preserve Dates, etc.
- Tailwind: preconfigured; edit classNames in components as needed.

## Deployment
You can deploy to any Next.js‑compatible platform (Vercel, Netlify, Docker, etc.). Ensure environment variables are set and run:
- `npm run build`
- `npm start`

For more on the T3 Stack, see https://create.t3.gg/. 
