/**
 * app.js coordinates the popup: it loads tabs, turns them into profiles, reacts
 * to user choices, and asks focused modules to handle UI, matching, and storage.
 */

import { queryCurrentWindowTabs, watchClosedTabs } from "./tabs.js";
import { createProfiles } from "./profiles.js";
import { findBestMatch } from "./matching.js";
import { diagnoseTabHabits } from "./therapist.js";
import { clearHistory, loadHistory, markRelationshipEventsRead, recordDecision, recordEncounters } from "./storage.js";
import { createUI } from "./ui.js";

const state = {
  profiles: [],
  currentIndex: 0,
  history: null,
  previousView: "deck",
};

const ui = createUI({
  onPass: () => choose("pass"),
  onLike: () => choose("like"),
  onContinue: showNextProfile,
  onDeadContinue: showNextProfile,
  onRestart: restartDeck,
  onRetry: initialize,
  onOpenStats: openStats,
  onCloseStats: closeStats,
  onOpenTherapist: openTherapist,
  onCloseTherapist: closeOverlay,
  onClear: clearSavedHistory,
  onOpenFeed: openFeed,
  onOpenSingles: openSingles,
});

async function initialize() {
  ui.showLoading();

  try {
    const [tabs, history] = await Promise.all([
      queryCurrentWindowTabs(),
      loadHistory(),
    ]);

    state.profiles = createProfiles(tabs, history);
    state.currentIndex = 0;
    state.history = await recordEncounters(history, state.profiles);

    await openFeed();
  } catch (error) {
    console.error("Tabsolutely failed to start:", error);
    ui.showError(error instanceof Error ? error.message : "An unexpected browser error occurred.");
  }
}

function renderCurrentProfile() {
  const profile = state.profiles[state.currentIndex];

  if (!profile) {
    ui.showEmpty(
      "You’ve met everyone!",
      `That was ${state.profiles.length} potential ${state.profiles.length === 1 ? "match" : "matches"}. Your statistics await.`,
      true,
    );
    return;
  }

  ui.showProfile(profile, state.currentIndex + 1, state.profiles.length, state.history);
}

async function openFeed() {
  if (!state.history) return;
  ui.showFeed(state.history?.relationshipEvents ?? [], state.profiles);
  try {
    state.history = await markRelationshipEventsRead(state.history);
    await chrome.action.setBadgeText({ text: "" });
  } catch (error) {
    console.warn("Tabsolutely could not mark the feed as read:", error);
  }
}

function openSingles() {
  if (!state.history) return;
  if (state.profiles.length === 0) {
    ui.showEmpty("No eligible tabs", "Open a normal webpage, then try Tabsolutely again.", false);
    return;
  }
  renderCurrentProfile();
}

async function choose(decision) {
  const profile = state.profiles[state.currentIndex];
  if (!profile || ui.isAnimating()) return;

  await ui.animateDecision(decision);

  const candidates = decision === "like"
    ? state.profiles.filter((candidate, index) => index !== state.currentIndex && candidate.id !== profile.id)
    : [];
  const match = decision === "like" ? findBestMatch(profile, candidates) : null;

  try {
    state.history = await recordDecision(state.history, decision, profile, Boolean(match));
  } catch (error) {
    console.warn("The choice could not be saved, but swiping can continue.", error);
  }

  if (decision === "like") {
    state.currentIndex += 1;

    if (match) {
      ui.showMatch(profile, match.profile, match.result);
      return;
    }
  } else {
    state.currentIndex += 1;
  }

  renderCurrentProfile();
}

function showNextProfile() {
  renderCurrentProfile();
}

function restartDeck() {
  state.currentIndex = 0;
  renderCurrentProfile();
}

function openStats() {
  state.previousView = ui.currentView();
  ui.showStats(state.history);
}

function closeStats() {
  ui.restoreView(state.previousView);
}

function openTherapist() {
  state.previousView = ui.currentView();
  ui.showTherapist(diagnoseTabHabits(state.profiles));
}

function closeOverlay() {
  ui.restoreView(state.previousView);
}

async function clearSavedHistory() {
  const confirmed = window.confirm("Clear all likes, passes, matches, and Tabsolutely statistics?");
  if (!confirmed) return;

  state.history = await clearHistory();
  ui.showStats(state.history);
}

function handleClosedTab(tabId) {
  const removedIndex = state.profiles.findIndex((profile) => profile.id === tabId);
  if (removedIndex < 0) return;

  const [departedProfile] = state.profiles.splice(removedIndex, 1);
  if (removedIndex < state.currentIndex) state.currentIndex -= 1;
  ui.showDeadTab(departedProfile);
}

document.addEventListener("keydown", (event) => {
  if (ui.currentView() !== "deck" || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowLeft") choose("pass");
  if (event.key === "ArrowRight") choose("like");
});

watchClosedTabs(handleClosedTab);
initialize();
