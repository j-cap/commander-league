# Set up the live app (first deployment)

Use a computer for the one-time setup. Afterwards, the web app works from a phone browser.

## 1. Start with a test copy

In Google Sheets, choose **File → Make a copy** of the league workbook. Keep all four tabs. Use this copy for the first save test so the league standings are not changed by practice results.

## 2. Create the Apps Script project

Open the copy and choose **Extensions → Apps Script**. Name the project **Commander League**.

Copy the complete contents of these repository files into the script editor:

| Repository file | Apps Script file |
| --- | --- |
| `apps-script/Code.gs` | Replace the default `Code.gs` |
| `apps-script/Scoring.gs` | Add a Script file named `Scoring` |
| `apps-script/Index.html` | Add an HTML file named `Index` |

Use GitHub's **Raw** view when copying. The HTML is already built and self-contained.

## 3. Point it at the test spreadsheet

In Apps Script **Project Settings → Script properties**, add:

- Property: `SPREADSHEET_ID`
- Value: the ID between `/d/` and `/edit` in the copied spreadsheet URL.

Keep this configuration in Google, not in GitHub. Save the project.

## 4. Deploy for yourself

Choose **Deploy → New deployment → Web app**.

- **Execute as:** Me.
- **Who has access:** Only myself.

Deploy and authorize the script using the Google account that can edit the test spreadsheet. Review that the authorization request is for this script and its spreadsheet access. Copy the resulting web app URL ending in `/exec` and open it. Do not make an owner-executed web app anonymously accessible.

## 5. Verify one real round trip

1. Confirm the app shows the names, scores and next prepared game from the test copy.
2. Select four players and enter places **1, 2, 2, 4**.
3. Check base points **3, 1.5, 1.5, 0**, and the individual handicaps.
4. Save. Confirm the correct row in **Spiele** contains those base points, with absent players blank.
5. Confirm **Wertung** and **Rangliste** update and the app moves to the next game.
6. Open the app in two tabs. After saving in one, the old preview in the other must be rejected.

Test the per-day option only on the copy, selecting the same mode for every game of that day. Never change past modes on the live sheet just to test.

## 6. Switch to the real league

After the test succeeds, change `SPREADSHEET_ID` to the real league spreadsheet ID. Reload the app and verify the current standings before saving. You can keep the same script and deployment. Add the app URL to your phone home screen if convenient.

The first edition is for the organizer. Before granting the whole group access, decide who may submit results. An option is execution as the accessing user, requiring each submitter's Google authorization and spreadsheet edit access. This is a separate access decision, not enabled by the initial deployment.

## Updating the app later

Replace the three script files with the new repository version, then **Deploy → Manage deployments → Edit → New version → Deploy**. The existing app URL stays the same.

## Google documentation

- [Deploy a web app and choose its execution identity](https://developers.google.com/apps-script/guides/web)
- [Browser-to-server calls with google.script.run](https://developers.google.com/apps-script/guides/html/communication)

The ChatGPT Google Drive connection does not automatically authorize or deploy this separate application. Its first authorization must happen in your Google account.
