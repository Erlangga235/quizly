# Server-Enforced Quiz Ownership + RLS Lockdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all quiz/question/option reads and writes behind server API endpoints that verify a signed admin session and enforce per-admin ownership, then lock down Supabase RLS so the public anon key can no longer read or write any admin-owned data directly.

**Architecture:** Login/register issue an HMAC-signed session token (minimal JWT, built with `node:crypto`, no new library). The browser sends `Authorization: Bearer <token>` on every admin request. Server endpoints verify the token, derive the trusted `admin.id`, and use the Supabase **service-role** client (which bypasses RLS) to perform ownership-scoped queries. Player pages get their own thin server endpoints (service role) for the few reads/writes they need. Finally, RLS policies are tightened so the anon role has zero access to `quizzes`/`questions`/`options`/`admins` and read-only access to `participants` (so the public realtime leaderboard keeps working).

**Tech Stack:** Nuxt 3, Nitro server routes, `@nuxtjs/supabase` (`serverSupabaseServiceRole`), Node `node:crypto` (HMAC), Vitest (added for one pure utility), Supabase Postgres + RLS.

---

## Why this exact order

The current `adminId` lives in plain `localStorage` with no signature. A server endpoint that simply reads an `admin_id` from the request body or a header would still be spoofable — any client can send any id. So the plan must:

