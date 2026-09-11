# Commander League

An invitation-only browser app for a casual MTG Commander league. League members only need an invited email address.

## Version 0.3

- Members view standings, game results, dates and the configured handicap mode.
- Managers enter results and correct existing games with a reason.
- The owner sends direct invitation emails, assigns multiple managers, demotes them and revokes access.
- A commissioner can open the shared `/join` link and QR for a limited time and optional number of verified requests. Applicants verify their email before a pending request is created; an owner or manager must approve it.
- Passwordless email links expire after 15 minutes and work once. Sessions use a Secure, HttpOnly, SameSite cookie and expire after 30 days.
- Revocation and role changes invalidate sessions and outstanding login links.
- The shared join link or QR never grants access directly. Approval always creates a member account; only the owner can later promote it to manager.
- Results and subsequent handicaps are recalculated from the complete game history.
- Role enforcement, validation, stale-preview rejection and save serialization happen on the server.
- The audit log records actor, time, before/after data and correction reasons. Uncertain remote writes block further writes until the owner reconciles them.

## Architecture

The Worker serves the UI and API. D1 stores membership, hashed login/session/join-verification tokens, pending join requests, rate limits, audit history and the write lock. Google Sheets remains the source of truth for base points, dates and handicap rules. A Google service account connects the server to the sheet. Gmail (send-only OAuth) or Resend delivers verification and sign-in emails. Neither service is called directly from the browser.

The Apps Script edition was removed; it does not satisfy account-independent membership and multiple manager roles. Follow [SETUP.md](SETUP.md) for the new deployment.

The current spreadsheet contract is eight players and 35 prepared game slots: `Spiele!A1:N36` and `Regeln!B2:B12`. Changes to that structure require an adapter update. The app does not silently invent new rows or players. Original placements for new/corrected games are retained in the audit record. Historical games originally recorded only as base points cannot have every placement reconstructed, so corrections require re-entering the participants and placements.

## Development

Node 24+ is required for SQLite-backed tests. Runtime code has no external JS packages; Drizzle is used only to generate database migrations.

```sh
npm install
npm run build
npm test
```

For a schema change, edit `db/schema.ts`, then run `npm run db:generate`. Inspect the generated SQL; never rewrite a migration already applied to a deployment. No GitHub Actions workflow is installed.

UI sources live in `dist/`. `scripts/build.cjs` creates a Worker build in `dist/server/`, embeds the public assets, and copies migrations into `dist/.openai/`. `server/scoring.mjs` is generated from the browser scoring module.

## Validation and remaining setup

Automated tests exercise scoring, server route authorization, real SQLite queries, token redemption, revocation, concurrent saves, stale previews and uncertain-write recovery. The Google and email integrations need real credentials and an end-to-end trial against a copied sheet before live league use. Unit tests use fake addresses and a fake Sheets adapter; they send no email and change no Google data.

The `/demo` route uses fictional players and memory-only results. The main route is the real sign-in surface; without configuration it explains that the league is not ready. The committed QR contains only the public sign-in URL.

Manual spreadsheet edits and other scripts are not covered by the app's write lock. Make those edits between app operations; the revision check detects edits before a save but the Google values API does not provide a conditional row-write transaction. After a correction, subsequent handicaps may change intentionally. Global rule changes remain retrospective until rule versioning is added.

The email ownership and Google service-account keys are configured as server-side runtime secrets, never committed. A public hosting audience exposes the sign-in page, not private league data. Every league API requires an active app session.
