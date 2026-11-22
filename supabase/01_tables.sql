-- Agri B2B Marketplace schema. Matches src/lib/types.ts (camelCase there, snake_case here).
-- Run parts 1, 2, 3 in order in the Supabase SQL editor.

create type user_role as enum ('farmer', 'buyer');
create type language_code as enum ('en', 'kn');
create type crop_unit as enum ('kg', 'quintal', 'ton');
create type crop_grade as enum ('A', 'B', 'C');
create type order_status as enum (
  'requested', 'accepted', 'rejected', 'pickup_scheduled',
  'picked_up', 'in_transit', 'delivered', 'confirmed'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  name text not null,
  phone text not null unique,
  location text not null,
  preferred_language language_code not null default 'en',
  business_name text,
  created_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles(id) on delete cascade,
  crop text not null,
  variety text,
  quantity numeric not null check (quantity >= 0),
  unit crop_unit not null default 'kg',
  asking_price numeric not null check (asking_price > 0),
  grade crop_grade not null default 'A',
  harvest_date date not null,
  location text not null,
  photos text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index listings_farmer_idx on listings(farmer_id);
create index listings_crop_idx on listings(lower(crop));

create table market_prices (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  min_price numeric not null,
  max_price numeric not null,
  market text not null,
  reported_on date not null,
  source text not null,
  is_sample boolean not null default true,
  check (max_price >= min_price)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references profiles(id),
  farmer_id uuid not null references profiles(id),
  quantity numeric not null check (quantity > 0),
  agreed_price numeric not null check (agreed_price > 0),
  status order_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_buyer_idx on orders(buyer_id);
create index orders_farmer_idx on orders(farmer_id);

