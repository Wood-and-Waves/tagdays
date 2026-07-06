import { EventRole, SlotRoleCapacity } from './types'

/**
 * Returns the effective max capacity for a role on a specific slot.
 * If a slot-level override exists for this role, it wins.
 * Otherwise, falls back to the event role's default max_per_slot.
 */
export function getEffectiveCapacity(
  role: EventRole,
  roleCapacities: SlotRoleCapacity[] | null | undefined
): number {
  const override = roleCapacities?.find(rc => rc.event_role_id === role.id)
  return override ? override.max_per_slot : role.max_per_slot
}