1. Establish a **server-verifiable identity** (signed token) — Tasks 1-4.
2. Route **admin** quiz operations through endpoints that derive identity from that token — Tasks 5-7.
3. Route the **player** reads/writes through endpoints too (because once RLS is locked, the anon client can't touch these tables) — Task 8.
4. Rewire the **client pages** to call those endpoints instead of the Supabase client — Task 9.
5. **Lock down RLS** last, once nothing depends on open anon access — Task 10.

Doing the lockdown (Task 10) before Tasks 5-9 would break the running app. Doing it last makes every prior task independently shippable.

---

## Security scope and limitations (read before starting)

- **In scope:** Admins can no longer see, edit, or delete other admins' quizzes — enforced by the database (RLS) + server token, not just client-side filtering.
- **Out of scope (documented follow-ups, do NOT silently add):**
  - Player score is still client-reported in the finish endpoint. Fully server-authoritative scoring (server tracks each answer and computes the total) is a separate, larger change. This plan keeps the existing `/api/check-answer` scoring model and notes the limitation.
  - Password hashing remains SHA-256+salt (unchanged). Migrating to a slow hash (bcrypt/argon2) is a separate task.
  - The session token has no server-side revocation list (stateless). Logout clears it client-side only. Acceptable for this app's threat model.

---

## File Structure

**New files:**
- `server/utils/session.ts` — pure HMAC sign/verify of session tokens. One responsibility: token crypto. Unit-tested.
- `server/utils/session.test.ts` — Vitest unit tests for the above.
- `server/utils/requireAdmin.ts` — extracts + verifies the Bearer token from a request, returns the admin session or throws 401.
- `server/api/admin/quizzes/index.get.ts` — list the calling admin's quizzes (with counts).
- `server/api/admin/quizzes/index.post.ts` — create a quiz owned by the calling admin.
- `server/api/admin/quizzes/[id].get.ts` — quiz detail + questions + options (ownership-checked).
- `server/api/admin/quizzes/[id].patch.ts` — update quiz title and/or leaderboard visibility (ownership-checked).
- `server/api/admin/quizzes/[id].delete.ts` — delete a quiz (ownership-checked).
- `server/api/admin/quizzes/[id]/participants.get.ts` — list participants of an owned quiz.
- `server/api/admin/quizzes/[id]/questions.post.ts` — add a question + its options to an owned quiz.
- `server/api/admin/questions/[id].delete.ts` — delete a question (ownership via parent quiz).
- `server/api/play/join.post.ts` — resolve a quiz code to a quiz id.
- `server/api/play/[id]/questions.get.ts` — questions + options for players, **without** `is_correct`.
- `server/api/play/[id]/finish.post.ts` — insert a participant score row, returns the participant id.
- `server/api/play/[id]/result.get.ts` — public result payload: quiz title/visibility + top-10 leaderboard.
- `vitest.config.ts` — minimal Vitest config (node environment).

**Modified files:**
- `.env.example` — add `SUPABASE_SERVICE_KEY` and `AUTH_SECRET`.
- `nuxt.config.ts` — add `runtimeConfig.authSecret`.
- `package.json` — add `vitest` devDependency + `test` script.
- `server/api/auth/login.post.ts` — switch to service-role client, return a signed token.
- `server/api/auth/register.post.ts` — switch to service-role client, return a signed token.
- `server/api/check-answer.post.ts` — switch to service-role client (anon loses `options` access).
- `pages/admin/login.vue` — store `adminToken`; send nothing new yet.
- `middleware/admin-auth.ts` — gate on `adminToken`.
- `pages/admin/index.vue` — replace all Supabase calls with `$fetch` to admin endpoints.
- `pages/admin/quiz/[id].vue` — replace all Supabase calls with `$fetch` to admin endpoints; add `admin-auth` middleware.
- `pages/index.vue` — join via `/api/play/join`.
- `pages/quiz/[id]/index.vue` — questions via `/api/play/[id]/questions`; finish via `/api/play/[id]/finish`.
- `pages/quiz/[id]/result.vue` — quiz + leaderboard via `/api/play/[id]/result`; keep realtime on participants.
- `supabase-schema.sql` — replace wide-open policies with locked-down policies (also delivered as a standalone migration to run in Supabase).

---

## Verification approach (no existing test runner)

This repo has no test framework (per `AGENTS.md`). This plan adds **Vitest** for the one piece of pure logic worth unit-testing — the token signer/verifier (`server/utils/session.ts`). Everything else is verified by:
- `npm run build` must succeed (catches type/import errors).
- Manual endpoint checks with PowerShell `Invoke-RestMethod` against `npm run dev` (exact commands given per task).

Do not invent fake automated tests for the endpoints; use the manual commands provided.

---

### Task 1: Add Vitest tooling and config

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `vitest.config.ts`

- [ ] **Step 1: Add the test script and dev dependency to `package.json`**

Edit the `"scripts"` block to add a `test` line, and add `vitest` to `devDependencies`:

```json
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "test": "vitest run"
  },
```

```json
  "devDependencies": {
    "@nuxtjs/supabase": "^2.0.6",
    "@nuxtjs/tailwindcss": "^6.14.0",
    "vitest": "^2.1.8",
    "vue": "^3.5.34",
    "vue-tsc": "^3.2.8"
  }
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Install the new dependency**

Run: `npm install`
Expected: completes without errors; `node_modules/vitest` now exists.

- [ ] **Step 4: Verify the runner starts (no tests yet)**

Run: `npm test`
Expected: Vitest reports "No test files found" (exit non-zero is fine here) — confirms Vitest is installed and configured. The first real test arrives in Task 2.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for server util tests"
```

---

### Task 2: Signed session token utility (HMAC, no new library)

A minimal signed token: `base64url(payloadJson).base64url(hmacSha256(payloadJson, secret))`. No external JWT library — uses `node:crypto`. The payload carries `{ sub: adminId, username, iat, exp }`.

**Files:**
- Create: `server/utils/session.ts`
- Test: `server/utils/session.test.ts`

- [ ] **Step 1: Write the failing test**

`server/utils/session.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from './session'

const SECRET = 'test-secret-please-change'

describe('session token', () => {
  it('round-trips a valid token', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, 3600)
    const session = verifySession(token, SECRET)
    expect(session.sub).toBe('admin-1')
    expect(session.username).toBe('alice')
  })

  it('rejects a token signed with a different secret', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, 3600)
    expect(() => verifySession(token, 'other-secret')).toThrow()
  })

  it('rejects a tampered payload', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, 3600)
    const [, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'admin-999', username: 'evil', iat: 1, exp: 9999999999 })).toString('base64url')
    expect(() => verifySession(`${forged}.${sig}`, SECRET)).toThrow()
  })

  it('rejects an expired token', () => {
    const token = signSession({ sub: 'admin-1', username: 'alice' }, SECRET, -1)
    expect(() => verifySession(token, SECRET)).toThrow()
  })

  it('rejects a malformed token', () => {
    expect(() => verifySession('not-a-token', SECRET)).toThrow()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run server/utils/session.test.ts`
Expected: FAIL — cannot import `signSession`/`verifySession` (module not found).

- [ ] **Step 3: Write the implementation**

`server/utils/session.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface AdminSession {
  sub: string       // admin id
  username: string
  iat: number       // issued-at (seconds)
  exp: number       // expiry (seconds)
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function signSession(
  claims: { sub: string; username: string },
  secret: string,
  ttlSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSession = {
    sub: claims.sub,
    username: claims.username,
    iat: now,
    exp: now + ttlSeconds,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

export function verifySession(token: string, secret: string): AdminSession {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Malformed token')
  }
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) {
    throw new Error('Malformed token')
  }
  const expected = sign(encoded, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid signature')
  }
  let payload: AdminSession
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw new Error('Invalid payload')
  }
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== 'number' || payload.exp < now) {
    throw new Error('Token expired')
  }
  return payload
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run server/utils/session.test.ts`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add server/utils/session.ts server/utils/session.test.ts
git commit -m "feat: add HMAC-signed admin session token utility"
```

---

### Task 3: `requireAdmin` request guard

Extracts the Bearer token from the `Authorization` header, verifies it with the runtime secret, and returns the `AdminSession`. Throws 401 on any failure. Centralizes auth so every admin endpoint is one line.

**Files:**
- Create: `server/utils/requireAdmin.ts`

- [ ] **Step 1: Write the implementation**

`server/utils/requireAdmin.ts`:

```ts
import type { H3Event } from 'h3'
import { verifySession, type AdminSession } from './session'

export function requireAdmin(event: H3Event): AdminSession {
  const authSecret = useRuntimeConfig(event).authSecret
  if (!authSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Server auth not configured.' })
  }
  const header = getRequestHeader(event, 'authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Tidak terautentikasi.' })
  }
  try {
    return verifySession(match[1], authSecret)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Sesi tidak valid atau kedaluwarsa.' })
  }
}
```

Note: `useRuntimeConfig`, `createError`, `getRequestHeader` are Nitro/h3 auto-imports — no import statements needed for them.

- [ ] **Step 2: Verify it compiles via build**

Run: `npm run build`
Expected: build succeeds (the file is referenced by later tasks; here we only confirm it type-checks and imports resolve).

- [ ] **Step 3: Commit**

```bash
git add server/utils/requireAdmin.ts
git commit -m "feat: add requireAdmin bearer-token guard"
```

---

### Task 4: Wire up config + issue tokens from auth routes (service role)

Add the service-role key and auth secret to config, then change login/register to (a) use the service-role client and (b) return a signed token instead of a bare id.

**Files:**
- Modify: `.env.example`
- Modify: `nuxt.config.ts:42-44`
- Modify: `server/api/auth/login.post.ts`
- Modify: `server/api/auth/register.post.ts`

- [ ] **Step 1: Add new keys to `.env.example`**

Replace the entire contents of `.env.example` with:

```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
AUTH_SECRET=generate-a-long-random-string-min-32-chars
```

- [ ] **Step 2: Create your local `.env` values**

The worker must ensure the real `.env` (not committed) has all four keys. The service-role key is in the Supabase dashboard under Project Settings → API → `service_role` secret. Generate `AUTH_SECRET` with:

Run: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
Expected: prints a ~64-char random string. Put it in `.env` as `AUTH_SECRET=...`.

Note: `@nuxtjs/supabase` reads `SUPABASE_SERVICE_KEY` automatically for `serverSupabaseServiceRole`. No module config change is needed for it.

- [ ] **Step 3: Expose `AUTH_SECRET` to the server via `runtimeConfig`**

In `nuxt.config.ts`, replace the `supabase` block (lines 42-44):

```ts
  supabase: {
    redirect: false
  }
