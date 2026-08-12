/**
 * profiles.js converts raw browser tab objects into safe, humorous profiles.
 * Its rule-based approach needs no server or AI service.
 */

const CATEGORY_RULES = [
  { name: "Development", domains: ["github.com", "gitlab.com", "stackoverflow.com", "developer.mozilla.org", "npmjs.com", "vercel.com", "localhost"], bio: "It works on my machine. Looking for someone who respects my branches.", traits: ["Logical", "Bug magnet", "Dark-mode fluent"] },
  { name: "Productivity", domains: ["docs.google.com", "sheets.google.com", "notion.so", "trello.com", "atlassian.net", "office.com", "figma.com", "linear.app"], bio: "I have my life together—at least according to this carefully color-coded tab.", traits: ["Organized", "Ambitious", "Deadline aware"] },
  { name: "Entertainment", domains: ["youtube.com", "netflix.com", "spotify.com", "twitch.tv", "hotstar.com", "primevideo.com"], bio: "I was only supposed to be here for five minutes. That was several episodes ago.", traits: ["Fun", "Charming", "Time traveler"] },
  { name: "Social", domains: ["reddit.com", "x.com", "twitter.com", "instagram.com", "facebook.com", "discord.com", "linkedin.com"], bio: "I’m definitely networking, not procrastinating. Please stop checking the clock.", traits: ["Talkative", "Online", "Knows the discourse"] },
  { name: "Search", domains: ["google.com", "bing.com", "duckduckgo.com", "search.brave.com"], bio: "I know everything except what you were actually trying to find.", traits: ["Curious", "Resourceful", "Asks follow-ups"] },
  { name: "Education", domains: ["coursera.org", "edx.org", "nptel.ac.in", "khanacademy.org", "wikipedia.org", "udemy.com"], bio: "We should probably study. Or spend twenty minutes choosing the perfect playlist first.", traits: ["Curious", "Goal-oriented", "Has homework"] },
  { name: "Shopping", domains: ["amazon.com", "amazon.in", "flipkart.com", "ebay.com", "etsy.com", "myntra.com"], bio: "You don’t need me, but I’m already imagining our future at checkout.", traits: ["Tempting", "Well reviewed", "Free delivery"] },
  { name: "News", domains: ["bbc.com", "reuters.com", "cnn.com", "theguardian.com", "nytimes.com", "indiatimes.com"], bio: "I have breaking information you probably did not ask for before breakfast.", traits: ["Informed", "Dramatic", "Always updating"] },
];

const RESTRICTED_SCHEMES = ["chrome:", "edge:", "about:", "devtools:"];

export function createProfiles(tabs) {
  const counts = countDomains(tabs);
  return tabs.map((tab) => createProfile(tab, counts));
}

export function createProfile(tab, domainCounts = {}) {
  const parsed = parseTabUrl(tab.url);
  const restricted = parsed.restricted;
  const domain = parsed.domain;
  const category = restricted ? fallbackCategory() : classifyDomain(domain);
  const duplicateCount = domainCounts[domain] ?? 1;

  return {
    id: tab.id ?? `${domain}-${tab.index ?? 0}`,
    name: restricted ? "Mysterious Stranger" : siteName(domain, tab.title),
    domain: restricted ? "Private browser page" : domain,
    title: cleanTitle(tab.title),
    favicon: safeFavicon(tab.favIconUrl),
    category: restricted ? "Mysterious" : category.name,
    bio: restricted ? "I can’t tell you much about myself. Some boundaries are browser-enforced." : category.bio,
    traits: restricted ? ["Private", "Mysterious", "Hard to read"] : category.traits,
    greenFlags: buildGreenFlags(tab, category.name, restricted),
    redFlags: buildRedFlags(tab, category.name, duplicateCount, restricted),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    muted: Boolean(tab.mutedInfo?.muted),
    active: Boolean(tab.active),
    duplicateCount,
  };
}

function parseTabUrl(value) {
  try {
    const url = new URL(value || "");
    const restricted = RESTRICTED_SCHEMES.includes(url.protocol);
    return { restricted, domain: restricted ? "private-page" : url.hostname.replace(/^www\./, "") || "unknown-site" };
  } catch {
    return { restricted: true, domain: "unknown-site" };
  }
}

function countDomains(tabs) {
  return tabs.reduce((counts, tab) => {
    const { domain } = parseTabUrl(tab.url);
    counts[domain] = (counts[domain] ?? 0) + 1;
    return counts;
  }, {});
}

function classifyDomain(domain) {
  return CATEGORY_RULES.find((rule) => rule.domains.some((known) => domain === known || domain.endsWith(`.${known}`))) ?? fallbackCategory();
}

function fallbackCategory() {
  return {
    name: "Wildcard",
    bio: "We haven’t met before, which either makes this exciting or a very creative phishing attempt.",
    traits: ["Mysterious", "Independent", "Open in a new tab"],
  };
}

function siteName(domain, title) {
  if (!domain || domain === "unknown-site") return cleanTitle(title) || "Unknown Website";
  const recognizable = domain.split(".").slice(-2, -1)[0] || domain.split(".")[0];
  return recognizable.charAt(0).toUpperCase() + recognizable.slice(1);
}

function cleanTitle(title) {
  return typeof title === "string" && title.trim() ? title.trim().slice(0, 100) : "Untitled, but emotionally available";
}

function safeFavicon(value) {
  if (typeof value !== "string") return "";
  return /^(https?:|data:image\/|chrome-extension:)/.test(value) ? value : "";
}

function buildGreenFlags(tab, category, restricted) {
  if (restricted) return ["Respects boundaries", "Keeps secrets"];
  const flags = [];
  if (tab.pinned) flags.push("Clearly important to you");
  if (tab.active) flags.push("Actually pays attention");
  if (category === "Development") flags.push("Knows how to fix things");
  if (category === "Productivity") flags.push("Has a five-year plan");
  if (category === "Education") flags.push("Has goals and citations");
  if (tab.audible && !tab.mutedInfo?.muted) flags.push("Communicates openly");
  if (flags.length === 0) flags.push("Still here through every refresh");
  return flags.slice(0, 2);
}

function buildRedFlags(tab, category, duplicateCount, restricted) {
  if (restricted) return ["Won’t reveal their URL", "Emotionally encrypted"];
  const flags = [];
  if (duplicateCount > 1) flags.push(`${duplicateCount} versions of this relationship`);
  if (tab.mutedInfo?.muted) flags.push("Communication issues (muted)");
  if (tab.pinned) flags.push("Getting attached very quickly");
  if (category === "Entertainment") flags.push("“One more episode” energy");
  if (category === "Social") flags.push("Knows when you were last online");
  if (category === "Shopping") flags.push("Might affect your bank balance");
  if (flags.length === 0) flags.push("Suspiciously few obvious flaws");
  return flags.slice(0, 2);
}
