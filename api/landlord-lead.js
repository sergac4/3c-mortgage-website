const MAX = 2000;

function clean(value, max = MAX) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function normalize(body = {}) {
  const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution : {};
  return {
    full_name: clean(body.full_name, 120),
    submission_id: clean(body.submission_id, 36),
    phone: clean(body.phone, 60),
    email: clean(body.email, 180),
    property_address: clean(body.property_address, 250),
    report_type: 'keep_or_sell',
    property_city: clean(body.property_city, 120),
    property_zip: clean(body.property_zip, 20),
    occupancy: clean(body.occupancy, 80),
    primary_issue: clean(body.primary_issue, 160),
    timeline: clean(body.timeline, 80),
    preferred_outcome: clean(body.preferred_outcome, 160),
    callback_preference: clean(body.callback_preference, 80),
    contact_consent: body.contact_consent === true,
    ai_call_consent: false,
    sms_consent_transactional: body.callback_preference === 'text_first' && body.sms_consent_transactional === true,
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
    'NEW 3C KEEP-OR-SELL REPORT REQUEST',
    '',
    `Name: ${lead.full_name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Property address: ${lead.property_address || 'To be confirmed'}`,
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
    ['Property', `${lead.property_address || 'Address to be confirmed'} | ${lead.property_city} ${lead.property_zip}`], ['Occupancy', lead.occupancy],
    ['Primary issue', lead.primary_issue], ['Timeline', lead.timeline], ['Preferred outcome', lead.preferred_outcome],
    ['Follow-up', lead.callback_preference], ['Contact consent', lead.contact_consent ? 'YES' : 'NO'],
    ['AI/artificial-voice consent', lead.ai_call_consent ? 'YES' : 'NO'],
    ['Transactional SMS consent', lead.sms_consent_transactional ? 'YES' : 'NO'],
    ['Consent version', meta.consent_version], ['Received', meta.received_at],
    ['Attribution', JSON.stringify(lead.attribution)]
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px"><h2>New Keep-or-Sell Report request</h2><table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">${rows.map(([k,v]) => `<tr><td style="border-bottom:1px solid #ddd;font-weight:700;vertical-align:top">${escapeHtml(k)}</td><td style="border-bottom:1px solid #ddd">${escapeHtml(v)}</td></tr>`).join('')}</table><p style="font-size:12px;color:#666">Source page: ${escapeHtml(lead.page_url)}</p></div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject: `Report request: ${lead.property_city} — ${lead.primary_issue}`.slice(0, 180),
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

  if (!lead.full_name || !lead.email || !lead.property_city || !lead.property_zip || !lead.primary_issue || !lead.timeline || !lead.preferred_outcome || !lead.callback_preference) {
    return res.status(400).json({ ok: false, error: 'Please complete the required fields.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(lead.email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email.' });
  if (!lead.contact_consent) return res.status(400).json({ ok: false, error: 'Contact consent is required.' });

  if (!['email_only', 'human_call', 'text_first'].includes(lead.callback_preference)) {
    return res.status(400).json({ ok: false, error: 'Please select a supported contact preference.' });
  }
  if (lead.callback_preference !== 'email_only' && !lead.phone) {
    return res.status(400).json({ ok: false, error: 'Please add a phone number for your requested call or text.' });
  }
  if (lead.callback_preference === 'text_first' && !lead.sms_consent_transactional) {
    return res.status(400).json({ ok: false, error: 'Please confirm text permission or select email only.' });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lead.submission_id)) {
    return res.status(400).json({ ok: false, error: 'Please refresh the page and try again.' });
  }

  const meta = {
    received_at: new Date().toISOString(),
    consent_version: '2026-09-16-keep-sell-v2',
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
