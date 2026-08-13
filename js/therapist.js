/**
 * therapist.js calculates a browser-wide personality from the live profile deck.
 * Scores are playful local heuristics, not medical or psychological claims.
 */

const PRODUCTIVE = new Set(["Development", "Productivity", "Education", "Search", "Builder Community", "AI Assistant"]);
const DISTRACTING = new Set(["Entertainment", "Social", "Shopping"]);

export function diagnoseTabHabits(profiles) {
  const total = profiles.length;
  const productive = profiles.filter((profile) => PRODUCTIVE.has(profile.category)).length;
  const distracting = profiles.filter((profile) => DISTRACTING.has(profile.category)).length;
  const muted = profiles.filter((profile) => profile.muted).length;
  const pinned = profiles.filter((profile) => profile.pinned).length;
  const finalDrafts = profiles.filter((profile) => /\bfinal(?:[-_ ]?v?\d+)?\b/i.test(profile.title)).length;
  const domainCounts = countBy(profiles, (profile) => profile.domain);
  const duplicateGroups = Object.values(domainCounts).filter((count) => count > 1).length;
  const worstRepeat = Math.max(0, ...Object.values(domainCounts));
  const dominantDomain = Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "none";
  const diagnosis = chooseDiagnosis({ total, distracting, duplicateGroups, worstRepeat });
  const symptoms = [`${total} tabs currently in the dating pool`];

  if (worstRepeat > 1) symptoms.push(`${worstRepeat} simultaneous relationships with ${dominantDomain}`);
  if (distracting) symptoms.push(`${distracting} highly qualified distractions`);
  if (muted) symptoms.push(`${muted} relationship${muted === 1 ? "" : "s"} receiving the silent treatment`);
  if (pinned) symptoms.push(`${pinned} serious long-term commitment${pinned === 1 ? "" : "s"}`);
  if (finalDrafts) symptoms.push(`${finalDrafts} “final” draft${finalDrafts === 1 ? "" : "s"}, allegedly`);

  const productivity = percentage(productive, total);
  const procrastination = clamp(percentage(distracting, total) + Math.min(35, worstRepeat * 5));
  const hoarding = clamp(Math.round((total / 30) * 100));
  const dependency = clamp(worstRepeat * 18);
  const closureChance = clamp(100 - Math.round(hoarding * 0.65) - Math.round(procrastination * 0.2), 2, 98);

  return {
    ...diagnosis,
    symptoms: symptoms.slice(0, 5),
    treatment: prescribe({ total, distracting, duplicateGroups }),
    metrics: [
      { label: "Productivity", value: productivity },
      { label: "Procrastination", value: procrastination },
      { label: "Tab hoarding", value: hoarding },
      { label: `${shortDomain(dominantDomain)} dependency`, value: dependency },
    ],
    prediction: `Probability you’ll close these tabs: ${closureChance}%`,
  };
}

function chooseDiagnosis({ total, distracting, duplicateGroups, worstRepeat }) {
  if (total >= 30) return { title: "Severe Tab Hoarding", note: "Your RAM has requested a private session." };
  if (worstRepeat >= 5) return { title: "Domain Attachment Disorder", note: "Opening it again is not the same as making progress." };
  if (distracting >= Math.max(4, total / 2)) return { title: "Chronic Productive Procrastination", note: "The vibes are excellent. The task remains untouched." };
  if (duplicateGroups >= 2) return { title: "Commitment Multiplicity", note: "You keep your options—and identical tabs—open." };
  if (total <= 3) return { title: "Suspiciously Healthy Boundaries", note: "We have very little to discuss. Disturbing." };
  return { title: "Mild Tab Emotional Baggage", note: "Common, treatable, and honestly kind of charming." };
}

function prescribe({ total, distracting, duplicateGroups }) {
  if (total >= 30) return "Recommended treatment: close three tabs, drink water, then close three more.";
  if (distracting >= 4) return "Recommended treatment: finish one task before the algorithm chooses your evening.";
  if (duplicateGroups) return "Recommended treatment: introduce your duplicate tabs to each other and choose one.";
  return "Recommended treatment: continue responsibly and schedule a follow-up after your next rabbit hole.";
}

function percentage(part, total) { return total ? Math.round((part / total) * 100) : 0; }
function clamp(value, minimum = 0, maximum = 100) { return Math.max(minimum, Math.min(maximum, value)); }
function shortDomain(domain) { return domain === "none" ? "Browser" : domain.split(".")[0].replace(/^./, (letter) => letter.toUpperCase()); }

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
