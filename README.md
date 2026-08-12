# Tabsolutely

**Your tabs deserve love too.**

Tabsolutely is a humorous, privacy-friendly Chromium extension that turns currently open tabs into fictional dating profiles. Pass on a tab, like it, discover its best match in your current window, and inspect your wonderfully questionable dating statistics.

## What the MVP includes

- Live profiles generated from open tabs using local rules
- Website categories, bios, personality traits, green flags, and red flags
- Like/pass buttons, arrow-key controls, and swipe animations
- Deterministic compatibility scores with humorous explanations
- A match screen and relationship classifications
- Local likes, passes, matches, favorite-domain statistics, and clear-data control
- Safe fallbacks for missing favicons, titles, URLs, restricted pages, API errors, and small tab sets
- Reduced-motion support, visible focus states, semantic controls, and live status announcements

## Privacy

Tabsolutely has no server, analytics, accounts, database, advertising SDK, or AI API. Tab details are processed only while the popup is open and are never transmitted.

The extension stores only aggregate Tabsolutely decisions:

- number of profiles viewed, liked, passed, and matched;
- counts of liked and passed domains.

It does **not** store full URLs, page titles, complete browsing history, page contents, or favicons. Use **Statistics → Clear my dating history** to remove all saved Tabsolutely data.

## Project structure

```text
Tabsolutely/
|-- manifest.json       # Manifest V3 metadata and minimum permissions
|-- popup.html          # Accessible structure for each popup screen
|-- css/
|   `-- popup.css       # Layout, visual system, states, and animations
`-- js/
    |-- app.js          # Application state and event coordination
    |-- tabs.js         # The single boundary around chrome.tabs
    |-- profiles.js     # Local tab classification and profile rules
    |-- matching.js     # Deterministic compatibility calculation
    |-- storage.js      # Privacy-limited chrome.storage.local access
    `-- ui.js           # DOM rendering and interaction feedback
```

Every HTML, CSS, and JavaScript file starts with a comment describing its job. JSON cannot contain comments, so the manifest is explained here.

## Necessary libraries

None. Tabsolutely uses HTML, CSS, vanilla JavaScript modules, and two built-in browser APIs:

- `chrome.tabs` reads tabs in the current window. The `tabs` permission is needed for titles, URLs, and favicons.
- `chrome.storage.local` saves aggregate decisions on the device. The `storage` permission enables it.

There is no package manager, bundler, build step, backend, database, or API key.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this folder—the one containing `manifest.json`.
5. Pin Tabsolutely from the Extensions menu and click its toolbar icon.

## Install in Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project folder.
5. Open Tabsolutely from its toolbar icon.

After editing a file, use the reload button on the extension card, then close and reopen the popup.

## How the code flows

1. Chromium reads `manifest.json` and opens `popup.html` when the toolbar action is clicked.
2. `app.js` loads saved choices and asks `tabs.js` for current-window tabs.
3. `profiles.js` converts each raw tab into a plain profile object. Unknown and protected browser pages receive fallbacks instead of crashing.
4. `ui.js` renders the current card and returns user actions to `app.js`.
5. A pass advances the deck. A like asks `matching.js` to score every other profile and display the highest-scoring partner.
6. `storage.js` saves only the aggregate choice and domain count.

This separation keeps each concept small: browser access, data transformation, calculation, persistence, presentation, and coordination.

## Compatibility scoring

The algorithm starts from a base score and adds understandable bonuses for:

- compatible or matching categories;
- both tabs being pinned;
- active-tab attention;
- same-domain chemistry;
- productive/distraction balance;
- a small deterministic domain-pair bonus.

Scores map to Soulmates, Great match, Could work, It’s complicated, or Absolutely not. No random number or external service is used, so the same pair stays consistent.

## Test checklist

- Open two or more regular pages and confirm each becomes a profile.
- Test both buttons and the Left/Right Arrow keys.
- Like a profile and confirm a match, score, reasons, and Continue button appear.
- Finish the deck and restart it.
- Open Statistics, verify totals, clear them, and confirm all values return to zero.
- Try a restricted page such as `chrome://extensions` or `edge://settings`; it should become a Mysterious Stranger.
- Test a tab without a favicon and confirm the heart fallback appears.
- Mute, pin, or duplicate a tab and look for corresponding profile flags.
- Temporarily remove the `tabs` permission, reload, and confirm the error screen offers Retry; restore the permission afterward.
- Enable reduced motion in the operating system and confirm the popup remains usable.

## Troubleshooting

**Manifest is unreadable:** Select the folder containing `manifest.json`. JSON does not allow comments or trailing commas.

**Changes do not appear:** Reload the extension on its extensions page, then close and reopen the popup.

**Popup says the Tabs API is unavailable:** Open it from the installed toolbar action, not by opening `popup.html` as a normal file.

**A module fails to load:** Check the popup’s developer console and confirm the `js/` filenames and import paths match exactly.

**Text looks corrupted:** Save files as UTF-8. `popup.html` explicitly declares UTF-8.

## Ideas beyond the MVP

Possible later experiments include tab jealousy, returning “ex” tabs, breakups that close a tab, relationship advice, custom icons, and a competition demo mode. These should remain local and request no new permissions unless the feature genuinely requires one.
