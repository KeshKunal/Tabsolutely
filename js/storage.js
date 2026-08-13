/**
 * storage.js saves only Tabsolutely decisions and aggregate domain counts.
 * It deliberately does not persist full URLs, page titles, or browsing history.
 */

const STORAGE_KEY = "tabsolutelyHistory";

export function emptyHistory() {
  return {
    matches: 0, domainMemory: {},
    relationshipEvents: [], unreadEvents: 0, lastNotificationAt: 0,
  };
}

export async function loadHistory() {
  if (!globalThis.chrome?.storage?.local) return emptyHistory();
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeHistory(result[STORAGE_KEY]);
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

/** Append one privacy-filtered automatic relationship event, newest first. */
export async function recordRelationshipEvent(current, event) {
  const history = normalizeHistory(current);
  history.relationshipEvents = [sanitizeEvent(event), ...history.relationshipEvents].slice(0, 50);
  history.unreadEvents += 1;
  history.matches += 1;
  await save(history);
  return history;
}

export async function recordNotificationSent(current, timestamp = Date.now()) {
  const history = normalizeHistory(current);
  history.lastNotificationAt = timestamp;
  await save(history);
  return history;
}

export async function markRelationshipEventsRead(current) {
  const history = normalizeHistory(current);
  history.unreadEvents = 0;
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
    matches: numberOrZero(value.matches),
    domainMemory: normalizeDomainMemory(value.domainMemory),
    relationshipEvents: normalizeEvents(value.relationshipEvents),
    unreadEvents: numberOrZero(value.unreadEvents),
    lastNotificationAt: numberOrZero(value.lastNotificationAt),
  };
}

async function save(history) {
  if (globalThis.chrome?.storage?.local) await chrome.storage.local.set({ [STORAGE_KEY]: history });
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

function normalizeEvents(value) {
  return Array.isArray(value) ? value.slice(0, 50).map(sanitizeEvent) : [];
}

function sanitizeEvent(event = {}) {
  return {
    id: String(event.id ?? ""),
    timestamp: numberOrZero(event.timestamp),
    kind: String(event.kind ?? "match"),
    first: sanitizePartner(event.first),
    second: sanitizePartner(event.second),
    score: Math.min(99, numberOrZero(event.score)),
    tier: String(event.tier ?? "Unexpected chemistry"),
    label: String(event.label ?? "Unexpected chemistry"),
    reason: String(event.reason ?? "The browser refuses to elaborate."),
    dialogue: {
      first: String(event.dialogue?.first ?? "Interesting."),
      second: String(event.dialogue?.second ?? "Very interesting."),
    },
  };
}

function sanitizePartner(partner = {}) {
  return {
    name: String(partner.name ?? "Unknown Tab"),
    domain: String(partner.domain ?? "unknown-site"),
    category: String(partner.category ?? "Wildcard"),
  };
}
