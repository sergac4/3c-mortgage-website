const MAX = 2000;

function clean(value, max = MAX) {
  if (typeof value !== 'string') return value;
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function normalize(body = {}) {
  const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution : {};
  return {
    full_name: clean(body.full_name, 120),
    phone: clean(body.phone, 60),
    email: clean(body.email, 180),
    property_city: clean(body.property_city, 120),
    property_zip: clean(body.property_zip, 20),
    occupancy: clean(body.occupancy, 80),
    primary_issue: clean(body.primary_issue, 160),
    timeline: clean(body.timeline, 80),
    preferred_outcome: clean(body.preferred_outcome, 160),
    callback_preference: clean(body.callback_preference, 80),
    contact_consent: body.contact_consent === true,
    ai_call_consent: body.ai_call_consent === true,
    sms_consent_transactional: body.sms_consent_transactional === true,
    page_url: clean(body.page_url, 1200),
    referrer: clean(body.referrer, 1200),
    form_started_at: clean(body.form_started_at, 60),
    form_submitted_at: clean(body.form_submitted_at, 60),
    company_website: clean(body.company_website, 200),
    attribution: Object.fromEntries(Object.entries(attribution).slice(0, 12).map(([k,v]) => [clean(k,50), clean(v,250)]))
  };
}

function leadText(lead, meta) {
  const lines = [
    'NEW 3C LANDLORD EXIT & EQUITY REVIEW LEAD',
    '',
    `Name: ${lead.full_name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Property city / ZIP: ${lead.property_city} ${lead.property_zip}`,
    `Occupancy: ${lead.occupancy}`,
    `Primary issue: ${lead.primary_issue}`,
    `Timeline: ${lead.timeline}`,
    `Preferred outcome: ${lead.preferred_outcome}`,
    `Follow-up preference: ${lead.callback_preference}`,
    '',
    `Contact consent: ${lead.contact_consent ? 'YES' : 'NO'}`,
    `AI/artificial-voice callback consent: ${lead.ai_call_consent ? 'YES' : 'NO'}`,
    `Transactional SMS consent: ${lead.sms_consent_transactional ? 'YES' : 'NO'}`,
    `Consent version: ${meta.consent_version}`,
    `Received: ${meta.received_at}`,
    `IP: ${meta.ip || 'not available'}`,
    `User agent: ${meta.user_agent || 'not available'}`,
    '',
    `Attribution: ${JSON.stringify(lead.attribution)}`,
    `Page: ${lead.page_url || ''}`,
    `Referrer: ${lead.referrer || ''}`
  ];
  return lines.join('\n');
}

async function sendToGhl(payload) {
  const url = process.env.GHL_LANDLORD_WEBHOOK_URL;
  if (!url) return { configured: false, ok: false };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000)
  });
  return { configured: true, ok: response.ok, status: response.status };
}

async function sendByResend(lead, meta) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { configured: false, ok: false };
  const to = process.env.LEAD_TO_EMAIL || 'sergio@3cmortgagegroup.com';
  const from = process.env.LEAD_FROM_EMAIL || '3C Lead Desk <onboarding@resend.dev>';
  const text = leadText(lead, meta);
  const rows = [
    ['Name', lead.full_name], ['Phone', lead.phone], ['Email', lead.email],
    ['Property', `${lead.property_city} ${lead.property_zip}`], ['Occupancy', lead.occupancy],
    ['Primary issue', lead.primary_issue], ['Timeline', lead.timeline], ['Preferred outcome', lead.preferred_outcome],
    ['Follow-up', lead.callback_preference], ['Contact consent', lead.contact_consent ? 'YES' : 'NO'],
    ['AI/artificial-voice consent', lead.ai_call_consent ? 'YES' : 'NO'],
    ['Transactional SMS consent', lead.sms_consent_transactional ? 'YES' : 'NO'],
    ['Consent version', meta.consent_version], ['Received', meta.received_at],
    ['Attribution', JSON.stringify(lead.attribution)]
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px"><h2>New Landlord Exit &amp; Equity Review lead</h2><table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">${rows.map(([k,v]) => `<tr><td style="border-bottom:1px solid #ddd;font-weight:700;vertical-align:top">${escapeHtml(k)}</td><td style="border-bottom:1px solid #ddd">${escapeHtml(v)}</td></tr>`).join('')}</table><p style="font-size:12px;color:#666">Source page: ${escapeHtml(lead.page_url)}</p></div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject: `Landlord lead: ${lead.property_city} — ${lead.primary_issue}`.slice(0, 180),
      text,
      html
    }),
    signal: AbortSignal.timeout(8000)
  });
  return { configured: true, ok: response.ok, status: response.status };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const lead = normalize(req.body || {});

  // Honeypot: return a normal success response so bots do not learn the trap.
  if (lead.company_website) return res.status(200).json({ ok: true });

  if (!lead.full_name || !lead.phone || !lead.email || !lead.property_city || !lead.property_zip || !lead.primary_issue || !lead.timeline || !lead.preferred_outcome || !lead.callback_preference) {
    return res.status(400).json({ ok: false, error: 'Please complete the required fields.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(lead.email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email.' });
  if (!lead.contact_consent) return res.status(400).json({ ok: false, error: 'Contact consent is required.' });

  const wantsAiCallback = lead.callback_preference === 'call_today' || lead.callback_preference === 'call_next_business_day';
  if (wantsAiCallback && !lead.ai_call_consent) {
    return res.status(400).json({ ok: false, error: 'AI/artificial-voice callback consent is required when a callback is requested.' });
  }

  const meta = {
    received_at: new Date().toISOString(),
    consent_version: '2026-09-14-landlord-v1',
    ip: clean((req.headers['x-forwarded-for'] || '').split(',')[0], 80),
    user_agent: clean(req.headers['user-agent'] || '', 500)
  };
  const payload = { source: '3cmortgagegroup.com/landlord-options', lead, meta };

  const results = await Promise.allSettled([sendToGhl(payload), sendByResend(lead, meta)]);
  const sinks = results.map((r) => r.status === 'fulfilled' ? r.value : { configured: true, ok: false });
  const configured = sinks.some((s) => s.configured);
  const delivered = sinks.some((s) => s.ok);

  if (!configured) {
    console.error('Landlord lead intake has no delivery sink configured.');
    return res.status(503).json({ ok: false, error: 'Lead delivery is being configured. Please call 3C directly.' });
  }
  if (!delivered) {
    console.error('Landlord lead delivery failed', sinks);
    return res.status(502).json({ ok: false, error: 'We could not deliver the request. Please call 3C directly.' });
  }

  return res.status(200).json({ ok: true });
};
