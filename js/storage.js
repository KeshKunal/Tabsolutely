/**
 * storage.js saves only Tabsolutely decisions and aggregate domain counts.
 * It deliberately does not persist full URLs, page titles, or browsing history.
 */

const STORAGE_KEY = "tabsolutelyHistory";

export function emptyHistory() {
  return { viewed: 0, likes: 0, passes: 0, matches: 0, likedDomains: {}, passedDomains: {}, lastPassedAt: {}, domainMemory: {} };
}

export async function loadHistory() {
  if (!globalThis.chrome?.storage?.local) return emptyHistory();
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeHistory(result[STORAGE_KEY]);
}

export async function recordDecision(current, decision, profile, createdMatch = false) {
  const history = normalizeHistory(current);
  history.viewed += 1;

  if (decision === "like") {
    history.likes += 1;
    if (createdMatch) history.matches += 1;
    increment(history.likedDomains, profile.domain);
  } else {
    history.passes += 1;
    increment(history.passedDomains, profile.domain);
    history.lastPassedAt[profile.domain] = Date.now();
  }

  await save(history);
  return history;
}

/** Remember aggregate encounters without persisting titles, paths, or full URLs. */
export async function recordEncounters(current, profiles) {
  const history = normalizeHistory(current);
  const now = Date.now();
  const domains = new Set(profiles.map((profile) => profile.domain));

  domains.forEach((domain) => {
    const existing = history.domainMemory[domain] ?? {};
    history.domainMemory[domain] = {
      firstSeenAt: existing.firstSeenAt ?? now,
      lastSeenAt: now,
      encounters: numberOrZero(existing.encounters) + 1,
    };
  });

  await save(history);
  return history;
}

export async function clearHistory() {
  const history = emptyHistory();
  if (globalThis.chrome?.storage?.local) await chrome.storage.local.remove(STORAGE_KEY);
  return history;
}

function normalizeHistory(value) {
  const defaults = emptyHistory();
  if (!value || typeof value !== "object") return defaults;
  return {
    viewed: numberOrZero(value.viewed),
    likes: numberOrZero(value.likes),
    passes: numberOrZero(value.passes),
    matches: numberOrZero(value.matches),
    likedDomains: objectOrEmpty(value.likedDomains),
    passedDomains: objectOrEmpty(value.passedDomains),
    lastPassedAt: objectOrEmpty(value.lastPassedAt),
    domainMemory: normalizeDomainMemory(value.domainMemory),
  };
}

async function save(history) {
  if (globalThis.chrome?.storage?.local) await chrome.storage.local.set({ [STORAGE_KEY]: history });
}

function increment(record, key) {
  record[key] = (record[key] ?? 0) + 1;
}

function numberOrZero(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function normalizeDomainMemory(value) {
  const memory = objectOrEmpty(value);
  return Object.fromEntries(Object.entries(memory).map(([domain, entry]) => [domain, {
    firstSeenAt: numberOrZero(entry?.firstSeenAt),
    lastSeenAt: numberOrZero(entry?.lastSeenAt),
    encounters: numberOrZero(entry?.encounters),
  }]));
}
