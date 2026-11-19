import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, Target, Trophy, CalendarPlus, Sparkles, ArrowRight, History, BarChart3, Award, Send, Medal, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getUserStats, getUserSubmissions, getLeaderboard, getStatusMap, simulateNextDaySolve } from '../services/problemService.js';
import { detectWeakTopics, getRecommendations, getTopicStats } from '../services/aiEngine.js';
import { Alert, DifficultyBadge, ProgressBar, TopicTag, timeAgo, DIFF_BG, DIFF_TEXT } from '../components/ui.jsx';
import { RecommendationCard, WeakTopicsStrip } from '../components/Recommendations.jsx';
import { LANGUAGES } from '../data/seedData.js';

export default function Dashboard() {
  const { user, version } = useApp();
  const location = useLocation();
  const [flash, setFlash] = useState(location.state?.welcome ? { type: 'success', text: `Welcome to Code Mentor, ${user.name}! Your account has been created.` } : null);

  const data = useMemo(() => ({
    stats: getUserStats(user.id),
    weak: detectWeakTopics(user.id),
    recs: getRecommendations(user.id, 3),
    topics: getTopicStats(user.id),
    history: getUserSubmissions(user.id).slice(0, 8),
    leaderboard: getLeaderboard(6),
    status: getStatusMap(user.id),
  }), [user.id, version]);
  const { stats, weak, recs, topics, history, leaderboard, status } = data;
  const goalPct = Math.min(100, Math.round((stats.solvedToday / stats.dailyGoal) * 100));
  const myRank = getLeaderboard(100).find((r) => r.userId === user.id)?.rank;

  const simulate = () => {
    const prevStreak = stats.streak;
    const res = simulateNextDaySolve(user.id, recs[0]?.problem.id);
    setFlash({
      type: 'info',
      text: `Simulated next day (${res.stats.today}): solved "${res.problem.title}". Streak ${prevStreak} → ${res.stats.streak} day${res.stats.streak === 1 ? '' : 's'}.`,
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-sm text-lc-muted">
            Here's your progress{stats.dayOffset > 0 && <span className="text-sky-300"> · simulated date {stats.today}</span>}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={simulate} className="btn-ghost" title="Demo helper: advance one day and record a solve to verify streak updates">
            <CalendarPlus size={15} /> Simulate Next-Day Solve
          </button>
          <Link to="/problems" className="btn-primary">Start Practice <ArrowRight size={15} /></Link>
        </div>
      </div>

      {flash && <Alert type={flash.type} onClose={() => setFlash(null)}>{flash.text}</Alert>}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Solved breakdown */}
        <div className="card p-5">
          <div className="mb-4 text-sm text-lc-muted">Solved Problems</div>
          <div className="flex items-center gap-6">
            <SolvedRing solved={stats.totalSolved} total={stats.totalProblems} />
            <div className="flex-1 space-y-3">
              {['Easy', 'Medium', 'Hard'].map((d) => (
                <div key={d}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className={DIFF_TEXT[d]}>{d}</span>
                    <span><span className="font-semibold text-white">{stats.breakdown[d].solved}</span><span className="text-lc-muted">/{stats.breakdown[d].total}</span></span>
                  </div>
                  <ProgressBar value={stats.breakdown[d].solved} max={stats.breakdown[d].total} color={DIFF_BG[d]} height="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak + daily goal */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-lc-muted">Daily Streak</div>
              <div className="mt-1 flex items-center gap-2 text-3xl font-semibold">
                <Flame size={28} className={stats.streak ? 'text-lc-orange' : 'text-neutral-600'} fill={stats.streak ? 'currentColor' : 'none'} />
                {stats.streak} <span className="text-base font-normal text-lc-muted">day{stats.streak === 1 ? '' : 's'}</span>
              </div>
              <div className="mt-1 text-xs text-lc-muted">Longest: {stats.longestStreak} days</div>
            </div>
            <Award size={22} className="text-amber-400" />
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-lc-muted"><Target size={14} /> Daily Goal</span>
              <span><span className="font-semibold">{stats.solvedToday}</span><span className="text-lc-muted"> / {stats.dailyGoal} problems</span></span>
            </div>
            <ProgressBar value={stats.solvedToday} max={stats.dailyGoal} color={goalPct >= 100 ? 'bg-lc-easy' : 'bg-lc-orange'} height="h-2.5" />
            <div className="mt-1.5 text-xs text-lc-muted">
              {goalPct >= 100 ? '🎉 Daily goal complete!' : `${stats.dailyGoal - stats.solvedToday} more to hit today's goal.`}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card grid grid-cols-2 gap-4 p-5">
          <MiniStat icon={Send} label="Submissions" value={stats.totalSubmissions} />
          <MiniStat icon={BarChart3} label="Acceptance" value={`${stats.acceptanceRate}%`} />
          <MiniStat icon={Trophy} label="Points" value={stats.points} />
          <MiniStat icon={Medal} label="Global Rank" value={myRank ? `#${myRank}` : '—'} />
        </div>
      </div>

      <WeakTopicsStrip weakTopics={weak} />

      {/* Recommended For You */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={18} className="text-lc-orange" /> Recommended For You</h2>
          <Link to="/recommended" className="text-sm text-lc-orange hover:underline">View all recommendations →</Link>
        </div>
        {recs.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {recs.map((r) => <RecommendationCard key={r.problem.id} rec={r} status={status[r.problem.id]} />)}
          </div>
        ) : (
          <div className="card p-6 text-center text-sm text-lc-muted">You've solved everything available. Amazing work! 🎉</div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Topic-wise success */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Topic-wise Success Rate</h2>
          <div className="space-y-3.5">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    {t.topic}
                    {t.isWeak && <span className="rounded bg-rose-500/15 px-1.5 text-[10px] font-semibold uppercase text-rose-300">Weak</span>}
                  </span>
                  <span className="text-xs text-lc-muted">
                    {t.accuracy === null ? 'Not attempted' : <><span className="font-semibold text-white">{t.accuracy}%</span> · {t.accepted}/{t.attempts} accepted · {t.solved}/{t.totalProblems} solved</>}
                  </span>
                </div>
                <ProgressBar value={t.accuracy || 0} color={t.isWeak ? 'bg-rose-500' : 'bg-emerald-500'} />
              </div>
            ))}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><CalendarDays size={16} /> Activity · last 5 weeks</h2>
          <p className="mb-4 text-xs text-lc-muted">{stats.activity.reduce((s, d) => s + d.count, 0)} submissions</p>
          <div className="grid max-w-[340px] grid-cols-7 gap-1.5">
            {stats.activity.map((d) => (
              <div key={d.day} title={`${d.day}: ${d.count} submission${d.count === 1 ? '' : 's'}`}
                className={`aspect-square rounded ${d.count === 0 ? 'bg-lc-layer' : d.count === 1 ? 'bg-emerald-900' : d.count === 2 ? 'bg-emerald-700' : 'bg-emerald-500'} ${d.day === stats.today ? 'ring-1 ring-lc-orange' : ''}`} />
            ))}
          </div>
          <div className="mt-3 flex max-w-[340px] items-center justify-end gap-1.5 text-[11px] text-lc-muted">
            Less <span className="h-3 w-3 rounded bg-lc-layer" /><span className="h-3 w-3 rounded bg-emerald-900" /><span className="h-3 w-3 rounded bg-emerald-700" /><span className="h-3 w-3 rounded bg-emerald-500" /> More
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Practice history */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="flex items-center gap-2 border-b border-lc-border px-5 py-3 font-semibold"><History size={16} /> Practice History</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-lc-border">
                  <th className="th">Problem</th><th className="th">Topic</th><th className="th">Status</th><th className="th">Language</th><th className="th">When</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={5} className="td py-8 text-center text-lc-muted">No submissions yet — <Link to="/problems" className="text-lc-orange">solve your first problem</Link>.</td></tr>
                )}
                {history.map((s) => (
                  <tr key={s.id} className="border-b border-lc-border/50 hover:bg-lc-layer/40">
                    <td className="td"><Link to={`/problems/${s.problemId}`} className="hover:text-lc-orange">{s.title}</Link> <span className="ml-1"><DifficultyBadge difficulty={s.difficulty} /></span></td>
                    <td className="td"><TopicTag topic={s.topic} /></td>
                    <td className={`td font-medium ${s.status === 'Accepted' ? 'text-lc-easy' : 'text-lc-hard'}`}>{s.status}</td>
                    <td className="td text-neutral-400">{LANGUAGES.find((l) => l.id === s.language)?.label}</td>
                    <td className="td text-lc-muted">{timeAgo(s.timestamp, Date.now() + stats.dayOffset * 86400000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-lc-border px-5 py-3 font-semibold"><Trophy size={16} className="text-amber-400" /> Leaderboard</div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-lc-border"><th className="th">#</th><th className="th">Student</th><th className="th text-right">Solved</th><th className="th text-right">Points</th></tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr key={r.userId} className={`border-b border-lc-border/50 ${r.userId === user.id ? 'bg-lc-orange/10' : ''}`}>
                  <td className="td font-semibold">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                  <td className="td">{r.name}{r.userId === user.id && <span className="ml-1 text-xs text-lc-orange">(you)</span>}<div className="text-[11px] text-lc-muted">🔥 {r.streak} day streak</div></td>
                  <td className="td text-right">{r.solved}</td>
                  <td className="td text-right font-semibold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SolvedRing({ solved, total }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = total ? solved / total : 0;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#3e3e3e" strokeWidth="6" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="#ffa116" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold">{solved}<span className="text-sm font-normal text-lc-muted">/{total}</span></div>
        <div className="text-xs text-lc-muted">Solved</div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-lc-muted"><Icon size={13} /> {label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