```

with:

```ts
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
  },
  supabase: {
    redirect: false
  }
```

(`runtimeConfig` keys without a `public` wrapper are server-only — exactly what we want for the signing secret.)

- [ ] **Step 4: Update `server/api/auth/login.post.ts` to use service role + return a token**

Replace the entire file with:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { createHash } from 'node:crypto'
import { signSession } from '~/server/utils/session'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan password wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: admin } = await supabase
    .from('admins')
    .select('id, username, password_hash')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: 'Username atau password salah.' })
  }

  const [salt, storedHash] = (admin as any).password_hash.split(':')
  const inputHash = createHash('sha256').update(password + salt).digest('hex')

  if (inputHash !== storedHash) {
    throw createError({ statusCode: 401, statusMessage: 'Username atau password salah.' })
  }

  const authSecret = useRuntimeConfig(event).authSecret
  const token = signSession(
    { sub: (admin as any).id, username: (admin as any).username },
    authSecret,
    TOKEN_TTL_SECONDS
  )

  return { token, id: (admin as any).id, username: (admin as any).username }
})
```

- [ ] **Step 5: Update `server/api/auth/register.post.ts` to use service role + return a token**

Replace the entire file with:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { createHash, randomBytes } from 'node:crypto'
import { signSession } from '~/server/utils/session'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan password wajib diisi.' })
  }
  if (username.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Username minimal 3 karakter.' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 6 karakter.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Username sudah dipakai.' })
  }

  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  const password_hash = `${salt}:${hash}`

  const { data, error } = await supabase
    .from('admins')
    .insert({ username: username.trim().toLowerCase(), password_hash })
    .select('id, username')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat akun.' })
  }

  const authSecret = useRuntimeConfig(event).authSecret
  const token = signSession(
    { sub: (data as any).id, username: (data as any).username },
    authSecret,
    TOKEN_TTL_SECONDS
  )

  return { token, id: (data as any).id, username: (data as any).username }
})
```

- [ ] **Step 6: Build to confirm everything compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Manually verify register returns a token**

Start dev in one terminal: `npm run dev`
In another terminal:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/auth/register -Method Post -ContentType 'application/json' -Body '{"username":"planuser","password":"secret123"}'
```

Expected: an object with `token` (a string containing a `.`), `id` (uuid), and `username` `planuser`. If you re-run it, expect a 409 "Username sudah dipakai."

- [ ] **Step 8: Commit**

```bash
git add .env.example nuxt.config.ts server/api/auth/login.post.ts server/api/auth/register.post.ts
git commit -m "feat: issue signed session tokens from auth routes via service role"
```

---

### Task 5: Admin endpoints — list and create quizzes

Replaces the `fetchQuizzes` and `createQuiz` Supabase calls in `pages/admin/index.vue`. Both derive the owner from the verified token, never from the request body.

**Files:**
- Create: `server/api/admin/quizzes/index.get.ts`
- Create: `server/api/admin/quizzes/index.post.ts`

- [ ] **Step 1: Create the list endpoint**

`server/api/admin/quizzes/index.get.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, questions(count), participants(count)')
    .eq('admin_id', session.sub)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memuat kuis.' })
  }
  return data || []
})
```

- [ ] **Step 2: Create the create endpoint**

`server/api/admin/quizzes/index.post.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const body = await readBody(event)
  const title = (body?.title || '').trim()
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Judul kuis wajib diisi.' })
  }

  const insertData: Record<string, any> = {
    title,
    description: '',
    admin_id: session.sub,
  }
  const code = (body?.code || '').trim()
  if (code) {
    insertData.code = code.toUpperCase().slice(0, 4)
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase
    .from('quizzes')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat kuis.' })
  }
  return data
})
```

- [ ] **Step 3: Build to confirm both endpoints compile**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manually verify ownership enforcement**

With `npm run dev` running, first get a token, then call the endpoints:

```powershell
$r = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' -Body '{"username":"planuser","password":"secret123"}'
$h = @{ Authorization = "Bearer $($r.token)" }
# create
Invoke-RestMethod -Uri http://localhost:3000/api/admin/quizzes -Method Post -Headers $h -ContentType 'application/json' -Body '{"title":"Plan Test Quiz"}'
# list
Invoke-RestMethod -Uri http://localhost:3000/api/admin/quizzes -Method Get -Headers $h
# unauthorized (no header) must 401
Invoke-RestMethod -Uri http://localhost:3000/api/admin/quizzes -Method Get
```

Expected: create returns the new quiz row (with `admin_id` = your id); list returns an array containing it; the no-header call fails with HTTP 401.

- [ ] **Step 5: Commit**

```bash
git add server/api/admin/quizzes/index.get.ts server/api/admin/quizzes/index.post.ts
git commit -m "feat: add admin list/create quiz endpoints with ownership"
```

---

### Task 6: Admin endpoints — quiz detail, update, delete

Replaces `fetchQuiz`, `saveEdit`, `confirmDelete` (dashboard) and `fetchQuiz`, `toggleLeaderboard` (detail page). Every handler re-checks `admin_id = session.sub` so one admin can never touch another's quiz.

