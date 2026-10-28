/**
 * Shift times — the ONE place slots are generated from a time range.
 *
 * There used to be four copies of this loop (the bulk API, the admin preview,
 * the CSV import and its preview) and they had already drifted apart: the
 * server kept the start's minutes while the preview and the import forced
 * ":00". That was invisible while every time was on the hour, and would have
 * shown the admin one set of shifts and created another the moment a quarter
 * past existed. Everything calls generateSlotTimes() now.
 *
 * Times are plain "HH:MM" strings, matching the Postgres `time` columns.
 */

/** The grid admin-facing times snap to. */
export const SHIFT_STEP_MINUTES = 15

/** What a shift is when nobody says otherwise — the old hardcoded 2 hours. */
export const DEFAULT_SHIFT_MINUTES = 120

/** The earliest and latest times the pickers offer. */
export const DAY_START_HOUR = 6
export const DAY_END_HOUR = 20

export type SlotTime = { start: string; end: string }

/**
 * Minutes since midnight, or null if this isn't a time.
 *
 * Accepts "8:00", "08:00" and "08:00:00" — Postgres returns the last, and a
 * spreadsheet exports the first. The old code compared these as STRINGS, so
 * "8:00" < "18:00" was false and an import starting at 8am silently produced
 * nothing at all.
 */
export function toMinutes(value: string | null | undefined): number | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Minutes since midnight back to "HH:MM". */
export function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** "08:00:00" or "8:00" to "08:00". Null when it isn't a time. */
export function normalizeTime(value: string | null | undefined): string | null {
  const minutes = toMinutes(value)
  return minutes === null ? null : fromMinutes(minutes)
}

/**
 * Back-to-back shifts of `shiftMinutes` filling [startTime, endTime].
 *
 * Each shift starts where the last ended, so there is never a gap (nobody at
 * the stand) or an overlap (two crews at once). A tail too short for a whole
 * shift is dropped rather than created short — which is what the old loop did,
 * and what the admin preview showed.
 */
export function generateSlotTimes(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  shiftMinutes: number = DEFAULT_SHIFT_MINUTES,
): SlotTime[] {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)

  if (start === null || end === null) return []
  if (!Number.isFinite(shiftMinutes) || shiftMinutes <= 0) return []
  if (end <= start) return []

  const slots: SlotTime[] = []
  for (let cursor = start; cursor + shiftMinutes <= end; cursor += shiftMinutes) {
    slots.push({ start: fromMinutes(cursor), end: fromMinutes(cursor + shiftMinutes) })
  }
  return slots
}

/** Every time on the grid between DAY_START_HOUR and DAY_END_HOUR, for the pickers. */
export function timeOptions(
  startHour: number = DAY_START_HOUR,
  endHour: number = DAY_END_HOUR,
  stepMinutes: number = SHIFT_STEP_MINUTES,
): string[] {
  const options: string[] = []
  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += stepMinutes) {
    options.push(fromMinutes(minutes))
  }
  return options
}

/** "45 min", "1 hr", "1 hr 30 min" — for the shift-length picker. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} hr`
  return `${hours} hr ${rest} min`
}

/** The shift lengths offered, in minutes. */
export const SHIFT_LENGTH_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240]
