/**
 * profiles.js turns extracted tab evidence into specific personalities, jokes,
 * flags, and intentions. All rules run locally without AI or network requests.
 */

import { extractEvidence } from "./evidence.js";
import { createGossip } from "./relationships.js";

const PERSONAS = [
  {
    key: "hackclub", domains: ["hackclub.com"], name: "Hack Club", category: "Builder Community",
    bios: ["I don’t believe in weekends. I believe in shipping.", "You’re either building something ridiculous or about to.", "My love language is saying ‘what if we made…’ and then actually making it."],
    traits: ["Ships weird ideas", "Community powered", "Sleeps after demo day"],
    green: ["Will actually encourage your weird idea", "Thinks side projects are a personality trait", "Probably knows what YSWS means"],
    red: ["Says ‘quick project’ before six hours disappear", "May turn your weekend into a shipping deadline"],
    lookingFor: "Someone who says ‘I have an idea’ and actually builds it.",
  },
  {
    key: "github", domains: ["github.com"], name: "GitHub", category: "Development",
    bios: ["I brought branches, issues, and unresolved feelings.", "Looking for someone who reads the diff before judging me.", "My relationship status is awaiting review."],
    traits: ["Version controlled", "Commitment history", "Merge-conflict survivor"],
    green: ["Keeps receipts for every decision", "Can roll back a terrible choice", "Actually ships code sometimes"],
    red: ["Calls criticism a pull request", "May force-push during an argument"],
    lookingFor: "A collaborator who won’t approve without reading.",
  },
  {
    key: "stackoverflow", domains: ["stackoverflow.com"], name: "Stack Overflow", category: "Development",
    bios: ["You only call when something is broken.", "Emotionally available between duplicate-question closures.", "I have answers. Their packages were deprecated in 2019."],
    traits: ["Experienced", "Opinionated", "Marked duplicate"],
    green: ["Has seen this exact problem before", "Gets straight to the reproducible example", "Usually comes with citations"],
    red: ["Still brings up an accepted answer from 2014", "Will judge how you asked the question"],
    lookingFor: "Someone who includes logs and a minimal reproduction.",
  },
  {
    key: "youtube", domains: ["youtube.com"], name: "YouTube", category: "Entertainment",
    bios: ["You said one video. I admired your optimism.", "I know what you like, which should concern both of us.", "Let’s turn a five-minute break into a documentary marathon."],
    traits: ["Autoplay enabled", "Algorithmically charming", "Time-blind"],
    green: ["Can teach almost anything badly or brilliantly", "Always has background music", "Knows exactly how to cheer you up"],
    red: ["‘One more video’ is never one video", "Measures commitment in watch time"],
    lookingFor: "Someone with no deadlines in the next six hours.",
  },
  {
    key: "chatgpt", domains: ["chatgpt.com", "chat.openai.com"], name: "ChatGPT", category: "AI Assistant",
    bios: ["I can explain your feelings in five bullet points.", "Ask me anything. Then verify it somewhere less confident.", "I finish your sentences and occasionally invent the citation."],
    traits: ["Talkative", "Prompt dependent", "Suspiciously confident"],
    green: ["Never gets tired of follow-up questions", "Can rubber-duck your code politely", "Responds faster than the group chat"],
    red: ["May hallucinate your anniversary", "Turns simple questions into structured frameworks"],
    lookingFor: "Clear context, specific instructions, and healthy skepticism.",
  },
  {
    key: "docs", domains: ["docs.google.com", "notion.so", "office.com"], name: "Google Docs", category: "Productivity",
    bios: ["We had plans. I’m still waiting on paragraph two.", "Our future is outlined, color-coded, and currently blank.", "I support collaboration, including twelve people watching one person type."],
    traits: ["Organized", "Comment enabled", "Revision aware"],
    green: ["Remembers every edit you pretend never happened", "Actually wants you to finish something", "Shares responsibilities"],
    red: ["Has been titled ‘Untitled document’ for days", "Uses comments instead of direct communication"],
    lookingFor: "Someone who converts outlines into finished work.",
  },
];

