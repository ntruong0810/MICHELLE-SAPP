# Michelle's Day Planner

A warm, paper-inspired digital planner built with the official Next.js App Router, React, TypeScript, and Tailwind CSS.

## Features

- Month event creation, editing, deletion, overflow, and keyboard navigation
- Read-only synchronization of Month events into their corresponding Week
- Independent Week-only events and checklist tasks
- Per-week resizable Events/Tasks layout
- Date-scoped photo galleries in Month and read-only photo galleries in Week
- Supabase Anonymous Auth, private user data, and Row Level Security

Sticker persistence and artwork exist, but the sticker picker is not wired into the UI yet.

## Structure

- `app/`: App Router pages, metadata, and global styles
- `components/planner/`: Month, Week, entry, dialog, and media UI
- `lib/`: calendar and immutable planner collection logic
- `lib/planner-data/`: Supabase row mapping and CRUD
- `lib/supabase/`: browser client and anonymous session initialization
- `supabase/`: table, RLS, and Storage setup SQL
- `tests/`: calendar, collection, and data-mapping unit tests

## Local setup

Use Node 22.13 or newer, run `npm install`, and copy the public Supabase values from `.env.example` into `.env.local`. Enable Supabase Anonymous Auth and apply the SQL files under `supabase/` before testing persistence.

Run `npm run dev` for development. Use `npm test`, `npm run lint`, and `npm run build` before shipping changes.
