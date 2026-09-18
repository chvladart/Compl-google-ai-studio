# Base44 Dev Environment

## Stack
- **Single-origin app**: `tsx server.ts` runs an Express server on port 3000 that also mounts Vite in middleware mode (HMR + live source serving). No separate frontend/backend processes.
- Frontend: React 19 + Vite 6 + Tailwind 4 (`@tailwindcss/vite`). Entry: `src/main.tsx` → `src/App.tsx`.
- Backend API: Express routes under `/api/*` in `server.ts`; persistence is a JSON file DB at `data/database.json` (see `server/db.ts`). The DB file is seeded on first run if absent.
- Firebase (Google auth + cloud sync) is configured client-side from the committed `firebase-applet-config.json` — no secret needed from the user.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Base image `node:22`; deps installed at startup via `npm install`, then `npx tsx server.ts`.
- Source is bind-mounted at `/app`; `node_modules` is an anonymous volume so installs persist without polluting the repo.
- Health check: `GET /api/health` → `{"status":"ok"}`.
- Live reload: edits to `src/` hot-reload via Vite HMR; edits to `server.ts`/`server/` require a container restart (`docker compose -f docker-compose.base44.yml restart app`).

## Secrets
- `GEMINI_API_KEY` and `APP_URL` are listed in `.env.example` but are **not referenced anywhere in the code** — the app boots without them. No external credentials are required to run.