**Files:**
- Create: `server/api/admin/quizzes/[id].get.ts`
- Create: `server/api/admin/quizzes/[id].patch.ts`
- Create: `server/api/admin/quizzes/[id].delete.ts`

- [ ] **Step 1: Create the detail endpoint (quiz + questions + options)**

`server/api/admin/quizzes/[id].get.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .single()

  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', quizId)
    .order('created_at')

  return { quiz, questions: questions || [] }
})
```

- [ ] **Step 2: Create the update endpoint (title and/or leaderboard visibility)**

`server/api/admin/quizzes/[id].patch.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const updates: Record<string, any> = {}
  if (typeof body?.title === 'string' && body.title.trim()) {
    updates.title = body.title.trim()
  }
  if (typeof body?.is_leaderboard_visible === 'boolean') {
    updates.is_leaderboard_visible = body.is_leaderboard_visible
  }
  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada perubahan.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase
    .from('quizzes')
    .update(updates)
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }
  return data
})
```

- [ ] **Step 3: Create the delete endpoint**

`server/api/admin/quizzes/[id].delete.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
    .eq('admin_id', session.sub)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus kuis.' })
  }
  return { ok: true }
})
```

- [ ] **Step 4: Build to confirm compilation**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manually verify detail + cross-owner protection**

With `npm run dev` running and using `$h` / quiz id from Task 5 (call the create endpoint again if you need a fresh `$qid`):

```powershell
$q = Invoke-RestMethod -Uri http://localhost:3000/api/admin/quizzes -Method Post -Headers $h -ContentType 'application/json' -Body '{"title":"Detail Test"}'
$qid = $q.id
# detail OK
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes/$qid" -Method Get -Headers $h
# patch visibility
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes/$qid" -Method Patch -Headers $h -ContentType 'application/json' -Body '{"is_leaderboard_visible":false}'
# fetching a random/non-owned id must 404
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes/00000000-0000-0000-0000-000000000000" -Method Get -Headers $h
```

Expected: detail returns `{ quiz, questions }`; patch returns the row with `is_leaderboard_visible: false`; the bogus id returns HTTP 404.

- [ ] **Step 6: Commit**

```bash
git add server/api/admin/quizzes/[id].get.ts server/api/admin/quizzes/[id].patch.ts server/api/admin/quizzes/[id].delete.ts
git commit -m "feat: add admin quiz detail/update/delete endpoints with ownership"
```

---

### Task 7: Admin endpoints — participants, add question, delete question

Replaces `fetchParticipants`, `addQuestion`, `confirmDeleteQuestion` in `pages/admin/quiz/[id].vue`. Question operations verify ownership through the parent quiz before touching questions/options.

**Files:**
- Create: `server/api/admin/quizzes/[id]/participants.get.ts`
- Create: `server/api/admin/quizzes/[id]/questions.post.ts`
- Create: `server/api/admin/questions/[id].delete.ts`

- [ ] **Step 1: Create the participants endpoint**

`server/api/admin/quizzes/[id]/participants.get.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  // Confirm the quiz belongs to this admin before exposing participants.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })

  return data || []
})
```

- [ ] **Step 2: Create the add-question endpoint (question + options in one call)**

`server/api/admin/quizzes/[id]/questions.post.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const quizId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const text = (body?.text || '').trim()
  const timeLimit = Number(body?.time_limit) || 30
  const options = Array.isArray(body?.options) ? body.options : []
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Teks pertanyaan wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Ownership check via parent quiz.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('admin_id', session.sub)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .insert({ quiz_id: quizId, text, time_limit: timeLimit })
    .select()
    .single()
  if (qErr || !question) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menambah pertanyaan.' })
  }

  const optsToInsert = options
    .filter((o: any) => o && typeof o.text === 'string' && o.text.trim())
    .map((o: any) => ({
      question_id: question.id,
      text: o.text.trim(),
      is_correct: !!o.is_correct,
    }))

  if (optsToInsert.length > 0) {
    const { error: oErr } = await supabase.from('options').insert(optsToInsert)
    if (oErr) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan opsi.' })
    }
  }

  return { id: question.id }
})
```

- [ ] **Step 3: Create the delete-question endpoint**

`server/api/admin/questions/[id].delete.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const session = requireAdmin(event)
  const questionId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  // Resolve the question's quiz, then confirm that quiz is owned by this admin.
  const { data: question } = await supabase
    .from('questions')
    .select('id, quiz_id')
    .eq('id', questionId)
    .single()
  if (!question) {
    throw createError({ statusCode: 404, statusMessage: 'Pertanyaan tidak ditemukan.' })
  }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', question.quiz_id)
    .eq('admin_id', session.sub)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 403, statusMessage: 'Bukan pemilik kuis ini.' })
  }

  const { error } = await supabase.from('questions').delete().eq('id', questionId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus pertanyaan.' })
  }
  return { ok: true }
})
```

Note: deleting a question cascades to its options via the existing `on delete cascade` on `options.question_id` (schema line 37). No separate options delete is needed.

- [ ] **Step 4: Build to confirm compilation**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manually verify question lifecycle**

With `npm run dev` running, using `$h` and a quiz id `$qid` you own:

```powershell
$qadd = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes/$qid/questions" -Method Post -Headers $h -ContentType 'application/json' -Body '{"text":"2+2?","time_limit":20,"options":[{"text":"4","is_correct":true},{"text":"5","is_correct":false}]}'
# detail should now include the question with its options
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes/$qid" -Method Get -Headers $h
# participants (empty array expected)
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes/$qid/participants" -Method Get -Headers $h
# delete the question
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/questions/$($qadd.id)" -Method Delete -Headers $h
```

