/**
 * ui.js owns all DOM reads and visible updates. The rest of the app passes it
 * plain data, so browser logic and presentation stay separate.
 */

const FALLBACK_FAVICON = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#ffe0ea"/><text x="32" y="43" text-anchor="middle" font-size="34" fill="#d9366e">♥</text></svg>`);

export function createUI(handlers) {
  const elements = collectElements();
  const views = [...document.querySelectorAll(".view")];
  let activeView = "loading";
  let animating = false;

  bind(elements.passButton, handlers.onPass);
  bind(elements.likeButton, handlers.onLike);
  bind(elements.continueButton, handlers.onContinue);
  bind(elements.deadContinueButton, handlers.onDeadContinue);
  bind(elements.restartButton, handlers.onRestart);
  bind(elements.retryButton, handlers.onRetry);
  bind(elements.statsButton, handlers.onOpenStats);
  bind(elements.closeStatsButton, handlers.onCloseStats);
  bind(elements.therapistButton, handlers.onOpenTherapist);
  bind(elements.closeTherapistButton, handlers.onCloseTherapist);
  bind(elements.clearButton, handlers.onClear);

  function showView(name) {
    views.forEach((view) => { view.hidden = view.id !== `${name}-view`; });
    activeView = name;
    elements.app.setAttribute("aria-busy", String(name === "loading"));
  }

  function showLoading() {
    showView("loading");
  }

  function showProfile(profile, position, total, history) {
    const lastPassedAt = Number(history?.lastPassedAt?.[profile.domain]) || 0;
    const isEx = lastPassedAt > 0;

    setImage(elements.avatar, profile.favicon, `${profile.name} favicon`);
    elements.category.textContent = profile.category;
    elements.name.textContent = profile.name;
    elements.domain.textContent = profile.domain;
    elements.bio.textContent = `“${profile.bio}”`;
    renderList(elements.traits, profile.traits, "li");
    renderList(elements.greenFlags, profile.greenFlags, "li");
    renderList(elements.redFlags, profile.redFlags, "li");
    elements.progress.textContent = `${position} of ${total} potential matches`;
    elements.exAlert.hidden = !isEx;
    elements.exMessage.textContent = isEx
      ? `You rejected ${profile.name} ${relativeTime(lastPassedAt)}. “People change. Tabs refresh.”`
      : "";
    elements.passButton.innerHTML = isEx ? '<span aria-hidden="true">×</span> Stay strong' : '<span aria-hidden="true">×</span> Pass';
    elements.likeButton.innerHTML = isEx ? '<span aria-hidden="true">♥</span> Take them back' : '<span aria-hidden="true">♥</span> Like';
    elements.card.className = "profile-card";
    showView("deck");
    elements.passButton.focus({ preventScroll: true });
  }

  async function animateDecision(decision) {
    if (animating) return;
    animating = true;
    elements.card.classList.add(decision === "like" ? "profile-card--like" : "profile-card--pass");
    await waitForAnimation(elements.card, 280);
    animating = false;
  }

  function showMatch(first, second, result) {
    setImage(elements.matchFirstAvatar, first.favicon, "");
    setImage(elements.matchSecondAvatar, second.favicon, "");
    elements.matchTitle.textContent = `${first.name} + ${second.name}`;
    elements.matchScore.textContent = `${result.score}%`;
    elements.matchRelationship.textContent = result.label;
    renderList(elements.matchReasons, result.reasons.map((reason) => `✓ ${reason}`), "li");
    showView("match");
    elements.continueButton.focus({ preventScroll: true });
  }

  function showDeadTab(profile) {
    elements.deadTitle.textContent = `${profile.name} is no longer available.`;
    elements.deadMessage.textContent = `The ${profile.category.toLowerCase()} heart wants what the close button took away.`;
    showView("dead");
    elements.deadContinueButton.focus({ preventScroll: true });
  }

  function showStats(history) {
    const safe = history ?? { viewed: 0, likes: 0, passes: 0, matches: 0, likedDomains: {}, passedDomains: {} };
    const stats = [
      [safe.viewed, "Viewed"], [safe.likes, "Likes"], [safe.passes, "Passes"], [safe.matches, "Matches"],
    ];
    elements.statGrid.replaceChildren(...stats.map(([value, label]) => statCard(value, label)));

    const favorite = topDomain(safe.likedDomains);
    const rejected = topDomain(safe.passedDomains);
    elements.domainStats.replaceChildren(
      detailRow("Most attractive", favorite || "Still deciding"),
      detailRow("Most rejected", rejected || "No heartbreak yet"),
      detailRow("Relationship status", relationshipStatus(safe)),
    );
    showView("stats");
    elements.closeStatsButton.focus({ preventScroll: true });
  }

  function showEmpty(title, message, showRestart) {
    elements.emptyTitle.textContent = title;
    elements.emptyMessage.textContent = message;
    elements.restartButton.hidden = !showRestart;
    showView("empty");
    (showRestart ? elements.restartButton : elements.statsButton).focus({ preventScroll: true });
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    showView("error");
    elements.retryButton.focus({ preventScroll: true });
  }

  function showTherapist(diagnosis) {
    elements.diagnosisTitle.textContent = diagnosis.title;
    elements.diagnosisNote.textContent = diagnosis.note;
    renderList(elements.diagnosisSymptoms, diagnosis.symptoms, "li");
    elements.diagnosisTreatment.textContent = diagnosis.treatment;
    showView("therapist");
    elements.closeTherapistButton.focus({ preventScroll: true });
  }

  function restoreView(name) {
    const allowed = new Set(["loading", "deck", "match", "dead", "empty", "error", "stats", "therapist"]);
    showView(allowed.has(name) ? name : "deck");
  }

  return {
    showLoading,
    showProfile,
    animateDecision,
    showMatch,
    showDeadTab,
    showStats,
    showEmpty,
    showError,
    showTherapist,
    restoreView,
    currentView: () => activeView,
    isAnimating: () => animating,
  };
}

