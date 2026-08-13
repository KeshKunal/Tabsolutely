/**
 * therapist.js turns current-window profile statistics into a playful diagnosis.
 * It is pure product logic: it reads no browser data and changes no UI itself.
 */

export function diagnoseTabHabits(profiles) {
  const total = profiles.length;
  const distracting = profiles.filter((profile) => ["Entertainment", "Social", "Shopping"].includes(profile.category)).length;
  const muted = profiles.filter((profile) => profile.muted).length;
  const pinned = profiles.filter((profile) => profile.pinned).length;
  const finalDrafts = profiles.filter((profile) => /\bfinal(?:[-_ ]?v?\d+)?\b/i.test(profile.title)).length;
  const domainCounts = countBy(profiles, (profile) => profile.domain);
  const duplicateGroups = Object.values(domainCounts).filter((count) => count > 1).length;
  const worstRepeat = Math.max(0, ...Object.values(domainCounts));
  const diagnosis = chooseDiagnosis({ total, distracting, duplicateGroups, worstRepeat });
  const symptoms = [`${total} tabs attending this session`];

  if (worstRepeat > 1) symptoms.push(`${worstRepeat} tabs committed to the same domain`);
  if (distracting) symptoms.push(`${distracting} highly qualified distractions`);
  if (muted) symptoms.push(`${muted} relationship${muted === 1 ? "" : "s"} receiving the silent treatment`);
  if (pinned) symptoms.push(`${pinned} serious long-term commitment${pinned === 1 ? "" : "s"}`);
  if (finalDrafts) symptoms.push(`${finalDrafts} “final” draft${finalDrafts === 1 ? "" : "s"}, allegedly`);

  return { ...diagnosis, symptoms: symptoms.slice(0, 5), treatment: prescribe({ total, distracting, duplicateGroups }) };
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
  if (distracting >= 4) return "Recommended treatment: one productive tab before your next video. Negotiate firmly.";
  if (duplicateGroups) return "Recommended treatment: introduce your duplicate tabs to each other and choose one.";
  return "Recommended treatment: continue browsing responsibly and schedule a follow-up after your next rabbit hole.";
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