Expected: add returns `{ id }`; detail shows the question with two options; participants returns `[]`; delete returns `{ ok: true }`.

- [ ] **Step 6: Commit**

```bash
git add server/api/admin/quizzes/[id]/participants.get.ts server/api/admin/quizzes/[id]/questions.post.ts server/api/admin/questions/[id].delete.ts
git commit -m "feat: add admin participants and question add/delete endpoints"
```

---

### Task 8: Player endpoints (so anon client can lose direct table access)

Once RLS is locked (Task 10), the anon client cannot read `quizzes`/`questions`/`options`. These four endpoints (service role, no token required — they are public) give players exactly what they need and nothing more. The questions endpoint deliberately strips `is_correct`.

**Files:**
- Create: `server/api/play/join.post.ts`
- Create: `server/api/play/[id]/questions.get.ts`
- Create: `server/api/play/[id]/finish.post.ts`
- Create: `server/api/play/[id]/result.get.ts`

- [ ] **Step 1: Create the join (code → quiz id) endpoint**

`server/api/play/join.post.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const code = (body?.code || '').toUpperCase().trim()
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Kode wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data } = await supabase
    .from('quizzes')
    .select('id')
    .eq('code', code)
    .single()

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }
  return { id: data.id }
})
```

- [ ] **Step 2: Create the player questions endpoint (no `is_correct`)**

`server/api/play/[id]/questions.get.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('questions')
    .select('id, quiz_id, text, time_limit, created_at, options(id, question_id, text)')
    .eq('quiz_id', quizId)
    .order('created_at')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal memuat soal.' })
  }
  return data || []
})
```

Note: the `options(...)` projection intentionally omits `is_correct`, so the correct answer is never sent to the player. Answer checking continues to go through `/api/check-answer`.

- [ ] **Step 3: Create the finish (insert participant) endpoint**

`server/api/play/[id]/finish.post.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const quizId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const name = (body?.name || '').trim()
  const score = Number(body?.score) || 0
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nama wajib diisi.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Confirm the quiz exists before inserting a participant for it.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({
      quiz_id: quizId,
      name,
      score,
      finished_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan skor.' })
  }
  return data
})
```

Note: `score` is still client-supplied (documented limitation in "Security scope"). This endpoint preserves current behavior while removing the anon client's direct table write.

- [ ] **Step 4: Create the result (quiz meta + leaderboard) endpoint**

`server/api/play/[id]/result.get.ts`:

```ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const quizId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, code, is_leaderboard_visible')
    .eq('id', quizId)
    .single()
  if (!quiz) {
    throw createError({ statusCode: 404, statusMessage: 'Kuis tidak ditemukan.' })
  }

  const { data: leaderboard } = await supabase
    .from('participants')
    .select('id, name, score, finished_at')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(10)

  return { quiz, leaderboard: leaderboard || [] }
})
```

- [ ] **Step 5: Build to confirm compilation**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Manually verify the player flow**

With `npm run dev` running. Use a quiz that has a question (create one and add a question via the Task 5/7 commands, and note its `code` from the create response — call it `$code`, and its id `$qid`):

```powershell
# join by code
Invoke-RestMethod -Uri http://localhost:3000/api/play/join -Method Post -ContentType 'application/json' -Body "{`"code`":`"$code`"}"
# questions must NOT contain is_correct
Invoke-RestMethod -Uri "http://localhost:3000/api/play/$qid/questions" -Method Get | ConvertTo-Json -Depth 6
# finish
Invoke-RestMethod -Uri "http://localhost:3000/api/play/$qid/finish" -Method Post -ContentType 'application/json' -Body '{"name":"Tester","score":1500}'
# result
Invoke-RestMethod -Uri "http://localhost:3000/api/play/$qid/result" -Method Get | ConvertTo-Json -Depth 6
```

Expected: join returns `{ id }`; questions JSON shows options with `id`/`text` but **no** `is_correct` field; finish returns the inserted participant row; result returns `{ quiz, leaderboard }` with the participant in the leaderboard.

- [ ] **Step 7: Commit**

```bash
git add server/api/play/join.post.ts server/api/play/[id]/questions.get.ts server/api/play/[id]/finish.post.ts server/api/play/[id]/result.get.ts
git commit -m "feat: add public play endpoints (join, questions, finish, result)"
```

---

### Task 9: Rewire client pages to call endpoints instead of Supabase

Now the front end stops talking to Supabase directly and uses the endpoints. Admin pages attach the Bearer token; player pages just `$fetch`. After this task the app works end-to-end through the API, while RLS is still open (locked in Task 10).

**Files:**
- Modify: `pages/admin/login.vue:26-27`
- Modify: `middleware/admin-auth.ts`
- Modify: `pages/admin/index.vue` (script section)
- Modify: `pages/admin/quiz/[id].vue` (script section + add middleware + template options projection)
- Modify: `pages/index.vue` (join)
- Modify: `pages/quiz/[id]/index.vue` (questions + finish)
- Modify: `pages/quiz/[id]/result.vue` (quiz + leaderboard)

#### 9a — Login stores the token

- [ ] **Step 1: Store `adminToken` on successful auth**

In `pages/admin/login.vue`, replace lines 26-27:

```js
    localStorage.setItem('adminId', result.id)
    localStorage.setItem('adminUsername', result.username)
```

with:

```js
    localStorage.setItem('adminToken', result.token)
    localStorage.setItem('adminId', result.id)
    localStorage.setItem('adminUsername', result.username)
