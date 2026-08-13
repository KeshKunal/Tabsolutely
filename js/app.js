/**
 * app.js opens Tabsolutely's small local drama feed and its optional diagnosis.
 * Automatic matching continues in background.js while this popup is closed.
 */

import { queryCurrentWindowTabs } from "./tabs.js";
import { createProfiles } from "./profiles.js";
import { diagnoseTabHabits } from "./therapist.js";
import { clearHistory, loadHistory, markRelationshipEventsRead, recordEncounters } from "./storage.js";
import { createUI } from "./ui.js";

const state = { profiles: [], history: null, previousView: "feed" };

const ui = createUI({
  onRetry: initialize,
  onOpenStats: openStats,
  onCloseStats: closeOverlay,
  onOpenTherapist: openTherapist,
  onCloseTherapist: closeOverlay,
  onClear: clearSavedHistory,
});

async function initialize() {
  ui.showLoading();

  try {
    const [tabs, history] = await Promise.all([queryCurrentWindowTabs(), loadHistory()]);
    state.profiles = createProfiles(tabs, history);
    state.history = await recordEncounters(history, state.profiles);
    await openFeed();
  } catch (error) {
    console.error("Tabsolutely failed to start:", error);
    ui.showError(error instanceof Error ? error.message : "An unexpected browser error occurred.");
  }
}

async function openFeed() {
  if (!state.history) return;
  ui.showFeed(state.history.relationshipEvents, state.profiles);

  try {
    state.history = await markRelationshipEventsRead(state.history);
    await chrome.action.setBadgeText({ text: "" });
  } catch (error) {
    console.warn("Tabsolutely could not mark the feed as read:", error);
  }
}

function openStats() {
  state.previousView = ui.currentView();
  ui.showStats(state.history);
}

function openTherapist() {
  state.previousView = ui.currentView();
  ui.showTherapist(diagnoseTabHabits(state.profiles));
}

function closeOverlay() {
  ui.restoreView(state.previousView);
}

async function clearSavedHistory() {
  const confirmed = window.confirm("Clear Tabsolutely's local drama feed and statistics?");
  if (!confirmed) return;

  state.history = await clearHistory();
  await openFeed();
}

initialize();
