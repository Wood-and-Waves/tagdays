import type { SupabaseClient } from '@supabase/supabase-js'
import { daysBetween, shiftDate, renameForDate, slugify } from './eventCopy'

/**
 * Copy an event to a new date, rows and all.
 *
 * Everything dated moves by the same offset — the event's own start and end,
 * and every slot — so a three-day run keeps its shape and a single evening
 * keeps its two shifts. Roles and the per-slot capacity overrides come across;
 * signups never do, and neither does `earnings`, which is what the event made
 * afterwards and belongs to the day that earned it.
 *
 * The copy arrives INACTIVE. It is otherwise complete enough to be public the
 * instant it exists, and a volunteer page appearing because somebody pressed
 * Copy is a surprise; Activate is one click away on the row.
 *
 * There is no transaction to lean on — PostgREST writes one table at a time —
 * so every step after the event row is created deletes it again on failure.
 * The child tables cascade, so that one delete is the whole undo, and it is
 * what stops a half-copied event sitting in the list looking finished.
 *
 * This is a plain function rather than the body of the route so it can be run
 * against a real database without a browser session; the route is the auth
 * check and nothing else.
 */
export type CopyEventResult =
  | { ok: true; event: Record<string, unknown>; copied: { roles: number; slots: number } }
  | { ok: false; status: number; error: string }

export async function copyEvent(
  admin: SupabaseClient,
  input: { id?: unknown; newStartDate?: unknown; name?: unknown },
): Promise<CopyEventResult> {
  const id = input.id
  const new_start_date = input.newStartDate
  const givenName = input.name

  if (!id || typeof new_start_date !== 'string' || !new_start_date) {
    return { ok: false, status: 400, error: 'An event and a new date are required.' }
  }

  const { data: source } = await admin.from('events').select('*').eq('id', id).single()
  if (!source) {
    return { ok: false, status: 404, error: 'That event no longer exists — it may have been deleted.' }
  }

  const [{ data: roles }, { data: slots }] = await Promise.all([
    admin.from('event_roles').select('*').eq('event_id', id).order('sort_order', { ascending: true }),
    admin.from('slots').select('*').eq('event_id', id)
      .order('date', { ascending: true }).order('start_time', { ascending: true }),
  ])

  // What the offset is measured FROM. Normally the event's own start date; an
  // event that never had one still has slots, and their first day is the same
  // anchor by another name.
  const reference = source.start_date || slots?.[0]?.date || null
  const offset = reference ? daysBetween(reference, new_start_date) : 0
  if (offset === null) {
    return { ok: false, status: 400, error: 'That date could not be read.' }
  }

  const name = (typeof givenName === 'string' && givenName.trim())
    ? givenName.trim()
    : renameForDate(source.name, new_start_date)
  const slug = slugify(name)
  if (!slug) {
    return { ok: false, status: 400, error: 'The name needs at least one letter or number.' }
  }

  const { data: created, error: createError } = await admin.from('events').insert({
    name,
    slug,
    description: source.description,
    start_date: source.start_date ? shiftDate(source.start_date, offset) : new_start_date,
    end_date: source.end_date ? shiftDate(source.end_date, offset) : null,
    is_active: false,
    is_archived: false,
    reminder_notes: source.reminder_notes,
    faq_content: source.faq_content,
  }).select().single()

  if (createError?.code === '23505') {
    return {
      ok: false, status: 400,
      error: `Another event already uses the URL "${slug}". Give this copy a different name.`,
    }
  }
  if (createError || !created) {
    return { ok: false, status: 500, error: createError?.message || 'The copy could not be created.' }
  }

  const abandon = async (message: string, status = 500) => {
    await admin.from('events').delete().eq('id', created.id)
    return { ok: false, status, error: message } as CopyEventResult
  }

  // Roles are re-numbered 0..n-1 on the way in so sort_order is unique by
  // construction — it is then a safe key for matching the rows back, which the
  // order of an insert's returned rows is not.
  let roleIdByOld = new Map<string, string>()
  if (roles && roles.length > 0) {
    const { data: newRoles, error } = await admin.from('event_roles').insert(
      roles.map((r, i) => ({
        event_id: created.id,
        name: r.name,
        max_per_slot: r.max_per_slot,
        sort_order: i,
      })),
    ).select()

    if (error || !newRoles) return abandon(error?.message || 'The roles could not be copied.')

    const bySortOrder = new Map(newRoles.map(r => [r.sort_order, r.id]))
    roleIdByOld = new Map(
      roles.map((r, i) => [r.id, bySortOrder.get(i)]).filter((p): p is [string, string] => Boolean(p[1])),
    )
  }

  let slotIdByOld = new Map<string, string>()
  if (slots && slots.length > 0) {
    const shifted = slots.map(s => ({ old: s, date: shiftDate(s.date, offset) }))
    const unshiftable = shifted.find(s => s.date === null)
    if (unshiftable) return abandon(`A shift on ${unshiftable.old.date} could not be moved.`)

    const { data: newSlots, error } = await admin.from('slots').insert(
      shifted.map(({ old, date }) => ({
        event_id: created.id,
        location_id: old.location_id,
        date,
        start_time: old.start_time,
        end_time: old.end_time,
        is_supply: old.is_supply,
      })),
    ).select()

    if (error || !newSlots) return abandon(error?.message || 'The shifts could not be copied.')

    // Matched on what makes a shift that shift rather than on the order rows
    // came back in. Queued per key, so two genuinely identical shifts each get
    // their own new row instead of both pointing at one.
    const key = (s: { date: string; start_time: string; end_time: string; location_id: string | null }) =>
      `${s.date}|${s.start_time}|${s.end_time}|${s.location_id ?? ''}`
    const queues = new Map<string, string[]>()
    for (const s of newSlots) {
      const k = key(s)
      queues.set(k, [...(queues.get(k) || []), s.id])
    }
    for (const { old, date } of shifted) {
      const queue = queues.get(key({ ...old, date: date! }))
      const next = queue?.shift()
      if (next) slotIdByOld.set(old.id, next)
    }
  }

  if (slotIdByOld.size > 0 && roleIdByOld.size > 0) {
    const { data: capacities } = await admin
      .from('slot_role_capacities')
      .select('*')
      .in('slot_id', [...slotIdByOld.keys()])

    const rows = (capacities || [])
      .map(c => ({
        slot_id: slotIdByOld.get(c.slot_id),
        event_role_id: roleIdByOld.get(c.event_role_id),
        max_per_slot: c.max_per_slot,
      }))
      .filter((r): r is { slot_id: string; event_role_id: string; max_per_slot: number } =>
        Boolean(r.slot_id && r.event_role_id))

    if (rows.length > 0) {
      const { error } = await admin.from('slot_role_capacities').insert(rows)
      if (error) return abandon(error.message)
    }
  }

  return { ok: true, event: created, copied: { roles: roleIdByOld.size, slots: slotIdByOld.size } }
}
