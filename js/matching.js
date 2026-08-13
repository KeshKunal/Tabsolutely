/**
 * matching.js scores two profiles from their evidence, then asks the relationship
 * engine for pair-specific chemistry, dialogue, and a relationship label.
 */

import { describeRelationship } from "./relationships.js";

const PAIR_SCORES = {
  "Development|Productivity": 24, "Entertainment|Productivity": 18,
  "Entertainment|Social": 28, "Education|Search": 26,
  "Development|Search": 22, "News|Social": 18, "Shopping|Social": 16,
};

export function calculateCompatibility(first, second) {
  let score = 42;
  const reasons = [];
  const categoryPair = [first.category, second.category].sort().join("|");
  const relationship = describeRelationship(first, second);

  if (first.category === second.category) score += 25;
  else score += PAIR_SCORES[categoryPair] ?? 10;
  reasons.push(relationship.reason);

  if (first.pinned && second.pinned) {
    score += 10;
    reasons.push("Both have already survived the commitment ceremony known as pinning");
  }
  if (first.active || second.active) {
    score += 6;
    reasons.push("At least one of them currently receives attention");
  }
  if (first.domain === second.domain) {
    score += 7;
    reasons.push("Same-domain chemistry—or an unresolved duplication problem");
  }
  score += stablePairBonus(first.domain, second.domain);
  score = Math.max(0, Math.min(99, score));

  return {
    score,
    tier: relationshipTier(score),
    label: relationship.label || relationshipLabel(score),
    reasons: reasons.slice(0, 3),
    dialogue: { first: relationship.firstLine, second: relationship.secondLine },
    marriage: score >= 95 ? createWeddingPlan(first, second) : null,
  };
}

export function findBestMatch(profile, candidates) {
  return candidates
    .map((candidate) => ({ profile: candidate, result: calculateCompatibility(profile, candidate) }))
    .sort((a, b) => b.result.score - a.result.score)[0] ?? null;
}

export function relationshipLabel(score) {
  if (score >= 90) return "Soulmates";
  if (score >= 75) return "Great match";
  if (score >= 60) return "Could work";
  if (score >= 40) return "It’s complicated";
  return "Absolutely not";
}

export function relationshipTier(score) {
  if (score >= 95) return "Soulmates";
  if (score >= 85) return "Power Couple";
  if (score >= 70) return "Friends";
  if (score >= 55) return "Flirty";
  if (score >= 30) return "Toxic";
  return "Enemies";
}

function stablePairBonus(first, second) {
  return [...[first, second].sort().join("|")].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 11, 0);
}

function createWeddingPlan(first, second) {
  const seed = stablePairBonus(first.domain, second.domain);
  const venues = ["/dev/null", "an incognito window", "the bookmarks bar", "a tastefully pinned tab", "localhost:3000"];
  const dressCodes = ["Business casual", "Dark mode formal", "Cache optional", "Tabs, not spaces", "Come as your favicon"];
  const vows = ["I promise to stay open through every refresh.", "Till browser crash do us part.", "For richer or poorer, online or cached.", "I choose you in this window and every restored session."];
  return { venue: venues[seed % venues.length], dressCode: dressCodes[(seed + 2) % dressCodes.length], vow: vows[(seed + 1) % vows.length] };
}
