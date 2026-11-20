/**
 * When an event is over, in the band's own timezone.
 *
 * The public events list used to show every ACTIVE event regardless of date,
 * so a concession night stayed at the top of the page — advertising its open
 * spots — until somebody remembered to deactivate it by hand. With a night
 * every couple of weeks that is a chore nobody will keep up.
 */

/** Huntley, Illinois. Every "what day is it" in this app resolves here. */
export const EVENT_TIMEZONE = 'America/Chicago'

/**
 * Today's date where the band is, as "YYYY-MM-DD".
 *
 * NEVER the server's clock or UTC. Netlify runs in UTC, so from 6pm Central a
 * UTC date is already tomorrow — an event would vanish from the page on the
 * evening of the day it is being worked, which is the one evening people are
 * looking it up. 'en-CA' is the locale that formats as YYYY-MM-DD.
 */
export function todayInEventZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: EVENT_TIMEZONE }).format(now)
}

/** The last day an event runs: its end date, or its start when there is no end. */
function lastDay(event: { start_date?: string | null; end_date?: string | null }): string | null {
  const last = event.end_date || event.start_date
  // A date column comes back as "YYYY-MM-DD" through PostgREST but as a
  // timestamp through a direct pg client, so both are reduced to the date.
  return last ? String(last).slice(0, 10) : null
}

/**
 * Has this event finished? False on its own last day, true the day after.
 *
 * An event with NO dates never finishes — nothing about it says it is past,
 * and silently hiding it would look like the app had lost it.
 */
export function hasFinished(
  event: { start_date?: string | null; end_date?: string | null },
  today: string,
): boolean {
  const last = lastDay(event)
  return last === null ? false : last < today
}
