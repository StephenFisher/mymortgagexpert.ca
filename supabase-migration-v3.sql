-- =============================================
-- Migration V3: Lead Notification System
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create leads table
create table leads (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  source text not null,
  page text,
  goal text,
  property_address text,
  borrow_amount text,
  calculator_type text,
  calculator_inputs jsonb,
  calculator_results jsonb,
  broker_id uuid references broker(id),
  created_at timestamptz default now()
);

-- 2. Add notification fields to broker table
alter table broker add column if not exists email text;
alter table broker add column if not exists crm_webhook_url text;
alter table broker add column if not exists notification_type text default 'email' check (notification_type in ('email', 'webhook', 'both'));

-- 3. RLS for leads table
alter table leads enable row level security;

-- Anyone can insert a lead (public form submissions)
create policy "Public can insert leads"
  on leads for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users can read leads
create policy "Authenticated can read leads"
  on leads for select
  to authenticated
  using (true);

-- Only authenticated users can update leads
create policy "Authenticated can update leads"
  on leads for update
  to authenticated
  using (true);

-- Only authenticated users can delete leads
create policy "Authenticated can delete leads"
  on leads for delete
  to authenticated
  using (true);
