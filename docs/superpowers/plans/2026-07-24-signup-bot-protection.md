# Signup Bot Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add invisible, zero-friction bot protection to the public volunteer signup flow (honeypot + signed timing token + duplicate guard + `noindex`), without blocking real volunteers.

**Architecture:** Two pure, unit-tested library modules (`lib/formToken.ts`, `lib/signupGuards.ts`) hold all the logic. The signup Server Component issues an HMAC-signed timing token and renders a hidden honeypot field; `EventSignupForm` submits both back; `POST /api/signup` runs a single `evaluateSignupGuards()` call before its existing capacity/insert/notify flow. Bot verdicts return a fake `200` success (no insert, no email/SMS); duplicates return a friendly `400`.

**Tech Stack:** Next.js 16 (App Router, Server Components), TypeScript, `node:crypto` (HMAC-SHA256), Supabase (service-role admin client), Vitest (new — for the pure library units).

## Global Constraints

- No new **required** env vars. HMAC key reuses the existing server-only `SUPABASE_SERVICE_ROLE_KEY`.
- No database schema changes.
- No third-party services (Cloudflare/reCAPTCHA explicitly out of scope).
- Never hard-block a legitimate volunteer: bot checks must be near-zero false-positive; ambiguous/bot cases return a **fake success**, not an error.
- Honeypot field name: `company_website`. Timing minimum: `3000` ms (lower bound only, **no expiry**).
- Follow existing code style (2-space indent, no semicolons, single quotes — match surrounding files).
- Run `npm run build` before considering the feature complete.

---

### Task 1: `lib/formToken.ts` — signed timing token (+ Vitest setup)

**Files:**
- Create: `lib/formToken.ts`
- Create: `lib/formToken.test.ts`
- Modify: `package.json` (add `vitest` devDependency + `test` script)

**Interfaces:**
- Produces:
  - `issueFormToken(now?: number, secret?: string): string`
  - `verifyFormToken(token: string, now?: number, secret?: string): { valid: boolean; elapsedMs: number | null }`
  - Token format: `base64url(issuedAtMs) + "." + hex(hmacSHA256(base64url(issuedAtMs), secret))`
  - `secret` defaults to `process.env.SUPABASE_SERVICE_ROLE_KEY`, read **inside** the functions (not at module load) so tests can set it first.

- [ ] **Step 1: Add Vitest tooling**

Run:
```bash
npm install -D vitest
```

Then add a `test` script to `package.json` `"scripts"` (keep existing scripts):
```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing tests**

Create `lib/formToken.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { issueFormToken, verifyFormToken } from './formToken'

const SECRET = 'test-secret-key'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = SECRET
})

