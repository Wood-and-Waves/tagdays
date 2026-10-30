/**
 * Where this app lives.
 *
 * Anything that PRINTS the address — the shareable event link an admin copies,
 * the SMS consent record a carrier reads — takes it from here rather than
 * typing the domain in, so moving to another one is a single environment
 * variable instead of a hunt through the pages for a hostname somebody
 * hardcoded. Three of them had already gone stale once.
 *
 * NEXT_PUBLIC_ because the Events page that shows the link is a client
 * component, so the value has to be inlined into the browser bundle too.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** Just the hostname, for the places that show the address rather than link to it. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
