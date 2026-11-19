// Problem Service — problem catalogue, deterministic evaluator, submissions, progress & streaks,
// leaderboard, and timed Practice Mode sessions.
import { getDB, updateDB, uid } from './storageService.js';

export const DAY_MS = 86400000;
export const POINTS = { Easy: 10, Medium: 20, Hard: 30 };
const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

// ───────────── time helpers (each user has a virtual clock for the "Simulate Next-Day" demo) ─────────────
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function userNow(userId) {
  const offset = getDB().progress[userId]?.dayOffset || 0;
  return Date.now() + offset * DAY_MS;
}

// ───────────── catalogue ─────────────
export function getProblems({ difficulty = 'All', topic = 'All', search = '' } = {}) {
  const q = search.trim().toLowerCase();
  return getDB()
    .problems.filter((p) => difficulty === 'All' || p.difficulty === difficulty)
    .filter((p) => topic === 'All' || p.topic === topic)
    .filter((p) => !q || p.title.toLowerCase().includes(q) || String(p.id) === q || p.topic.toLowerCase().includes(q))
    .sort((a, b) => a.id - b.id);
}

export function getProblem(id) {
  return getDB().problems.find((p) => p.id === Number(id)) || null;
}

export function getUserSubmissions(userId, problemId = null) {
  return getDB()
    .submissions.filter((s) => s.userId === userId && (problemId == null || s.problemId === Number(problemId)))
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Map problemId → 'solved' | 'attempted' for one user. */
export function getStatusMap(userId) {
  const map = {};
  getDB().submissions.forEach((s) => {
    if (s.userId !== userId) return;
    if (s.status === 'Accepted') map[s.problemId] = 'solved';
    else if (map[s.problemId] !== 'solved') map[s.problemId] = 'attempted';
  });
  return map;
}

// ───────────── deterministic evaluator ─────────────
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const COMMENT_LINE = /^(\/\/|#|\/\*|\*|\*\/)/;
const LOGIC_RE = /\b(return|for|while|if|print|yield|foreach)\b|[^=!<>]=[^=]/;
const FAIL_MARKER = /(\/\/|#)\s*fail\b|\bwrong\b/i;

function wrongOutputFor(expected) {
  const e = String(expected).trim();
  if (e === 'true') return 'false';
  if (e === 'false') return 'true';
  if (/^-?\d+$/.test(e)) return String(Number(e) === 0 ? -1 : Number(e) - 1);
  if (e.startsWith('[')) return '[]';
  return '""';
}

/**
 * Smart deterministic evaluator (TC04).
 *  PASS  — code adds real logic (return / loop / condition / assignment) beyond the starter template.
 *  FAIL  — empty, unchanged starter, too short, or contains "// fail" / "# fail" / the word "wrong".
 */
export function evaluateCode(problem, code, language, mode = 'submit') {
  const src = code || '';
  const starter = problem.starterCode?.[language] || '';
  const starterLines = new Set(starter.split('\n').map((l) => l.trim()).filter(Boolean));
  const addedLogic = src
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !starterLines.has(l) && !COMMENT_LINE.test(l));
  const addedText = addedLogic.join('\n');
  const compact = addedText.replace(/\s+/g, '');

  let reason = null;
  if (!src.trim()) reason = 'empty';
  else if (FAIL_MARKER.test(src)) reason = 'marker';
  else if (src.replace(/\s+/g, '') === starter.replace(/\s+/g, '')) reason = 'unchanged';
  else if (compact.length < 10) reason = 'too_short';
  else if (!LOGIC_RE.test(addedText)) reason = 'no_logic';

  const h = hash(`${problem.id}:${language}:${src}`);
  const total = 30 + ((problem.id * 7) % 45);
  const tests = problem.examples.map((ex) => ({ input: ex.input, expected: ex.output }));

  if (!reason) {
    return {
      status: 'Accepted',
      passed: total,
      total,
      runtime: 40 + (h % 70),
      runtimeBeats: +(55 + ((h >> 3) % 4400) / 100).toFixed(2),
      memory: +(40 + ((h >> 5) % 1200) / 100).toFixed(1),
      memoryBeats: +(40 + ((h >> 7) % 5800) / 100).toFixed(2),
      cases: tests.map((t) => ({ ...t, output: t.expected, pass: true })),
      mode,
    };
  }

  const messages = {
    empty: 'No code was submitted. Write your solution in the editor first.',
    marker: 'Your solution returned an incorrect result on the first test case.',
    unchanged: 'The starter template was submitted without any implementation.',
    too_short: 'The implementation is incomplete — it does not produce the expected output.',
    no_logic: 'Your code does not return or compute a result (no return / loop / condition found).',
  };
  const passed = reason === 'marker' || reason === 'no_logic' ? Math.floor(total * (0.15 + (h % 50) / 100)) : 0;
  return {
    status: 'Wrong Answer',
    passed,
    total,
    reason,
    message: messages[reason],
    input: tests[0].input,
    expected: tests[0].expected,
    output: reason === 'empty' || reason === 'unchanged' ? 'null' : wrongOutputFor(tests[0].expected),
    cases: tests.map((t, i) => ({
      ...t,
      output: i === 0 ? (reason === 'empty' || reason === 'unchanged' ? 'null' : wrongOutputFor(t.expected)) : t.expected,
      pass: i !== 0,
    })),
    mode,
  };
}

/** Run = evaluate sample cases only (nothing is recorded). */
export function runCode(problemId, code, language) {
  const problem = getProblem(problemId);
  return evaluateCode(problem, code, language, 'run');
}

/** Submit = evaluate + record submission + update progress / streak / leaderboard. */
export function submitSolution(userId, problemId, code, language, { source = 'workspace', sessionId = null } = {}) {
  const problem = getProblem(problemId);
  if (!problem) return { ok: false, error: 'Problem not found.' };
  const result = evaluateCode(problem, code, language, 'submit');
  const wasSolved = getStatusMap(userId)[problem.id] === 'solved';
  const submission = {
    id: uid('s'),
    userId,
    problemId: problem.id,
    title: problem.title,
    topic: problem.topic,
    difficulty: problem.difficulty,
    language,
    status: result.status,
    runtime: result.runtime ?? null,
    memory: result.memory ?? null,
    code,
    source,
    sessionId,
    timestamp: userNow(userId),
  };
  updateDB((db) => db.submissions.push(submission));
  return { ok: true, result, submission, firstSolve: result.status === 'Accepted' && !wasSolved };
}

// ───────────── progress, streaks & daily goal (TC08) ─────────────
function computeStreak(activeDays, todayTs) {
  const set = new Set(activeDays);
  let cursor = todayTs;
  if (!set.has(dayKey(cursor))) cursor -= DAY_MS; // streak survives until the end of today
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
}

function longestStreak(activeDays) {
  const sorted = [...new Set(activeDays)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  sorted.forEach((d) => {
    const t = new Date(`${d}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / DAY_MS) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  });
  return best;
}

export function getUserStats(userId) {
  const db = getDB();
  const subs = db.submissions.filter((s) => s.userId === userId);
  const status = getStatusMap(userId);
  const now = userNow(userId);
  const today = dayKey(now);
  const solvedIds = Object.keys(status).filter((k) => status[k] === 'solved').map(Number);
  const problemMap = Object.fromEntries(db.problems.map((p) => [p.id, p]));
  const solvedProblems = solvedIds.map((id) => problemMap[id]).filter(Boolean);

  const breakdown = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };
  db.problems.forEach((p) => breakdown[p.difficulty].total++);
  solvedProblems.forEach((p) => breakdown[p.difficulty].solved++);

  const accepted = subs.filter((s) => s.status === 'Accepted');
  const activeDays = accepted.map((s) => dayKey(s.timestamp));
  const solvedToday = new Set(accepted.filter((s) => dayKey(s.timestamp) === today).map((s) => s.problemId)).size;
  const dailyGoal = db.progress[userId]?.dailyGoal || 3;

  // Activity map for the last 35 days (submissions per day)
  const activity = [];
  for (let i = 34; i >= 0; i--) {
    const key = dayKey(now - i * DAY_MS);
    activity.push({ day: key, count: subs.filter((s) => dayKey(s.timestamp) === key).length });
  }

  return {
    totalSolved: solvedProblems.length,
    totalProblems: db.problems.length,
    breakdown,
    totalSubmissions: subs.length,
    acceptedSubmissions: accepted.length,
    acceptanceRate: subs.length ? Math.round((accepted.length / subs.length) * 100) : 0,
    streak: computeStreak(activeDays, now),
    longestStreak: longestStreak(activeDays),
    solvedToday,
    dailyGoal,
    points: solvedProblems.reduce((sum, p) => sum + POINTS[p.difficulty], 0),
    activity,
    today,
    dayOffset: db.progress[userId]?.dayOffset || 0,
  };
}

export function setDailyGoal(userId, goal) {
  updateDB((db) => {
    db.progress[userId] = { ...(db.progress[userId] || {}), dailyGoal: Math.max(1, Math.min(10, Number(goal) || 3)) };
  });
}

/** Demo helper (TC08): advance this user's virtual clock by one day and record an accepted solve. */
export function simulateNextDaySolve(userId, preferredProblemId = null) {
  updateDB((db) => {
    const p = db.progress[userId] || (db.progress[userId] = { dailyGoal: 3, hintsRevealed: {} });
    p.dayOffset = (p.dayOffset || 0) + 1;
  });
  const status = getStatusMap(userId);
  const pool = getDB().problems.slice().sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.id - b.id);
  const target =
    (preferredProblemId && pool.find((p) => p.id === preferredProblemId && status[p.id] !== 'solved')) ||
    pool.find((p) => status[p.id] !== 'solved') ||
    pool[0];
  const code = `${target.starterCode.javascript}\n// simulated solve\nconst result = [];\nfor (let i = 0; i < 1; i++) result.push(i);\nreturn result;`;
  const res = submitSolution(userId, target.id, code, 'javascript', { source: 'simulated' });
  return { ...res, problem: target, stats: getUserStats(userId) };
}

// ───────────── leaderboard ─────────────
export function getLeaderboard(limit = 10) {
  const db = getDB();
  return db.users
    .filter((u) => u.role === 'student')
    .map((u) => {
      const s = getUserStats(u.id);
      return { userId: u.id, name: u.name, solved: s.totalSolved, points: s.points, streak: s.streak, acceptanceRate: s.acceptanceRate };
    })
    .sort((a, b) => b.points - a.points || b.solved - a.solved || b.streak - a.streak || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// ───────────── Practice Mode (TC09) ─────────────
export function createPracticeSession(userId, { difficulty = 'Easy', topic = 'All', count = 3, minutes = 15 }) {
  const db = getDB();
  const status = getStatusMap(userId);
  const n = Math.max(3, Math.min(5, Number(count) || 3));
  const ranked = (list) => [...list.filter((p) => status[p.id] !== 'solved'), ...list.filter((p) => status[p.id] === 'solved')];
  const exact = db.problems.filter((p) => p.difficulty === difficulty && (topic === 'All' || p.topic === topic));
  const sameDiff = db.problems.filter((p) => p.difficulty === difficulty && !exact.includes(p));
  const rest = db.problems.filter((p) => !exact.includes(p) && !sameDiff.includes(p)).sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
  const picked = [...ranked(exact), ...ranked(sameDiff), ...ranked(rest)].slice(0, n);

  const session = {
    id: uid('ps'),
    userId,
    difficulty,
    topic,
    problemIds: picked.map((p) => p.id),
    durationSec: Math.max(1, Number(minutes) || 15) * 60,
    startedAt: Date.now(),
    status: 'active',
    summary: null,
  };
  updateDB((d) => d.practiceSessions.push(session));
  return session;
}

export function getPracticeSession(sessionId) {
  return getDB().practiceSessions.find((s) => s.id === sessionId) || null;
}

export function finishPracticeSession(sessionId) {
  const session = getPracticeSession(sessionId);
  if (!session) return null;
  if (session.summary) return session.summary;
  const db = getDB();
  const subs = db.submissions.filter((s) => s.sessionId === sessionId);
  const solvedIds = [...new Set(subs.filter((s) => s.status === 'Accepted').map((s) => s.problemId))];
  const problems = session.problemIds.map((id) => db.problems.find((p) => p.id === id)).filter(Boolean);
  const maxScore = problems.reduce((sum, p) => sum + POINTS[p.difficulty], 0);
  const score = problems.filter((p) => solvedIds.includes(p.id)).reduce((sum, p) => sum + POINTS[p.difficulty], 0);
  const elapsed = Math.min(session.durationSec, Math.round((Date.now() - session.startedAt) / 1000));
  const summary = {
    score,
    maxScore,
    solved: solvedIds.length,
    total: problems.length,
    attempts: subs.length,
    accuracy: subs.length ? Math.round((subs.filter((s) => s.status === 'Accepted').length / subs.length) * 100) : 0,
    timeTakenSec: elapsed,
    timedOut: elapsed >= session.durationSec,
    perProblem: problems.map((p) => {
      const ps = subs.filter((s) => s.problemId === p.id);
      return { id: p.id, title: p.title, difficulty: p.difficulty, topic: p.topic, attempts: ps.length, solved: solvedIds.includes(p.id) };
    }),
    finishedAt: Date.now(),
  };
  updateDB((d) => {
    const s = d.practiceSessions.find((x) => x.id === sessionId);
    s.status = 'finished';
    s.summary = summary;
  });
  return summary;
}

export function getPracticeHistory(userId) {
  return getDB()
    .practiceSessions.filter((s) => s.userId === userId && s.summary)
    .sort((a, b) => b.startedAt - a.startedAt);
}
