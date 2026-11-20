import { describe, it, expect } from 'vitest'
import { todayInEventZone, hasFinished, EVENT_TIMEZONE } from './eventDates'

const on = (date: string) => ({ start_date: date, end_date: date })

describe('todayInEventZone', () => {
  it('reads the date where the band is, not where the server is', () => {
    // 10pm Central on the 20th is already the 21st in UTC. Netlify runs in
    // UTC, so this is the hour an event would wrongly vanish from the page.
    expect(todayInEventZone(new Date('2026-11-21T04:00:00Z'))).toBe('2026-11-20')
    // 6am UTC on the 21st is midnight Central — the day has just turned.
    expect(todayInEventZone(new Date('2026-11-21T06:00:00Z'))).toBe('2026-11-21')
  })

  it('holds across the daylight saving change', () => {
    // CDT (UTC-5) in July: 4am UTC is still the previous evening.
    expect(todayInEventZone(new Date('2026-07-21T04:00:00Z'))).toBe('2026-07-20')
    // CST (UTC-6) in January: the same clock time is still the 20th too,
    // but the boundary has moved an hour, which a fixed offset would miss.
    expect(todayInEventZone(new Date('2026-01-21T05:30:00Z'))).toBe('2026-01-20')
    expect(todayInEventZone(new Date('2026-01-21T06:30:00Z'))).toBe('2026-01-21')
  })

  it('is the timezone the reminders already use', () => {
    expect(EVENT_TIMEZONE).toBe('America/Chicago')
  })
})

describe('hasFinished', () => {
  // The rule Dan asked for: it drops off the DAY AFTER.
  it('keeps an event on its own day and drops it the next', () => {
    expect(hasFinished(on('2026-11-20'), '2026-11-20')).toBe(false)
    expect(hasFinished(on('2026-11-20'), '2026-11-21')).toBe(true)
  })

  it('keeps an event that has not happened yet', () => {
    expect(hasFinished(on('2026-12-12'), '2026-11-20')).toBe(false)
  })

  // Tag Days runs several days: it is over when the LAST one is.
  it('measures a multi-day run from its end date', () => {
    const run = { start_date: '2026-09-05', end_date: '2026-09-07' }
    expect(hasFinished(run, '2026-09-05')).toBe(false)
    expect(hasFinished(run, '2026-09-07')).toBe(false)
    expect(hasFinished(run, '2026-09-08')).toBe(true)
  })

  it('falls back to the start date when there is no end', () => {
    expect(hasFinished({ start_date: '2026-11-20', end_date: null }, '2026-11-20')).toBe(false)
    expect(hasFinished({ start_date: '2026-11-20', end_date: null }, '2026-11-21')).toBe(true)
  })

  // Hiding a dateless event would look like the app had lost it.
  it('never finishes an event with no dates at all', () => {
    expect(hasFinished({ start_date: null, end_date: null }, '2026-11-21')).toBe(false)
    expect(hasFinished({}, '2026-11-21')).toBe(false)
  })

  it('reads a date that arrives as a timestamp', () => {
    expect(hasFinished({ start_date: '2026-11-20T06:00:00.000Z' }, '2026-11-20')).toBe(false)
    expect(hasFinished({ start_date: '2026-11-20T06:00:00.000Z' }, '2026-11-21')).toBe(true)
  })

  it('crosses a year end', () => {
    expect(hasFinished(on('2026-12-31'), '2027-01-01')).toBe(true)
    expect(hasFinished(on('2027-01-01'), '2026-12-31')).toBe(false)
  })
})
