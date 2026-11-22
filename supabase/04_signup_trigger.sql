-- Creates the profiles row automatically when someone signs up.
-- The app sends name, phone, role, location, preferred_language and business_name as metadata.

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, name, phone, location, preferred_language, business_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'role')::user_role,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'location',
    coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en')::language_code,
    nullif(new.raw_user_meta_data ->> 'business_name', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
