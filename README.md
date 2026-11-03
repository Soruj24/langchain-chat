# LangGraph Chat

A production-shaped AI chat application built with **Next.js 16**, **LangGraph**,
**MongoDB**, and **Auth.js (NextAuth v5)**. It pairs a Claude-inspired streaming
chat UI with real authentication, per-user conversation isolation, and a full
admin control panel.

- **Client** (`client/`): Next.js app — auth, dashboard, chat, admin panel, and an
  authenticated reverse proxy to the LangGraph server.
- **Server** (`server/`): LangGraph agent — dynamic model/prompt/tools, a
  calculator tool, and stateless "Dynamic Suggestions".

---

## Features

### Chat
- Token-by-token streaming, markdown/code rendering, reasoning and tool cards.
- Thread history in a sidebar; conversations are private to their owner.
- Tool calling (calculator is gated by an admin toggle).
- **Dynamic Suggestions** generated per answer; can be disabled by an admin.
- Optional model picker, controlled by an admin setting.

### Users
- Register, sign in, sign out; profile edit; password change.
- Password change and admin-forced changes invalidate every existing session.
- Personal conversation history with delete.

### Admin panel (`/admin`)
- **Overview** — real user/conversation/message counts, model usage, recent
  activity, newest users.
- **User Management** — search, filter by role/status, edit role, activate or
  deactivate, delete. Guards prevent self-demotion and removing the last admin.
- **AI Configuration** — allowed models, default model, system prompt,
  temperature, max tokens, tools/suggestions/model-picker toggles.
- **Conversation Management** — all conversations with owner, message counts,
  search, detail view, and delete.
- **System Settings** — app name, logo URL, welcome message, registration
  toggle, maintenance mode.

Admin settings are stored in MongoDB and read live by the LangGraph server, so
changes apply to new runs without restarting it.

---

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 20+ | Node 22 recommended |
| MongoDB | `mongodb://127.0.0.1:27017/langchain` by default |
| Ollama + a model | e.g. `ollama pull ornith:latest` (or any model you configure) |
| LangGraph CLI | Installed as a dev dependency of `server/` |

---

## Setup

### 1. Server (LangGraph)

```bash
cd server
npm install
cp .env.example .env
npm run dev          # http://localhost:4000
```

### 2. Client (Next.js)

```bash
cd client
npm install
cp .env.example .env
```

Generate an auth secret and put it in `client/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Start the app:

```bash
npm run dev          # http://localhost:3000
```

### 3. Seed the first admin

Admin credentials are never hardcoded. The seed script reads them from the
environment and is idempotent (re-running promotes/updates that account):

```bash
cd client
npm run seed:admin
```

It takes `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` from `client/.env`.
Choose a strong password, seed once, then remove the `ADMIN_*` values (or keep
them in a secret manager). Anyone who can read the env file can reset that
admin, so treat it as a secret.

Then sign in at `http://localhost:3000/login` and open `/admin`.

Additional users can register normally (when registration is enabled in System
Settings) or be created by an admin.

---

## Environment variables

### `client/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string, including the database name |
| `AUTH_SECRET` | yes | Auth.js JWT signing secret |
| `LANGGRAPH_URL` | yes | Server-side LangGraph URL. Use `http://localhost:4000` — the dev server binds IPv6 (`::1`) |
| `LANGGRAPH_API_KEY` | no | Only if the LangGraph server requires an API key |
| `AUTH_URL` | no | Canonical app URL; otherwise the request host is trusted |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | only for seeding | Used by `npm run seed:admin` |

### `server/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | yes | Ollama API endpoint |
| `OLLAMA_MODEL` | yes | Fallback model until AI settings exist in MongoDB |
| `MONGODB_URI` | yes | Must match the client database so admin settings are read live |
| `MONGODB_DB` | no | Override the database name when the URI omits it |

---

## Security model

- **Server-verified identity.** The JWT identifies the user; `role`, `isActive`,
  and `sessionVersion` are re-read from MongoDB on every request
  (`lib/auth/session.ts`). A client can never assert a role.
- **Session revocation.** `sessionVersion` is incremented on password change,
  role change, and deactivation; stale JWTs are rejected immediately.
- **Secure cookies.** HTTP-only, `SameSite=Lax`, and `Secure` in production; 7-day
  lifetime.
- **Input validation.** Every route and server action validates with Zod.
- **Ownership enforcement.** Threads are created only server-side, with
  `metadata.user_id` written by the server. Reads and deletes verify ownership
  against MongoDB or LangGraph metadata and return **404** for foreign threads,
  so IDs cannot be probed.
- **Contained proxy.** The browser only talks to `/api/langgraph/*`. The proxy
  forces the caller's `user_id` into thread searches and rejects raw thread
  creation, copies, pruning, metadata writes, and thread deletion.
- **Admin guards.** Every `/api/admin/*` route and `/admin` page calls
  `requireApiAdmin`/`requireAdmin`. Admins cannot demote or deactivate
  themselves, and the last active admin cannot be removed.
- **No secrets in the browser.** The LangGraph URL and API key are server-only.
- **Password hashing.** bcrypt, cost 12.

---

## API surface

| Route | Purpose |
| --- | --- |
| `POST /api/auth/[...nextauth]` | Auth.js endpoints (credentials sign-in) |
| `GET/PATCH /api/me` | Current user / update profile |
| `POST /api/me/password` | Change password (invalidates sessions) |
| `GET /api/me/conversations` | Own conversations |
| `GET/DELETE /api/me/conversations/[id]` | Own conversation detail/delete |
| `POST /api/threads` | Create an owned thread |
| `POST /api/threads/[id]/sync` | Mirror LangGraph messages into MongoDB |
| `ALL /api/langgraph/[...path]` | Authenticated LangGraph proxy |
| `GET /api/config` | Public client config (models, welcome text) |
| `GET /api/admin/overview` | Dashboard stats |
| `GET/POST /api/admin/users`, `PATCH/DELETE /api/admin/users/[id]` | User management |
| `GET/PATCH /api/admin/ai-settings` | AI configuration |
| `GET/PATCH /api/admin/system-settings` | System settings |
| `GET /api/admin/conversations`, `GET/DELETE .../[id]` | Conversation management |

All JSON responses share the shape `{ ok: true, data }` or
`{ ok: false, error: { code, message, details? } }`.

---

## Quality checks

```bash
# client
cd client
npm run lint
npx tsc --noEmit
npm run build

# server
cd server
npm run typecheck
```

---

## Manual verification checklist

1. Register a normal user; confirm `/admin` redirects to `/dashboard`.
2. As that user, call an admin API with the session cookie → **403**.
3. Request another user's thread by ID → **404** (not 403, to avoid probing).
4. Change your password; the current cookie stops working and the old password
   no longer signs in.
5. As admin: toggle tools/suggestions, set the default model, then start a new
   chat and confirm the behaviour changed without restarting the AI server.
6. As admin: deactivate a user; their next request is rejected.
7. Delete a conversation as its owner and confirm it disappears from history.

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `AI service is offline` / connection refused | LangGraph isn't running, or `LANGGRAPH_URL` uses `127.0.0.1` instead of `localhost` |
| "Invalid email or password" for a known account | Account is deactivated, or the password was changed elsewhere |
| Admin panel shows no data | MongoDB is empty/unreachable, or the seed script was never run |
| Settings changes ignored by the AI | `server/.env` points at a different database than `client/.env` |
| Env changes ignored | Restart the dev server; Next.js only loads env at boot |
