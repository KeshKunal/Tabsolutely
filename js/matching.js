/**
 * matching.js calculates deterministic compatibility between two tab profiles.
 * The same pair receives the same score and an understandable list of reasons.
 */

const PAIR_SCORES = {
  "Development|Productivity": 24,
  "Entertainment|Productivity": 18,
  "Entertainment|Social": 28,
  "Education|Search": 26,
  "Development|Search": 22,
  "News|Social": 18,
  "Shopping|Social": 16,
};

export function calculateCompatibility(first, second) {
  let score = 42;
  const reasons = [];
  const pair = [first.category, second.category].sort().join("|");

  if (first.category === second.category) {
    score += 25;
    reasons.push(`Both understand the ${first.category.toLowerCase()} lifestyle`);
  } else if (PAIR_SCORES[pair]) {
    score += PAIR_SCORES[pair];
    reasons.push(categoryReason(first.category, second.category));
  } else {
    score += 10;
    reasons.push("Opposites keep the tab bar interesting");
  }

  if (first.pinned && second.pinned) {
    score += 10;
    reasons.push("Both are ready for commitment");
  }
  if (first.active || second.active) {
    score += 6;
    reasons.push("At least one of them gets attention");
  }
  if (first.domain === second.domain) {
    score += 7;
    reasons.push("Same-domain chemistry is undeniable");
  }
  if ((first.category === "Productivity" && second.category === "Entertainment") || (second.category === "Productivity" && first.category === "Entertainment")) {
    score += 6;
    reasons.push("One works while the other plans the snack break");
  }

  score += stablePairBonus(first.domain, second.domain);
  score = Math.max(0, Math.min(99, score));

  return {
    score,
    label: relationshipLabel(score),
    reasons: reasons.slice(0, 3),
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

function stablePairBonus(first, second) {
  const text = [first, second].sort().join("|");
  const hash = [...text].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 11, 0);
  return hash;
}

function categoryReason(first, second) {
  const categories = new Set([first, second]);
  if (categories.has("Development") && categories.has("Productivity")) return "One builds it; the other keeps the roadmap tidy";
  if (categories.has("Entertainment") && categories.has("Social")) return "They can procrastinate together professionally";
  if (categories.has("Education") && categories.has("Search")) return "Curiosity has found its research assistant";
  if (categories.has("Development") && categories.has("Search")) return "Every error message deserves a second opinion";
  return "Their browser energy is weirdly complementary";
}
