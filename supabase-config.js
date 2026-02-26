// =============================================
// MyMortgageExpert — Supabase Configuration
// =============================================
const SUPABASE_URL = 'https://qsynstslucmrzwskhxty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzeW5zdHNsdWNtcnp3c2toeHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDYxNzIsImV4cCI6MjA4NzYyMjE3Mn0.nL9oQr3HBhcMhCM3uh6dVEsWFpn0795IrybosXIu1Es';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch term-based rates for a specific calculator → { 1: { fixed, variable }, ... } or null
async function fetchRates(calculator) {
  try {
    const { data, error } = await _supabase.from('rates').select('*').eq('calculator', calculator).not('term_years', 'is', null).order('term_years');
    if (error) throw error;
    if (!data.length) return null;
    const rates = {};
    data.forEach(r => {
      rates[r.term_years] = { fixed: parseFloat(r.fixed_rate), variable: parseFloat(r.variable_rate) };
    });
    return rates;
  } catch (e) {
    console.warn('Failed to fetch ' + calculator + ' rates:', e.message);
    return null;
  }
}

// Fetch a single rate value for a calculator → number or null
async function fetchSingleRate(calculator) {
  try {
    const { data, error } = await _supabase.from('rates').select('rate').eq('calculator', calculator).limit(1).single();
    if (error) throw error;
    return parseFloat(data.rate);
  } catch (e) {
    console.warn('Failed to fetch ' + calculator + ' rate:', e.message);
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

// Fetch homepage rate cards → returns array or null
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

// Fetch lenders → returns array or null
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

// Fetch active broker ID → returns uuid string or null
async function fetchActiveBrokerId() {
  try {
    const { data, error } = await _supabase.from('broker').select('id').eq('is_active', true).limit(1).single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.warn('Failed to fetch broker ID:', e.message);
    return null;
  }
}

// Submit a lead to Supabase → returns { data, error }
async function submitLead(leadData) {
  try {
    const { data, error } = await _supabase.from('leads').insert([leadData]);
    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    console.warn('Failed to submit lead:', e.message);
    return { data: null, error: e };
  }
}
