export type VolunteerRole = 'student' | 'parent'
export type ReminderPreference = 'email' | 'sms' | 'both'

export type Location = {
  id: string
  name: string
  address: string | null
  notes: string | null
  created_at: string
}

export type Slot = {
  id: string
  location_id: string
  date: string
  start_time: string
  end_time: string
  max_students: number
  max_parents: number
  earnings: number | null
  created_at: string
  location?: Location
}

export type Signup = {
  id: string
  slot_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: VolunteerRole
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
  updated_at: string
}

export type SlotWithSignups = Slot & {
  signups: Signup[]
  location: Location
}