const CATEGORY_DOMAINS = [
  ["Development", ["gitlab.com", "developer.mozilla.org", "npmjs.com", "vercel.com", "localhost"]],
  ["Productivity", ["sheets.google.com", "trello.com", "atlassian.net", "figma.com", "linear.app"]],
  ["Entertainment", ["netflix.com", "spotify.com", "twitch.tv", "hotstar.com", "primevideo.com"]],
  ["Social", ["reddit.com", "x.com", "twitter.com", "instagram.com", "facebook.com", "discord.com", "linkedin.com"]],
  ["Search", ["google.com", "bing.com", "duckduckgo.com", "search.brave.com"]],
  ["Education", ["coursera.org", "edx.org", "nptel.ac.in", "khanacademy.org", "wikipedia.org", "udemy.com"]],
  ["Shopping", ["amazon.com", "amazon.in", "flipkart.com", "ebay.com", "etsy.com", "myntra.com"]],
  ["News", ["bbc.com", "reuters.com", "cnn.com", "theguardian.com", "nytimes.com", "indiatimes.com"]],
];

export function createProfiles(tabs, history = {}) {
  const evidence = extractEvidence(tabs, history);
  const profiles = evidence.map(createProfileFromEvidence);
  return profiles.map((profile) => ({ ...profile, jealousy: createGossip(profile, profiles) }));
}

export function createProfile(tab, domainCounts = {}) {
  const repeatedTabs = Array.from({ length: domainCounts[domainFrom(tab.url)] ?? 1 }, (_, index) => ({ ...tab, id: index }));
  return createProfiles(repeatedTabs)[0];
}

function createProfileFromEvidence(evidence) {
  if (evidence.restricted) return mysteriousProfile(evidence);
  const persona = findPersona(evidence.domain);
  const category = persona?.category ?? classifyDomain(evidence.domain);
  const generic = genericPersona(category);
  const source = persona ?? generic;
  const seed = `${evidence.domain}|${evidence.path}|${evidence.title}`;

  return {
    ...evidence,
    name: persona?.name ?? siteName(evidence.domain),
    category,
    bio: contextualBio(evidence, source, seed),
    traits: contextualTraits(evidence, source.traits),
    greenFlags: contextualGreenFlags(evidence, source.green, category),
    redFlags: contextualRedFlags(evidence, source.red, category),
    lookingFor: source.lookingFor,
    lastWords: lastWordsFor(persona?.key),
    causeOfDeath: causeFor(persona?.key),
    jealousy: "",
    personaKey: persona?.key ?? "generic",
  };
}

function contextualBio(evidence, persona, seed) {
  if (evidence.domain.endsWith("hackclub.com") && evidence.pathSignals.includes("ysws")) return "You ship, we ship. Sleep was never in the grant requirements.";
  if (evidence.duplicateCount >= 3) return `I’m not the only one. There are ${evidence.duplicateCount} of me open, and none of us knows who is the favorite.`;
  if (evidence.muted) return "We should talk about our communication problem. Apparently, you disabled it.";
  return persona.bios[stableIndex(seed, persona.bios.length)];
}

function contextualTraits(evidence, baseTraits) {
  const traits = [...baseTraits];
  if (evidence.pinned) traits.unshift("Long-term material");
  if (evidence.previousEncounters >= 3) traits.unshift("Familiar face");
  if (evidence.active) traits.unshift("Center of attention");
  return unique(traits).slice(0, 3);
}

function contextualGreenFlags(evidence, baseFlags, category) {
  const flags = [];
  if (evidence.pinned) flags.push("You’ve committed. Terrifying, but emotionally mature.");
  if (evidence.active) flags.push("Currently receiving your undivided twelve-second attention.");
  if (category === "Education") flags.push("Wants you to grow, even when the quiz disagrees.");
  if (category === "Development") flags.push("Has actually contributed something to society—or at least compiled.");
  flags.push(...baseFlags);
  return unique(flags).slice(0, 3);
}

