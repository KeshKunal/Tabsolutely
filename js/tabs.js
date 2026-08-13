/**
 * tabs.js is the only module that reads browser tabs. Keeping browser API calls
 * here makes privacy-sensitive access easy to find, explain, and test.
 */

/** Return tabs from the current window without sending their data anywhere. */
export async function queryCurrentWindowTabs() {
  if (!globalThis.chrome?.tabs?.query) {
    throw new Error("The Tabs API is unavailable. Open Tabsolutely from its browser toolbar icon.");
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.filter((tab) => !tab.url?.startsWith("chrome-extension://"));
}

/** Watch real tab closures for as long as the extension popup remains open. */
export function watchClosedTabs(onClosed) {
  if (!globalThis.chrome?.tabs?.onRemoved) return () => {};

  const listener = (tabId) => onClosed(tabId);
  chrome.tabs.onRemoved.addListener(listener);
  return () => chrome.tabs.onRemoved.removeListener(listener);
}
