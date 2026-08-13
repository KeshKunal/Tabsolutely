/**
 * evidence.js extracts privacy-safe facts from live tabs and local aggregate
 * history. Evidence exists only while the popup is open and is never uploaded.
 */

const RESTRICTED_SCHEMES = new Set(["chrome:", "edge:", "about:", "devtools:"]);

export function extractEvidence(tabs, history = {}) {
  const basics = tabs.map(readTab);
  const domainCounts = countBy(basics, (tab) => tab.domain);

  return basics.map((tab) => {
    const memory = history.domainMemory?.[tab.domain] ?? {};
    return {
      ...tab,
      totalTabs: tabs.length,
      duplicateCount: domainCounts[tab.domain] ?? 1,
      firstSeenAt: memory.firstSeenAt ?? 0,
      previousEncounters: memory.encounters ?? 0,
      pathSignals: meaningfulSignals(tab.path, tab.title),
    };
  });
}

function readTab(tab) {
  try {
    const url = new URL(tab.url || "");
    const restricted = RESTRICTED_SCHEMES.has(url.protocol);
    const hostname = restricted ? "private-page" : url.hostname.replace(/^www\./, "") || "unknown-site";
    return baseEvidence(tab, {
      restricted,
      domain: hostname,
      subdomain: restricted ? "" : subdomainOf(hostname),
      path: restricted ? "" : decodePath(url.pathname),
    });
  } catch {
    return baseEvidence(tab, { restricted: true, domain: "unknown-site", subdomain: "", path: "" });
  }
}

function baseEvidence(tab, urlFacts) {
  return {
    id: tab.id ?? `${urlFacts.domain}-${tab.index ?? 0}`,
    title: cleanTitle(tab.title),
    favicon: safeFavicon(tab.favIconUrl),
    pinned: Boolean(tab.pinned),
    active: Boolean(tab.active),
    audible: Boolean(tab.audible),
    muted: Boolean(tab.mutedInfo?.muted),
    windowId: tab.windowId,
    ...urlFacts,
  };
}

function meaningfulSignals(path, title) {
  const source = `${path} ${title}`.toLowerCase();
  const vocabulary = ["ysws", "project", "repo", "issue", "pull", "watch", "playlist", "course", "lesson", "docs", "sheet", "cart", "checkout", "search", "final", "dashboard", "login"];
  return vocabulary.filter((word) => source.includes(word));
}

function subdomainOf(hostname) {
  const parts = hostname.split(".");
  return parts.length > 2 ? parts.slice(0, -2).join(".") : "";
}

function decodePath(pathname) {
  try {
    return decodeURIComponent(pathname).slice(0, 160);
  } catch {
    return pathname.slice(0, 160);
  }
}

function cleanTitle(title) {
  return typeof title === "string" && title.trim() ? title.trim().slice(0, 120) : "Untitled, but emotionally available";
}

function safeFavicon(value) {
  return typeof value === "string" && /^(https?:|data:image\/|chrome-extension:)/.test(value) ? value : "";
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
