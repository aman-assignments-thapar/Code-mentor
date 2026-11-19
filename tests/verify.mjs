// Service-level verification of Test Cases TC01–TC10.  Run with: npm test
// Uses an in-memory localStorage shim so the exact browser services run under Node.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};

const storage = await import('../src/services/storageService.js');
const auth = await import('../src/services/authService.js');
const ps = await import('../src/services/problemService.js');
const ai = await import('../src/services/aiEngine.js');
const admin = await import('../src/services/adminService.js');

let passed = 0;
let failed = 0;
const results = [];
function check(tc, name, cond, extra = '') {
  if (cond) passed++;
  else failed++;
  results.push({ tc, name, ok: !!cond });
  console.log(`${cond ? '  ✔' : '  ✘'} [${tc}] ${name}${!cond && extra ? ` — ${extra}` : ''}`);
}

storage.resetDB();
console.log('\nCode Mentor — TC01–TC10 service verification\n');

// TC01 Registration
const reg = auth.register({ name: 'Test Student', email: 'new@codementor.edu', password: 'secret1' });
check('TC01', 'new student account is created', reg.ok && reg.user.role === 'student');
check('TC01', 'account persisted to storage', JSON.parse(localStorage.getItem('codementor_db_v1')).users.some((u) => u.email === 'new@codementor.edu'));
check('TC01', 'session started (redirect to dashboard)', auth.getCurrentUser()?.email === 'new@codementor.edu');
check('TC01', 'duplicate email rejected', !auth.register({ name: 'Dup', email: 'NEW@codementor.edu', password: 'secret1' }).ok);
check('TC01', 'invalid email / short password rejected', !auth.register({ name: 'X Y', email: 'bad', password: '1' }).ok);
const newUserId = reg.user.id;

// TC02 Login
auth.logout();
const bad = auth.login('student@codementor.edu', 'wrongpass');
check('TC02', 'wrong password shows error', !bad.ok && /invalid/i.test(bad.error));
check('TC02', 'unknown email shows error', !auth.login('nobody@x.com', 'whatever').ok);
check('TC02', 'no session after failed login', auth.getCurrentUser() === null);
const okStudent = auth.login('student@codementor.edu', 'student123');
check('TC02', 'student routes to /dashboard', okStudent.ok && okStudent.redirect === '/dashboard');
const okAdmin = auth.login('admin@codementor.edu', 'admin123');
check('TC02', 'admin routes to /admin', okAdmin.ok && okAdmin.redirect === '/admin');
auth.logout();
check('TC02', 'logout ends the session', auth.getCurrentUser() === null);

// TC03 Difficulty filter
for (const d of ['Easy', 'Medium', 'Hard']) {
  const list = ps.getProblems({ difficulty: d });
  check('TC03', `${d} filter returns only ${d} problems (${list.length})`, list.length > 0 && list.every((p) => p.difficulty === d));
}
check('TC03', 'topic + difficulty filter combined', ps.getProblems({ difficulty: 'Easy', topic: 'Arrays' }).every((p) => p.topic === 'Arrays' && p.difficulty === 'Easy'));
check('TC03', 'search filter', ps.getProblems({ search: 'two sum' })[0]?.id === 1);
check('TC03', '20 seeded problems with 4-language starter code & 3 hints', ps.getProblems().length === 20 && ps.getProblems().every((p) => Object.keys(p.starterCode).length === 4 && p.hints.length === 3));

// TC04 Submission & deterministic evaluator
const alex = auth.login('alex@codementor.edu', 'alex123').user;
const twoSum = ps.getProblem(1);
const good = `${twoSum.starterCode.javascript.replace('    \n', `    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        if (map.has(target - nums[i])) return [map.get(target - nums[i]), i];\n        map.set(nums[i], i);\n    }\n`)}`;
const r1 = ps.submitSolution(alex.id, 1, good, 'javascript');
check('TC04', 'valid code → Accepted with runtime/memory', r1.result.status === 'Accepted' && r1.result.runtime > 0 && r1.result.memory > 0);
check('TC04', 'problem marked Solved & progress updated', ps.getStatusMap(alex.id)[1] === 'solved' && ps.getUserStats(alex.id).totalSolved === 1);
check('TC04', 'evaluator is deterministic', ps.evaluateCode(twoSum, good, 'javascript').runtime === ps.evaluateCode(twoSum, good, 'javascript').runtime);
check('TC04', 'empty code → Wrong Answer', ps.evaluateCode(twoSum, '', 'javascript').status === 'Wrong Answer');
check('TC04', 'unchanged starter → Wrong Answer', ps.evaluateCode(twoSum, twoSum.starterCode.python, 'python').status === 'Wrong Answer');
check('TC04', '"// fail" marker → Wrong Answer', ps.evaluateCode(twoSum, `${good}\n// fail`, 'javascript').status === 'Wrong Answer');
check('TC04', 'too-short code → Wrong Answer', ps.evaluateCode(twoSum, `${twoSum.starterCode.javascript}\nreturn 1`, 'javascript').status === 'Wrong Answer');
check('TC04', 'next problem is suggested', !!ai.getNextProblem(alex.id, 1));

