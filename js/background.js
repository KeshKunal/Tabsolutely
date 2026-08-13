/**
 * background.js is Tabsolutely's Manifest V3 matchmaker. It wakes for tab
 * lifecycle events, creates local relationships, stores them, and notifies only
 * for notable chemistry subject to a global cooldown.
 */

import { createProfiles } from "./profiles.js";
import { findBestMatch } from "./matching.js";
import {
  loadHistory,
  recordEncounters,
  recordNotificationSent,
  recordRelationshipEvent,
} from "./storage.js";

const NOTIFICATION_COOLDOWN_MS = 45_000;
const PROCESSED_TABS_KEY = "tabsolutelyProcessedTabs";
let matchmakingQueue = Promise.resolve();

chrome.tabs.onCreated.addListener((tab) => enqueueTab(tab));
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") enqueueTab(tab);
});
chrome.tabs.onRemoved.addListener((tabId) => forgetTab(tabId));

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#d92f68" });
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  await chrome.notifications.clear(notificationId);
  if (chrome.action.openPopup) await chrome.action.openPopup().catch(() => {});
});

function enqueueTab(tab) {
  matchmakingQueue = matchmakingQueue
    .then(() => processCandidate(tab))
    .catch((error) => console.warn("Tabsolutely matchmaker skipped an event:", error));
}

async function processCandidate(tab) {
  if (!tab?.id || tab.windowId == null || !isMatchableUrl(tab.url)) return;

  const processed = await loadProcessedTabs();
  const signature = domainOf(tab.url);
  if (processed[tab.id] === signature) return;
  processed[tab.id] = signature;
  await chrome.storage.session.set({ [PROCESSED_TABS_KEY]: processed });

  const openTabs = (await chrome.tabs.query({ windowId: tab.windowId })).filter((candidate) => isMatchableUrl(candidate.url));
  const otherTabs = openTabs.filter((candidate) => candidate.id !== tab.id);
  if (otherTabs.length === 0) return;

  let history = await loadHistory();
  const profiles = createProfiles([...otherTabs, tab], history);
  const newcomer = profiles.find((profile) => profile.id === tab.id);
  const existingProfiles = profiles.filter((profile) => profile.id !== tab.id);
  if (!newcomer) return;

  const match = findBestMatch(newcomer, existingProfiles);
  if (!match) return;

  const event = createRelationshipEvent(newcomer, match.profile, match.result);
  history = await recordRelationshipEvent(history, event);
  history = await recordEncounters(history, [newcomer]);

  await updateBadge(history.unreadEvents);
  if (isNotable(event) && Date.now() - history.lastNotificationAt >= NOTIFICATION_COOLDOWN_MS) {
    await showNotification(event);
    await recordNotificationSent(history);
  }
}

function createRelationshipEvent(first, second, result) {
  const duplicate = first.domain === second.domain;
  const rivalry = /rival|toxic|enemy/i.test(`${result.label} ${result.tier}`);
  return {
    id: `relationship-${Date.now()}-${first.id}`,
    timestamp: Date.now(),
    kind: duplicate ? "duplicate" : rivalry ? "rivalry" : "match",
    first: partnerSnapshot(first),
    second: partnerSnapshot(second),
    score: result.score,
    tier: result.tier,
    label: result.label,
    reason: result.reasons[0],
    dialogue: result.dialogue,
  };
}

function partnerSnapshot(profile) {
  return { name: profile.name, domain: profile.domain, category: profile.category };
}

function isNotable(event) {
  return event.score >= 70 || event.score <= 54 || event.kind !== "match";
}

async function showNotification(event) {
  const title = event.kind === "duplicate"
    ? "Cheating detected"
    : event.kind === "rivalry" ? "Browser rivalry detected" : `${event.tier}: new relationship`;
  const message = `${event.first.name} + ${event.second.name} · ${event.score}%\n${event.reason}`;
  await chrome.notifications.create(event.id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
    contextMessage: "Tabsolutely · Your tabs are meeting behind your back.",
    priority: 1,
  });
}

async function updateBadge(unreadCount) {
  await chrome.action.setBadgeText({ text: unreadCount > 0 ? String(Math.min(unreadCount, 99)) : "" });
}

async function loadProcessedTabs() {
  const result = await chrome.storage.session.get(PROCESSED_TABS_KEY);
  return result[PROCESSED_TABS_KEY] ?? {};
}

async function forgetTab(tabId) {
  const processed = await loadProcessedTabs();
  delete processed[tabId];
  await chrome.storage.session.set({ [PROCESSED_TABS_KEY]: processed });
}

function isMatchableUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function domainOf(value) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "unknown-site"; }
}
