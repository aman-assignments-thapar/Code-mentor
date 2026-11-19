import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RotateCcw, Target, Compass, TrendingUp, BookX, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getStatusMap } from '../services/problemService.js';
import { detectWeakTopics, getMistakeLog, getRecommendations, WEAK_RULE } from '../services/aiEngine.js';
import { DifficultyBadge, TopicTag, timeAgo } from '../components/ui.jsx';
import { RecommendationCard, WeakTopicsStrip } from '../components/Recommendations.jsx';

const STEPS = [
  { icon: BookX, title: 'Record mistakes', text: 'Every Wrong Answer is logged with its topic and problem type.' },
  { icon: Target, title: 'Detect weak topics', text: `A topic is flagged after ${WEAK_RULE.minWrong}+ mistakes or <${WEAK_RULE.maxAccuracy}% accuracy (clears at ${WEAK_RULE.recoveredAccuracy}%).` },
  { icon: Sparkles, title: 'Recommend', text: 'Retries come first, then targeted weak-topic problems, then new topics and level-ups.' },
];

export default function Recommended() {
  const { user, version } = useApp();
  const { weak, recs, mistakes, status } = useMemo(() => ({
    weak: detectWeakTopics(user.id),
    recs: getRecommendations(user.id, 12),
    mistakes: getMistakeLog(user.id),
    status: getStatusMap(user.id),
  }), [user.id, version]);

  const groups = [
    { type: 'retry', title: 'Retry After Previous Mistakes', icon: RotateCcw, cls: 'text-rose-400' },
    { type: 'weak', title: 'Targeted Weak-Topic Practice', icon: Target, cls: 'text-amber-400' },
    { type: 'explore', title: 'Explore New Topics', icon: Compass, cls: 'text-sky-400' },
    { type: 'levelup', title: 'Level Up', icon: TrendingUp, cls: 'text-emerald-400' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Sparkles className="text-lc-orange" /> Recommended Practice</h1>
        <p className="text-sm text-lc-muted">Personalised from your mistakes and weak topics — updated after every submission.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card flex gap-3 p-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lc-orange/15 text-sm font-bold text-lc-orange">{i + 1}</div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium"><s.icon size={14} /> {s.title}</div>
              <p className="mt-0.5 text-xs text-lc-muted">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <WeakTopicsStrip weakTopics={weak} />

      {recs.length === 0 && <div className="card p-8 text-center text-lc-muted">Nothing to recommend — you've solved every problem! 🎉</div>}

      {groups.map((g) => {
        const items = recs.filter((r) => r.reasonType === g.type);
        if (!items.length) return null;
        return (
          <section key={g.type}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><g.icon size={17} className={g.cls} /> {g.title} <span className="text-sm font-normal text-lc-muted">({items.length})</span></h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => <RecommendationCard key={r.problem.id} rec={r} status={status[r.problem.id]} />)}
            </div>
          </section>
        );
      })}

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-lc-border px-5 py-3 font-semibold"><BookX size={16} className="text-rose-400" /> Mistake Log</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-lc-border"><th className="th">Problem</th><th className="th">Topic</th><th className="th">Difficulty</th><th className="th">Mistakes</th><th className="th">Last mistake</th><th className="th">Status</th></tr>
            </thead>
            <tbody>
              {mistakes.length === 0 && <tr><td colSpan={6} className="td py-8 text-center text-lc-muted">No mistakes recorded yet.</td></tr>}
              {mistakes.map((m) => (
                <tr key={m.problemId} className="border-b border-lc-border/50 hover:bg-lc-layer/40">
                  <td className="td"><Link to={`/problems/${m.problemId}`} className="hover:text-lc-orange">{m.title}</Link></td>
                  <td className="td"><TopicTag topic={m.topic} weak={weak.some((w) => w.topic === m.topic)} /></td>
                  <td className="td"><DifficultyBadge difficulty={m.difficulty} /></td>
                  <td className="td text-rose-300">{m.mistakes}</td>
                  <td className="td text-lc-muted">{timeAgo(m.lastAt)}</td>
                  <td className="td">{m.resolved ? <span className="flex items-center gap-1 text-lc-easy"><CheckCircle2 size={14} /> Fixed</span> : <Link to={`/problems/${m.problemId}`} className="text-lc-orange hover:underline">Retry →</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
