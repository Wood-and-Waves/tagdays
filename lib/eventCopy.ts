/**
 * Copying an event means moving it to a new date.
 *
 * In this app an event essentially IS a date: the name carries it, the event
 * carries start and end, and every slot hangs off a specific day. So a copy is
 * never "another one like this" — it is "we are doing this again on the 12th",
 * and everything else shifts by the difference.
 *
 * Dates are plain "YYYY-MM-DD" strings, which is what a Postgres `date` column
 * gives back through PostgREST. Every calculation here goes through Date.UTC
 * and never a local Date: a local one shifts by an hour across a daylight
 * saving boundary, and adding 22 days to a November date in a US timezone is
 * exactly the arithmetic that lands on the wrong day.
 */

const MS_PER_DAY = 86_400_000

/** "YYYY-MM-DD" to a UTC timestamp, or null if it isn't a date. */
function toUtc(date: string | null | undefined): number | null {
  if (typeof date !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const stamp = Date.UTC(year, month - 1, day)
  // Date.UTC rolls 2026-02-30 forward to March rather than refusing, so the
  // round trip is what actually rejects a date that does not exist.
  const back = new Date(stamp)
  if (back.getUTCMonth() !== month - 1 || back.getUTCDate() !== day) return null
  return stamp
}

function fromUtc(stamp: number): string {
  const d = new Date(stamp)
  return [
    String(d.getUTCFullYear()).padStart(4, '0'),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

/** Whole days from `from` to `to`; negative when `to` is earlier. Null on bad input. */
export function daysBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  const a = toUtc(from)
  const b = toUtc(to)
  if (a === null || b === null) return null
  return Math.round((b - a) / MS_PER_DAY)
}

/** `date` moved by `days`. Null on bad input. */
export function shiftDate(date: string | null | undefined, days: number): string | null {
  const stamp = toUtc(date)
  if (stamp === null || !Number.isFinite(days)) return null
  return fromUtc(stamp + Math.round(days) * MS_PER_DAY)
}

/**
 * The same name with its date moved: "Concessions 11/20" to the 12th of
 * December becomes "Concessions 12/12".
 *
 * Only an M/D (optionally with a year) is recognised, because that is how
 * these events are named. A name with no date in it comes back untouched —
 * there is nothing sensible to substitute, and inventing a suffix would be
 * worse than leaving it for somebody to edit. The original's own shape is
 * kept, so a padded "01/05" stays padded and a two-digit year stays two.
 */
export function renameForDate(name: string, newDate: string | null | undefined): string {
  const stamp = toUtc(newDate)
  if (stamp === null || typeof name !== 'string') return name

  const target = new Date(stamp)
  const month = target.getUTCMonth() + 1
  const day = target.getUTCDate()
  const year = target.getUTCFullYear()

  let replaced = false
  return name.replace(
    // \d{4} before \d{2}: alternation is first-match-wins, so the two-digit
    // branch would eat "20" of "2026" and leave "26" stranded after the
    // replacement — "11/20/2026" became "01/04/2726".
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?/,
    (whole, oldMonth: string, oldDay: string, oldYear: string | undefined) => {
      // Only the first date in a name is moved. A second one would be a range,
      // and guessing how to move half of it is worse than leaving it alone.
      if (replaced) return whole
      replaced = true
      // Padded only when the original was genuinely padded — a LEADING ZERO,
      // not merely two digits. "11/20" is two digits because November is the
      // eleventh month, which says nothing about how this person writes June;
      // reading it as a padding style turned 6/15 into 06/15.
      const pad = (value: number, sample: string) =>
        sample.startsWith('0') ? String(value).padStart(2, '0') : String(value)
      const head = `${pad(month, oldMonth)}/${pad(day, oldDay)}`
      if (oldYear === undefined) return head
      return `${head}/${oldYear.length === 2 ? String(year).slice(-2) : String(year)}`
    },
  )
}

/** The same slug rule the create form uses, so a copy and a hand-made event agree. */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
