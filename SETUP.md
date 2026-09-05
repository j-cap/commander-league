# Live setup: email invitations and manager roles

This replaces the earlier Apps Script instructions. Do not deploy the old Google-account-only app.

## What is already built

The login page, member view, manager result entry and corrections, owner access management, QR invitation, audit trail, database schema and server adapters are implemented. Real email delivery and Google access still need to be connected. No invitations have been sent and no live results have been written by this version.

## 1. Set the owner address

Choose the email address you will use as league owner. Configure it as `OWNER_EMAIL` in the hosting runtime settings. This is the only address that can bootstrap the owner account; it must verify a sign-in email before obtaining a session. Other addresses must be invited by that owner.

Use the exact deployed HTTPS origin as `APP_ORIGIN`, without a trailing slash. The current app origin is https://commander-league-demo.jakobweber.chatgpt.site.

## 2. Connect email delivery

Two interchangeable senders are supported. Changing the sender does not change league membership, roles or results.

### Gmail (initial setup)

Set `MAIL_PROVIDER=gmail` and `GMAIL_SENDER` to the owner's chosen Gmail address in private hosting settings. Do not commit the real address or credentials to this public repository.

1. Create a Google Cloud project called **Commander League** and enable the **Gmail API**.
2. Configure Google Auth Platform branding/audience for your own use. During testing, add only your sender account as a test user.
3. Create a Web application OAuth client. For the one-time setup through Google's OAuth Playground, register `https://developers.google.com/oauthplayground` as an authorized redirect URI.
4. In OAuth Playground settings, enable **Use your own OAuth credentials** and enter that client's ID and secret. Request only `https://www.googleapis.com/auth/gmail.send`, using offline access. Authorize with the exact account chosen as `GMAIL_SENDER`, then exchange the authorization code for tokens.
5. Store `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` and `GMAIL_REFRESH_TOKEN` in private hosting runtime settings. Mark the client secret and refresh token as secrets. Do not paste them into chat, GitHub or frontend code. The runtime refreshes access tokens before sending.
6. An external OAuth app in Testing normally has refresh tokens that expire after seven days for this scope. Use testing for the initial trial; resolve publishing status and any applicable Google verification requirements before relying on this sender throughout the league. Revoked/expired authorization requires reconnection.

This setup grants send-only access, not inbox reading. Only the sender authorizes Google; players use the league's existing email links. A ChatGPT Gmail plugin connection does not automatically authorize the deployed app. Delivery failures invalidate the newly created login token and return a generic retry message. No fallback sender is selected automatically.

### Own domain (later)

Set `MAIL_PROVIDER=resend`. Create a Resend account, verify a sender domain you control, and configure `RESEND_API_KEY` and `MAIL_FROM`. Once delivery is verified, remove unused Gmail runtime secrets and revoke the old Google authorization.


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

- [Gmail send-only scope](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google OAuth Playground](https://developers.google.com/oauthplayground)
- [Refresh-token expiration](https://developers.google.com/identity/protocols/oauth2#expiration)
