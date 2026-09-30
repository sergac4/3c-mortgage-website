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
