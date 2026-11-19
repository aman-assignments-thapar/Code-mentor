// Admin Service — reports & analytics, user management and problem management (TC10).
import { getDB, updateDB } from './storageService.js';
import { makeStarter, TOPICS, DIFFICULTIES } from '../data/seedData.js';
import { getUserStats } from './problemService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getReports() {
  const db = getDB();
  const subs = db.submissions;
  const accepted = subs.filter((s) => s.status === 'Accepted').length;
  const failsByTopic = {};
  const attemptsByTopic = {};
  subs.forEach((s) => {
    attemptsByTopic[s.topic] = (attemptsByTopic[s.topic] || 0) + 1;
    if (s.status !== 'Accepted') failsByTopic[s.topic] = (failsByTopic[s.topic] || 0) + 1;
  });
  const topics = [...new Set([...TOPICS, ...Object.keys(attemptsByTopic)])];
  const mostFailedTopics = topics
    .map((topic) => ({
      topic,
      failures: failsByTopic[topic] || 0,
      attempts: attemptsByTopic[topic] || 0,
      failRate: attemptsByTopic[topic] ? Math.round(((failsByTopic[topic] || 0) / attemptsByTopic[topic]) * 100) : 0,
    }))
    .sort((a, b) => b.failures - a.failures || b.failRate - a.failRate);
  const byDifficulty = DIFFICULTIES.map((d) => {
    const ds = subs.filter((s) => s.difficulty === d);
    return { difficulty: d, submissions: ds.length, passRate: ds.length ? Math.round((ds.filter((s) => s.status === 'Accepted').length / ds.length) * 100) : 0 };
  });
  const problemFails = {};
  subs.filter((s) => s.status !== 'Accepted').forEach((s) => (problemFails[s.title] = (problemFails[s.title] || 0) + 1));
  return {
    totalUsers: db.users.length,
    totalStudents: db.users.filter((u) => u.role === 'student').length,
    totalAdmins: db.users.filter((u) => u.role === 'admin').length,
    totalProblems: db.problems.length,
    totalSubmissions: subs.length,
    acceptedSubmissions: accepted,
    passRate: subs.length ? Math.round((accepted / subs.length) * 100) : 0,
    mostFailedTopics,
    byDifficulty,
    mostFailedProblems: Object.entries(problemFails).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    recentSubmissions: [...subs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8).map((s) => ({
      ...s,
      userName: db.users.find((u) => u.id === s.userId)?.name || 'Deleted user',
    })),
  };
}

export function listUsers() {
  return getDB().users.map(({ password, ...u }) => {
    const s = getUserStats(u.id);
    return { ...u, solved: s.totalSolved, submissions: s.totalSubmissions, streak: s.streak };
  });
}

export function updateUser(userId, { name, email, role, password }) {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found.' };
  if (name !== undefined && name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
  if (email !== undefined) {
    if (!EMAIL_RE.test(email.trim())) return { ok: false, error: 'Invalid email address.' };
    if (db.users.some((u) => u.id !== userId && u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { ok: false, error: 'Another user already uses this email.' };
    }
  }
  if (role !== undefined && !['student', 'admin'].includes(role)) return { ok: false, error: 'Invalid role.' };
  if (password && password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  updateDB((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (name !== undefined) u.name = name.trim();
    if (email !== undefined) u.email = email.trim().toLowerCase();
    if (role !== undefined) u.role = role;
    if (password) u.password = password;
  });
  return { ok: true };
}

export function deleteUser(userId, actingAdminId = null) {
  if (userId === actingAdminId) return { ok: false, error: 'You cannot delete your own admin account.' };
  const db = getDB();
  if (!db.users.some((u) => u.id === userId)) return { ok: false, error: 'User not found.' };
  updateDB((d) => {
    d.users = d.users.filter((u) => u.id !== userId);
    d.submissions = d.submissions.filter((s) => s.userId !== userId);
    d.practiceSessions = d.practiceSessions.filter((s) => s.userId !== userId);
    delete d.progress[userId];
  });
  return { ok: true };
}

export function listProblems() {
  const db = getDB();
  return db.problems.map((p) => {
    const ps = db.submissions.filter((s) => s.problemId === p.id);
    return { ...p, submissions: ps.length, failures: ps.filter((s) => s.status !== 'Accepted').length };
  });
}

export function addProblem(data) {
  const title = (data.title || '').trim();
  if (title.length < 3) return { ok: false, error: 'Title must be at least 3 characters.' };
  if (!TOPICS.includes(data.topic)) return { ok: false, error: 'Please choose a valid topic.' };
  if (!DIFFICULTIES.includes(data.difficulty)) return { ok: false, error: 'Please choose a valid difficulty.' };
  if (!(data.description || '').trim()) return { ok: false, error: 'Description is required.' };
  const db = getDB();
  if (db.problems.some((p) => p.title.toLowerCase() === title.toLowerCase())) return { ok: false, error: 'A problem with this title already exists.' };
  const fn = (data.functionName || 'solve').trim().replace(/[^A-Za-z0-9_]/g, '') || 'solve';
  const hints = [data.hint1, data.hint2, data.hint3].map((h, i) => (h || '').trim() || [
    'Think about what information you need at each step.',
    'Pick a data structure that lets you look that information up quickly.',
    'Iterate once over the input, update your structure, and return the answer.',
  ][i]);
  const problem = {
    id: db.nextProblemId || Math.max(0, ...db.problems.map((p) => p.id)) + 1,
    title,
    topic: data.topic,
    difficulty: data.difficulty,
    acceptanceRate: 0,
    description: data.description.trim(),
    examples: [{ input: (data.exampleInput || 'input = []').trim(), output: (data.exampleOutput || '0').trim(), explanation: (data.exampleExplanation || '').trim() || undefined }],
    constraints: (data.constraints || '').split('\n').map((c) => c.trim()).filter(Boolean),
    starterCode: makeStarter(fn, [['input', 'int[]']], 'int'),
    expectedKeywords: (data.keywords || 'return').split(',').map((k) => k.trim()).filter(Boolean),
    hints,
    custom: true,
  };
  updateDB((d) => {
    d.problems.push(problem);
    d.nextProblemId = problem.id + 1;
  });
  return { ok: true, problem };
}

export function deleteProblem(problemId) {
  const id = Number(problemId);
  if (!getDB().problems.some((p) => p.id === id)) return { ok: false, error: 'Problem not found.' };
  updateDB((d) => {
    d.problems = d.problems.filter((p) => p.id !== id);
  });
  return { ok: true };
}
