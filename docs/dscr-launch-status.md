# DSCR launch status — 2026-09-30

## Built on the feature branch
- Free calculator at `/dscr`: amortizing or interest-only payments, included housing expenses, DSCR and LTV.
- Review request creates a GHL iframe with the calculated scenario in `dscr_scenario` and persona/platform/campaign in the summary.
- Copyable summary, form fallback link, and invalidation when numbers change.
- Maria links select Spanish as preferred language. Page and existing acknowledgment remain English; Spanish automation is not implemented.
- `node tests/dscr.test.cjs` passes payment/ratio edge cases, attribution, URL payload and stale-form clearing. These are local tests, not proof of a GHL submission.

## GHL changes observed saved
Location: `oIxXvITDgVIjqUTXky8B` (3C Mortgage Group).
Form: `3C DSCR Investor Consultation`, ID `8TIAZhMK86v6aqgW3rxA`.
Workflow: `DSCR Lead Capture Workflow`, ID `f7416027-d200-45a7-8bd7-14f3709749fd`.
- Notification recipient changed to Sergio Ceballos explicitly.
- Existing workflow includes DSCR tag, opportunity, acknowledgment email and same-day Sergio call task.
- Added the native Source element with value `DSCR Calculator` to the form and saved.
- Existing hidden `DSCR Calculator Scenario` field uses query key `dscr_scenario`.

## Launch blocker
GHL's own Preview opened the public form and displayed `{"message":"Please contact the site owner for access."}`. A direct browser attempt also returned ERR_BLOCKED_BY_CLIENT. No test lead was submitted.

Do not represent the funnel as tested or drive paid traffic until the public form is accessible and the tests below pass. No new website deployment has been made by this work.

## Required live acceptance checks
1. Open the deployed calculator on desktop and mobile, using Duke and Maria referral links.
2. Load the native form and inspect whether the hidden scenario is populated from the query parameter. Verify source behavior; the native Source default is general DSCR Calculator and persona lives in the scenario.
3. Submit a clearly identified test with a controlled recipient inbox/phone. Do not accept terms on behalf of a real borrower.
4. Confirm the contact's complete scenario, DSCR tag, expected pipeline/stage, Sergio notification, acknowledgment delivery, same-day task and source.
5. Repeat submission and verify update/deduplication behavior. Confirm workflows stop when manually processed and no marketing SMS is sent without appropriate consent.
6. Add verified persona tags and Spanish follow-up, then verify both branches.
7. Connect Duke/Maria social accounts to this mortgage subaccount through the account owner's authorization; Aly product/affiliate tracking remains separate. No social connection has been completed here.
8. Validate sender domain/delivery and program eligibility before marketing lender-specific claims. This calculator is illustrative, not live lender pricing.

A DSCR lead is ready for human review only; this work does not approve loans or submit files to lenders automatically.

## Results-first corrections — Sept 30 evening
- Sergio successfully opened the public form in his browser and submitted a test; acknowledgment arrived in spam. The earlier access block applies to the agent browser, not proven customer access.
- Published acknowledgment now merges `{{contact.dscr_calculator_scenario}}`, says Sergio will follow up, and offers the existing active 10-minute Quick Call calendar.
- Sender explicitly set to sergio@3cmortgagegroup.com; this does not establish SPF/DKIM/DMARC alignment or inbox delivery.
- Calculator draft includes an optional booking button and a results-first review CTA.
- Calendar URL observed in GHL Share calendar: https://link.3cmortgagegroup.com/widget/booking/Fmy9SxEJ1BVSNsVsXHva
- Still required: submit calculator-generated scenario and verify actual numbers in delivered email; test calendar availability/booking and confirmation; audit sender authentication and message headers; deploy calculator after acceptance.

### Sender audit
GHL dedicated domain `go.3cmortgagegroup.com` shows SPF, DKIM, tracking CNAME, MX and DMARC all Verified. Dedicated Header is enabled: Sergio at 3C Mortgage Group / sergio@go.3cmortgagegroup.com. Domain warmup is In Progress, Stage 2, shared IP. Do not attribute spam to missing authentication based on these settings; inspect the delivered message Authentication-Results and provider feedback before further changes. No DNS changes made.

## Borrower summary cleanup — October 1, 2026

GHL form now has a hidden DSCR Borrower Summary field with query key `dscr_borrower_summary`. Published email merges `{{contact.dscr_borrower_summary}}`. Calculator preview and copy use clean summary with two-decimal DSCR and human payment labels. Internal DSCR Calculator Scenario remains unchanged for attribution and review. Automated tests cover matching borrower payload, no internal tracking labels, and the user’s interest-only scenario. A new borrower delivery test remains to confirm the new field merge; prior delivery and booking were confirmed by Sergio. Production main is not yet published.
