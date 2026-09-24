const clean = (value, max = 250) => typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').trim().slice(0, max) : '';
const finiteMoney = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000000;
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;

function normalize(body) {
  const raw = body.scenario || {};
  const keys = ['property_value','loan_amount','rent','principal_interest','taxes','insurance','hoa','other_expense'];
  const scenario = Object.fromEntries(keys.map(key => [key, raw[key]]));
  if (!keys.every(key => finiteMoney(scenario[key])) || scenario.property_value <= 0 || scenario.loan_amount <= 0) return null;
  const housingExpense = round(scenario.principal_interest + scenario.taxes + scenario.insurance + scenario.hoa + scenario.other_expense);
  if (housingExpense <= 0) return null;
  scenario.housing_expense = housingExpense;
  scenario.ltv = round(scenario.loan_amount / scenario.property_value * 100);
  scenario.dscr = round(scenario.rent / housingExpense);
  const allowedPurpose = ['purchase','rate_term_refinance','cash_out_refinance'];
  const allowedPropertyType = ['1_unit','2_4_units','short_term_rental','other'];
  const lead = {
    full_name: clean(body.full_name, 120), phone: clean(body.phone, 60), email: clean(body.email, 180),
    purpose: clean(body.purpose, 40), property_type: clean(body.property_type, 40), state: clean(body.state, 40),
    contact_consent: body.contact_consent === true,
    scenario,
    attribution: Object.fromEntries(Object.entries(body.attribution && typeof body.attribution === 'object' ? body.attribution : {}).slice(0, 12).map(([k,v]) => [clean(k, 50),clean(v, 250)])),
    page_url: clean(body.page_url, 1200), referrer: clean(body.referrer, 1200)
  };
  if (!lead.full_name || !lead.phone || !/^\S+@\S+\.\S+$/.test(lead.email) || !lead.state || !allowedPurpose.includes(lead.purpose) || !allowedPropertyType.includes(lead.property_type) || !lead.contact_consent) return null;
  return lead;
}

async function sendToGhl(payload) {
  const url = process.env.GHL_DSCR_WEBHOOK_URL;
  if (!url) return {configured:false,ok:false};
  const response = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
  return {configured:true,ok:response.ok,status:response.status};
}

async function sendByResend(lead, meta) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return {configured:false,ok:false};
  const s = lead.scenario;
  const lines = [
    'NEW 3C DSCR INVESTOR LEAD', '',
    `Name: ${lead.full_name}`, `Phone: ${lead.phone}`, `Email: ${lead.email}`,
    `Purpose: ${lead.purpose}`, `Property type: ${lead.property_type}`, `State: ${lead.state}`, '',
    `Property value / purchase price: $${s.property_value}`,
    `Requested loan: $${s.loan_amount}`, `LTV: ${s.ltv}%`, `Qualifying monthly rent: $${s.rent}`,
    `Monthly principal and interest: $${s.principal_interest}`, `Monthly taxes: $${s.taxes}`,
    `Monthly insurance: $${s.insurance}`, `Monthly HOA: $${s.hoa}`,
    `Other monthly property expense: $${s.other_expense}`,
    `Total entered monthly housing expense: $${s.housing_expense}`, `Estimated DSCR: ${s.dscr}`, '',
    `Contact consent: YES (phone/email; no SMS or automated-call consent)`,
    `Consent version: ${meta.consent_version}`, `Received: ${meta.received_at}`,
    `Attribution: ${JSON.stringify(lead.attribution)}`, `Page: ${lead.page_url}`, `Referrer: ${lead.referrer}`
  ];
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:process.env.LEAD_FROM_EMAIL || '3C Lead Desk <onboarding@resend.dev>',
      to:[process.env.LEAD_TO_EMAIL || 'sergio@3cmortgagegroup.com'],
      reply_to:lead.email,
      subject:`DSCR investor lead: ${lead.state} · ${lead.purpose}`,
      text:lines.join('\n')
    }), signal:AbortSignal.timeout(8000)
  });
  return {configured:true,ok:response.ok,status:response.status};
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  if (Number(req.headers['content-length'] || 0) > 20000) return res.status(413).json({ok:false,error:'Request too large'});
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (body.company_website) return res.status(200).json({ok:true});
  const lead = normalize(body);
  if (!lead) return res.status(400).json({ok:false,error:'Please check the scenario and required contact fields.'});
  const meta = {received_at:new Date().toISOString(),consent_version:'2026-09-dscr-v1',ip:clean(String(req.headers['x-forwarded-for'] || '').split(',')[0],80),user_agent:clean(req.headers['user-agent'],500)};
  const payload = {source:'3cmortgagegroup.com/dscr-loans',lead,meta};
  const results = await Promise.allSettled([sendToGhl(payload),sendByResend(lead,meta)]);
  const sinks = results.map(r => r.status === 'fulfilled' ? r.value : {configured:true,ok:false});
  if (!sinks.some(s => s.configured)) {
    console.error('DSCR lead intake has no configured delivery sink.');
    return res.status(503).json({ok:false,error:'Lead delivery is being configured. Please call 3C directly.'});
  }
  if (!sinks.some(s => s.ok)) {
    console.error('DSCR lead delivery failed',sinks);
    return res.status(502).json({ok:false,error:'We could not deliver the request. Please call 3C directly.'});
  }
  if (sinks.some(s => s.configured && !s.ok)) console.error('DSCR lead partial delivery',sinks);
  return res.status(200).json({ok:true});
};
