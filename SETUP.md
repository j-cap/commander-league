# Live setup: email invitations and manager roles

This replaces the earlier Apps Script instructions. Do not deploy the old Google-account-only app.

## What is already built

The login page, member view, manager result entry and corrections, owner access management, QR invitation, audit trail, database schema and server adapters are implemented. Real email delivery and Google access still need to be connected. No invitations have been sent and no live results have been written by this version.

## 1. Set the owner address

Choose the email address you will use as league owner. Configure it as `OWNER_EMAIL` in the hosting runtime settings. This is the only address that can bootstrap the owner account; it must verify a sign-in email before obtaining a session. Other addresses must be invited by that owner.

Use the exact deployed HTTPS origin as `APP_ORIGIN`, without a trailing slash. The current app origin is https://commander-league-demo.jakobweber.chatgpt.site.

## 2. Connect email delivery

The prepared adapter uses Resend. Create an account, verify a sender domain that you control, and create a sending API key. Configure:

- `RESEND_API_KEY`: server-side API key.
- `MAIL_FROM`: a sender address on the verified domain, such as Commander League <league@your-domain.example>.

Any email provider can receive the sign-in links. League members need no Resend accounts. Provider account/domain setup and any paid plan are the owner's decisions; no purchase or email dispatch was performed here.

If you do not have a domain, discuss an alternative delivery provider before purchasing one. The adapter is isolated in `server/auth.mjs`.

## 3. Connect Google Sheets

Start with a **copy** of the league workbook.

In a Google Cloud project you control, enable the Google Sheets API, create a service account, and create its JSON key. Share only the test spreadsheet with the service account email as an editor. Configure these as private server runtime values:

- `SPREADSHEET_ID`: the ID of the test spreadsheet.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: the JSON key's client_email.
- `GOOGLE_PRIVATE_KEY`: the JSON key's private_key, including its BEGIN/END lines.

You perform this Google setup once as the owner. Members never sign in to Google or receive spreadsheet permissions. Do not paste the JSON key into GitHub, public chat, the frontend or a URL.

## 4. Deploy storage and app

The Sites manifest declares the logical D1 binding `DB`. The Worker build includes generated Drizzle migrations; the hosting flow provisions storage and applies them before serving the Worker. Never seed personal email addresses in migrations.

The production site must allow visitors to reach the sign-in page without platform sign-in. Private league access is enforced by the application's session and membership checks. Keep the service-account/email secrets server-side.

## 5. Test before switching to the real sheet

1. Sign in as the configured owner; confirm the email link works once and expires.
2. Invite a second email as a member. Share the app link or QR. Confirm this member can view but cannot enter or correct results.
3. Promote that member to manager. They sign in again, then record places 1, 2, 2, 4 on the test sheet: base points must be 3, 1.5, 1.5, 0.
4. Verify the sheet's Wertung and Rangliste agree with the app after the save.
5. Correct the game with a reason and verify subsequent handicap changes. Review the before/after audit record.
6. Revoke the manager and confirm their existing session cannot read or write anymore.
7. Use two browser sessions to confirm a stale preview cannot overwrite another manager's result.
8. If a save reports an uncertain status, do not re-enter it. The owner uses “Offenen Speichervorgang prüfen” after two minutes. It compares the actual sheet row to both versions, records the outcome and releases the lock only if unambiguous.

After these pass, share the real spreadsheet with the service account and change `SPREADSHEET_ID`. Reload and verify all existing league totals before entering a real game.

## Invitations and QR

Owner → Zugänge verwalten → enter email → select member or manager → Adresse freigeben. The owner can copy the league link or download the QR and distribute it. Creating an invitation grants eligibility; the member requests their own email sign-in link. The app does not automatically email everyone or reveal whether arbitrary addresses are members.

The QR currently encodes the deployed app origin. For a different domain, regenerate it with `scripts/generate_qr.py` (requires Python reportlab) and update the QR-origin check in portal.js. A shared QR must never embed a session or manager token.

## Sources

- [Google service-account authorization](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)
