import { getEffectiveCapacity } from './capacity'
import { EventRole, SlotRoleCapacity } from './types'

/**
 * How many volunteer spots an event still has open.
 *
 * A "spot" is one person on one role on one shift, which is the unit somebody
 * browsing is actually counting: four shifts needing two adults and two
 * students each, with three people signed up, is thirteen spots open — not
 * four shifts and not two roles.
 *
 * Counted the same way the event page counts a single shift, through
 * getEffectiveCapacity, so a per-slot override is respected here too and the
 * card can never disagree with the schedule behind it.
 *
 * Cancelled signups do not hold a spot — that is the whole point of cancelling
 * — and an over-filled role is clamped at zero rather than lending its surplus
 * to another role, which would hide a shortage somewhere else.
 */
export type SpotSlot = {
  signups: { role: string | null; cancelled: boolean | null }[]
  role_capacities?: SlotRoleCapacity[] | null
}

export type EventOpenings = {
  /** Shifts on the schedule; zero means nothing has been built yet. */
  shifts: number
  /** Spots nobody has taken. */
  open: number
  /** Spots in total, taken or not. */
  capacity: number
}

export function summarizeOpenings(
  slots: SpotSlot[] | null | undefined,
  roles: EventRole[] | null | undefined,
): EventOpenings {
  const list = slots || []
  const roleList = roles || []

  let open = 0
  let capacity = 0

  for (const slot of list) {
    const active = (slot.signups || []).filter(s => !s.cancelled)
    for (const role of roleList) {
      const max = getEffectiveCapacity(role, slot.role_capacities)
      const taken = active.filter(s => s.role === role.name).length
      capacity += max
      open += Math.max(0, max - taken)
    }
  }

  return { shifts: list.length, open, capacity }
}
