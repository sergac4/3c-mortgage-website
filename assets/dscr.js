(() => {
  const calculator = document.getElementById('dscr-calculator');
  if (!calculator) return;
  const leadForm = document.getElementById('dscr-lead-form');
  const section = document.getElementById('options');
  const result = document.getElementById('dscr-result');
  const placeholder = document.getElementById('dscr-placeholder');
  const status = document.getElementById('dscr-status');
  const submit = document.getElementById('dscr-submit');
  let scenario = null;
  let leadStarted = false;
  const params = new URLSearchParams(location.search);
  const attribution = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid']) {
    if (params.get(key)) attribution[key] = params.get(key).slice(0, 250);
  }
  function track(eventName) {
    // No contact details or financial inputs are included in analytics events.
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName });
    if (typeof window.gtag === 'function') window.gtag('event', eventName);
    if (typeof window.fbq === 'function' && eventName === 'dscr_lead_submitted') window.fbq('track', 'Lead');
  }
  const money = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
  function readScenario() {
    if (!calculator.reportValidity()) return null;
    const values = Object.fromEntries(new FormData(calculator).entries());
    for (const [key, value] of Object.entries(values)) {
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100000000) return null;
      values[key] = Number(value);
    }
    if (values.property_value <= 0 || values.loan_amount <= 0) return null;
    const expense = Math.round((values.principal_interest + values.taxes + values.insurance + values.hoa + values.other_expense) * 100) / 100;
    if (expense <= 0) { calculator.querySelector('#principal-interest').setCustomValidity('Enter a monthly housing expense greater than zero.'); calculator.reportValidity(); return null; }
    return {...values, housing_expense:expense, ltv:values.loan_amount / values.property_value * 100, dscr:values.rent / expense};
  }
  function render(next, first) {
    scenario = next;
    placeholder.hidden = true;
    result.hidden = false;
    document.getElementById('dscr-ratio').textContent = next.dscr.toFixed(2);
    document.getElementById('dscr-expense').textContent = money(next.housing_expense);
    document.getElementById('dscr-ltv').textContent = `${next.ltv.toFixed(1)}%`;
    document.getElementById('dscr-explanation').textContent = `${next.dscr.toFixed(2)} means approximately $${next.dscr.toFixed(2)} of entered qualifying rent for every $1.00 of included monthly housing expense.`;
    document.getElementById('dscr-scenario-summary').textContent = `Value ${money(next.property_value)} · Loan ${money(next.loan_amount)} · Rent ${money(next.rent)}/mo · Expense ${money(next.housing_expense)}/mo · DSCR ${next.dscr.toFixed(2)} · LTV ${next.ltv.toFixed(1)}%.`;
    if (first) track('dscr_calculator_completed');
  }
  calculator.addEventListener('input', () => {
    calculator.querySelector('#principal-interest').setCustomValidity('');
    if (!scenario) return;
    // Hide the prior result and lead form until the edited scenario is valid again.
    scenario = null;
    result.hidden = true;
    placeholder.hidden = false;
    section.hidden = true;
  });
  calculator.addEventListener('submit', e => { e.preventDefault(); const next = readScenario(); if (next) render(next, true); });
  document.getElementById('dscr-options').addEventListener('click', () => {
    if (!scenario) return;
    section.hidden = false;
    track('dscr_options_clicked');
    section.scrollIntoView({behavior:'smooth',block:'start'});
  });
  leadForm.addEventListener('focusin', () => {
    if (!leadStarted) { leadStarted = true; track('dscr_lead_form_started'); }
  });
  leadForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!scenario || !leadForm.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(leadForm).entries());
    fields.contact_consent = leadForm.elements.contact_consent.checked;
    fields.scenario = scenario;
    fields.attribution = attribution;
    fields.page_url = location.href.slice(0, 1200);
    fields.referrer = document.referrer.slice(0, 1200);
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.textContent = 'Sending your scenario…';
    status.className = 'lead-status';
    try {
      const response = await fetch('/api/dscr-lead', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Delivery failed');
      leadForm.reset();
      status.textContent = 'Received. 3C will review your scenario and contact you about available options.';
      status.className = 'lead-status success';
      track('dscr_lead_submitted');
    } catch (_) {
      status.textContent = 'We could not send the request. Please call 3C at (925) 386-6528 or try again.';
      status.className = 'lead-status error';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send my scenario';
    }
  });
})();
