// =============================================
// MyMortgageExpert — Supabase Configuration
// =============================================
const SUPABASE_URL = 'https://qsynstslucmrzwskhxty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzeW5zdHNsdWNtcnp3c2toeHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDYxNzIsImV4cCI6MjA4NzYyMjE3Mn0.nL9oQr3HBhcMhCM3uh6dVEsWFpn0795IrybosXIu1Es';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch calculator rates → returns { 1: { fixed, variable }, 2: ... } or null
async function fetchRates() {
  try {
    const { data, error } = await _supabase.from('rates').select('*').order('term_years');
    if (error) throw error;
    const rates = {};
    data.forEach(r => {
      rates[r.term_years] = { fixed: parseFloat(r.fixed_rate), variable: parseFloat(r.variable_rate) };
    });
    return rates;
  } catch (e) {
    console.warn('Failed to fetch rates from Supabase, using defaults:', e.message);
    return null;
  }
}

// Fetch active broker → returns { name, phone, phoneTel, licence, logo } or null
async function fetchBroker() {
  try {
    const { data, error } = await _supabase.from('broker').select('*').eq('is_active', true).limit(1).single();
    if (error) throw error;
    return {
      name: data.name,
      phone: data.phone_display,
      phoneTel: data.phone_tel,
      licence: data.licence,
      logo: data.logo_url
    };
  } catch (e) {
    console.warn('Failed to fetch broker from Supabase, using defaults:', e.message);
    return null;
  }
}

// Fetch homepage rate cards → returns array of { badge_text, rate_value, meta_text } or null
async function fetchHomepageRates() {
  try {
    const { data, error } = await _supabase.from('homepage_rates').select('*').order('display_order');
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Failed to fetch homepage rates from Supabase, using defaults:', e.message);
    return null;
  }
}

// Fetch lenders → returns array of { name } or null
async function fetchLenders() {
  try {
    const { data, error } = await _supabase.from('lenders').select('*').eq('is_active', true).order('display_order');
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Failed to fetch lenders from Supabase, using defaults:', e.message);
    return null;
  }
}
