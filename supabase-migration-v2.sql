-- =============================================
-- Migration: Per-calculator rates
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing rates table and recreate with calculator column
drop table if exists rates;

create table rates (
  id uuid default gen_random_uuid() primary key,
  calculator text not null,
  term_years integer check (term_years between 1 and 10),
  fixed_rate numeric(5,2),
  variable_rate numeric(5,2),
  rate numeric(5,2),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table rates enable row level security;

-- Public read
create policy "Public read rates" on rates for select using (true);

-- Auth write
create policy "Auth insert rates" on rates for insert to authenticated with check (true);
create policy "Auth update rates" on rates for update to authenticated using (true);
create policy "Auth delete rates" on rates for delete to authenticated using (true);

-- Seed: Refinance (5 terms, fixed + variable)
insert into rates (calculator, term_years, fixed_rate, variable_rate) values
  ('refinance', 1, 5.99, 4.95),
  ('refinance', 2, 4.64, 4.70),
  ('refinance', 3, 4.24, 4.55),
  ('refinance', 4, 4.14, 4.50),
  ('refinance', 5, 4.04, 4.45);

-- Seed: Renewal (5 terms, fixed + variable)
insert into rates (calculator, term_years, fixed_rate, variable_rate) values
  ('renewal', 1, 5.99, 4.95),
  ('renewal', 2, 4.64, 4.70),
  ('renewal', 3, 4.24, 4.55),
  ('renewal', 4, 4.14, 4.50),
  ('renewal', 5, 4.04, 4.45);

-- Seed: HELOC (single rate)
insert into rates (calculator, rate) values
  ('heloc', 4.95);

-- Seed: Self-Employed (5 terms + HELOC rate)
insert into rates (calculator, term_years, fixed_rate, variable_rate) values
  ('self-employed', 1, 5.99, 4.95),
  ('self-employed', 2, 4.64, 4.70),
  ('self-employed', 3, 4.24, 4.55),
  ('self-employed', 4, 4.14, 4.50),
  ('self-employed', 5, 4.04, 4.45);

insert into rates (calculator, rate) values
  ('self-employed-heloc', 4.95);

-- Seed: Home Equity Loan (single default rate)
insert into rates (calculator, rate) values
  ('home-equity-loan', 6.49);