function collectElements() {
  return {
    app: required("app"), card: required("profile-card"), progress: required("deck-progress"),
    exAlert: required("ex-alert"), exMessage: required("ex-message"),
    avatar: required("profile-avatar"), category: required("profile-category"), name: required("profile-name"),
    domain: required("profile-domain"), bio: required("profile-bio"), traits: required("profile-traits"),
    greenFlags: required("green-flags"), redFlags: required("red-flags"), passButton: required("pass-button"),
    likeButton: required("like-button"), statsButton: required("stats-button"), closeStatsButton: required("close-stats-button"),
    therapistButton: required("therapist-button"), closeTherapistButton: required("close-therapist-button"),
    diagnosisTitle: required("diagnosis-title"), diagnosisNote: required("diagnosis-note"),
    diagnosisSymptoms: required("diagnosis-symptoms"), diagnosisTreatment: required("diagnosis-treatment"),
    matchFirstAvatar: required("match-first-avatar"), matchSecondAvatar: required("match-second-avatar"),
    matchTitle: required("match-title"), matchScore: required("match-score"), matchRelationship: required("match-relationship"),
    matchReasons: required("match-reasons"), continueButton: required("continue-button"), statGrid: required("stat-grid"),
    deadTitle: required("dead-title"), deadMessage: required("dead-message"), deadContinueButton: required("dead-continue-button"),
    domainStats: required("domain-stats"), clearButton: required("clear-button"), emptyTitle: required("empty-title"),
    emptyMessage: required("empty-message"), restartButton: required("restart-button"), errorMessage: required("error-message"),
    retryButton: required("retry-button"),
  };
}

function required(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Required UI element #${id} is missing.`);
  return element;
}

function bind(element, handler) {
  element.addEventListener("click", handler);
}

function setImage(image, source, alt) {
  image.src = source || FALLBACK_FAVICON;
  image.alt = alt;
  image.onerror = () => { image.src = FALLBACK_FAVICON; };
}

function renderList(container, values, tagName) {
  container.replaceChildren(...values.map((value) => {
    const item = document.createElement(tagName);
    item.textContent = value;
    return item;
  }));
}

function statCard(value, label) {
  const card = document.createElement("div");
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = String(value);
  span.textContent = label;
  card.append(strong, span);
  return card;
}

function detailRow(label, value) {
  const row = document.createElement("p");
  const span = document.createElement("span");
  const strong = document.createElement("strong");
  span.textContent = label;
  strong.textContent = value;
  row.append(span, strong);
  return row;
}

function topDomain(record) {
  return Object.entries(record ?? {}).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "";
}

function relationshipStatus(history) {
  if (!history.viewed) return "Newly single";
  if (history.likes > history.passes) return "Falls fast";
  if (history.passes > history.likes * 2) return "Very selective";
  return "It’s complicated";
}

function relativeTime(timestamp) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 10) return "just now";
  if (elapsedSeconds < 60) return `${elapsedSeconds} seconds ago`;
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function waitForAnimation(element, fallbackMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, fallbackMs);
    element.addEventListener("animationend", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}