// TC05 Weak topics
const failCode = (p) => `${p.starterCode.javascript}\n// fail\nreturn [];`;
check('TC05', 'alex starts with no weak topics', ai.detectWeakTopics(alex.id).length === 0);
ps.submitSolution(alex.id, 2, failCode(ps.getProblem(2)), 'javascript');
ps.submitSolution(alex.id, 3, failCode(ps.getProblem(3)), 'javascript');
ps.submitSolution(alex.id, 3, failCode(ps.getProblem(3)), 'javascript');
const weak = ai.detectWeakTopics(alex.id);
check('TC05', 'repeated Arrays failures flag Arrays as weak', weak.some((t) => t.topic === 'Arrays'), JSON.stringify(weak));
check('TC05', 'recommendations update immediately', ai.getRecommendations(alex.id).some((r) => r.problem.topic === 'Arrays'));
check('TC05', 'seeded student has Arrays pre-flagged weak (33%)', ai.detectWeakTopics('u_student').some((t) => t.topic === 'Arrays' && t.accuracy === 33));

// TC06 Progressive hints
check('TC06', 'no hints visible initially', ai.getVisibleHints(alex.id, 4).length === 0);
const h1 = ai.revealNextHint(alex.id, 4);
check('TC06', 'click 1 reveals Hint 1 only', h1.length === 1 && h1[0].text === ps.getProblem(4).hints[0]);
const h2 = ai.revealNextHint(alex.id, 4);
check('TC06', 'click 2 reveals Hint 2', h2.length === 2 && h2[1].text === ps.getProblem(4).hints[1]);
const h3 = ai.revealNextHint(alex.id, 4);
check('TC06', 'click 3 reveals Hint 3 (step-by-step)', h3.length === 3);
check('TC06', 'no more than 3 hints', ai.revealNextHint(alex.id, 4).length === 3);

// TC07 Mistake-based practice
const recs = ai.getRecommendations(alex.id);
check('TC07', 'failed problems recommended for retry', recs.some((r) => r.reasonType === 'retry' && [2, 3].includes(r.problem.id)));
check('TC07', 'weak-topic problems targeted with reason', recs.some((r) => r.reason === 'Targeted for weak topic: Arrays'));
check('TC07', 'solved problems are never recommended', recs.every((r) => r.problem.id !== 1));
check('TC07', 'every recommendation carries a reason', recs.every((r) => r.reason && r.detail));

// TC08 Streak & progress
const before = ps.getUserStats(alex.id);
check('TC08', 'streak = 1 after solving today', before.streak === 1 && before.solvedToday === 1);
const sim = ps.simulateNextDaySolve(alex.id);
check('TC08', 'next-day solve → streak 2', sim.stats.streak === 2, `got ${sim.stats.streak}`);
check('TC08', 'solved count & history updated', sim.stats.totalSolved === 2 && ps.getUserSubmissions(alex.id).length === 5);
check('TC08', 'Easy/Medium/Hard breakdown sums to total', Object.values(sim.stats.breakdown).reduce((s, b) => s + b.solved, 0) === sim.stats.totalSolved);
check('TC08', 'seeded student has an active 4-day streak', ps.getUserStats('u_student').streak === 4, `got ${ps.getUserStats('u_student').streak}`);
check('TC08', 'leaderboard ranks students', ps.getLeaderboard().length >= 3 && ps.getLeaderboard()[0].rank === 1);

// TC09 Practice mode
const session = ps.createPracticeSession(alex.id, { difficulty: 'Medium', topic: 'All', count: 4, minutes: 10 });
check('TC09', 'session has 4 problems & a 10-min timer', session.problemIds.length === 4 && session.durationSec === 600);
const pp = ps.getProblem(session.problemIds[0]);
ps.submitSolution(alex.id, pp.id, `${pp.starterCode.javascript}\nconst dp = [];\nfor (let i = 0; i < 3; i++) dp.push(i);\nreturn dp.length;`, 'javascript', { source: 'practice', sessionId: session.id });
ps.submitSolution(alex.id, session.problemIds[1], '', 'javascript', { source: 'practice', sessionId: session.id });
const summary = ps.finishPracticeSession(session.id);
check('TC09', 'summary has score, accuracy & time', summary.score === 20 && summary.accuracy === 50 && summary.timeTakenSec >= 0);

// TC10 Admin
const rep = admin.getReports();
check('TC10', 'reports: users, submissions, pass rate, failed topics', rep.totalUsers >= 7 && rep.totalSubmissions > 0 && rep.passRate > 0 && rep.mostFailedTopics.length > 0);
check('TC10', 'update user details & role', admin.updateUser(newUserId, { name: 'Renamed Student', role: 'admin' }).ok && admin.listUsers().find((u) => u.id === newUserId).name === 'Renamed Student');
check('TC10', 'update rejects duplicate email', !admin.updateUser(newUserId, { email: 'alex@codementor.edu' }).ok);
check('TC10', 'admin cannot delete self', !admin.deleteUser('u_admin', 'u_admin').ok);
check('TC10', 'delete user removes from list & storage', admin.deleteUser(newUserId, 'u_admin').ok && !admin.listUsers().some((u) => u.id === newUserId));
const added = admin.addProblem({ title: 'Contains Duplicate', topic: 'Arrays', difficulty: 'Easy', description: 'Return true if any value appears twice.', exampleInput: 'nums = [1,2,3,1]', exampleOutput: 'true' });
check('TC10', 'admin adds a problem', added.ok && ps.getProblems().length === 21);
check('TC10', 'admin deletes a problem', admin.deleteProblem(added.problem.id).ok && ps.getProblems().length === 20);

storage.resetDB();
check('RESET', 'Reset Demo Data restores the seed', ps.getProblems().length === 20 && !storage.getDB().users.some((u) => u.email === 'new@codementor.edu'));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
