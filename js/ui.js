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
  bind(elements.feedButton, handlers.onOpenFeed);
  bind(elements.singlesButton, handlers.onOpenSingles);

  function showView(name) {
    views.forEach((view) => { view.hidden = view.id !== `${name}-view`; });
    activeView = name;
    elements.app.setAttribute("aria-busy", String(name === "loading"));
    elements.feedButton.disabled = name === "loading";
    elements.singlesButton.disabled = name === "loading";
    const inSingles = ["deck", "match", "dead", "empty"].includes(name);
    elements.feedButton.classList.toggle("mode-button--active", name === "feed");
    elements.singlesButton.classList.toggle("mode-button--active", inSingles);
    elements.feedButton.setAttribute("aria-pressed", String(name === "feed"));
    elements.singlesButton.setAttribute("aria-pressed", String(inSingles));
  }

  function showLoading() {
    showView("loading");
  }

  function showFeed(events, profiles) {
    elements.feedSummary.textContent = events.length
      ? `${events.length} relationship ${events.length === 1 ? "event" : "events"} recorded locally · ${profiles.length} tabs currently in the room`
      : `${profiles.length} tabs are in the room. The matchmaker is watching quietly.`;
    elements.eventFeed.replaceChildren(...events.map(eventCard));
    elements.feedEmpty.hidden = events.length > 0;
    showView("feed");
  }

  function showProfile(profile, position, total, history) {
    const lastPassedAt = Number(history?.lastPassedAt?.[profile.domain]) || 0;
    const isEx = lastPassedAt > 0;

    setImage(elements.avatar, profile.favicon, `${profile.name} favicon`);
    elements.category.textContent = profile.category;
    elements.name.textContent = profile.name;
    elements.domain.textContent = profile.domain;
    elements.bio.textContent = `“${profile.bio}”`;
    elements.jealousyNote.hidden = !profile.jealousy;
    elements.jealousyNote.textContent = profile.jealousy;
    renderList(elements.traits, profile.traits, "li");
    elements.lookingFor.textContent = profile.lookingFor;
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
    const isMarriage = Boolean(result.marriage);
    setImage(elements.matchFirstAvatar, first.favicon, "");
    setImage(elements.matchSecondAvatar, second.favicon, "");
    elements.matchTitle.textContent = `${first.name} + ${second.name}`;
    elements.dialogueFirstName.textContent = first.name;
    elements.dialogueFirst.textContent = `“${result.dialogue.first}”`;
    elements.dialogueSecondName.textContent = second.name;
    elements.dialogueSecond.textContent = `“${result.dialogue.second}”`;
    elements.matchScore.textContent = `${result.score}%`;
    elements.scoreRing.style.setProperty("--score", `${result.score}%`);
    elements.matchRelationship.textContent = result.label;
    renderList(elements.matchReasons, result.reasons.map((reason) => `✓ ${reason}`), "li");
    elements.matchKicker.textContent = isMarriage ? "They’re getting married!" : "It’s a match!";
    elements.matchView.classList.toggle("match-view--marriage", isMarriage);
    elements.weddingDetails.hidden = !isMarriage;
    if (result.marriage) {
      elements.weddingVenue.textContent = result.marriage.venue;
      elements.weddingDress.textContent = result.marriage.dressCode;
      elements.weddingVow.textContent = `“${result.marriage.vow}”`;
    }
    showView("match");
    elements.continueButton.focus({ preventScroll: true });
  }

  function showDeadTab(profile) {
    elements.deadTitle.textContent = `${profile.name} is no longer available.`;
    elements.deadMessage.textContent = `Last words: “${profile.lastWords}”`;
    elements.deadCause.textContent = profile.causeOfDeath;
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
    elements.browserPrediction.textContent = diagnosis.prediction;
    renderMeters(elements.browserMeters, diagnosis.metrics);
    showView("therapist");
    elements.closeTherapistButton.focus({ preventScroll: true });
  }

  function restoreView(name) {
    const allowed = new Set(["loading", "feed", "deck", "match", "dead", "empty", "error", "stats", "therapist"]);
    showView(allowed.has(name) ? name : "deck");
  }

  return {
    showLoading,
    showFeed,
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
    feedButton: required("feed-button"), singlesButton: required("singles-button"),
    feedSummary: required("feed-summary"), eventFeed: required("event-feed"), feedEmpty: required("feed-empty"),
    exAlert: required("ex-alert"), exMessage: required("ex-message"),
    avatar: required("profile-avatar"), category: required("profile-category"), name: required("profile-name"),
    domain: required("profile-domain"), bio: required("profile-bio"), jealousyNote: required("jealousy-note"), traits: required("profile-traits"), lookingFor: required("profile-looking-for"),
    greenFlags: required("green-flags"), redFlags: required("red-flags"), passButton: required("pass-button"),
    likeButton: required("like-button"), statsButton: required("stats-button"), closeStatsButton: required("close-stats-button"),
    therapistButton: required("therapist-button"), closeTherapistButton: required("close-therapist-button"),
    diagnosisTitle: required("diagnosis-title"), diagnosisNote: required("diagnosis-note"),
    diagnosisSymptoms: required("diagnosis-symptoms"), diagnosisTreatment: required("diagnosis-treatment"),
    browserMeters: required("browser-meters"), browserPrediction: required("browser-prediction"),
    matchView: required("match-view"), matchKicker: required("match-kicker"), scoreRing: required("score-ring"),
    matchFirstAvatar: required("match-first-avatar"), matchSecondAvatar: required("match-second-avatar"),
    dialogueFirstName: required("dialogue-first-name"), dialogueFirst: required("dialogue-first"),
    dialogueSecondName: required("dialogue-second-name"), dialogueSecond: required("dialogue-second"),
    matchTitle: required("match-title"), matchScore: required("match-score"), matchRelationship: required("match-relationship"),
    matchReasons: required("match-reasons"), continueButton: required("continue-button"), statGrid: required("stat-grid"),
    weddingDetails: required("wedding-details"), weddingVenue: required("wedding-venue"),
    weddingDress: required("wedding-dress"), weddingVow: required("wedding-vow"),
    deadTitle: required("dead-title"), deadMessage: required("dead-message"), deadCause: required("dead-cause"), deadContinueButton: required("dead-continue-button"),
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

function eventCard(event) {
  const article = document.createElement("article");
  article.className = `event-card event-card--${event.kind}`;

  const meta = document.createElement("div");
  meta.className = "event-meta";
  const tier = document.createElement("span");
  tier.textContent = event.kind === "duplicate" ? "Cheating detected" : event.kind === "rivalry" ? "Rivalry detected" : event.tier;
  const time = document.createElement("time");
  time.dateTime = new Date(event.timestamp).toISOString();
  time.textContent = relativeTime(event.timestamp);
  meta.append(tier, time);

  const couple = document.createElement("h3");
  couple.textContent = `${event.first.name} + ${event.second.name}`;
  const score = document.createElement("strong");
  score.className = "event-score";
  score.textContent = `${event.score}% · ${event.label}`;
  const reason = document.createElement("p");
  reason.className = "event-reason";
  reason.textContent = `“${event.reason}”`;

  const dialogue = document.createElement("div");
  dialogue.className = "event-dialogue";
  dialogue.append(dialogueLine(event.first.name, event.dialogue.first), dialogueLine(event.second.name, event.dialogue.second));
  article.append(meta, couple, score, reason, dialogue);
  return article;
}

function dialogueLine(name, line) {
  const paragraph = document.createElement("p");
  const speaker = document.createElement("b");
  speaker.textContent = name;
  const quote = document.createElement("span");
  quote.textContent = `“${line}”`;
  paragraph.append(speaker, quote);
  return paragraph;
}

function renderMeters(container, metrics) {
  container.replaceChildren(...metrics.map((metric) => {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    const track = document.createElement("i");
    label.textContent = metric.label;
    value.textContent = `${metric.value}%`;
    track.style.setProperty("--meter", `${metric.value}%`);
    row.append(label, value, track);
    return row;
  }));
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
