# Tabsolutely

**Your tabs have a life of their own.**

Tabsolutely is a small, local-first Chromium extension that turns normal browsing into a tiny browser soap opera. It quietly notices notable tab chemistry, records the funniest moments, and lets you catch up later in a compact feed.

## What it does

- Watches relevant tab events locally in a Manifest V3 service worker.
- Creates occasional relationship, rivalry, and duplicate-tab moments.
- Shows rate-limited desktop notifications only for noteworthy drama.
- Keeps a bounded local feed of recent moments.
- Includes an optional playful browser diagnosis and small local statistics view.

There is no server, analytics, account, AI API, or remote browsing-data collection. The extension never stores full URLs or page titles in its relationship feed.

## Install

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this project folder.
4. Reload the extension after source changes, then reopen the popup.

The extension requests only `tabs`, `storage`, and `notifications`: tabs enable local relationship detection, storage keeps the local drama feed, and notifications announce only notable moments.

## Architecture

```text
browser tab event
  -> js/background.js
  -> evidence + profiles + matching
  -> local storage + optional notification
  -> popup feed
```

- `background.js`: event-driven automatic matchmaker.
- `profiles.js`, `relationships.js`, `matching.js`: local personality and relationship rules.
- `storage.js`: bounded, local relationship history.
- `app.js` and `ui.js`: feed, diagnosis, and statistics popup.

## Visual assets

The popup bundles local DM Serif Display and Manrope fonts from [Google Fonts](https://fonts.google.com/) (SIL Open Font License). Its small heart animation is from [Sam Herbert’s SVG Loaders](https://github.com/SamHerbert/SVG-Loaders), licensed under MIT; the license is included at `assets/motion/SVG-LOADERS-LICENSE.txt`.

## Privacy

Use **Clear local drama** in the popup to remove Tabsolutely’s saved feed, relationships, and summary data from this browser.
