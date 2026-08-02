# Tag Days — Demonstration Guide

A walkthrough for showing the site to the HHS Band Boosters board.
Runs about **15 minutes**, or 25 with questions.

---

## Before you start

- [ ] Sign in to **hhstagdays.com/login** on one tab (leave it on the Dashboard)
- [ ] Open **hhstagdays.com** in a second tab (the public site)
- [ ] Have your **phone out and unlocked** — you'll receive a real text during the demo
- [ ] Reset the data to a clean state:

```bash
npm run db:sql -- scripts/sql/demo-reset.sql
```

**What's loaded:** 16 locations, Tag Days 2026 (Aug 14–16, 73 shifts), Culver's Dine-n-Share (Sep 15), Fall Concessions (Oct 15), an archived Tag Days 2025, plus 126 signups and a 60-student roster.

### Three things to avoid

| Don't | Why |
|---|---|
| Fill the signup form in under 3 seconds | Anti-bot protection silently discards it — you'll see the success page but no record is saved. **Fill it at a natural pace.** |
| Edit or toggle an event while the public schedule is on screen | Roles are briefly rebuilt during a save; the schedule can flash as empty |
| Click **Send Invite** on the Users page | It sends a real email to whatever address is in the box |

---

## Part 1 — The volunteer's experience *(lead with this)*

> "Let me show you what a band parent sees when they get the sign-up link."

### 1. The front page — hhstagdays.com
Three fundraisers, each its own card. **Point out:** one place for every event, not a different sign-up sheet each time.

### 2. Open **Tag Days 2026**
Shifts across the whole weekend. Show the controls:

- **By Time** — everything happening at 10am Saturday, wherever it is
- **By Location** — "I'll be at Jewel anyway, what do they need?" (shows address and any notes)
- **Day pills** — Fri / Sat / Sun

> "Every shift shows exactly what's still needed and who's already signed up — so nobody wonders whether their spot is covered."

**Worth saying:** once a shift is completely full it disappears from this list. Volunteers only ever see what still needs filling.

### 3. Pick an open shift and sign up
Choose one showing **2 needed**. Point out the form is short: name, email, phone, role, and how they'd like to be reminded.

- Choose **Both email and SMS**
- Use **your own** email and mobile number
- Check the consent box (required for texting — it's a legal requirement, and the site records it)
- **Take your time filling it in** — see the warning above

### 4. The confirmation
The thank-you page names the event and shows the reminders that were set for *this* event.

### 5. Your phone buzzes 📱
**This is the moment.** Show the text and the confirmation email.

> "That went out automatically. They'll also get a reminder three days before, and another the day before — nobody has to make a single phone call."

### 6. Go back to the schedule
Refresh — the shift now shows one fewer needed, with the new name listed. No double-booking is possible: if two people claim the last spot at the same time, the second is turned away automatically.

---

## Part 2 — The organizer's experience

> "Now here's what you'd see as the person running it."

### Dashboard
Locations, shifts, signups, and open spots at a glance, with a per-event switcher. Every shift with its fill status.

> "At any moment you know exactly how many holes are left to fill."

### Events
All three fundraisers plus the archived one. Show **Create Event** and talk through it without necessarily saving:

- Name and web address
- Dates
- **Volunteer roles** with a per-shift maximum — this is what prevents over- and under-staffing
- **Reminder instructions** — the text volunteers get in confirmations and reminders
- **FAQ** — optional; if filled in, an FAQ link appears on the public page
- **Active** — controls whether the public can see it

**Show Archived Events** → "Last year's data is still here. Archiving hides it from day-to-day views without deleting anything."

### Locations
All 16 stops with addresses and notes. Entered once, reused for every event, every year.

### Slots
The scheduling workhorse. Two ways to build a weekend:

1. **Bulk Generate** — pick a location, a date, and a time range; it creates the two-hour shifts. Show the live preview counting them.
2. **Import from CSV** — paste a spreadsheet and create every location and shift at once. Show **Download Template** and the preview step, which reports what's new versus what already exists.

> "Setting up a full Tag Days weekend is about ten minutes of work, not an evening."

Point out the **capacity pills** — red means that shift overrides the event default. Jewel @ Reed and Walmart take three students on the busy Saturday middays.

### Signups
Every volunteer, searchable by name, email, or location. Show:

- **Search** — type a name
- **Cancel** — frees the spot immediately and reopens it to the public
- **Export CSV** — opens in Excel or Google Sheets, including whether each person consented to texts

### Roster ← *the one that lands*
Paste the band roster once, and the site cross-references it against signups.

- **No shifts** — 12 students who haven't signed up for anything
- **1 shift** / **2+ shifts**
- **Unmatched Student Signups** — people who signed up but aren't on the roster (nickname or spelling mismatch)

> "This answers the question you actually care about: *who still needs a shift?* — instead of reading down a paper list."

### Users
Invite other board members by email; they set their own password. No shared logins or passwords over text.

### Settings
When reminders go out — currently **72 hours** and **24 hours** before each shift. Change it here and it applies everywhere.

---

## What this replaces

- Paper sign-up sheets that only exist in one place
- Phone trees and reminder calls
- A spreadsheet someone has to keep merging
- "Is that spot taken?" texts
- Not knowing who hasn't signed up until it's too late

**And:** works on any phone, no app to install, and volunteers never create an account.

---

## Likely questions

**What does it cost to run?**
Currently nothing — hosting and the database are on free tiers. Texting is the only usage-based cost, fractions of a cent per message. A domain renewal is about $20/year.

**Who can see volunteers' contact information?**
Only signed-in board members you invite. It isn't public, and it isn't readable by anyone else — the schedule shows only a first name and last initial.

**Can we use it for things other than Tag Days?**
Yes — that's what Culver's and Concessions are. Any event with shifts to fill.

**What if a volunteer doesn't have a smartphone?**
The site works on any browser, and email-only reminders are an option. A board member can also sign someone up on their behalf.

**What happens if someone cancels?**
Cancel it on the Signups page and the spot reopens immediately. The record is kept, not deleted.

**Can two people take the last spot?**
No. It's prevented at the database level, not just in the browser.

**Who owns the data?**
The boosters. It exports to CSV any time.

---

## After the demo

Reset to clean demo data:

```bash
npm run db:sql -- scripts/sql/demo-reset.sql
```

⚠️ **Before August 11:** the seeded signups use fake `@example.com` addresses, and reminder emails for the Aug 14 shifts would first try to send 72 hours ahead. Before then, either re-run the reset, delete the demo signups, or set the events inactive on the Events page.
