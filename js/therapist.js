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
  const domainCounts = countBy(profiles, (profile) => profile.domain);
  const duplicateGroups = Object.values(domainCounts).filter((count) => count > 1).length;
  const worstRepeat = Math.max(0, ...Object.values(domainCounts));
  const dominantDomain = Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "none";
  const pinned = profiles.filter((profile) => profile.pinned).length;
  const diagnosis = chooseDiagnosis({ total, distracting, duplicateGroups, worstRepeat });
  const symptoms = [];
  
  if (total > 10) symptoms.push(`${total} tabs open — browser may slow down`);
  if (worstRepeat > 1) symptoms.push(`${worstRepeat} duplicate tabs from ${dominantDomain}`);
  if (distracting) symptoms.push(`${distracting} entertainment/social tabs`);
  if (duplicateGroups >= 2) symptoms.push(`Multiple domains in duplicates (${duplicateGroups} groups)`);
  if (pinned) symptoms.push(`${pinned} pinned tab${pinned === 1 ? "" : "s"} (long-term projects)`);

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
      { label: "Work tabs", value: productivity },
      { label: "Distraction level", value: procrastination },
      { label: "Open tab count", value: hoarding },
      { label: `${shortDomain(dominantDomain)} usage`, value: dependency },
    ],
    prediction: `Estimated closure likelihood: ${closureChance}%`,
  };
}

function chooseDiagnosis({ total, distracting, duplicateGroups, worstRepeat }) {
  if (total >= 30) return { title: "Too Many Tabs Open", note: "Over 30 tabs impact browser performance and your focus. Consider organizing by project." };
  if (worstRepeat >= 5) return { title: "Duplicate Tabs Detected", note: `You have ${worstRepeat} instances of the same domain open. Close extras to stay focused.` };
  if (distracting >= Math.max(4, total / 2)) return { title: "High Distraction Level", note: `${distracting} entertainment/social tabs are open. Set these aside when focused on work.` };
  if (duplicateGroups >= 2) return { title: "Multiple Domain Duplicates", note: "You're managing several domains across multiple tabs. Consolidate to reduce cognitive load." };
  if (total <= 3) return { title: "Clean Tab Practice", note: "You're keeping tabs minimal. This setup allows better focus and faster browsing." };
  return { title: "Moderate Tab Count", note: "Your tab count is reasonable. Keep monitoring to avoid accumulation." };
}

function prescribe({ total, distracting, duplicateGroups }) {
  if (total >= 30) return "Action: Close tabs you haven't viewed in the last hour. Keep only current tasks open.";
  if (distracting >= 4) return "Action: Move entertainment tabs to a separate window. Return to them after completing your main task.";
  if (duplicateGroups) return "Action: Close duplicate tabs for the same domain. Keep only the one you're actively using.";
  return "Action: Maintain current setup. Close tabs after completing their task to prevent accumulation.";
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
