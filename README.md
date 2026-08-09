# Little Day Planner

A warm, paper-inspired digital planner built with Next.js, TypeScript, and Tailwind CSS.

Stage 1 includes:

- a nearly full-screen monthly calendar
- previous, next, and direct month navigation
- a week link for every calendar row
- a seven-day weekly layout with separate Events and Tasks areas
- centralized UTC-safe calendar utilities
- typed planner data models
- calendar-math and server-rendering tests

The planner is intentionally read-only in Stage 1. Direct event entry, persistence, synchronization overrides, tasks, and media belong to later stages.

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
npm run test:render
```

The Month grid and Week view use Sunday as the canonical first day, so every Month row opens the exact same seven dates in Week.
