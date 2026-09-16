(() => {
  document.body.classList.add('landlord-funnel');
  const funnelStyle = document.createElement('style');
  funnelStyle.textContent = '.landlord-funnel .nav,.landlord-funnel .mobile-menu,.landlord-funnel .mobile-cta{display:none!important}.landlord-funnel .header-inner{justify-content:flex-start}';
  document.head.appendChild(funnelStyle);

  const form = document.getElementById('landlord-lead-form');
  if (!form) return;

  const status = document.getElementById('landlord-status');
  const submit = document.getElementById('landlord-submit');
  const callback = document.getElementById('ll-callback');
  const aiConsent = document.getElementById('ai-call-consent');
  const startedAt = Date.now();

  const params = new URLSearchParams(window.location.search);
  const attribution = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'].forEach((key) => {
    if (params.get(key)) attribution[key] = params.get(key).slice(0, 250);
  });

  function setStatus(message, type = '') {
    status.textContent = message;
    status.className = `lead-status ${type}`.trim();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    if (!form.reportValidity()) return;

    const wantsCall = callback.value === 'call_today' || callback.value === 'call_next_business_day';
    if (wantsCall && !aiConsent.checked) {
      setStatus('Please confirm the AI/artificial-voice callback disclosure, or choose “Text or email me first.”', 'error');
      aiConsent.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.contact_consent = document.getElementById('contact-consent').checked;
    data.ai_call_consent = aiConsent.checked;
    data.sms_consent_transactional = document.getElementById('sms-consent').checked;
    data.attribution = attribution;
    data.page_url = window.location.href.slice(0, 1200);
    data.referrer = document.referrer.slice(0, 1200);
    data.form_started_at = new Date(startedAt).toISOString();
    data.form_submitted_at = new Date().toISOString();

    submit.disabled = true;
    submit.textContent = 'Sending…';
    setStatus('Submitting your report request…');

    try {
      const response = await fetch('/api/landlord-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Submission failed');

      form.reset();
      setStatus(wantsCall
        ? 'Received. 3C will review your information and follow up using the callback preference you selected.'
        : 'Received. 3C will review your information and follow up by text or email first.', 'success');

      if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { lead_source: attribution.utm_source || 'website' });
    } catch (error) {
      setStatus('We could not send the form. Please call 3C at (925) 386-6528 or try again in a moment.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Request my free report';
    }
  });
})();
