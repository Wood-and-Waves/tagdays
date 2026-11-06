import { describe, it, expect } from 'vitest'
import { summarizeOpenings, SpotSlot } from './openSpots'
import { EventRole } from './types'

const role = (id: string, name: string, max: number): EventRole =>
  ({ id, event_id: 'e', name, max_per_slot: max, sort_order: 0, created_at: '' } as EventRole)

const ROLES = [role('r1', 'Student', 2), role('r2', 'Parent/Adult', 2)]
const slot = (signups: SpotSlot['signups'] = [], role_capacities: SpotSlot['role_capacities'] = null): SpotSlot =>
  ({ signups, role_capacities })

describe('summarizeOpenings', () => {
  // The real event: two shifts, two roles, two people each, nobody signed up.
  it('counts a spot per person per role per shift', () => {
    expect(summarizeOpenings([slot(), slot()], ROLES))
      .toEqual({ shifts: 2, open: 8, capacity: 8 })
  })

  it('takes signed-up people off the count', () => {
    const slots = [slot([{ role: 'Student', cancelled: false }, { role: 'Parent/Adult', cancelled: false }]), slot()]
    expect(summarizeOpenings(slots, ROLES)).toEqual({ shifts: 2, open: 6, capacity: 8 })
  })

  // Cancelling is how somebody gives a spot back.
  it('does not let a cancelled signup hold a spot', () => {
    const slots = [slot([{ role: 'Student', cancelled: true }])]
    expect(summarizeOpenings(slots, ROLES)).toEqual({ shifts: 1, open: 4, capacity: 4 })
  })

  it('reaches zero when every spot is taken', () => {
    const full = slot([
      { role: 'Student', cancelled: false }, { role: 'Student', cancelled: false },
      { role: 'Parent/Adult', cancelled: false }, { role: 'Parent/Adult', cancelled: false },
    ])
    expect(summarizeOpenings([full], ROLES)).toEqual({ shifts: 1, open: 0, capacity: 4 })
  })

  // A surplus on one role must not paper over a shortage on another: three
  // students on a two-student shift still leaves both adult spots open.
  it('clamps an over-filled role instead of lending its surplus', () => {
    const over = slot([
      { role: 'Student', cancelled: false }, { role: 'Student', cancelled: false },
      { role: 'Student', cancelled: false },
    ])
    expect(summarizeOpenings([over], ROLES)).toEqual({ shifts: 1, open: 2, capacity: 4 })
  })

  it('respects a per-slot capacity override', () => {
    const boosted = slot([], [{ id: 'c', slot_id: 's', event_role_id: 'r1', max_per_slot: 5 }] as SlotRoleCapacity[])
    expect(summarizeOpenings([boosted], ROLES)).toEqual({ shifts: 1, open: 7, capacity: 7 })
  })

  it('ignores a signup whose role no longer exists', () => {
    const stale = slot([{ role: 'Deleted Role', cancelled: false }])
    expect(summarizeOpenings([stale], ROLES)).toEqual({ shifts: 1, open: 4, capacity: 4 })
  })

  it('reports nothing built yet rather than guessing', () => {
    expect(summarizeOpenings([], ROLES)).toEqual({ shifts: 0, open: 0, capacity: 0 })
    expect(summarizeOpenings(null, ROLES)).toEqual({ shifts: 0, open: 0, capacity: 0 })
    expect(summarizeOpenings([slot()], [])).toEqual({ shifts: 1, open: 0, capacity: 0 })
    expect(summarizeOpenings([slot()], null)).toEqual({ shifts: 1, open: 0, capacity: 0 })
  })
})
