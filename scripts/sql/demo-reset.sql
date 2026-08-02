-- ============================================================================
-- DEMO RESET — wipes all event data and rebuilds a realistic demo state.
--
--   npm run db:sql -- scripts/sql/demo-reset.sql
--
-- Safe to run repeatedly: it always clears first, so you can rehearse, reset,
-- present, and reset again. Everything runs in one transaction — if any part
-- fails, nothing changes.
--
-- PRESERVED (never touched):
--   * admin_config  — singleton; the Settings page throws if it has 0 rows
--   * auth.users    — admin logins live in Supabase Auth, separate from this
--
-- All seeded volunteers use @example.com addresses and 555-01xx phone numbers
-- (the reserved fictional range), so no real person is ever contacted.
--
-- ⚠ AFTER THE DEMO: reminder emails for the Aug 14 shifts would first attempt
--   to send on Aug 11 (72h before). Before then, re-run this script, delete the
--   demo signups, or set the events inactive — the reminder cron skips
--   inactive events.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. WIPE  (explicit order — correct regardless of FK cascade config)
-- ---------------------------------------------------------------------------
delete from signups;
delete from slot_role_capacities;
delete from slots;
delete from event_roles;
delete from events;
delete from locations;
delete from roster;

-- ---------------------------------------------------------------------------
-- 2. LOCATIONS  (Dan's real Tag Days list, plus the school for concessions)
-- ---------------------------------------------------------------------------
insert into locations (name, address, notes) values
  ('7-11 LITH',                  '4500 W. Algonquin Rd, Lake in the Hills, IL 60156', null),
  ('Brunch Cafe',                '12270 Princeton Dr, Huntley, IL 60142',             null),
  ('Butcher on the Block',       '4660 W. Algonquin Rd, Lake in the Hills, IL 60156', null),
  ('Culver''s',                  '12950 Route 47, Huntley, IL 60142',                 'Cover both the entrance and the drive-thru.'),
  ('DC Cobbs',                   '11808 Coral St, Huntley, IL 60142',                 null),
  ('Dunkin @ Princeton',         '12090 Princeton Dr, Huntley, IL 60142',             null),
  ('Dunkin @ Reed',              '9800 Highway 47, Huntley, IL 60142',                null),
  ('Jewel @ Reed Rd.',           '10090 Route 47, Huntley, IL 60142',                 'Busiest stop — two entrances, keep both covered.'),
  ('Jewel @ Village Green Dr.',  '13200 Village Green Dr, Huntley, IL 60142',         null),
  ('More Brewing',               '13980 Automall Dr, Huntley, IL 60142',              null),
  ('Morkes',                     '11801 Main St, Huntley, IL 60142',                  null),
  ('Parkside',                   '11721 E Main St, Huntley, IL 60142',                null),
  ('Village Square',             '11700 Main St, Huntley, IL 60142',                  null),
  ('Walmart on 47',              '12300 Route 47, Huntley, IL 60142',                 'High traffic — park near the garden centre entrance.'),
  ('Walgreen''s @ Princeton',    '12000 Princeton Dr, Huntley, IL 60142',             null),
  -- Added for the October concessions event. TODO: confirm the address.
  ('Huntley High School — Concession Stand', null,                                     'Stadium concession stand, home side.');

-- ---------------------------------------------------------------------------
-- 3. EVENTS + ROLES
-- ---------------------------------------------------------------------------
insert into events (name, slug, description, start_date, end_date, is_active, is_archived, reminder_notes, faq_content) values
  ('Tag Days 2026', 'tag-days-2026',
   'Our largest fundraiser of the year — two-hour shifts collecting donations at businesses around Huntley and Lake in the Hills.',
   '2026-08-14', '2026-08-16', true, false,
   E'Arrive 10–15 minutes early and check in with your shift lead.\nWear your band shirt or spirit wear.\nBuckets, tags and safety vests are provided at each location.\nStudents should never handle transporting money — a parent volunteer will collect.',
   E'What are Tag Days?\nTag Days are our annual community fundraiser. Volunteers stand outside local businesses in two-hour shifts, collecting donations and handing out tags to thank donors.\n\nWho can volunteer?\nBand students and their parents or guardians. Every location needs at least one adult present at all times.\n\nWhat should I bring?\nJust yourself and weather-appropriate clothing. We provide buckets, tags, and safety vests.\n\nWhat if it rains?\nShifts run rain or shine unless we contact you directly. Check your email the morning of your shift.\n\nCan I sign up for more than one shift?\nYes, and we appreciate it! Sign up for each shift separately.\n\nWhat if I need to cancel?\nContact us as soon as you can so we can find a replacement.'),

  ('Culver''s Dine-n-Share', 'culvers-dine-n-share',
   'Eat at Culver''s on Route 47 and a share of the proceeds comes back to the band. Volunteers greet guests and hand out flyers.',
   '2026-09-15', '2026-09-15', true, false,
   E'Meet the shift lead by the front entrance.\nWear your band shirt.\nBring a smile — you''ll be greeting guests and handing out flyers.',
   null),

  ('Fall Concessions', 'fall-concessions',
   'Staff the stadium concession stand during the October home game. Proceeds support the marching band.',
   '2026-10-15', '2026-10-15', true, false,
   E'Enter through the gate by the field house and check in with the concessions lead.\nClosed-toe shoes required.\nFood handling gloves are provided.',
   null),

  ('Tag Days 2025', 'tag-days-2025',
   'Last year''s Tag Days fundraiser.',
   '2025-08-15', '2025-08-17', false, true,
   null, null);

insert into event_roles (event_id, name, max_per_slot, sort_order)
select e.id, r.name, r.max_per_slot, r.sort_order
from events e
join (values
  ('tag-days-2026', 'Student', 2, 0),
  ('tag-days-2026', 'Parent',  1, 1),
  ('culvers-dine-n-share', 'Student', 4, 0),
  ('culvers-dine-n-share', 'Parent',  2, 1),
  ('fall-concessions', 'Student', 3, 0),
  ('fall-concessions', 'Parent',  2, 1),
  ('tag-days-2025', 'Student', 2, 0),
  ('tag-days-2025', 'Parent',  1, 1)
) as r(slug, name, max_per_slot, sort_order) on r.slug = e.slug;

-- ---------------------------------------------------------------------------
-- 4. SLOTS  (2-hour blocks on even hours — identical in shape to what the
--            app's own Bulk Generate produces)
-- ---------------------------------------------------------------------------

-- Friday Aug 14 — afternoon only, the four busiest stops
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2026-08-14', t.s::time, t.e::time
from events e
join locations l on l.name in ('Jewel @ Reed Rd.', 'Jewel @ Village Green Dr.', 'Walmart on 47', '7-11 LITH')
cross join (values ('14:00','16:00'), ('16:00','18:00')) as t(s, e)
where e.slug = 'tag-days-2026';

-- Saturday Aug 15 — the big day. High-traffic stops run 08:00–18:00 …
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2026-08-15', t.s::time, t.e::time
from events e
join locations l on l.name in ('7-11 LITH', 'Culver''s', 'Jewel @ Reed Rd.',
                               'Jewel @ Village Green Dr.', 'Walmart on 47', 'Walgreen''s @ Princeton')
cross join (values ('08:00','10:00'), ('10:00','12:00'), ('12:00','14:00'),
                   ('14:00','16:00'), ('16:00','18:00')) as t(s, e)
where e.slug = 'tag-days-2026';

-- … and the smaller shops run 10:00–16:00
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2026-08-15', t.s::time, t.e::time
from events e
join locations l on l.name in ('Brunch Cafe', 'Butcher on the Block', 'DC Cobbs',
                               'Dunkin @ Princeton', 'Dunkin @ Reed', 'More Brewing',
                               'Morkes', 'Parkside', 'Village Square')
cross join (values ('10:00','12:00'), ('12:00','14:00'), ('14:00','16:00')) as t(s, e)
where e.slug = 'tag-days-2026';

-- Sunday Aug 16 — late morning wrap-up
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2026-08-16', t.s::time, t.e::time
from events e
join locations l on l.name in ('Culver''s', 'Dunkin @ Princeton', 'Jewel @ Reed Rd.', 'Village Square')
cross join (values ('10:00','12:00'), ('12:00','14:00')) as t(s, e)
where e.slug = 'tag-days-2026';

-- Culver's Dine-n-Share — one evening, one location
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2026-09-15', t.s::time, t.e::time
from events e
join locations l on l.name = 'Culver''s'
cross join (values ('16:00','18:00'), ('18:00','20:00')) as t(s, e)
where e.slug = 'culvers-dine-n-share';

-- Fall Concessions — one evening at the stadium
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2026-10-15', t.s::time, t.e::time
from events e
join locations l on l.name = 'Huntley High School — Concession Stand'
cross join (values ('16:00','18:00'), ('18:00','20:00')) as t(s, e)
where e.slug = 'fall-concessions';

-- Tag Days 2025 (archived) — a little history
insert into slots (event_id, location_id, date, start_time, end_time)
select e.id, l.id, date '2025-08-16', t.s::time, t.e::time
from events e
join locations l on l.name in ('Jewel @ Reed Rd.', 'Walmart on 47', 'Culver''s')
cross join (values ('10:00','12:00'), ('12:00','14:00')) as t(s, e)
where e.slug = 'tag-days-2025';

-- ---------------------------------------------------------------------------
-- 5. PER-SLOT CAPACITY OVERRIDES
--    Only exists where a slot differs from the event default, which is what
--    makes the red "custom capacity" pills appear on the Slots page.
-- ---------------------------------------------------------------------------
insert into slot_role_capacities (slot_id, event_role_id, max_per_slot)
select s.id, r.id, 3
from slots s
join events e on e.id = s.event_id and e.slug = 'tag-days-2026'
join locations l on l.id = s.location_id
join event_roles r on r.event_id = e.id and r.name = 'Student'
where s.date = date '2026-08-15'
  and l.name in ('Jewel @ Reed Rd.', 'Walmart on 47')
  and s.start_time in (time '10:00', time '12:00');

-- ---------------------------------------------------------------------------
-- 6. STUDENT ROSTER  (60 students — a realistic band size)
--    The first 48 are drawn from for signups; the last 12 never sign up, so
--    the Roster page's "No shifts" filter has real content. Because signups
--    cycle evenly through a 50-name pool while there are ~83 student shifts,
--    the roster naturally splits across all three filters: none / 1 / 2+.
-- ---------------------------------------------------------------------------
insert into roster (first_name, last_name)
select split_part(n, ' ', 1), split_part(n, ' ', 2)
from unnest(array[
  -- 1–48: these appear in signups
  'Emma Bauer','Liam Novak','Olivia Reinhart','Noah Castellano','Ava Lindqvist',
  'Ethan Marchetti','Sophia Delgado','Mason Kowalczyk','Isabella Nakamura','Lucas Brennan',
  'Mia Petrov','Owen Fitzgerald','Charlotte Vasquez','Henry Osei','Amelia Rasmussen',
  'Jack Thibodeaux','Harper Sandoval','Leo Kaminski','Ella Moreau','Wyatt Ferraro',
  'Nora Abernathy','Caleb Winterbourne','Lily Okonkwo','Julian Stavros','Zoe Hollingsworth',
  'Grace Sullivan','Miles Ashford','Ruby Chen','Isaac Toledo','Clara Whitmore',
  'Felix Andersen','Nina Kowalski','Theo Marsden','Iris Beaumont','Silas Nguyen',
  'Willa Brightman','Desmond Clarke','Juniper Hale','Oscar Lindberg','Poppy Ashworth',
  'Rowan Gallagher','Esme Fontaine','Griffin Yates','Maeve Donnelly','Casper Novotny',
  'Lena Hartwell','Emmett Sinclair','Freya Solberg',
  -- 49–60: these have no shifts
  'Bodhi Ramirez','Talia Weiss','Jonah Kirkwood','Priya Raghavan','Declan Moss',
  'Anika Voss','Rafael Ortega','Sadie Lockhart','Kai Yamamoto','Delphine Rousseau',
  'Tobias Kern','Marisol Reyes'
]) as n;

-- ---------------------------------------------------------------------------
-- 7. SIGNUPS
--    Filled deterministically from the slot ordering so the result is the same
--    every run: students cycle 0/1/2 per slot and parents 0/1, which leaves
--    most shifts partly filled, a few completely full (those disappear from the
--    public schedule by design), and plenty open for a live demo signup.
--
--    'Sam Whitfield' and 'Gracie Lindqvist' are deliberately NOT on the roster
--    so the "Unmatched Student Signups" panel has something to show.
-- ---------------------------------------------------------------------------
with ordered as (
  select s.id as slot_id, s.event_id,
         row_number() over (order by s.date, s.start_time, s.location_id) as rn
  from slots s
  join events e on e.id = s.event_id
  where e.slug in ('tag-days-2026', 'culvers-dine-n-share', 'fall-concessions', 'tag-days-2025')
),
student_pool as (
  select array[
    -- roster students 1–48 …
    'Emma Bauer','Liam Novak','Olivia Reinhart','Noah Castellano','Ava Lindqvist',
    'Ethan Marchetti','Sophia Delgado','Mason Kowalczyk','Isabella Nakamura','Lucas Brennan',
    'Mia Petrov','Owen Fitzgerald','Charlotte Vasquez','Henry Osei','Amelia Rasmussen',
    'Jack Thibodeaux','Harper Sandoval','Leo Kaminski','Ella Moreau','Wyatt Ferraro',
    'Nora Abernathy','Caleb Winterbourne','Lily Okonkwo','Julian Stavros','Zoe Hollingsworth',
    'Grace Sullivan','Miles Ashford','Ruby Chen','Isaac Toledo','Clara Whitmore',
    'Felix Andersen','Nina Kowalski','Theo Marsden','Iris Beaumont','Silas Nguyen',
    'Willa Brightman','Desmond Clarke','Juniper Hale','Oscar Lindberg','Poppy Ashworth',
    'Rowan Gallagher','Esme Fontaine','Griffin Yates','Maeve Donnelly','Casper Novotny',
    'Lena Hartwell','Emmett Sinclair','Freya Solberg',
    -- … plus two who are NOT on the roster, to populate the Unmatched panel
    'Sam Whitfield','Gracie Lindqvist'
  ] as names
),
parent_pool as (
  select array[
    'Michael Bauer','Jennifer Novak','David Reinhart','Karen Castellano','Robert Lindqvist',
    'Susan Marchetti','James Delgado','Patricia Kowalczyk','Thomas Nakamura','Linda Brennan',
    'Daniel Petrov','Nancy Fitzgerald','Paul Vasquez','Sandra Osei','Mark Rasmussen',
    'Steven Thibodeaux','Donna Sandoval','Kevin Kaminski','Carol Moreau','Brian Ferraro',
    'Michelle Abernathy','Gregory Okonkwo','Rebecca Stavros','Andrew Hollingsworth','Teresa Sullivan'
  ] as names
),
-- Numbering the SIGNUPS (not the slots) and stepping by 7 through a pool whose
-- size is coprime with 7 means every name is used before any repeats — so the
-- roster splits cleanly into none / 1 shift / 2+ shifts.
student_picks as (
  select o.slot_id, o.event_id, o.rn, i as idx,
         row_number() over (order by o.rn, i) as k
  from ordered o
  cross join lateral generate_series(1, (o.rn % 3)::int) as i
),
parent_picks as (
  select o.slot_id, o.event_id, o.rn, i as idx,
         row_number() over (order by o.rn, i) as k
  from ordered o
  cross join lateral generate_series(1, (o.rn % 2)::int) as i
),
picked as (
  select p.slot_id, p.event_id, p.rn, 'Student' as role_name, p.idx,
         (select names[1 + ((p.k * 7) % array_length(names, 1))] from student_pool) as full_name
  from student_picks p
  union all
  select p.slot_id, p.event_id, p.rn, 'Parent', p.idx,
         (select names[1 + ((p.k * 7) % array_length(names, 1))] from parent_pool)
  from parent_picks p
)
insert into signups (
  slot_id, event_role_id, first_name, last_name, email, phone, role,
  reminder_preference, sms_consent, sms_consent_at, confirmation_sent, created_at
)
select
  p.slot_id,
  r.id,
  split_part(p.full_name, ' ', 1),
  split_part(p.full_name, ' ', 2),
  lower(split_part(p.full_name, ' ', 1)) || '.' || lower(split_part(p.full_name, ' ', 2)) || '@example.com',
  case when p.rn % 3 = 0 then '+1555010' || lpad((p.rn % 100)::text, 3, '0') else null end,
  p.role_name,
  case when p.rn % 3 = 0 then 'both' else 'email' end,
  case when p.rn % 3 = 0 then true else false end,
  case when p.rn % 3 = 0 then now() - ((p.rn % 14) || ' days')::interval else null end,
  true,
  now() - ((p.rn % 14) || ' days')::interval - ((p.idx * 37) || ' minutes')::interval
from picked p
join event_roles r on r.event_id = p.event_id and r.name = p.role_name;

commit;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
select 'events' as table_name, count(*)::text as rows from events
union all select 'locations', count(*)::text from locations
union all select 'slots', count(*)::text from slots
union all select 'capacity overrides', count(*)::text from slot_role_capacities
union all select 'signups', count(*)::text from signups
union all select 'roster', count(*)::text from roster
order by table_name;
