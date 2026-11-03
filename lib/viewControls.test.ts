import { describe, it, expect } from 'vitest'
import { viewControls } from './viewControls'

const slot = (date: string, location_id: string | null = 'hhs') => ({ date, location_id })

describe('viewControls', () => {
  // A concession night: two shifts, one stand, one evening.
  it('hides both on a single-day single-location event', () => {
    expect(viewControls([slot('2026-11-20'), slot('2026-11-20')]))
      .toEqual({ showSort: false, showDays: false })
  })

  // The one that must not break: Tag Days, several days and several corners.
  it('shows both on a multi-day multi-location event', () => {
    expect(viewControls([
      slot('2026-09-05', 'corner-a'),
      slot('2026-09-05', 'corner-b'),
      slot('2026-09-06', 'corner-a'),
    ])).toEqual({ showSort: true, showDays: true })
  })

  it('shows only the day filter when one location runs several days', () => {
    expect(viewControls([slot('2026-11-20'), slot('2026-11-21')]))
      .toEqual({ showSort: false, showDays: true })
  })

  it('shows only the sort when several locations run on one day', () => {
    expect(viewControls([slot('2026-11-20', 'a'), slot('2026-11-20', 'b')]))
      .toEqual({ showSort: true, showDays: false })
  })

  it('treats slots with no location as one group, not as many', () => {
    expect(viewControls([slot('2026-11-20', null), slot('2026-11-20', null)]).showSort).toBe(false)
    // A missing location and a real one are still two groups worth sorting.
    expect(viewControls([slot('2026-11-20', null), slot('2026-11-20', 'a')]).showSort).toBe(true)
  })

  it('shows nothing for no slots at all', () => {
    expect(viewControls([])).toEqual({ showSort: false, showDays: false })
  })
})
