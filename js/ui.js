/**
 * ui.js renders Tabsolutely's feed, statistics, diagnosis, and small overlay
 * views. It only uses safe DOM nodes and textContent for browser-derived data.
 */

export function createUI(handlers) {
  const elements = collectElements();
  const views = [...document.querySelectorAll(".view")];
  let activeView = "loading";

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

  function showLoading() { showView("loading"); }

  function showFeed(events, profiles) {
    elements.feedSummary.textContent = events.length
      ? `${events.length} local ${events.length === 1 ? "moment" : "moments"} · ${profiles.length} tabs currently in the room`
      : `${profiles.length} tabs are in the room. The matchmaker is watching quietly.`;
    elements.eventFeed.replaceChildren(...events.map(eventCard));
    elements.feedEmpty.hidden = events.length > 0;
    showView("feed");
  }

  function showStats(history) {
    const safe = history ?? { matches: 0, relationshipEvents: [], domainMemory: {} };
    const events = safe.relationshipEvents ?? [];
    const notable = events.filter((event) => event.score >= 85).length;
    const dramatic = events.filter((event) => event.kind !== "match" || event.score <= 54).length;
    const familiar = Object.keys(safe.domainMemory ?? {}).length;
    elements.statGrid.replaceChildren(
      statCard(events.length, "Moments"), statCard(safe.matches, "Relationships"),
      statCard(notable, "Big matches"), statCard(dramatic, "Drama alerts"),
    );
    elements.domainStats.replaceChildren(
      detailRow("Tabs remembered", familiar || "No history yet"),
      detailRow("Current mood", events.length ? "The plot is thickening" : "Quietly observant"),
      detailRow("Data", "Stored only in this browser"),
    );
    showView("stats");
    elements.closeStatsButton.focus({ preventScroll: true });
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
    showView(name === "therapist" || name === "stats" ? "feed" : name || "feed");
  }

  return { showLoading, showFeed, showStats, showError, showTherapist, restoreView, currentView: () => activeView };
}

function collectElements() {
  return {
    app: required("app"), statsButton: required("stats-button"), therapistButton: required("therapist-button"),
    feedSummary: required("feed-summary"), eventFeed: required("event-feed"), feedEmpty: required("feed-empty"),
    statGrid: required("stat-grid"), domainStats: required("domain-stats"), clearButton: required("clear-button"),
    closeStatsButton: required("close-stats-button"), closeTherapistButton: required("close-therapist-button"),
    diagnosisTitle: required("diagnosis-title"), diagnosisNote: required("diagnosis-note"),
    diagnosisSymptoms: required("diagnosis-symptoms"), diagnosisTreatment: required("diagnosis-treatment"),
    browserMeters: required("browser-meters"), browserPrediction: required("browser-prediction"),
    errorMessage: required("error-message"), retryButton: required("retry-button"),
  };
}

function required(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Required UI element #${id} is missing.`);
  return element;
}

function bind(element, handler) { element.addEventListener("click", handler); }

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

function renderList(container, values, tagName) {
  container.replaceChildren(...values.map((value) => {
    const item = document.createElement(tagName);
    item.textContent = value;
    return item;
  }));
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

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
