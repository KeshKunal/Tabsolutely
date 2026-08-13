/**
 * relationships.js describes how two evidence-driven tab personalities interact.
 * It is shared by profile gossip and compatibility results.
 */

const SPECIFIC_RELATIONSHIPS = {
  "github|stackoverflow": {
    label: "Co-dependent developers",
    reason: "One creates problems; the other has an accepted answer from 2014",
    lines: ["She understands my issues.", "He only visits when something has gone terribly wrong."],
  },
  "github|youtube": {
    label: "Toxic productivity",
    reason: "One tracks commits; the other makes sure they stop happening",
    lines: ["I build things.", "I provide the twelve-minute break that lasts all evening."],
  },
  "docs|youtube": {
    label: "One-sided",
    reason: "They had plans until autoplay entered the relationship",
    lines: ["We had a deadline.", "Plans change. This video essay is important."],
  },
  "chatgpt|stackoverflow": {
    label: "Professional rivalry",
    reason: "Both answer questions; only one remembers 2014 correctly",
    lines: ["I can explain it better.", "Can you mark it as a duplicate better?"],
  },
  "hackclub|github": {
    label: "Shipping partners",
    reason: "One funds the weird idea; the other records every chaotic commit",
    lines: ["Let’s ship before we overthink it.", "Fine, but we are using branches this time."],
  },
  "hackclub|youtube": {
    label: "Demo-day danger",
    reason: "A shipping deadline has met its natural predator",
    lines: ["The project is due tonight.", "Perfect time for one tiny tutorial rabbit hole."],
  },
};

export function describeRelationship(first, second) {
  const directKey = pairKey(first.personaKey, second.personaKey);
  const specific = SPECIFIC_RELATIONSHIPS[directKey];
  if (specific) return orient(specific, first.personaKey <= second.personaKey);

  if (first.category === second.category) {
    return { label: "Same-type situation", reason: `Both speak fluent ${first.category.toLowerCase()}`, firstLine: "Finally, someone who gets it.", secondLine: "This feels healthy. Suspiciously healthy." };
  }
  if (new Set([first.category, second.category]).has("Entertainment") && new Set([first.category, second.category]).has("Productivity")) {
    return { label: "It’s complicated", reason: "Productivity has fallen for its most charming distraction", firstLine: "We could accomplish so much together.", secondLine: "Or we could watch something first." };
  }
  return { label: "Unexpected chemistry", reason: "Their browser histories would have very different explanations", firstLine: "You’re not usually my type.", secondLine: "That has never stopped an open tab." };
}

export function createGossip(profile, profiles) {
  const has = (key) => profiles.some((candidate) => candidate.personaKey === key);
  if (profile.personaKey === "stackoverflow" && has("chatgpt")) return "Stack Overflow noticed ChatGPT: “You used to come to me first.”";
  if (profile.personaKey === "chatgpt" && has("stackoverflow")) return "ChatGPT noticed Stack Overflow: “I can explain the accepted answer, if that helps.”";
  if (profile.personaKey === "github" && has("youtube")) return "GitHub has something to say about YouTube: “Every time they show up, you stop committing.”";
  if (profile.personaKey === "youtube" && has("docs")) return "YouTube glanced at Google Docs: “We had very different plans for your evening.”";
  if (profile.personaKey === "hackclub" && has("github")) return "Hack Club checked GitHub: “Good. There had better be commits.”";

  const sameDomain = profiles.filter((candidate) => candidate.domain === profile.domain).length;
  if (sameDomain >= 3) return `${profile.name} looks at the other ${sameDomain - 1}: “I’m not the only one… am I?”`;
  return "";
}

function pairKey(first, second) {
  return [first, second].sort().join("|");
}

function orient(relationship, alreadySorted) {
  const [firstLine, secondLine] = alreadySorted ? relationship.lines : [...relationship.lines].reverse();
  return { label: relationship.label, reason: relationship.reason, firstLine, secondLine };
}
