const siteHeader = `
<div class="topbar"><div class="shell topbar-inner">
  <span>California residential &amp; commercial mortgage guidance</span>
  <div class="topbar-links"><a href="tel:+19253866528">(925) 386-6528</a><a href="mailto:sergio@3cmortgagegroup.com">sergio@3cmortgagegroup.com</a></div>
</div></div>
<header class="site-header"><div class="shell header-inner">
  <a href="/" class="brand" aria-label="3C Mortgage Group home"><img src="/assets/3c-logo.png" alt=""><span class="brand-copy">3C Mortgage Group<small>Capital · Clarity · Closings</small></span></a>
  <nav class="nav" aria-label="Primary navigation"><a href="/residential">Residential</a><a href="/commercial">Commercial</a><a href="/cash-buyers">Cash Buyers</a><a href="/sell-for-cash">Sell for Cash</a><a href="/learning">Learning</a><a href="/about">About</a><a class="nav-apply" href="https://app.3cmortgagegroup.com/" target="_blank" rel="noreferrer">Apply now</a></nav>
  <details class="mobile-menu"><summary aria-label="Open navigation"></summary><nav class="mobile-nav"><a href="/residential">Residential</a><a href="/commercial">Commercial</a><a href="/cash-buyers">Cash Buyers</a><a href="/sell-for-cash">Sell for Cash</a><a href="/learning">Learning</a><a href="/about">About</a><a href="/contact">Contact</a><a href="https://app.3cmortgagegroup.com/" target="_blank" rel="noreferrer">Apply now ↗</a></nav></details>
</div></header>`;

const siteFooter = `
<footer class="site-footer"><div class="shell footer-main">
  <div class="footer-brand"><a href="/" class="brand"><img src="/assets/3c-logo.png" alt=""><span class="brand-copy">3C Mortgage Group<small>Capital · Clarity · Closings</small></span></a><p>Residential and commercial mortgage guidance for California borrowers, homeowners and real estate investors.</p></div>
  <div class="footer-col"><h3>Financing</h3><a href="/residential">Residential</a><a href="/commercial">Commercial</a><a href="/commercial#fix-and-flip">Fix &amp; flip</a><a href="https://app.3cmortgagegroup.com/" target="_blank" rel="noreferrer">Apply online ↗</a></div>
  <div class="footer-col"><h3>Ecosystem</h3><a href="/cash-buyers">Cash buyers</a><a href="/sell-for-cash">Sell for cash</a><a href="/learning">Learning center</a><a href="/about">About 3C</a></div>
  <div class="footer-col"><h3>Contact</h3><a href="tel:+19253866528">(925) 386-6528</a><a href="mailto:sergio@3cmortgagegroup.com">sergio@3cmortgagegroup.com</a><span>3701 Lone Tree Way, Suite 4B<br>Antioch, CA 94509</span><a href="/contact">Send a message</a></div>
</div><div class="shell footer-legal">
  <p>3C Mortgage Group · Company NMLS #1813428 · Sergio Ceballos NMLS #1224913. Not a commitment to lend. All loans are subject to underwriting, approval, property eligibility and program availability. Rates, terms and programs may change without notice. Equal Housing Opportunity.</p>
  <p>Cash-sale inquiries may be introduced to participating independent buyers. 3C Mortgage Group does not guarantee an offer, purchase a property through this form, or provide legal, tax or investment advice.</p>
  <div class="footer-bottom"><span>© 2026 3C Mortgage Group</span><span><a href="/privacy">Privacy</a> · <a href="/legal">Legal</a> · <a href="/accessibility">Accessibility</a> · <a href="https://www.nmlsconsumeraccess.org/" target="_blank" rel="noreferrer">NMLS Consumer Access</a></span></div>
</div><div class="mobile-cta"><a href="tel:+19253866528">Call 3C</a><a href="https://app.3cmortgagegroup.com/" target="_blank" rel="noreferrer">Apply now</a></div></footer>`;
function mountSiteShell() {
  if (!document.querySelector('.site-header')) {
    document.body.insertAdjacentHTML('afterbegin', siteHeader);
  }

  if (!document.querySelector('.site-footer')) {
    document.body.insertAdjacentHTML('beforeend', siteFooter);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountSiteShell, { once: true });
} else {
  mountSiteShell();
}
