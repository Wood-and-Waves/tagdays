# Signup Bot Protection — Design

**Date:** 2026-07-24
**Status:** Approved (design)
**Author:** Dan + Claude

## Problem

The public volunteer signup form (`/events/[slug]/signup/[slotId]` → `POST /api/signup`)
has no bot protection. This is **preventative** — no abuse has been observed yet.
The stakes are higher than junk rows: each accepted signup can fire a Resend
confirmation email **and** a Twilio SMS, so automated spam means real cost and
risk to the A2P sender reputation.

## Goals

- Stop the overwhelming majority of drive-by / automated form bots.
- **Never block a real volunteer** — every measure must have near-zero false positives.
- Zero added friction (no visible CAPTCHA, no puzzles).
- Zero new external dependencies and zero new required env vars (self-contained).

## Non-Goals (deferred, YAGNI)

- IP-based rate limiting (needs storing IPs / a table). Add later if abuse appears.
- Cloudflare Turnstile / any third-party CAPTCHA. Add later if the self-contained
  layers prove insufficient.

## Approach — three invisible layers + one bonus

### Layer 1: Honeypot field
A decoy text input the server expects to stay empty. Hidden from humans via CSS
(`position:absolute; left:-9999px` / visually hidden), plus `tabindex={-1}`,
`autoComplete="off"`, and `aria-hidden="true"` so assistive tech skips it. Real
users never fill it; naive bots that fill every field do. Non-empty on submit ⇒
treat as bot.

- Field name: `company_website` (plausible-looking so bots target it, unrelated
  to any real field).

### Layer 2: Signed timing token (server-side, spoof-proof)
The signup page (a Server Component) issues a token when it renders:

```
token = base64url(issuedAtMs) + "." + hmacSHA256(base64url(issuedAtMs), SECRET)
```

- **SECRET**: reuse an existing server-only env var (`SUPABASE_SERVICE_ROLE_KEY`)
  as the HMAC key. Never exposed to the browser; no new env var required.
- The token is passed to `EventSignupForm` and submitted back with the form.
- On submit, `/api/signup` verifies the HMAC, then computes
  `elapsed = Date.now() - issuedAtMs` using **its own clock** (no client clock
  involved, so nothing to spoof by adjusting a device time).
- Reject if the signature is invalid/missing **or** `elapsed < 3000ms`
  (humanly impossible to complete the form that fast).
- **Only the lower bound is enforced — no expiry.** A volunteer who leaves the
  tab open for hours is never punished (avoids false positives).

### Layer 3: Duplicate guard
Reject a second signup for the **same slot + same email** (case-insensitive).
Primarily a UX / data-hygiene win; also blunts repeat spam. Returns a real,
friendly message (see below).

### Bonus: `noindex` on public signup/event pages
Add `robots: { index: false, follow: false }` metadata to the event schedule
page and the per-slot signup page so search engines / scrapers don't index the
per-slot pages (which display volunteer first-name + last-initial). Free, and
covers the "crawlers" half of the request.

## Server response strategy (the key to zero friction)

| Condition | Response | Insert? | Email/SMS? |
|-----------|----------|---------|------------|
| Honeypot non-empty | fake `200 { success: true }` | no | no |
| Token invalid/missing | fake `200 { success: true }` | no | no |
| `elapsed < 3000ms` | fake `200 { success: true }` | no | no |
| Duplicate (slot+email) | `400 { error: "You're already signed up for this shift!" }` | no | no |
| Otherwise | normal signup flow | yes | yes |

Bot cases return a **fake success** so bots believe they succeeded and don't
adapt, and no email/SMS cost is incurred. The client already redirects to
`/confirm` on `res.ok`, so a bot silently lands on the confirm page — fine.

## Components

- **`lib/formToken.ts`** (new, pure/unit-tested)
  - `issueFormToken(now?: number): string`
  - `verifyFormToken(token: string, now?: number): { valid: boolean; elapsedMs: number | null }`
  - Uses `node:crypto` `createHmac('sha256', SECRET)` with constant-time compare
    (`crypto.timingSafeEqual`).
- **`app/events/[slug]/signup/[slotId]/page.tsx`** — call `issueFormToken()` and
  pass `formToken` to `EventSignupForm`; add `noindex` metadata.
- **`app/events/[slug]/signup/[slotId]/EventSignupForm.tsx`** — render the hidden
  honeypot input; include `company_website` and `form_token` in the POST body.
- **`app/events/[slug]/page.tsx`** — add `noindex` metadata.
- **`app/api/signup/route.ts`** — before the existing capacity/insert logic:
  1. honeypot check → fake success
  2. `verifyFormToken` + `elapsed < 3000` → fake success
  3. duplicate slot+email check → friendly 400
  Then continue to the existing (already-hardened) capacity + insert + notify flow.

## Data flow

1. Volunteer opens the signup page → server issues `formToken`, renders form
   (with hidden honeypot).
2. Volunteer fills and submits → client POSTs `{ ...form, slot_id, company_website,
   form_token }`.
3. API runs the three bot checks, then the normal capacity/insert/notify path.

No schema changes. No new env vars.

## Error handling & edge cases

- **Missing token** (e.g. direct POST not via the page): treated as invalid ⇒ fake
  success. Real users always get a token from the page, so no legitimate flow lacks one.
- **JS-disabled users**: the form is already a client component requiring JS to
  submit (`onSubmit` + `fetch`), so bot protection adds no new hard dependency.
- **Idle tab**: no upper time bound, so an old-but-valid token still works.
- **Honeypot + screen readers**: `aria-hidden` + `tabindex=-1` keep it out of the
  accessibility tree and tab order.

## Testing

- **Unit (`lib/formToken.ts`)**: issue→verify round-trip; tampered signature fails;
  wrong-length/garbage token fails; elapsed computed correctly for a known
  `issuedAt`; too-fast (`elapsed < 3000`) flagged.
- **Route-level verification** (via a node script against the running route or a
  direct handler call): honeypot-filled ⇒ 200 but no row inserted; too-fast token
  ⇒ 200 but no row; duplicate email+slot ⇒ 400; valid human-paced submit ⇒ row
  inserted + notifications attempted. Confirm no signup rows persist from the bot
  cases (use a rolled-back / cleaned-up test as with the capacity trigger test).
- **Manual**: real signup still works end-to-end; honeypot stays invisible.

## Rollout

Single implementation plan. No migration. Ships in one commit + Netlify auto-deploy.
