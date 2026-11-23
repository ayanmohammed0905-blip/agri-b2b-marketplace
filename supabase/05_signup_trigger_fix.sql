-- Corrected sign-up trigger (replaces 04_signup_trigger.sql). Tolerant of missing metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, phone, location, preferred_language, business_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'farmer')::public.user_role,
    coalesce(new.raw_user_meta_data ->> 'name', 'User'),
    coalesce(new.raw_user_meta_data ->> 'phone', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'location', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'en')::public.language_code,
    nullif(new.raw_user_meta_data ->> 'business_name', '')
  );
  return new;
end
$$;

alter function public.handle_new_user() owner to postgres;
grant insert, select on public.profiles to supabase_auth_admin;
