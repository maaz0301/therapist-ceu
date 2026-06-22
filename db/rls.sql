-- ===========================================================================
-- TherapistCEU.com — Row Level Security, triggers, and helpers.
-- RLS is the backstop; primary authorization lives in Server Actions.
-- This file is idempotent: safe to re-run.
-- ===========================================================================

-- --- Helpers --------------------------------------------------------------

-- SECURITY DEFINER so it bypasses RLS on profiles (prevents policy recursion).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create a profile row automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, contact_email, role)
  values (new.id, new.email, 'trainer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

-- --- Enable RLS -----------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_states  enable row level security;
alter table public.tags            enable row level security;
alter table public.listing_tags    enable row level security;
alter table public.analytics_events enable row level security;

-- --- profiles -------------------------------------------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- --- listings -------------------------------------------------------------

drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings
  for select using (status = 'approved' and active = true);

drop policy if exists listings_owner_read on public.listings;
create policy listings_owner_read on public.listings
  for select using (auth.uid() = trainer_id or public.is_admin());

drop policy if exists listings_owner_write on public.listings;
create policy listings_owner_write on public.listings
  for all using (auth.uid() = trainer_id or public.is_admin())
  with check (auth.uid() = trainer_id or public.is_admin());

-- --- listing_states -------------------------------------------------------

drop policy if exists listing_states_read on public.listing_states;
create policy listing_states_read on public.listing_states
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          (l.status = 'approved' and l.active = true)
          or l.trainer_id = auth.uid()
          or public.is_admin()
        )
    )
  );

drop policy if exists listing_states_write on public.listing_states;
create policy listing_states_write on public.listing_states
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.trainer_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.trainer_id = auth.uid() or public.is_admin())
    )
  );

-- --- tags -----------------------------------------------------------------

drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags
  for select using (
    status = 'approved' or public.is_admin() or suggested_by = auth.uid()
  );

drop policy if exists tags_suggest_insert on public.tags;
create policy tags_suggest_insert on public.tags
  for insert with check (
    public.is_admin()
    or (auth.uid() is not null and status = 'suggested' and suggested_by = auth.uid())
  );

drop policy if exists tags_admin_update on public.tags;
create policy tags_admin_update on public.tags
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists tags_admin_delete on public.tags;
create policy tags_admin_delete on public.tags
  for delete using (public.is_admin());

-- --- listing_tags ---------------------------------------------------------

drop policy if exists listing_tags_read on public.listing_tags;
create policy listing_tags_read on public.listing_tags
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          (l.status = 'approved' and l.active = true)
          or l.trainer_id = auth.uid()
          or public.is_admin()
        )
    )
  );

drop policy if exists listing_tags_write on public.listing_tags;
create policy listing_tags_write on public.listing_tags
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.trainer_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.trainer_id = auth.uid() or public.is_admin())
    )
  );

-- --- analytics_events -----------------------------------------------------

-- Anyone may record a view / link click on a publicly visible listing.
drop policy if exists analytics_insert_public on public.analytics_events;
create policy analytics_insert_public on public.analytics_events
  for insert with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.status = 'approved' and l.active = true
    )
  );

-- Trainers read their own listings' events; admin reads all.
drop policy if exists analytics_owner_read on public.analytics_events;
create policy analytics_owner_read on public.analytics_events
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.trainer_id = auth.uid() or public.is_admin())
    )
  );