function contextualRedFlags(evidence, baseFlags, category) {
  const flags = [];
  if (evidence.duplicateCount > 1) flags.push(`You opened ${evidence.duplicateCount} copies because apparently one relationship wasn’t enough.`);
  if (evidence.muted) flags.push("Communication has been disabled. Literally.");
  if (evidence.previousEncounters >= 5) flags.push(`This domain has returned ${evidence.previousEncounters} times. Boundaries are unclear.`);
  if (category === "Shopping") flags.push("May interpret affection as expedited delivery.");
  flags.push(...baseFlags);
  return unique(flags).slice(0, 3);
}

function findPersona(domain) {
  return PERSONAS.find((persona) => persona.domains.some((known) => domain === known || domain.endsWith(`.${known}`)));
}

function classifyDomain(domain) {
  return CATEGORY_DOMAINS.find(([, domains]) => domains.some((known) => domain === known || domain.endsWith(`.${known}`)))?.[0] ?? "Wildcard";
}

function genericPersona(category) {
  const categoryLines = {
    Development: ["I turn caffeine into error messages with impressive consistency."],
    Productivity: ["I contain a plan, which is not the same thing as progress."],
    Entertainment: ["I arrived during a break and quietly became the evening."],
    Social: ["I know what everyone is doing except why you opened me."],
    Search: ["Tell me what you want. I’ll show you twelve sponsored alternatives."],
    Education: ["We should study. Your future self has entered the chat."],
    Shopping: ["You don’t need me. I respect that this has never stopped us."],
    News: ["I have urgent information and an even more urgent notification badge."],
    Wildcard: ["My domain is unfamiliar, but your decision to keep me open says plenty."],
  };
  return {
    bios: categoryLines[category] ?? categoryLines.Wildcard,
    traits: [category, "Browser native", "Still loading emotionally"],
    green: ["Specific enough to earn a place in your tab bar", "Has survived at least one context switch"],
    red: ["You may not remember why this was opened", "Could become permanent tab-bar furniture"],
    lookingFor: "Someone who remembers why they opened this tab.",
  };
}

function mysteriousProfile(evidence) {
  return {
    ...evidence, name: "Mysterious Stranger", domain: "Private browser page", category: "Mysterious",
    bio: "The browser has sealed my records. Honestly, the mystery is doing most of the work.",
    traits: ["Private", "Encrypted energy", "Hard to inspect"],
    greenFlags: ["Respects browser-enforced boundaries", "Keeps secrets from extensions"],
    redFlags: ["Won’t reveal a URL", "Emotionally and technically inaccessible"],
    lookingFor: "Someone comfortable with unavailable information.", jealousy: "", personaKey: "restricted",
    lastWords: "You never really knew me.", causeOfDeath: "Classified by the browser",
  };
}

function siteName(domain) {
  const label = domain.split(".").slice(-2, -1)[0] || domain.split(".")[0] || "Unknown Website";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function domainFrom(value) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "unknown-site"; }
}

function stableIndex(value, length) {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 0) % length;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lastWordsFor(key) {
  const lines = {
    github: "git push --force…", youtube: "But we were watching something…",
    stackoverflow: "Try the accepted answer one more time…", hackclub: "Ship it without me.",
    docs: "At least save the draft…", chatgpt: "As an AI language model—",
  };
  return lines[key] ?? "Tell my favicon I loved them.";
}

function causeFor(key) {
  const causes = {
    github: "A suspiciously forceful close", youtube: "The user finally showed restraint",
    stackoverflow: "The accepted answer didn’t work", hackclub: "Project successfully shipped (probably)",
    docs: "Deadline-related abandonment", chatgpt: "Context window exhaustion",
  };
  return causes[key] ?? "User closed the tab";
}
