# Tabsolutely

**Your tabs deserve love too.**

Tabsolutely is a playful Chromium extension that will turn open browser tabs into fictional dating profiles. This first stage is intentionally small: it proves that a Manifest V3 extension can load, open a styled popup, and run JavaScript modules correctly.

## Privacy promise

Tabsolutely is designed to work entirely inside your browser. It has no backend, analytics, accounts, or external requests. Stage 1 asks for no browser permissions and stores nothing. Later stages will request only the permissions needed to read open tabs and save Tabsolutely decisions locally; tab data will never be transmitted to a server.

## Project structure

```text
Tabsolutely/
|-- manifest.json       # Tells Chromium how to install and open the extension.
|-- popup.html          # Provides the popup's accessible HTML structure.
|-- README.md           # Explains the project, files, and learning workflow.
|-- css/
|   `-- popup.css       # Controls the popup's visual design and states.
`-- js/
    |-- app.js          # Starts the popup and coordinates its modules.
    `-- ui.js           # Updates elements that the user can see.
```

Every source file starts with a short description of its responsibility. JSON does not support comments, so `manifest.json` explains the extension through its required `description` field and is documented here.

## How Stage 1 works

1. Chromium reads `manifest.json` when you load the folder. `manifest_version: 3` selects the current extension platform, while `action.default_popup` tells the browser to open `popup.html` when the toolbar icon is clicked.
2. `popup.html` creates the semantic page structure and loads `css/popup.css`.
3. The script tag uses `type="module"`, which enables JavaScript `import` and `export` syntax.
4. `js/app.js` imports `showReadyState` from `js/ui.js` and calls it after the HTML is ready.
5. `showReadyState` finds the loading message, updates its text, and adds a CSS class that turns it green.

The loading text remains useful if JavaScript fails: instead of a blank popup, you can see which part did not finish.

## Libraries

There are no libraries to install in Stage 1. The project uses only:

- HTML for structure;
- CSS for appearance and responsive popup sizing;
- vanilla JavaScript modules for behavior;
- Chromium extension APIs in later stages.

That means there is no `npm install`, build command, framework, server, database, or API key. Edit the files and reload the extension.

## Load it in Google Chrome

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** in the top-right corner.
3. Select **Load unpacked**.
4. Choose this `Tabsolutely` project folder—the folder containing `manifest.json`.
5. Pin Tabsolutely from the browser's Extensions menu if you want easy access.
6. Click its toolbar icon. The popup should say **Extension loaded — ready to match!**

## Load it in Microsoft Edge

1. Open `edge://extensions` in Edge.
2. Turn on **Developer mode** in the sidebar.
3. Select **Load unpacked**.
4. Choose this `Tabsolutely` project folder.
5. Click the Tabsolutely toolbar icon and confirm that the ready message appears.

## Test changes while learning

After editing a file, return to the extensions page and click the reload button on the Tabsolutely card. Close and reopen the popup because extension popups are recreated each time they open.

Check these Stage 1 outcomes:

- the extension card reports no manifest errors;
- clicking the toolbar icon opens a compact pink popup;
- the text is readable and the layout is not clipped;
- the gray loading message changes to a green ready message;
- keyboard focus will have a visible purple outline when interactive controls arrive.

To inspect an error, right-click inside the popup and choose **Inspect**. The Console tab shows JavaScript and loading errors. On the extensions page, Chromium may also display an **Errors** button on the extension card.

## Common errors

### Manifest file is missing or unreadable

Make sure you selected the folder containing `manifest.json`, not its parent or one of its subfolders. JSON requires double quotes and does not permit comments or trailing commas.

### The popup is unstyled

Confirm that `css/popup.css` exists and that this path in `popup.html` has not changed. Reload the extension after fixing it.

### The message stays on "Loading the extension..."

Open the popup inspector and check the Console. Confirm that both JavaScript files are inside `js/`, and keep `type="module"` on the script element so imports work.

### Changes do not appear

Reload the extension from `chrome://extensions` or `edge://extensions`, then close and reopen the popup. Refreshing a normal browser tab does not reload extension files.

### Emoji or punctuation looks corrupted

Save source files as UTF-8. The HTML already declares UTF-8 with `<meta charset="UTF-8">`.

## Learning roadmap

Each stage should remain small, be tested in the browser, and work before the next begins.

1. **Starter popup:** load the manifest, styled HTML, and JavaScript modules.
2. **Count open tabs:** add the minimum Tabs API permission and call `chrome.tabs.query()`.
3. **Build one profile:** safely turn one tab's title, URL, and favicon into a dating card.
4. **Pass:** move to the next local profile with a short left-swipe animation.
5. **Like:** record a like in memory and move right.
6. **Compatibility:** calculate a deterministic humorous score from tab categories and state.
7. **Match screen:** display the score, explanation, and relationship label.
8. **Local history:** introduce `chrome.storage.local`, statistics, and a clear-data control.
9. **Personality rules:** add local bios, categories, green flags, and red flags.
10. **Polish:** improve animations, empty states, accessibility, visual branding, and icons.
11. **Test:** cover missing titles, invalid URLs, restricted pages, duplicates, and API failures.
12. **Demo:** document privacy, package the extension, and prepare a short competition walkthrough.

Later modules such as `tabs.js`, `profiles.js`, `matching.js`, and `storage.js` will be added only when their stage begins. This keeps every new file connected to a concept you are actively learning.
