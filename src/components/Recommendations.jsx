import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Target, Compass, TrendingUp, ArrowRight } from 'lucide-react';
import { DifficultyBadge, TopicTag } from './ui.jsx';

const REASON_STYLE = {
  retry: { icon: RotateCcw, cls: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
  weak: { icon: Target, cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  explore: { icon: Compass, cls: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  levelup: { icon: TrendingUp, cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  next: { icon: ArrowRight, cls: 'bg-neutral-500/15 text-neutral-300 ring-neutral-500/30' },
};

export function ReasonBadge({ type, reason }) {
  const { icon: Icon, cls } = REASON_STYLE[type] || REASON_STYLE.next;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      <Icon size={12} /> {reason}
    </span>
  );
}

export function WeakTopicsStrip({ weakTopics, compact = false }) {
  if (!weakTopics.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
        <Target size={16} /> No weak topics detected — keep practising! Topics get flagged after 2+ mistakes or &lt;50% accuracy.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-rose-500/40 bg-gradient-to-r from-rose-500/10 to-transparent px-4 py-3" role="alert">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-300">
        <AlertTriangle size={16} /> Weak Topic{weakTopics.length > 1 ? 's' : ''} Detected
      </div>
      <div className="flex flex-wrap gap-2">
        {weakTopics.map((t) => (
          <div key={t.topic} className="rounded-md bg-lc-bg/70 px-3 py-1.5 text-sm ring-1 ring-rose-500/30">
            <span className="font-semibold text-white">{t.topic}</span>
            <span className="text-rose-300"> — {t.accuracy}% accuracy</span>
            <span className="text-lc-muted"> • {t.wrong} recent mistake{t.wrong === 1 ? '' : 's'}</span>
          </div>
        ))}
      </div>
      {!compact && <p className="mt-2 text-xs text-lc-muted">Recommendations below are prioritised to fix these gaps first.</p>}
    </div>
  );
}

export function RecommendationCard({ rec, status }) {
  const { problem } = rec;
  return (
    <div className="card flex flex-col gap-3 p-4 transition-colors hover:border-neutral-500">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-lc-muted">#{problem.id}</div>
          <Link to={`/problems/${problem.id}`} className="font-medium text-white hover:text-lc-orange">{problem.title}</Link>
        </div>
        <DifficultyBadge difficulty={problem.difficulty} pill />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ReasonBadge type={rec.reasonType} reason={rec.reason} />
        <TopicTag topic={problem.topic} />
        {status === 'attempted' && <span className="text-xs text-lc-medium">Attempted</span>}
      </div>
      <p className="flex-1 text-xs leading-relaxed text-lc-muted">{rec.detail}</p>
      <Link to={`/problems/${problem.id}`} className="btn-primary self-start">
        Solve Now <ArrowRight size={14} />
      </Link>
    </div>
  );
}
