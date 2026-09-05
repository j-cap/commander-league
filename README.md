# Commander League

A mobile-friendly score-entry app for a casual MTG Commander league. Select participants and placements, review base points and handicaps, then save into the existing **Spiele** tab. Sheets remains the source of truth.

## Two editions, one interface

- **Demo:** `dist/index.html`, served as a static website. Fictional players, in-memory results, no spreadsheet connection. Reload resets everything.
- **Live:** `apps-script/Index.html` and the two `.gs` files, hosted as a Google Apps Script web app. Reads the sheet at runtime and writes only the eight base-point cells for the next prepared game.

Live Google authorization and deployment are not performed by committing this repository. Follow [the setup guide](SETUP.md).

## Implemented

- Participant selection, placements and tied-place scoring (1, 2, 2, 4).
- Point preview using the current league leader, including absent players.
- Per-game or per-day handicap from each game's existing setting.
- Fractional points without rounding stored values.
- Server-side recalculation, stale-preview detection and a script lock against competing app submissions.
- Existing games cannot be overwritten or accidentally saved twice by retrying a request.
- Standings and an explicit demo/live indicator.

## Development

Requires Node.js 20+; no third-party packages or installation needed.

```sh
npm test
npm run build
```

The build regenerates Apps Script HTML and its shared scoring code from `dist/`. Edit `dist/` for UI/scoring and `apps-script/Code.gs` for the backend. Commit generated Apps Script files so setup requires no local development tools. No GitHub Actions workflow is installed.

## Scope and constraints

Version 0.1 targets the current eight-player, 35-game prepared workbook layout (`Spiele!A1:N36`, `Wertung!C2:K281`, `Regeln!B2:B12`). It records only the next empty game, preserving chronological handicap calculations. More players, extra game slots, editing old results and new seasons need explicit schema support before use. Placements are converted to base points; the sheet does not yet persist the original placements independently. Global rule changes remain retrospective in the sheet.

For now, make direct spreadsheet edits between app submissions, not simultaneously. Apps Script locks serialize this app's writes; they do not lock out manual edits or other scripts. If a save reports an error after writing, reload: the saved row remains and cannot be submitted again.

The hosted demo uses fictional data. No sheet ID, league history, account credentials or access tokens belong in this public repository. Actual Google deployment and a round-trip test against a copied spreadsheet are still required before live use.
