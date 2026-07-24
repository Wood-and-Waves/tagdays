-- Security fix: volunteer PII (email, phone) was world-readable.
--
-- The `signups` table had a SELECT policy granting the anon role read
-- access to every row via the public anon key (which ships in the browser
-- bundle). That exposed every volunteer's name, email, and phone.
--
-- Public pages that need to show who's signed up now read `signups` through
-- the service-role client server-side (selecting only non-PII columns), so
-- the anon role no longer needs any read access to this table.
--
-- Kept intact: "Public can insert signups" (anon INSERT — the signup form),
-- "Admins can do everything on signups" (authenticated ALL),
-- "Service role bypass on signups" (service_role ALL).

drop policy if exists "Public can read signups" on public.signups;

-- Show what remains so we can eyeball it after running.
select policyname, cmd, roles::text
from pg_policies
where schemaname = 'public' and tablename = 'signups'
order by cmd, policyname;
