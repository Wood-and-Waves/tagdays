-- Fix: signup capacity was enforced only by a check-then-insert in the API
-- route, which is a race condition — two concurrent signups can both pass the
-- check and overfill a slot/role.
--
-- This adds an authoritative, atomic guard at the database level: a BEFORE
-- INSERT trigger that serializes concurrent inserts for the same slot+role
-- with a transaction-scoped advisory lock, recomputes the effective capacity
-- (slot override wins, else the event role's default), and rejects the insert
-- if the role is already full. Works no matter how the insert happens.

create or replace function public.enforce_signup_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.event_roles;
  v_effective_max int;
  v_current_count int;
begin
  -- Cancelled rows don't consume capacity.
  if new.cancelled then
    return new;
  end if;

  -- Resolve the role: prefer the FK, else match by name within the slot's event.
  if new.event_role_id is not null then
    select * into v_role from public.event_roles where id = new.event_role_id;
  else
    select er.* into v_role
    from public.event_roles er
    join public.slots s on s.event_id = er.event_id
    where s.id = new.slot_id and er.name = new.role;
  end if;

  -- No matching role config to evaluate against — let it through rather than
  -- block on data we can't reason about.
  if v_role.id is null then
    return new;
  end if;

  -- Serialize concurrent inserts for this exact slot+role.
  perform pg_advisory_xact_lock(hashtextextended(new.slot_id::text || ':' || v_role.id::text, 0));

  -- Effective capacity: slot-level override wins, else the role default.
  select coalesce(
    (select max_per_slot from public.slot_role_capacities
       where slot_id = new.slot_id and event_role_id = v_role.id),
    v_role.max_per_slot
  ) into v_effective_max;

  select count(*) into v_current_count
  from public.signups
  where slot_id = new.slot_id and role = new.role and cancelled = false;

  if v_current_count >= v_effective_max then
    raise exception 'ROLE_FULL' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_signup_capacity on public.signups;
create trigger trg_enforce_signup_capacity
  before insert on public.signups
  for each row execute function public.enforce_signup_capacity();
