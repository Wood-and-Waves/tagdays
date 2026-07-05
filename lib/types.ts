export type ReminderPreference = 'email' | 'sms' | 'both'

export type Event = {
  id: string
  name: string
  slug: string
  description: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  is_archived: boolean
  reminder_notes: string | null
  faq_content: string | null
  created_at: string
}

export type EventRole = {
  id: string
  event_id: string
  name: string
  max_per_slot: number
  sort_order: number
  created_at: string
}

export type Location = {
  id: string
  name: string
  address: string | null
  notes: string | null
  created_at: string
}

export type Slot = {
  id: string
  event_id: string
  location_id: string | null
  date: string
  start_time: string
  end_time: string
  is_supply: boolean
  earnings: number | null
  created_at: string
  location?: Location | null
  event?: Event
}

export type Signup = {
  id: string
  slot_id: string
  event_role_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: string
  quantity: number
  reminder_preference: ReminderPreference
  reminder_1_sent: boolean
  reminder_2_sent: boolean
  confirmation_sent: boolean
  cancelled: boolean
  created_at: string
}

export type AdminConfig = {
  id: string
  reminder_1_hours_before: number
  reminder_2_hours_before: number
  event_year: number
  updated_at: string
}

export type SlotWithSignups = Slot & {
  signups: Signup[]
  location: Location | null
  event?: Event
  roles?: EventRole[]
}

export type EventWithRoles = Event & {
  roles: EventRole[]
}

export type RosterStudent = {
  id: string
  first_name: string
  last_name: string
  created_at: string
}
