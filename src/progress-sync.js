import { initialProgress } from "./engine.js";
export function validProgress(p) {
  return (
    p?.version === 1 &&
    p.skills &&
    typeof p.skills === "object" &&
    Array.isArray(p.seen) &&
    Array.isArray(p.attempts) &&
    Array.isArray(p.sessions)
  );
}
const attemptId = (a) =>
  a.id || `${a.date}|${a.fingerprint || a.skill}|${a.retries}|${a.skipped}`;
const sessionId = (s) => s.id || `${s.date}|${s.worldId}|${s.count}`;
export function mergeProgress(remote, local) {
  if (!validProgress(remote)) remote = initialProgress();
  const ids = new Set(remote.attempts.map(attemptId)),
    seen = new Set(remote.seen);
  const added = local.attempts.filter(
    (a) =>
      !ids.has(attemptId(a)) && (!a.fingerprint || !seen.has(a.fingerprint)),
  );
  const localById = new Map(local.attempts.map((a) => [attemptId(a), a]));
  const updatedRemoteAttempts = remote.attempts.map((a) => {
    const other = localById.get(attemptId(a));
    return (other?.reflection?.date || 0) > (a.reflection?.date || 0)
      ? { ...a, reflection: other.reflection }
      : a;
  });
  const skills = structuredClone(remote.skills);
  for (const a of added) {
    const s = skills[a.skill] || {
      total: 0,
      independent: 0,
      supported: 0,
      last: 0,
    };
    skills[a.skill] = {
      total: s.total + 1,
      independent: s.independent + (a.independent ? 1 : 0),
      supported: s.supported + (!a.skipped && !a.independent ? 1 : 0),
      last: Math.max(s.last, a.date),
    };
  }
  // Preserve older aggregate evidence when the local attempt window has been trimmed.
  for (const [key, s] of Object.entries(local.skills)) {
    if (!remote.skills[key] || s.total > (skills[key]?.total || 0))
      skills[key] = s;
  }
  const sessions = new Map(
    [...remote.sessions, ...local.sessions].map((s) => [sessionId(s), s]),
  );
  return {
    version: 1,
    skills,
    seen: [...new Set([...remote.seen, ...local.seen])],
    attempts: [...updatedRemoteAttempts, ...added]
      .sort((a, b) => a.date - b.date)
      .slice(-3000),
    sessions: [...sessions.values()]
      .sort((a, b) => a.date - b.date)
      .slice(-365),
    seeds: Math.max(remote.seeds || 0, local.seeds || 0),
  };
}
export function encodeProgress(p) {
  const raw = JSON.stringify(p);
  const chunks = [];
  for (let i = 0; i < raw.length; i += 90000)
    chunks.push(raw.slice(i, i + 90000));
  if (chunks.length > 450)
    throw Error(
      "Progress backup is too large. Export a copy from Parent corner.",
    );
  return chunks;
}
export function decodeProgress(chunks) {
  const p = JSON.parse(chunks.join(""));
  if (!validProgress(p)) throw Error("Invalid cloud progress");
  return p;
}