```

#### 9b — Middleware gates on the token

- [ ] **Step 2: Update `middleware/admin-auth.ts`**

Replace the entire file with:

```ts
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      return navigateTo('/admin/login')
    }
  }
})
```

#### 9c — Dashboard uses admin endpoints

- [ ] **Step 3: Replace the `<script setup>` of `pages/admin/index.vue`**

Replace everything from line 1 (`<script setup lang="ts">`) through the closing `</script>` (line 94) with:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ middleware: 'admin-auth' })

const router = useRouter()
const adminUsername = ref('')
const adminToken = ref('')

function authHeaders() {
  return { Authorization: `Bearer ${adminToken.value}` }
}

onMounted(() => {
  adminUsername.value = localStorage.getItem('adminUsername') || 'Admin'
  adminToken.value = localStorage.getItem('adminToken') || ''
  fetchQuizzes()
})

function logout() {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminId')
  localStorage.removeItem('adminUsername')
  router.push('/admin/login')
}
const quizzes = ref([])
const newQuizTitle = ref('')
const newQuizCode = ref('')
const editQuizId = ref('')
const editQuizTitle = ref('')
const deleteQuizId = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

async function fetchQuizzes() {
  if (!adminToken.value) return
  try {
    quizzes.value = await $fetch('/api/admin/quizzes', { headers: authHeaders() })
  } catch {
    quizzes.value = []
  }
}

async function createQuiz() {
  if (!newQuizTitle.value) return
  try {
    const data = await $fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: authHeaders(),
      body: { title: newQuizTitle.value, code: newQuizCode.value.trim() },
    })
    newQuizTitle.value = ''
    newQuizCode.value = ''
    showCreateDialog.value = false
    router.push(`/admin/quiz/${data.id}`)
  } catch {}
}

function openEdit(quiz: any) {
  editQuizId.value = quiz.id
  editQuizTitle.value = quiz.title
  showEditDialog.value = true
}

async function saveEdit() {
  if (!editQuizTitle.value) return
  try {
    await $fetch(`/api/admin/quizzes/${editQuizId.value}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { title: editQuizTitle.value },
    })
    showEditDialog.value = false
    await fetchQuizzes()
  } catch {}
}

function openDelete(quizId: string) {
  deleteQuizId.value = quizId
  showDeleteDialog.value = true
}

