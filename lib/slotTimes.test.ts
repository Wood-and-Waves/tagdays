import { describe, it, expect } from 'vitest'
import {
  toMinutes,
  fromMinutes,
  normalizeTime,
  generateSlotTimes,
  hourOptions,
  minuteOptions,
  formatHour,
  formatDuration,
  DEFAULT_SHIFT_MINUTES,
} from './slotTimes'

describe('toMinutes', () => {
  it('reads the three shapes a time arrives in', () => {
    expect(toMinutes('08:00')).toBe(480)      // a picker value
    expect(toMinutes('8:00')).toBe(480)       // a spreadsheet export
    expect(toMinutes('08:00:00')).toBe(480)   // what Postgres returns
  })

  it('keeps the minutes', () => {
    expect(toMinutes('11:15')).toBe(675)
    expect(toMinutes('11:45')).toBe(705)
  })

  it('refuses anything that is not a time', () => {
    for (const bad of ['', 'noon', '8', '8am', '25:00', '08:60', null, undefined]) {
      expect(toMinutes(bad as string)).toBeNull()
    }
  })
})

describe('fromMinutes / normalizeTime', () => {
  it('pads both halves', () => {
    expect(fromMinutes(480)).toBe('08:00')
    expect(fromMinutes(675)).toBe('11:15')
    expect(fromMinutes(0)).toBe('00:00')
  })

  it('normalises to what the database column holds', () => {
    expect(normalizeTime('8:00')).toBe('08:00')
    expect(normalizeTime('17:30:00')).toBe('17:30')
    expect(normalizeTime('nonsense')).toBeNull()
  })
})

describe('generateSlotTimes', () => {
  it('reproduces the old two-hour behaviour exactly', () => {
    expect(generateSlotTimes('09:00', '13:00')).toEqual([
      { start: '09:00', end: '11:00' },
      { start: '11:00', end: '13:00' },
    ])
  })

  it('defaults to two hours when no length is given', () => {
    expect(generateSlotTimes('09:00', '11:00')).toEqual(
      generateSlotTimes('09:00', '11:00', DEFAULT_SHIFT_MINUTES),
    )
  })

  // The whole point of the change: a quarter-past start stays quarter-past all
  // the way down, instead of being rounded to the hour by the preview.
  it('carries a quarter-hour start through every shift', () => {
    expect(generateSlotTimes('11:15', '15:15')).toEqual([
      { start: '11:15', end: '13:15' },
      { start: '13:15', end: '15:15' },
    ])
  })

  it('makes shifts of any length, not just whole hours', () => {
    expect(generateSlotTimes('17:30', '20:30', 90)).toEqual([
      { start: '17:30', end: '19:00' },
      { start: '19:00', end: '20:30' },
    ])
    expect(generateSlotTimes('18:00', '19:00', 15)).toEqual([
      { start: '18:00', end: '18:15' },
      { start: '18:15', end: '18:30' },
      { start: '18:30', end: '18:45' },
      { start: '18:45', end: '19:00' },
    ])
  })

  it('leaves no gap between shifts', () => {
    const slots = generateSlotTimes('08:00', '17:00', 45)
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].start).toBe(slots[i - 1].end)
    }
  })

  // The whole range gets covered: a tail too short for a full shift is made
  // short rather than dropped, because the hours somebody typed are the hours
  // the stand needs somebody standing in it.
  it('shortens the last shift to reach the end time', () => {
    expect(generateSlotTimes('09:00', '14:00')).toEqual([
      { start: '09:00', end: '11:00' },
      { start: '11:00', end: '13:00' },
      { start: '13:00', end: '14:00' },
    ])
  })

  // Dan's case, in his numbers: ten to six in three-hour shifts.
  it('ends a three-hour run of 10-6 with a two-hour shift', () => {
    expect(generateSlotTimes('10:00', '18:00', 180)).toEqual([
      { start: '10:00', end: '13:00' },
      { start: '13:00', end: '16:00' },
      { start: '16:00', end: '18:00' },
    ])
  })

  it('still ends exactly on time when the shifts divide evenly', () => {
    const slots = generateSlotTimes('10:00', '18:00', 120)
    expect(slots).toHaveLength(4)
    expect(slots[slots.length - 1].end).toBe('18:00')
  })

  it('always finishes on the end time, whatever the shift length', () => {
    for (const minutes of [15, 45, 50, 90, 150, 180, 240]) {
      const slots = generateSlotTimes('10:00', '18:00', minutes)
      expect(slots.length).toBeGreaterThan(0)
      expect(slots[0].start).toBe('10:00')
      expect(slots[slots.length - 1].end).toBe('18:00')
    }
  })

  // This is the bug the string comparison caused: "8:00" < "18:00" is false,
  // so an import starting at 8am produced nothing and said nothing.
  it('handles an unpadded start against a padded end', () => {
    expect(generateSlotTimes('8:00', '18:00', 120)).toHaveLength(5)
  })

  it('returns nothing rather than looping forever on bad input', () => {
    expect(generateSlotTimes('13:00', '09:00')).toEqual([])      // end before start
    expect(generateSlotTimes('09:00', '09:00')).toEqual([])      // zero length
    expect(generateSlotTimes('09:00', '17:00', 0)).toEqual([])   // zero-minute shift
    expect(generateSlotTimes('09:00', '17:00', -60)).toEqual([]) // negative shift
    expect(generateSlotTimes('nonsense', '17:00')).toEqual([])
    expect(generateSlotTimes('09:00', null)).toEqual([])
  })

  // A shift longer than the range is not nothing — it is the range. Asking for
  // three-hour shifts across one hour means that hour wants covering.
  it('gives the whole range when one shift would overrun it', () => {
    expect(generateSlotTimes('09:00', '10:00', 120)).toEqual([
      { start: '09:00', end: '10:00' },
    ])
  })
})

describe('hourOptions', () => {
  it('runs from the start of the day to the end', () => {
    const hours = hourOptions()
    expect(hours[0]).toBe(6)
    expect(hours[hours.length - 1]).toBe(21)
    expect(hours).toHaveLength(16)
  })
})

describe('minuteOptions', () => {
  it('offers each quarter of the hour', () => {
    expect(minuteOptions()).toEqual([0, 15, 30, 45])
  })

  it('follows the step it is given', () => {
    expect(minuteOptions(30)).toEqual([0, 30])
  })
})

describe('formatHour', () => {
  it('reads the way somebody would say it', () => {
    expect(formatHour(6)).toBe('6 AM')
    expect(formatHour(11)).toBe('11 AM')
    expect(formatHour(12)).toBe('12 PM')
    expect(formatHour(13)).toBe('1 PM')
    expect(formatHour(21)).toBe('9 PM')
  })
})

describe('formatDuration', () => {
  it('reads the way somebody would say it', () => {
    expect(formatDuration(15)).toBe('15 min')
    expect(formatDuration(60)).toBe('1 hr')
    expect(formatDuration(90)).toBe('1 hr 30 min')
    expect(formatDuration(120)).toBe('2 hr')
    expect(formatDuration(240)).toBe('4 hr')
  })
})
