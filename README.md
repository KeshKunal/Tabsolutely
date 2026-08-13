# Tabsolutely

**Your tabs deserve love too.**

Tabsolutely is a humorous, privacy-friendly Chromium extension that turns currently open tabs into fictional dating profiles. Pass, like, discover ridiculous chemistry, receive a browser diagnosis, encounter jealous exes, and witness the occasional tab wedding.

## Features

- Live dating profiles generated locally from open tabs
- Rule-based categories, biographies, traits, green flags, and red flags
- Like/pass buttons, arrow-key controls, and swipe animations
- Deterministic compatibility scores with humorous explanations
- Returning Tab Exes with rejection times and dramatic choices
- Tab Therapist diagnoses based on real current-window statistics
- Dead Tab notices driven by real `chrome.tabs.onRemoved` events
- Jealous reactions when competing services appear together
- Tab Marriage ceremonies for compatibility scores of 95% or higher
- Local statistics, clear-history control, empty states, and error recovery
- Accessible labels, visible focus, live regions, and reduced-motion support

## Privacy

Tabsolutely has no server, analytics, accounts, database, advertising SDK, or AI API. Tab details are processed only while the popup is open and are never transmitted.

The extension stores only:

- totals for viewed, liked, passed, and matched profiles;
- aggregate liked and passed domain counts;
- the most recent rejection timestamp for a passed domain.

It does **not** store full URLs, page titles, browsing history, page contents, or favicons. Select **Statistics**, then **Clear my dating history** to remove all saved Tabsolutely data.

## Project structure

```text
Tabsolutely/
|-- css/
|   `-- popup.css       # Layout, visual system, states, and animations
|-- js/
|   |-- app.js          # Application state and event coordination
|   |-- matching.js     # Compatibility and wedding logic
|   |-- profiles.js     # Profile, flag, and jealousy generation
|   |-- storage.js      # Privacy-limited local persistence
|   |-- tabs.js         # Tab queries and lifecycle events
|   |-- therapist.js    # Current-window browser diagnosis rules
|   `-- ui.js           # DOM rendering and interaction feedback
|-- .gitignore
|-- manifest.json       # Manifest V3 metadata and permissions
|-- popup.html          # Accessible structure for every popup view
`-- README.md
```

Every HTML, CSS, and JavaScript file starts with a comment describing its responsibility. JSON cannot contain comments, so `manifest.json` is explained here.

## Libraries and permissions

There are no external libraries. Tabsolutely uses HTML, CSS, vanilla JavaScript modules, and two built-in browser APIs:

- `chrome.tabs` reads tabs in the current window and detects closures. The `tabs` permission provides titles, URLs, favicons, and lifecycle access.
- `chrome.storage.local` saves privacy-limited decisions on the device. The `storage` permission enables it.

There is no package manager, bundler, build command, backend, database, or API key.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this folder—the folder containing `manifest.json`.
5. Pin Tabsolutely from the Extensions menu and click its toolbar icon.

## Install in Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project folder.
5. Open Tabsolutely from its toolbar icon.

After changing a file, reload Tabsolutely from the extensions page and reopen its popup.

## How the code flows

1. Chromium reads `manifest.json` and opens `popup.html` from the toolbar action.
2. `app.js` loads saved choices and requests current-window tabs through `tabs.js`.
3. `profiles.js` converts raw tabs into safe profile objects and compares rival domains.
4. `ui.js` renders profiles and reports user actions to `app.js`.
5. A like asks `matching.js` to find the strongest partner. Scores of at least 95% include a deterministic wedding plan.
6. `storage.js` saves only aggregate decisions, domain counts, and rejection timestamps.
7. `therapist.js` analyzes current profile statistics without reading or storing additional browser data.
8. While the popup is open, `tabs.js` listens for real tab closures and `app.js` displays a Dead Tab interruption.

## Test checklist

### Core experience

- Open several ordinary pages and confirm each becomes a profile.
- Test Pass, Like, Left Arrow, and Right Arrow.
- Confirm a like produces a score, reasons, relationship label, and correctly filled score ring.
- Finish the deck and restart it.
- Verify statistics and clear all saved history.

### Next-phase features

- Pass YouTube, reload the extension, and confirm its next profile says **Your ex is back**.
- Open several duplicates and distracting sites, then select **Tab Therapist** and inspect the diagnosis.
- Keep the popup open and close one of its profiled browser tabs. Confirm the Dead Tab notice appears.
- Open GitHub and GitLab together, or Google and Bing, and confirm their profiles become jealous.
- Open two pinned tabs from `google.com`, like one, and confirm a score of at least 95% produces a wedding.

### Resilience and accessibility

- Try `chrome://extensions` or `edge://settings`; it should become a Mysterious Stranger.
- Test a missing favicon, a muted tab, pinned tabs, and duplicate domains.
- Navigate every button with the keyboard and check the visible focus indicator.
- Enable reduced motion in the operating system and confirm the experience remains usable.

## Troubleshooting

**Manifest is unreadable:** Select the folder containing `manifest.json`. JSON does not allow comments or trailing commas.

**Changes do not appear:** Reload the extension from `chrome://extensions` or `edge://extensions`, then close and reopen the popup.

**The Tabs API is unavailable:** Open Tabsolutely from its installed toolbar action rather than opening `popup.html` as a normal file.

**A module fails to load:** Inspect the popup and check the Console. Confirm the filenames and relative import paths inside `js/` match exactly.

**An ex does not return:** Pass the profile once, keep or reopen a tab from the same domain, then reopen Tabsolutely. Ex detection intentionally uses domains rather than full URLs.

**Dead Tabs do not appear:** The popup must remain open when the browser tab closes; extension popups stop running when dismissed.

**Text looks corrupted:** Save files as UTF-8. `popup.html` explicitly declares UTF-8.

## Future experiments

Strong future candidates include Toxic Relationship reports, a two-tab battle arena, breakups that optionally close tabs, custom extension icons, and a controlled competition demo mode. New features should remain local and request no additional permission without a concrete browser-native reason.
