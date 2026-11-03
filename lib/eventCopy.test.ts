import { describe, it, expect } from 'vitest'
import { daysBetween, shiftDate, renameForDate, slugify } from './eventCopy'

describe('daysBetween / shiftDate', () => {
  it('measures and moves the real case', () => {
    expect(daysBetween('2026-11-20', '2026-12-12')).toBe(22)
    expect(shiftDate('2026-11-20', 22)).toBe('2026-12-12')
  })

  it('round-trips in both directions', () => {
    const gap = daysBetween('2026-12-12', '2026-11-20')
    expect(gap).toBe(-22)
    expect(shiftDate('2026-12-12', gap!)).toBe('2026-11-20')
  })

  // The whole reason these go through Date.UTC: US daylight saving ends on
  // 2026-11-01, so a local-time calculation spanning it gains an hour and can
  // land a day early.
  it('crosses the daylight saving boundary without losing a day', () => {
    expect(daysBetween('2026-10-25', '2026-11-08')).toBe(14)
    expect(shiftDate('2026-10-25', 14)).toBe('2026-11-08')
    expect(shiftDate('2026-03-01', 14)).toBe('2026-03-15')
  })

  it('crosses months, years and a leap day', () => {
    expect(shiftDate('2026-12-28', 7)).toBe('2027-01-04')
    expect(daysBetween('2026-12-28', '2027-01-04')).toBe(7)
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftDate('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('refuses what is not a date rather than inventing one', () => {
    for (const bad of ['', 'tomorrow', '2026-13-01', '2026-02-30', '11/20/2026', null, undefined]) {
      expect(daysBetween(bad, '2026-12-12')).toBeNull()
      expect(shiftDate(bad, 3)).toBeNull()
    }
  })
})

describe('renameForDate', () => {
  it('moves the date in the name, which is how these are named', () => {
    expect(renameForDate('Concessions 11/20', '2026-12-12')).toBe('Concessions 12/12')
  })

  // A LEADING ZERO is the only evidence that somebody pads. "11/20" is two
  // digits because November is the eleventh month, which says nothing about
  // how they would write June — reading it as a style gave "06/15".
  it('pads only when the original was genuinely padded', () => {
    expect(renameForDate('Concessions 01/05', '2026-06-15')).toBe('Concessions 06/15')
    expect(renameForDate('Concessions 1/5', '2026-06-15')).toBe('Concessions 6/15')
    expect(renameForDate('Concessions 11/20', '2027-06-15')).toBe('Concessions 6/15')
    expect(renameForDate('Concessions 11/20', '2026-12-12')).toBe('Concessions 12/12')
  })

  it('keeps the year shape it found', () => {
    expect(renameForDate('Concessions 11/20/26', '2027-01-04')).toBe('Concessions 1/4/27')
    expect(renameForDate('Concessions 11/20/2026', '2027-01-04')).toBe('Concessions 1/4/2027')
  })

  // Leaving it alone beats inventing something: a name with no date is edited
  // by hand, which is one field, where a wrong guess is a wrong event name.
  it('leaves a name with no date in it untouched', () => {
    expect(renameForDate('Tag Days 2026', '2026-12-12')).toBe('Tag Days 2026')
    expect(renameForDate('Fall Festival', '2026-12-12')).toBe('Fall Festival')
  })

  it('moves only the first date, so a range is not half-moved', () => {
    expect(renameForDate('Tag Days 9/5 - 9/7', '2026-10-03')).toBe('Tag Days 10/3 - 9/7')
  })

  it('gives the name back unchanged when the new date is not a date', () => {
    expect(renameForDate('Concessions 11/20', 'soon')).toBe('Concessions 11/20')
    expect(renameForDate('Concessions 11/20', null)).toBe('Concessions 11/20')
  })
})

describe('slugify', () => {
  it('matches what the create form produces', () => {
    expect(slugify('Concessions 12/12')).toBe('concessions-12-12')
    expect(slugify('Tag Days 2026')).toBe('tag-days-2026')
    expect(slugify('  Spring! Concert  ')).toBe('spring-concert')
  })
})
