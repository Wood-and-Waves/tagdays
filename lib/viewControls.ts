/**
 * Which of the event page's view controls are worth showing.
 *
 * A control offering a choice between one thing and the same thing is noise on
 * the screen a volunteer is trying to read: a single-location event has
 * nothing to sort BY location, and a single-day event has nothing to filter.
 * Most concession nights are both, and the bar disappears entirely.
 *
 * The case this has to get right is the opposite one — Tag Days runs several
 * days across several locations, and the day filter is how anybody finds their
 * Saturday. Hiding it there would be the real bug, which is why both arms are
 * pinned by tests rather than by looking at the one event that exists today.
 */
export function viewControls(
  slots: { date: string; location_id?: string | null }[],
): { showSort: boolean; showDays: boolean } {
  const dates = new Set(slots.map(s => s.date))
  // Slots with no location at all collapse to one group, same as slots sharing
  // one — either way there is nothing to sort by.
  const locations = new Set(slots.map(s => s.location_id ?? ''))
  return { showSort: locations.size > 1, showDays: dates.size > 1 }
}
