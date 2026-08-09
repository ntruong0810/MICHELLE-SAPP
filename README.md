# Little Day Planner

A warm, paper-inspired digital planner built with the official Next.js App Router, React, TypeScript, and Tailwind CSS.

The current planner includes:

- a nearly full-screen monthly calendar
- previous, next, and direct month navigation
- a week link for every calendar row
- a seven-day weekly layout with separate Events and Tasks areas
- centralized UTC-safe calendar utilities
- typed planner data models
- interactive Month event creation, editing, and deletion
- Supabase-backed Month persistence with quiet save status and retry
- private event ownership through Supabase Anonymous Auth and Row Level Security

Week event synchronization, interactive weekly tasks, media, and later-stage features are intentionally not implemented yet.

## Supabase setup

1. Create a Supabase project.
2. In **Authentication → Providers**, enable **Anonymous Sign-Ins**.
3. Open the Supabase SQL Editor and run [`supabase/calendar_events.sql`](supabase/calendar_events.sql).
4. Copy `.env.example` to `.env.local`.
5. Add the project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use the public anon/publishable key. Never place a service-role key in browser environment variables.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm test
npm run lint
npm run build
```

The Month grid and Week view use Sunday as the canonical first day, so every Month row opens the exact same seven dates in Week. Month loading includes the visible overflow dates from the previous and next month. Week remains read-only and does not query or render persisted Month events in Stage 3.