async function confirmDelete() {
  try {
    await $fetch(`/api/admin/quizzes/${deleteQuizId.value}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    showDeleteDialog.value = false
    await fetchQuizzes()
  } catch {}
}
</script>
```

The template (lines 95+) is unchanged — it already reads `quiz.questions?.[0]?.count` and `quiz.participants?.[0]?.count`, which the list endpoint preserves via `select('*, questions(count), participants(count)')`.

#### 9d — Quiz detail page uses admin endpoints

- [ ] **Step 4: Replace the `<script setup>` of `pages/admin/quiz/[id].vue`**

Replace everything from line 1 (`<script setup lang="ts">`) through the closing `</script>` (line 147) with:

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ middleware: 'admin-auth' })

const route = useRoute()
const router = useRouter()
const quizId = route.params.id as string
const adminToken = ref('')

function authHeaders() {
  return { Authorization: `Bearer ${adminToken.value}` }
}

const quiz = ref(null)
const questions = ref([])
const participants = ref([])
const activeTab = ref<'soal' | 'peserta'>('soal')
const newQuestionText = ref('')
const newQuestionTime = ref(30)
const optionCount = ref(4)
const options = ref([
  { text: '', is_correct: true },
  { text: '', is_correct: false },
  { text: '', is_correct: false },
  { text: '', is_correct: false }
])

function updateOptionCount(count: number) {
  optionCount.value = count
  const current = options.value
  if (count > current.length) {
    for (let i = current.length; i < count; i++) {
      current.push({ text: '', is_correct: false })
    }
  } else if (count < current.length) {
    options.value = current.slice(0, count)
    if (!options.value.some(o => o.is_correct)) {
      options.value[0].is_correct = true
    }
  }
}

function setCorrectOption(idx: number) {
  options.value.forEach(o => o.is_correct = false)
  options.value[idx].is_correct = true
}

function resetForm() {
  newQuestionText.value = ''
  newQuestionTime.value = 30
  const count = optionCount.value
  options.value = Array.from({ length: count }, (_, i) => ({ text: '', is_correct: i === 0 }))
}
const showDeleteQuestionDialog = ref(false)
const deleteQuestionId = ref('')
const codeCopied = ref(false)

async function fetchQuiz() {
  try {
    const data = await $fetch(`/api/admin/quizzes/${quizId}`, { headers: authHeaders() })
    quiz.value = data.quiz
    questions.value = data.questions || []
  } catch {
    router.push('/admin')
  }
}

async function fetchParticipants() {
  try {
    participants.value = await $fetch(`/api/admin/quizzes/${quizId}/participants`, { headers: authHeaders() })
  } catch {
    participants.value = []
  }
}

async function addQuestion() {
  if (!newQuestionText.value) return
  try {
    await $fetch(`/api/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        text: newQuestionText.value,
        time_limit: newQuestionTime.value,
        options: options.value.filter(o => o.text).map(o => ({ text: o.text, is_correct: o.is_correct })),
      },
    })
    resetForm()
    await fetchQuiz()
  } catch {}
}

function openDeleteQuestion(id: string) {
  deleteQuestionId.value = id
  showDeleteQuestionDialog.value = true
}

async function confirmDeleteQuestion() {
  try {
    await $fetch(`/api/admin/questions/${deleteQuestionId.value}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  } catch {}
  showDeleteQuestionDialog.value = false
  await fetchQuiz()
}

async function toggleLeaderboard() {
  if (!quiz.value) return
  const newVal = !quiz.value.is_leaderboard_visible
  try {
    await $fetch(`/api/admin/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { is_leaderboard_visible: newVal },
    })
    quiz.value.is_leaderboard_visible = newVal
  } catch {}
}

async function copyQuizCode() {
  const code = quiz.value?.code || ''
  try {
    await navigator.clipboard.writeText(code)
    codeCopied.value = true
    setTimeout(() => codeCopied.value = false, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = code
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    codeCopied.value = true
    setTimeout(() => codeCopied.value = false, 2000)
  }
}

const totalParticipants = computed(() => participants.value.length)
const avgScore = computed(() => {
  if (participants.value.length === 0) return 0
  const sum = participants.value.reduce((a, p) => a + (p.score || 0), 0)
  return Math.round(sum / participants.value.length)
})

onMounted(() => {
  adminToken.value = localStorage.getItem('adminToken') || ''
  fetchQuiz()
  fetchParticipants()
})
</script>
```

The template (lines 149+) is unchanged. It renders `qst.options` with `opt.is_correct` — and the **admin** detail endpoint (`[id].get.ts`, Task 6) returns full options including `is_correct`, so the green "correct" highlight still works for the owner. (Only the *player* endpoint strips `is_correct`.)

#### 9e — Join page uses the play endpoint

- [ ] **Step 5: Replace the `joinQuiz` query in `pages/index.vue`**

Find the block (lines 17-21):

```js
  const { data, error } = await supabase
    .from('quizzes')
    .select('id')
    .eq('code', code.value.toUpperCase().trim())
    .single()
```

Replace it, and update the code that uses `data`/`error`, so the function resolves the code through the endpoint. Replace lines 17-21 with:

```js
  let data: any = null
  let error: any = null
  try {
    data = await $fetch('/api/play/join', {
      method: 'POST',
      body: { code: code.value.toUpperCase().trim() },
    })
  } catch (e) {
    error = e
  }
```

The existing downstream logic (`if (error || !data)` → show "not found", else `router.push('/quiz/' + data.id)`) keeps working because `data` is still `{ id }` on success. If `pages/index.vue` still declares `const supabase = useSupabaseClient()` (line 6) and it is now unused, remove that line to avoid an unused-variable warning.

#### 9f — Play page uses the play endpoints

- [ ] **Step 6: Replace the questions fetch in `pages/quiz/[id]/index.vue`**

Find (lines 41-45):

```js
  const { data } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', quizId)
    .order('created_at')
```

Replace with:

```js
  let data: any[] = []
  try {
    data = await $fetch(`/api/play/${quizId}/questions`)
  } catch {
    data = []
  }
```

- [ ] **Step 7: Replace the participant insert in `pages/quiz/[id]/index.vue`**

Find the `finishQuiz` insert (lines 119-124):

```js
  const { data, error } = await supabase.from('participants').insert({
    quiz_id: quizId,
    name: participantName.value,
    score: score.value,
    finished_at: new Date().toISOString()
  }).select().single()
```

Replace with:

```js
  let data: any = null
  let error: any = null
  try {
    data = await $fetch(`/api/play/${quizId}/finish`, {
      method: 'POST',
      body: { name: participantName.value, score: score.value },
    })
  } catch (e) {
    error = e
  }
```

The downstream code that stores `participantId` from `data.id` and navigates to the result page is unchanged. If `useSupabaseClient()` is now fully unused in this file, remove its declaration (line 8). Note: `/api/check-answer` is unchanged and still called as before.

#### 9g — Result page uses the play endpoint (keep realtime)

- [ ] **Step 8: Replace the quiz + leaderboard fetches in `pages/quiz/[id]/result.vue`**

This page has three reads. Replace the quiz fetch (line 18):

```js
  const { data: qData } = await supabase.from('quizzes').select('*').eq('id', quizId).single()
```

with a call that also primes the leaderboard:

```js
  let qData: any = null
  try {
    const res = await $fetch(`/api/play/${quizId}/result`)
    qData = res.quiz
    leaderboard.value = res.leaderboard
  } catch {}
```

Then replace the `fetchLeaderboard` body (lines 39-44):

```js
  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(10)
```

with:

```js
  let data: any[] = []
  try {
    const res = await $fetch(`/api/play/${quizId}/result`)
    data = res.leaderboard
  } catch {
    data = []
  }
```

Leave the "own participant record" read (line 22, `participants.select('*').eq('id', pId)`) and the **realtime subscription** (lines 50-65) exactly as they are — they rely on the anon client reading `participants`, which Task 10 keeps allowed (read-only). Confirm the result endpoint's `leaderboard` items expose `id`, `name`, `score` so the template's existing bindings (`p.name`, `p.score`, row keys) still resolve.

- [ ] **Step 9: Build and full manual smoke test**

Run: `npm run build`
Expected: build succeeds.

Then `npm run dev` and exercise the UI in a browser:
1. Register/login at `/admin/login` → lands on dashboard, shows only your quizzes.
2. Create a quiz → redirected to detail page.
3. Add a question with options → appears in the list, correct option highlighted green.
4. Open `/` in an incognito window, join with the quiz code, play, finish.
5. Result page shows the leaderboard; the admin detail "Peserta" tab shows the participant.
6. Log in as a *second* admin in another browser profile → dashboard is empty (cannot see the first admin's quiz). Confirm the bug is fixed.

- [ ] **Step 10: Commit**

```bash
git add pages/admin/login.vue middleware/admin-auth.ts pages/admin/index.vue "pages/admin/quiz/[id].vue" pages/index.vue "pages/quiz/[id]/index.vue" "pages/quiz/[id]/result.vue"
git commit -m "refactor: route all quiz reads/writes through server endpoints"
```

---

### Task 10: Lock down RLS

This is the step that makes ownership a real database boundary. The service-role client used by every endpoint bypasses RLS, so locking the anon role does not affect the endpoints. The anon role keeps exactly one capability: SELECT on `participants` (so the public realtime leaderboard and the result page's "own record" read keep working).

**Files:**
- Create: `supabase-rls-lockdown.sql` (run this in the Supabase SQL editor)
- Modify: `supabase-schema.sql:68-72` (so fresh installs are locked from the start)

- [ ] **Step 1: Create the migration `supabase-rls-lockdown.sql`**

```sql
-- Remove the old wide-open policies
drop policy if exists "Enable all access for all users on quizzes" on quizzes;
drop policy if exists "Enable all access for all users on questions" on questions;
drop policy if exists "Enable all access for all users on options" on options;
drop policy if exists "Enable all access for all users on participants" on participants;
drop policy if exists "Enable all access for all users on admins" on admins;

-- quizzes, questions, options, admins: NO anon access at all.
-- All access goes through service-role server endpoints, which bypass RLS.
-- (With RLS enabled and zero policies, the anon role is denied by default.)

-- participants: anon may READ only (leaderboard + realtime + own-record lookup).
-- Inserts happen via the service-role finish endpoint, so no anon insert policy.
create policy "anon read participants" on participants
  for select using (true);
```

- [ ] **Step 2: Run the migration in Supabase**

Paste the contents of `supabase-rls-lockdown.sql` into the Supabase SQL editor and run it. Expected: "Success. No rows returned." Verify under Authentication → Policies that `quizzes`, `questions`, `options`, `admins` now have **no** policies (RLS on, default-deny) and `participants` has a single SELECT policy.

- [ ] **Step 3: Update `supabase-schema.sql` so fresh installs match**

Replace the five policy lines (currently lines 68-72):

```sql
create policy "Enable all access for all users on quizzes" on quizzes for all using (true) with check (true);
create policy "Enable all access for all users on questions" on questions for all using (true) with check (true);
create policy "Enable all access for all users on options" on options for all using (true) with check (true);
create policy "Enable all access for all users on participants" on participants for all using (true) with check (true);
create policy "Enable all access for all users on admins" on admins for all using (true) with check (true);
```

with:

```sql
-- RLS: anon role has NO access to quizzes/questions/options/admins.
-- All reads/writes go through service-role server API endpoints.
-- participants is readable by anon for the public realtime leaderboard.
create policy "anon read participants" on participants for select using (true);
```

- [ ] **Step 4: Verify the anon key is now blocked from quizzes**

Confirm RLS actually denies the public key. Replace `<SUPABASE_URL>` and `<ANON_KEY>` with the values from `.env`:

```powershell
$headers = @{ apikey = '<ANON_KEY>'; Authorization = 'Bearer <ANON_KEY>' }
# quizzes must return empty (RLS denies) — NOT all quizzes
Invoke-RestMethod -Uri '<SUPABASE_URL>/rest/v1/quizzes?select=*' -Headers $headers
# participants must still be readable
Invoke-RestMethod -Uri '<SUPABASE_URL>/rest/v1/participants?select=*' -Headers $headers
```

Expected: the `quizzes` call returns `[]` (empty — anon is denied, so no rows leak across admins even via raw API). The `participants` call returns rows. This is the proof that ownership is now enforced by the database, not just the app.

- [ ] **Step 5: Re-run the full UI smoke test from Task 9, Step 9**

Repeat the 6-point browser flow. Everything must still work: login, create, add question, play, finish, leaderboard, and the second-admin isolation check. If any admin action now fails with 401/empty data, confirm the token is being sent (Task 9) before suspecting RLS.

- [ ] **Step 6: Build once more**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add supabase-rls-lockdown.sql supabase-schema.sql
git commit -m "feat: lock down RLS so anon cannot access admin-owned tables"
```

---

## Self-Review

**1. Spec coverage** — the request was: "enforce RLS by routing quiz reads/writes through a server endpoint that enforces ownership."
- Server-verifiable identity: Tasks 1-4 (token util, guard, config, auth routes). ✓
- Admin reads/writes through ownership-enforcing endpoints: Tasks 5-7 cover every Supabase call previously in `pages/admin/index.vue` (list, create, update, delete) and `pages/admin/quiz/[id].vue` (detail, participants, add question, delete question, toggle leaderboard). ✓
- Player reads/writes through endpoints (required because RLS lockdown removes anon table access): Task 8 (join, questions, finish, result). ✓
- Client rewired: Task 9 covers all 7 affected pages/middleware. ✓
- RLS locked down: Task 10. ✓
- Every original `.from(...)` call from the research map is accounted for. The only anon table access kept is `participants` SELECT (leaderboard realtime + own-record read), explicitly preserved in Task 10's policy.

**2. Placeholder scan** — no "TBD/TODO/handle edge cases/similar to Task N". Every code step contains full, copy-pasteable code. Manual verification commands are concrete. Documented limitations (client-reported score, SHA-256 hashing, no token revocation) are intentional scope notes, not placeholders.

**3. Type consistency**
- `signSession(claims, secret, ttlSeconds)` / `verifySession(token, secret): AdminSession` — same signatures in Tasks 2, 3, 4. ✓
- `requireAdmin(event): AdminSession` returning `.sub` (admin id) — used identically in Tasks 5, 6, 7. ✓
- Auth routes return `{ token, id, username }` (Task 4); login.vue stores `result.token` (Task 9a). ✓
- Admin detail endpoint returns `{ quiz, questions }` (Task 6); detail page reads `data.quiz` / `data.questions` (Task 9d). ✓
- Result endpoint returns `{ quiz, leaderboard }` (Task 8); result page reads `res.quiz` / `res.leaderboard` (Task 9g). ✓
- `localStorage` key `adminToken` is written (9a), gated (9b), and read (9c, 9d) consistently.

No gaps or inconsistencies found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-server-enforced-quiz-ownership-rls.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
