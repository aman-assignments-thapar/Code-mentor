// AI / Solution Engine — weak-topic detection, mistake-based recommendations,
// progressive hints and submission feedback. Rule-based + deterministic so demos never flake.
import { getDB, updateDB } from './storageService.js';
import { TOPICS } from '../data/seedData.js';
import { getStatusMap } from './problemService.js';

const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };
const RECENT_WINDOW_MS = 14 * 86400000;

// Weak-topic rule (TC05): a topic is weak when the student has 2+ wrong submissions OR
// a success rate below 50% over at least 2 attempts — and has not yet recovered (≥ 70%).
export const WEAK_RULE = { minWrong: 2, maxAccuracy: 50, minAttempts: 2, recoveredAccuracy: 70 };

export function getTopicStats(userId) {
  const db = getDB();
  const subs = db.submissions.filter((s) => s.userId === userId);
  const status = getStatusMap(userId);
  const latest = subs.reduce((m, s) => Math.max(m, s.timestamp), 0) || Date.now();
  const topics = [...new Set([...TOPICS, ...db.problems.map((p) => p.topic)])];
  return topics.map((topic) => {
    const ts = subs.filter((s) => s.topic === topic);
    const accepted = ts.filter((s) => s.status === 'Accepted').length;
    const wrong = ts.length - accepted;
    const recentMistakes = ts.filter((s) => s.status !== 'Accepted' && latest - s.timestamp <= RECENT_WINDOW_MS).length;
    const topicProblems = db.problems.filter((p) => p.topic === topic);
    const accuracy = ts.length ? Math.round((accepted / ts.length) * 100) : null;
    const isWeak =
      ts.length > 0 &&
      (wrong >= WEAK_RULE.minWrong || (ts.length >= WEAK_RULE.minAttempts && accuracy < WEAK_RULE.maxAccuracy)) &&
      accuracy < WEAK_RULE.recoveredAccuracy;
    return {
      topic,
      attempts: ts.length,
      accepted,
      wrong,
      recentMistakes,
      accuracy,
      solved: topicProblems.filter((p) => status[p.id] === 'solved').length,
      totalProblems: topicProblems.length,
      isWeak,
      // higher = weaker; used for ranking
      severity: isWeak ? wrong * 10 + (100 - accuracy) : 0,
    };
  });
}

export function detectWeakTopics(userId) {
  return getTopicStats(userId)
    .filter((t) => t.isWeak)
    .sort((a, b) => b.severity - a.severity);
}

/** Problems the student failed and has not yet solved (mistake log). */
export function getMistakeLog(userId) {
  const db = getDB();
  const status = getStatusMap(userId);
  const byProblem = {};
  db.submissions
    .filter((s) => s.userId === userId && s.status !== 'Accepted')
    .forEach((s) => {
      const e = (byProblem[s.problemId] ||= { problemId: s.problemId, title: s.title, topic: s.topic, difficulty: s.difficulty, mistakes: 0, lastAt: 0 });
      e.mistakes++;
      e.lastAt = Math.max(e.lastAt, s.timestamp);
    });
  return Object.values(byProblem)
    .map((e) => ({ ...e, resolved: status[e.problemId] === 'solved' }))
    .sort((a, b) => b.lastAt - a.lastAt);
}

/**
 * Personalized Mistake-Based Recommendation System (TC07).
 * Priority: (1) retry unsolved failed problems, (2) unsolved problems in weak topics (easiest first),
 * (3) unexplored topics, (4) next step-up in difficulty.
 */
