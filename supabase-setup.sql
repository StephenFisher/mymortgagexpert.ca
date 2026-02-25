-- =============================================
-- MyMortgageExpert Supabase Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================

-- 1. Rates table (calculator rates by term)
create table rates (
  term_years integer primary key check (term_years between 1 and 10),
  fixed_rate numeric(5,2) not null,
  variable_rate numeric(5,2) not null,
  updated_at timestamp with time zone default now()
);

-- 2. Broker table
create table broker (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone_display text not null,
  phone_tel text not null,
  licence text not null,
  logo_url text,
  is_active boolean default true,
  updated_at timestamp with time zone default now()
);

-- 3. Lenders table
create table lenders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  display_order integer not null,
  is_active boolean default true,
  updated_at timestamp with time zone default now()
);

-- 4. Homepage rate cards
create table homepage_rates (
  id uuid default gen_random_uuid() primary key,
  badge_text text not null,
  rate_value numeric(5,2) not null,
  meta_text text not null default 'as low as · Insured rate',
  display_order integer not null,
  updated_at timestamp with time zone default now()
);

-- =============================================
-- Row Level Security
-- =============================================
alter table rates enable row level security;
alter table broker enable row level security;
alter table lenders enable row level security;
alter table homepage_rates enable row level security;

-- Public read access (anyone can view)
create policy "Public read rates" on rates for select using (true);
create policy "Public read broker" on broker for select using (true);
create policy "Public read lenders" on lenders for select using (true);
create policy "Public read homepage_rates" on homepage_rates for select using (true);

-- Authenticated users can insert, update, delete
create policy "Auth insert rates" on rates for insert to authenticated with check (true);
create policy "Auth update rates" on rates for update to authenticated using (true);
create policy "Auth delete rates" on rates for delete to authenticated using (true);

create policy "Auth insert broker" on broker for insert to authenticated with check (true);
create policy "Auth update broker" on broker for update to authenticated using (true);
create policy "Auth delete broker" on broker for delete to authenticated using (true);

create policy "Auth insert lenders" on lenders for insert to authenticated with check (true);
create policy "Auth update lenders" on lenders for update to authenticated using (true);
create policy "Auth delete lenders" on lenders for delete to authenticated using (true);

create policy "Auth insert homepage_rates" on homepage_rates for insert to authenticated with check (true);
create policy "Auth update homepage_rates" on homepage_rates for update to authenticated using (true);
create policy "Auth delete homepage_rates" on homepage_rates for delete to authenticated using (true);

-- =============================================
-- Seed Data (current hardcoded values)
-- =============================================

-- Calculator rates
insert into rates (term_years, fixed_rate, variable_rate) values
  (1, 5.99, 4.95),
  (2, 4.64, 4.70),
  (3, 4.24, 4.55),
  (4, 4.14, 4.50),
  (5, 4.04, 4.45);

-- Broker
insert into broker (name, phone_display, phone_tel, licence, logo_url, is_active) values
  ('Lighthouse Lending', '905-234-3323', '19052343323', 'FSRA# 13301', 'lighthouse-lending-logo.png', true);

-- Lenders
insert into lenders (name, display_order) values
  ('TD Bank', 1),
  ('Equitable', 2),
  ('Optimum', 3),
  ('Scotiabank', 4),
  ('HomeTrust', 5),
  ('National Bank', 6),
  ('MCAN', 7),
  ('MCAP', 8),
  ('First National', 9);

-- Homepage rate cards
insert into homepage_rates (badge_text, rate_value, meta_text, display_order) values
  ('5-Year Fixed', 4.04, 'as low as · Insured rate', 1),
  ('5-Year Variable', 4.45, 'as low as · Insured rate', 2),
  ('3-Year Fixed', 4.24, 'as low as · Insured rate', 3),
  ('3-Year Variable', 4.55, 'as low as · Insured rate', 4);