describe('formToken', () => {
  it('round-trips: a freshly issued token verifies as valid', () => {
    const t0 = 1_000_000
    const token = issueFormToken(t0)
    const res = verifyFormToken(token, t0 + 5000)
    expect(res.valid).toBe(true)
    expect(res.elapsedMs).toBe(5000)
  })

  it('computes elapsedMs from issued-at to now', () => {
    const token = issueFormToken(1000)
    expect(verifyFormToken(token, 4000).elapsedMs).toBe(3000)
  })

  it('rejects a tampered signature', () => {
    const token = issueFormToken(1000)
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa')
    const res = verifyFormToken(tampered, 5000)
    expect(res.valid).toBe(false)
  })

  it('rejects a token whose payload was swapped (signature no longer matches)', () => {
    const token = issueFormToken(1000)
    const sig = token.split('.')[1]
    const forgedPayload = Buffer.from(String(9999)).toString('base64url')
    const res = verifyFormToken(`${forgedPayload}.${sig}`, 5000)
    expect(res.valid).toBe(false)
  })

  it('rejects garbage / malformed tokens without throwing', () => {
    expect(verifyFormToken('', 5000).valid).toBe(false)
    expect(verifyFormToken('no-dot-here', 5000).valid).toBe(false)
    expect(verifyFormToken('a.b.c', 5000).valid).toBe(false)
  })

  it('is signed with the secret — a different secret does not verify', () => {
    const token = issueFormToken(1000, 'secret-A')
    expect(verifyFormToken(token, 5000, 'secret-B').valid).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot import from `./formToken` (module/exports not defined).

- [ ] **Step 4: Implement `lib/formToken.ts`**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(secret?: string): string {
  const s = secret ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('formToken: missing signing secret (SUPABASE_SERVICE_ROLE_KEY)')
  return s
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

// Issues `base64url(issuedAtMs).hex(hmac)`.
export function issueFormToken(now: number = Date.now(), secret?: string): string {
  const payload = Buffer.from(String(now)).toString('base64url')
  return `${payload}.${sign(payload, getSecret(secret))}`
}

// Verifies the signature and returns how long ago the token was issued.
// Never throws on malformed input — returns { valid: false, elapsedMs: null }.
export function verifyFormToken(
  token: string,
  now: number = Date.now(),
  secret?: string
): { valid: boolean; elapsedMs: number | null } {
  if (typeof token !== 'string' || token.length === 0) return { valid: false, elapsedMs: null }
  const parts = token.split('.')
  if (parts.length !== 2) return { valid: false, elapsedMs: null }
  const [payload, providedSig] = parts

  let expectedSig: string
  try {
    expectedSig = sign(payload, getSecret(secret))
  } catch {
    return { valid: false, elapsedMs: null }
  }

  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false, elapsedMs: null }

  const issuedAt = Number(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!Number.isFinite(issuedAt)) return { valid: false, elapsedMs: null }

  return { valid: true, elapsedMs: now - issuedAt }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/formToken.ts lib/formToken.test.ts package.json package-lock.json
git commit -m "Add signed form-timing token util + vitest"
```

---

### Task 2: `lib/signupGuards.ts` — combine the bot checks into one verdict

**Files:**
- Create: `lib/signupGuards.ts`
- Create: `lib/signupGuards.test.ts`

**Interfaces:**
- Consumes: `verifyFormToken` from `./formToken` (Task 1).
- Produces:
  - `type SignupVerdict = { action: 'bot' } | { action: 'duplicate' } | { action: 'ok' }`
  - `const MIN_FILL_MS = 3000`
  - `evaluateSignupGuards(input: { honeypot?: unknown; formToken?: unknown; email: string; existingEmails: string[]; now?: number }): SignupVerdict`
  - Order of precedence: honeypot → token/timing → duplicate → ok.
  - Duplicate match is case-insensitive/trimmed on email.

- [ ] **Step 1: Write the failing tests**

Create `lib/signupGuards.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { evaluateSignupGuards } from './signupGuards'
import { issueFormToken } from './formToken'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret-key'
})

const goodToken = (issuedAt: number) => issueFormToken(issuedAt)

describe('evaluateSignupGuards', () => {
  it('flags a filled honeypot as bot (before anything else)', () => {
    const v = evaluateSignupGuards({
      honeypot: 'http://spam.example',
      formToken: goodToken(0),
      email: 'a@b.com',
      existingEmails: [],
      now: 10_000,
    })
    expect(v.action).toBe('bot')
  })

  it('flags a missing/invalid token as bot', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: 'garbage',
      email: 'a@b.com',
      existingEmails: [],
      now: 10_000,
    })
    expect(v.action).toBe('bot')
  })

  it('flags a too-fast submit (< 3000ms) as bot', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: goodToken(0),
      email: 'a@b.com',
      existingEmails: [],
      now: 2000,
    })
    expect(v.action).toBe('bot')
  })

  it('flags a duplicate email for the slot (case-insensitive)', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: goodToken(0),
      email: '  Jane@Example.com ',
      existingEmails: ['jane@example.com'],
      now: 10_000,
    })
    expect(v.action).toBe('duplicate')
  })

  it('returns ok for a human-paced, unique, honeypot-empty submit', () => {
    const v = evaluateSignupGuards({
      honeypot: '',
      formToken: goodToken(0),
      email: 'new@person.com',
      existingEmails: ['someone@else.com'],
      now: 10_000,
    })
    expect(v.action).toBe('ok')
  })

  it('does not treat an empty honeypot (undefined) as a bot', () => {
    const v = evaluateSignupGuards({
      formToken: goodToken(0),
      email: 'x@y.com',
      existingEmails: [],
      now: 10_000,
    })
    expect(v.action).toBe('ok')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot import from `./signupGuards`.

- [ ] **Step 3: Implement `lib/signupGuards.ts`**

```ts
import { verifyFormToken } from './formToken'

export const MIN_FILL_MS = 3000

export type SignupVerdict = { action: 'bot' } | { action: 'duplicate' } | { action: 'ok' }

export function evaluateSignupGuards(input: {
  honeypot?: unknown
  formToken?: unknown
  email: string
  existingEmails: string[]
  now?: number
}): SignupVerdict {
  const now = input.now ?? Date.now()

  // Layer 1: honeypot — real users never fill this hidden field.
  if (typeof input.honeypot === 'string' && input.honeypot.trim() !== '') {
    return { action: 'bot' }
  }

  // Layer 2: signed timing token — invalid signature or submitted impossibly fast.
  const token = typeof input.formToken === 'string' ? input.formToken : ''
  const { valid, elapsedMs } = verifyFormToken(token, now)
  if (!valid || elapsedMs === null || elapsedMs < MIN_FILL_MS) {
    return { action: 'bot' }
  }

  // Layer 3: duplicate email for this slot.
  const email = input.email.trim().toLowerCase()
  const existing = input.existingEmails.map(e => e.trim().toLowerCase())
  if (existing.includes(email)) {
    return { action: 'duplicate' }
  }

  return { action: 'ok' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all formToken + signupGuards tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/signupGuards.ts lib/signupGuards.test.ts
git commit -m "Add evaluateSignupGuards: honeypot + timing + duplicate verdict"
```

---

### Task 3: Issue the token + render the honeypot in the signup page & form

**Files:**
- Modify: `app/events/[slug]/signup/[slotId]/page.tsx` (issue token, pass prop, add `noindex` metadata)
- Modify: `app/events/[slug]/signup/[slotId]/EventSignupForm.tsx` (honeypot field, submit new fields)

**Interfaces:**
- Consumes: `issueFormToken` from `@/lib/formToken` (Task 1).
- Produces: `EventSignupForm` gains a required `formToken: string` prop; POST body to `/api/signup` gains `company_website` (honeypot) and `form_token`.

- [ ] **Step 1: Issue the token and add `noindex` in the signup page**

In `app/events/[slug]/signup/[slotId]/page.tsx`, add the import near the other `@/lib` imports:
```ts
import { issueFormToken } from '@/lib/formToken'
```

Add exported metadata near the top of the file (after imports, before the component):
```ts
export const metadata = {
  robots: { index: false, follow: false },
}
```

Just before the `return (` in the component, issue the token:
```ts
  const formToken = issueFormToken()
```

Pass it to the form — change the existing `<EventSignupForm ... />` usage to include:
```tsx
        <EventSignupForm
          slotId={slotId}
          eventSlug={slug}
          eventName={event.name}
          roleAvailability={roleAvailability}
          formToken={formToken}
        />
```

- [ ] **Step 2: Add the `formToken` prop and honeypot to `EventSignupForm`**

In `app/events/[slug]/signup/[slotId]/EventSignupForm.tsx`, extend the props type and destructure — change the component signature to add `formToken`:
```tsx
export default function EventSignupForm({
  slotId,
  eventSlug,
  eventName,
  roleAvailability,
  formToken,
}: {
  slotId: string
  eventSlug: string
  eventName: string
  roleAvailability: {
    id: string
    name: string
    max_per_slot: number
    filled: number
    available: number
    full: boolean
  }[]
  formToken: string
}) {
```

Add `company_website: ''` to the initial `form` state object:
```tsx
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    reminder_preference: 'email',
    sms_consent: false,
    company_website: '',
  })
```

Include the honeypot value and token in the POST body — change the `fetch` body:
```tsx
      body: JSON.stringify({ ...form, slot_id: slotId, form_token: formToken }),
```
(`company_website` is already part of `...form`.)

Add the hidden honeypot input as the **first** child inside the `<form ...>` (before the grid of real fields):
```tsx
        {/* Honeypot: hidden from humans; bots that fill every field get flagged. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label>
            Company Website
            <input
              type="text"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              value={form.company_website}
              onChange={handleChange}
            />
          </label>
        </div>
```

- [ ] **Step 3: Build to verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`. No type errors about the new `formToken` prop.

- [ ] **Step 4: Manually verify the honeypot is invisible**

Run the dev server (`npm run dev`) and open a signup page for any slot. Confirm the "Company Website" field is not visible, is skipped when tabbing through fields, and a normal signup still submits. (Another dev server may already be running in this folder; use its URL or start one on a free port.)

- [ ] **Step 5: Commit**

```bash
git add "app/events/[slug]/signup/[slotId]/page.tsx" "app/events/[slug]/signup/[slotId]/EventSignupForm.tsx"
git commit -m "Issue timing token + render honeypot on signup form; noindex signup page"
```

---

### Task 4: Enforce the guards in `POST /api/signup`

**Files:**
- Modify: `app/api/signup/route.ts`

**Interfaces:**
- Consumes: `evaluateSignupGuards` from `@/lib/signupGuards` (Task 2); the existing `admin` service-role client and `existingSignups` fetch.

- [ ] **Step 1: Import the guard**

Add near the other imports in `app/api/signup/route.ts`:
```ts
import { evaluateSignupGuards } from '@/lib/signupGuards'
```

- [ ] **Step 2: Destructure the new body fields**

Change the body destructure line to also read the honeypot + token:
```ts
  const { slot_id, first_name, last_name, email, phone, role, reminder_preference, sms_consent, company_website, form_token } = body
```

- [ ] **Step 3: Include email in the existing-signups fetch**

The capacity read currently selects `id, role`. Change it to also select `email` (used for the duplicate check):
```ts
  // Get current signups for capacity check (service-role: anon can't read signups)
  const { data: existingSignups } = await admin
    .from('signups')
    .select('id, role, email')
    .eq('slot_id', slot_id)
    .eq('cancelled', false)
```

- [ ] **Step 4: Run the guards before the capacity check**

Immediately **after** the `existingSignups` fetch and **before** the `const roleConfig = roles?.find(...)` line, insert:
```ts
  // Invisible bot protection: honeypot, signed timing token, duplicate email.
  const verdict = evaluateSignupGuards({
    honeypot: company_website,
    formToken: form_token,
    email,
    existingEmails: (existingSignups || []).map(s => s.email).filter(Boolean) as string[],
  })

  if (verdict.action === 'bot') {
    // Fake success: bot believes it won, but we insert nothing and send nothing.
    console.warn('Signup rejected by bot guard for slot', slot_id)
    return NextResponse.json({ success: true })
  }

  if (verdict.action === 'duplicate') {
    return NextResponse.json(
      { error: "You're already signed up for this shift!" },
      { status: 400 }
    )
  }
```

- [ ] **Step 5: Build to verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 6: Verify behavior against a running server (script)**

Start the dev server. Create `scripts/_tmp_bot_test.mjs` (temporary — delete after) that POSTs to `http://localhost:3000/api/signup` for a real active slot id and asserts row counts via the service-role REST API:

```js
import { issueFormToken } from '../lib/formToken.ts'
const base = 'http://localhost:3000'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY
const SLOT = process.argv[2]          // pass a real active slot id
const ROLE = process.argv[3]          // a valid role name for that slot's event

const count = async (email) => {
  const r = await fetch(`${url}/rest/v1/signups?slot_id=eq.${SLOT}&email=eq.${encodeURIComponent(email)}&select=id`,
    { headers: { apikey: svc, Authorization: `Bearer ${svc}` } })
  return (await r.json()).length
}
const post = (body) => fetch(`${base}/api/signup`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(async r => ({ status: r.status, body: await r.json() }))

// 1) honeypot filled -> fake success, no row
let e = `bot-hp-${Date.now()}@example.com`
console.log('honeypot:', await post({ slot_id: SLOT, first_name: 'B', last_name: 'B', email: e, role: ROLE, company_website: 'x', form_token: issueFormToken(Date.now() - 5000) }), 'rows=', await count(e))

// 2) too-fast (token issued 'now') -> fake success, no row
e = `bot-fast-${Date.now()}@example.com`
console.log('too-fast:', await post({ slot_id: SLOT, first_name: 'B', last_name: 'B', email: e, role: ROLE, form_token: issueFormToken() }), 'rows=', await count(e))

// 3) human-paced, unique -> success, 1 row
e = `human-${Date.now()}@example.com`
console.log('human:', await post({ slot_id: SLOT, first_name: 'H', last_name: 'H', email: e, role: ROLE, reminder_preference: 'email', form_token: issueFormToken(Date.now() - 5000) }), 'rows=', await count(e))

// 4) duplicate of #3 -> 400
console.log('duplicate:', await post({ slot_id: SLOT, first_name: 'H', last_name: 'H', email: e, role: ROLE, reminder_preference: 'email', form_token: issueFormToken(Date.now() - 5000) }))
```

Run: `node --env-file=.env.local scripts/_tmp_bot_test.mjs <SLOT_ID> <ROLE_NAME>`
Expected: honeypot → `status 200 {success:true} rows=0`; too-fast → `200 {success:true} rows=0`; human → `200 {success:true} rows=1`; duplicate → `400 {error:"You're already signed up for this shift!"}`.

Then clean up the test row and the script:
```bash
node --env-file=.env.local -e "import('pg').then(async ({default:{Client}})=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query(\"delete from signups where email like 'human-%@example.com' or email like 'bot-%@example.com'\");console.log('cleaned',r.rowCount);await c.end()})"
rm -f scripts/_tmp_bot_test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add app/api/signup/route.ts
git commit -m "Enforce bot guards in /api/signup: honeypot, timing, duplicate"
```

---

### Task 5: `noindex` on the public event schedule page

**Files:**
- Modify: `app/events/[slug]/page.tsx`

- [ ] **Step 1: Add `noindex` metadata**

In `app/events/[slug]/page.tsx`, add after the imports and before the component:
```ts
export const metadata = {
  robots: { index: false, follow: false },
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add "app/events/[slug]/page.tsx"
git commit -m "noindex the public event schedule page"
```

---

## Notes for the implementer

- The signup page and event page are Server Components that already read the DB per request, so they render dynamically — the freshly-issued `formToken` is never statically cached.
- `SUPABASE_SERVICE_ROLE_KEY` is present in `.env.local` (local) and Netlify env (prod); both the signup page (Server Component) and the API route run server-side, so both can read it.
- The `/confirm` redirect on the client fires on `res.ok`, so a bot that receives the fake `200` silently lands on `/confirm` — intended, harmless.
- Do NOT log the honeypot value or PII; the `console.warn` logs only the slot id.