export function getRecommendations(userId, limit = 8) {
  const db = getDB();
  const status = getStatusMap(userId);
  const stats = getTopicStats(userId);
  const statByTopic = Object.fromEntries(stats.map((t) => [t.topic, t]));
  const weak = stats.filter((t) => t.isWeak).sort((a, b) => b.severity - a.severity);
  const weakSet = new Set(weak.map((t) => t.topic));
  const mistakes = getMistakeLog(userId).filter((m) => !m.resolved);
  const problemMap = Object.fromEntries(db.problems.map((p) => [p.id, p]));
  const recs = new Map();

  const add = (problem, rec) => {
    if (!problem || recs.has(problem.id) || status[problem.id] === 'solved') return;
    recs.set(problem.id, { problem, ...rec });
  };

  mistakes.forEach((m) => {
    const p = problemMap[m.problemId];
    if (!p) return;
    add(p, {
      reasonType: 'retry',
      reason: 'Retry after previous mistake',
      detail: `You had ${m.mistakes} wrong submission${m.mistakes > 1 ? 's' : ''} here. Use the hints and try again.`,
      score: 1000 + (weakSet.has(p.topic) ? 200 : 0) + m.mistakes * 10 - DIFF_ORDER[p.difficulty],
    });
  });

  weak.forEach((t, wi) => {
    db.problems
      .filter((p) => p.topic === t.topic)
      .sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.id - b.id)
      .forEach((p, i) =>
        add(p, {
          reasonType: 'weak',
          reason: `Targeted for weak topic: ${t.topic}`,
          detail: `${t.topic} accuracy is ${t.accuracy}% with ${t.wrong} mistake${t.wrong === 1 ? '' : 's'}. Start with the ${p.difficulty.toLowerCase()} pattern.`,
          score: 800 - wi * 50 - i * 5,
        }),
      );
  });

  const unexplored = stats.filter((t) => t.attempts === 0);
  unexplored.forEach((t, ti) => {
    const p = db.problems.filter((x) => x.topic === t.topic).sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty])[0];
    add(p, {
      reasonType: 'explore',
      reason: `Explore new topic: ${t.topic}`,
      detail: `You haven't attempted any ${t.topic} problems yet — this is a good first one.`,
      score: 400 - ti * 10,
    });
  });

  stats
    .filter((t) => t.solved > 0 && !t.isWeak)
    .forEach((t) => {
      const next = db.problems
        .filter((p) => p.topic === t.topic && status[p.id] !== 'solved')
        .sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty])[0];
      add(next, {
        reasonType: 'levelup',
        reason: `Level up in ${t.topic}`,
        detail: `You're doing well in ${t.topic} (${statByTopic[t.topic].accuracy ?? 0}% accuracy). Try the next challenge.`,
        score: 200 + (statByTopic[t.topic].accuracy || 0) / 10,
      });
    });

  return [...recs.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getNextProblem(userId, currentProblemId) {
  const rec = getRecommendations(userId, 10).find((r) => r.problem.id !== Number(currentProblemId));
  if (rec) return rec;
  const status = getStatusMap(userId);
  const p = getDB().problems.find((x) => x.id !== Number(currentProblemId) && status[x.id] !== 'solved');
  return p ? { problem: p, reason: 'Next unsolved problem', reasonType: 'next' } : null;
}

// ───────────── Progressive hints (TC06) ─────────────
export const HINT_LABELS = ['Hint 1 · Intuition', 'Hint 2 · Approach / Data Structure', 'Hint 3 · Step-by-step Algorithm'];

export function getRevealedHintCount(userId, problemId) {
  return getDB().progress[userId]?.hintsRevealed?.[problemId] || 0;
}

/** Reveal exactly one more hint; returns the list of hints now visible. */
export function revealNextHint(userId, problemId) {
  const problem = getDB().problems.find((p) => p.id === Number(problemId));
  if (!problem) return [];
  const max = problem.hints.length;
  updateDB((db) => {
    const prog = (db.progress[userId] ||= { dailyGoal: 3, dayOffset: 0, hintsRevealed: {} });
    prog.hintsRevealed ||= {};
    prog.hintsRevealed[problem.id] = Math.min(max, (prog.hintsRevealed[problem.id] || 0) + 1);
  });
  return getVisibleHints(userId, problemId);
}

export function getVisibleHints(userId, problemId) {
  const problem = getDB().problems.find((p) => p.id === Number(problemId));
  if (!problem) return [];
  return problem.hints.slice(0, getRevealedHintCount(userId, problemId)).map((text, i) => ({ level: i + 1, label: HINT_LABELS[i], text }));
}

// ───────────── Feedback on a submission ─────────────
export function analyzeSubmission(problem, code, result) {
  const lower = (code || '').toLowerCase();
  const tips = [];
  const missing = (problem.expectedKeywords || []).filter((k) => !lower.includes(k.toLowerCase()));
  if (result.status === 'Accepted') {
    tips.push(`Nice work! "${problem.title}" is a classic ${problem.topic} pattern.`);
    if (missing.length && missing.length < (problem.expectedKeywords || []).length) {
      tips.push(`Optimal solutions often use: ${missing.join(', ')}. Compare your approach with Hint 3.`);
    }
    return tips;
  }
  const byReason = {
    empty: 'Start by reading Hint 1 for the core intuition, then sketch the loop structure.',
    unchanged: 'You submitted the template unchanged. Fill in the function body and return a value.',
    too_short: 'Your solution is too short to handle the general case. Think about iterating over the input.',
    no_logic: 'Make sure your function actually returns the computed answer.',
    marker: 'The output differs from the expected answer on the sample input. Trace the example by hand.',
  };
  tips.push(byReason[result.reason] || 'Re-check your logic against the examples.');
  if (missing.length) tips.push(`Key ideas for this problem: ${problem.expectedKeywords.join(', ')}.`);
  tips.push(`This mistake has been recorded under ${problem.topic} and will shape your recommendations.`);
  return tips;
}
