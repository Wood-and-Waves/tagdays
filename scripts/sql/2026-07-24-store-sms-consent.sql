-- Fix: the signup form collects (and requires) an SMS consent checkbox for
-- A2P/TCPA compliance, but the value was never stored — leaving no record of
-- who consented or when. Add columns to capture the consent and its timestamp.

alter table public.signups
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz;

comment on column public.signups.sms_consent is 'Whether the volunteer checked the SMS consent box at signup (A2P/TCPA record).';
comment on column public.signups.sms_consent_at is 'When SMS consent was given.';
