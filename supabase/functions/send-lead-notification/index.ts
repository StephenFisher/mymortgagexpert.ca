// Supabase Edge Function: send-lead-notification
// Triggered by Database Webhook on leads table INSERT
// Sends email via Resend and/or posts to CRM webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  page: string | null;
  goal: string | null;
  property_address: string | null;
  borrow_amount: string | null;
  calculator_type: string | null;
  calculator_inputs: Record<string, string> | null;
  calculator_results: Record<string, string> | null;
  broker_id: string | null;
  created_at: string;
}

interface Broker {
  id: string;
  name: string;
  email: string | null;
  crm_webhook_url: string | null;
  notification_type: string;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/Pct$/, " %")
    .replace(/Ltt/, "LTT");
}

function buildEmailHtml(lead: Lead, broker: Broker): string {
  const sourceLabel =
    lead.source === "help-wizard"
      ? "Help Wizard"
      : lead.source === "calculator"
      ? `Calculator — ${lead.calculator_type || "Unknown"}`
      : "Pre-Approval Form";

  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1B3C2D;">
      <div style="background: #1B3C2D; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; font-size: 20px; margin: 0;">New Lead from MyMortgageExpert</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e8ebe6; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="font-size: 16px; color: #2A7D5B; margin: 0 0 16px;">Contact Information</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #6b7c74; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${lead.first_name} ${lead.last_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7c74;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #2A7D5B;">${lead.email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #6b7c74;">Phone</td><td style="padding: 8px 0;"><a href="tel:${lead.phone}" style="color: #2A7D5B;">${lead.phone}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #6b7c74;">Source</td><td style="padding: 8px 0;">${sourceLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7c74;">Page</td><td style="padding: 8px 0;">${lead.page || "Homepage"}</td></tr>
        </table>`;

  // Help wizard fields
  if (lead.source === "help-wizard") {
    html += `
        <h2 style="font-size: 16px; color: #2A7D5B; margin: 0 0 16px; padding-top: 16px; border-top: 1px solid #e8ebe6;">Inquiry Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #6b7c74; width: 140px;">Goal</td><td style="padding: 8px 0; font-weight: 600;">${lead.goal || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7c74;">Property Address</td><td style="padding: 8px 0;">${lead.property_address || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7c74;">Borrow Amount</td><td style="padding: 8px 0;">${lead.borrow_amount || "—"}</td></tr>
        </table>`;
  }

  // Calculator data
  if (lead.source === "calculator" && lead.calculator_inputs) {
    html += `
        <h2 style="font-size: 16px; color: #2A7D5B; margin: 0 0 16px; padding-top: 16px; border-top: 1px solid #e8ebe6;">Calculator Inputs — ${lead.calculator_type || ""}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">`;
    for (const [key, value] of Object.entries(lead.calculator_inputs)) {
      if (value && value !== "N/A") {
        html += `<tr><td style="padding: 8px 0; color: #6b7c74; width: 180px;">${formatLabel(key)}</td><td style="padding: 8px 0;">${value}</td></tr>`;
      }
    }
    html += `</table>`;

    if (lead.calculator_results) {
      html += `
        <h2 style="font-size: 16px; color: #2A7D5B; margin: 0 0 16px; padding-top: 16px; border-top: 1px solid #e8ebe6;">Calculator Results</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">`;
      for (const [key, value] of Object.entries(lead.calculator_results)) {
        if (value) {
          html += `<tr><td style="padding: 8px 0; color: #6b7c74; width: 180px;">${formatLabel(key)}</td><td style="padding: 8px 0; font-weight: 600;">${value}</td></tr>`;
        }
      }
      html += `</table>`;
    }
  }

  html += `
        <div style="margin-top: 24px; padding: 16px; background: #f5f5f0; border-radius: 8px; font-size: 13px; color: #6b7c74;">
          This lead was submitted on ${new Date(lead.created_at).toLocaleString("en-CA", { timeZone: "America/Toronto" })} via mymortgagexpert.ca
        </div>
      </div>
    </div>`;

  return html;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    // The webhook payload contains the new record
    const lead: Lead = payload.record;

    if (!lead || !lead.broker_id) {
      return new Response(JSON.stringify({ error: "No lead or broker_id" }), {
        status: 400,
      });
    }

    // Fetch broker details using service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: broker, error: brokerError } = await supabase
      .from("broker")
      .select("id, name, email, crm_webhook_url, notification_type")
      .eq("id", lead.broker_id)
      .single();

    if (brokerError || !broker) {
      return new Response(
        JSON.stringify({ error: "Broker not found", details: brokerError }),
        { status: 404 }
      );
    }

    const results: Record<string, unknown> = {};

    // Send email via Resend
    if (
      (broker.notification_type === "email" ||
        broker.notification_type === "both") &&
      broker.email
    ) {
      const emailHtml = buildEmailHtml(lead, broker);
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MyMortgageExpert <leads@mymortgagexpert.ca>",
          to: [broker.email],
          subject: `New Lead — ${lead.first_name} ${lead.last_name}`,
          html: emailHtml,
        }),
      });
      results.email = {
        status: emailRes.status,
        body: await emailRes.json(),
      };
    }

    // Post to CRM webhook
    if (
      (broker.notification_type === "webhook" ||
        broker.notification_type === "both") &&
      broker.crm_webhook_url
    ) {
      const webhookRes = await fetch(broker.crm_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: {
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            page: lead.page,
            goal: lead.goal,
            property_address: lead.property_address,
            borrow_amount: lead.borrow_amount,
            calculator_type: lead.calculator_type,
            calculator_inputs: lead.calculator_inputs,
            calculator_results: lead.calculator_results,
            created_at: lead.created_at,
          },
          broker_name: broker.name,
        }),
      });
      results.webhook = {
        status: webhookRes.status,
        body: await webhookRes.text(),
      };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
});
