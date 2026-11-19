import { Lightbulb, Lock, ThumbsUp, CheckCircle2, Clock, Cpu, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DifficultyBadge, TopicTag, RichText, timeAgo } from './ui.jsx';
import { HINT_LABELS } from '../services/aiEngine.js';
import { LANGUAGES } from '../data/seedData.js';

const langLabel = (id) => LANGUAGES.find((l) => l.id === id)?.label || id;

export function ProblemDescription({ problem, status, weak }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">{problem.id}. {problem.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} pill />
          <TopicTag topic={problem.topic} weak={weak} />
          {status === 'solved' && <span className="flex items-center gap-1 text-xs text-lc-easy"><CheckCircle2 size={14} /> Solved</span>}
          {status === 'attempted' && <span className="text-xs text-lc-medium">Attempted</span>}
          <span className="flex items-center gap-1 text-xs text-lc-muted"><ThumbsUp size={13} /> Acceptance {problem.acceptanceRate}%</span>
        </div>
        {weak && (
          <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {problem.topic} is one of your weak topics — solving this problem directly improves it.
          </div>
        )}
      </div>
      <RichText text={problem.description} />
      {problem.examples.map((ex, i) => (
        <div key={i}>
          <div className="mb-2 font-semibold text-white">Example {i + 1}:</div>
          <div className="space-y-1 border-l-2 border-lc-border pl-4 font-mono text-[13px] text-neutral-300">
            <div><span className="font-semibold text-white">Input:</span> {ex.input}</div>
            <div><span className="font-semibold text-white">Output:</span> {ex.output}</div>
            {ex.explanation && <div className="whitespace-pre-line"><span className="font-semibold text-white">Explanation:</span> {ex.explanation}</div>}
          </div>
        </div>
      ))}
      {problem.constraints?.length > 0 && (
        <div>
          <div className="mb-2 font-semibold text-white">Constraints:</div>
          <ul className="list-disc space-y-1.5 pl-6">
            {problem.constraints.map((c, i) => (
              <li key={i}><code className="rounded bg-lc-layer px-1.5 py-0.5 font-mono text-[12.5px] text-neutral-300">{c}</code></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function HintsPanel({ problem, visibleHints, onReveal }) {
  const total = problem.hints.length;
  const done = visibleHints.length >= total;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Progressive Hints</h2>
          <p className="text-xs text-lc-muted">Each click reveals one more hint — from intuition to the full algorithm.</p>
        </div>
        <span className="text-xs text-lc-muted">{visibleHints.length}/{total} revealed</span>
      </div>
      {problem.hints.map((_, i) => {
        const h = visibleHints[i];
        return h ? (
          <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-300"><Lightbulb size={15} /> {h.label}</div>
            <p className="text-sm leading-relaxed text-neutral-200">{h.text.replace(/^(Intuition|Approach|Algorithm):\s*/, '')}</p>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-dashed border-lc-border p-4 text-sm text-neutral-500">
            <Lock size={14} /> {HINT_LABELS[i]} — locked
          </div>
        );
      })}
      <button onClick={onReveal} disabled={done} className="btn-primary w-full">
        <Lightbulb size={15} /> {done ? 'All hints revealed' : `I'm Stuck — reveal Hint ${visibleHints.length + 1}`}
      </button>
    </div>
  );
}

export function SubmissionsList({ submissions, onLoad }) {
  if (!submissions.length) return <p className="py-10 text-center text-sm text-lc-muted">No submissions yet. Submit your code to see it here.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-lc-border">
          <th className="th px-2">Status</th>
          <th className="th px-2">Language</th>
          <th className="th px-2">Runtime</th>
          <th className="th px-2">Memory</th>
          <th className="th px-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((s) => (
          <tr key={s.id} className="border-b border-lc-border/50 hover:bg-lc-layer/40">
            <td className="px-2 py-2.5">
              <button disabled={!s.code} onClick={() => onLoad(s)} className={`font-medium ${s.status === 'Accepted' ? 'text-lc-easy' : 'text-lc-hard'} ${s.code ? 'hover:underline' : ''}`} title={s.code ? 'Load this code into the editor' : ''}>
                {s.status}
              </button>
            </td>
            <td className="px-2 py-2.5 text-neutral-300">{langLabel(s.language)}</td>
            <td className="px-2 py-2.5 text-neutral-300">{s.runtime ? `${s.runtime} ms` : 'N/A'}</td>
            <td className="px-2 py-2.5 text-neutral-300">{s.memory ? `${s.memory} MB` : 'N/A'}</td>
            <td className="px-2 py-2.5 text-lc-muted">{timeAgo(s.timestamp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** LeetCode-style verdict console. */
export function ResultView({ result, feedback = [], onTryAgain, onStuck, next, compact = false }) {
  if (!result) return null;
  const ok = result.status === 'Accepted';
  const isRun = result.mode === 'run';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className={`text-xl font-semibold ${ok ? 'text-lc-easy' : 'text-lc-hard'}`}>
          {ok ? (isRun ? 'Accepted' : 'Accepted') : 'Wrong Answer'}
        </h3>
        <span className="text-sm text-lc-muted">
          {isRun ? `${result.cases.filter((c) => c.pass).length} / ${result.cases.length} sample cases passed` : `${result.passed} / ${result.total} testcases passed`}
        </span>
        {isRun && <span className="rounded bg-lc-layer px-2 py-0.5 text-[11px] text-lc-muted">Run · not recorded</span>}
      </div>

      {ok && !isRun && (
        <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
          <div className="rounded-lg bg-lc-layer p-3">
            <div className="flex items-center gap-1.5 text-xs text-lc-muted"><Clock size={13} /> Runtime</div>
            <div className="mt-1 text-lg font-semibold">{result.runtime} <span className="text-sm font-normal text-lc-muted">ms</span></div>
            <div className="text-xs text-lc-easy">Beats {result.runtimeBeats}%</div>
          </div>
          <div className="rounded-lg bg-lc-layer p-3">
            <div className="flex items-center gap-1.5 text-xs text-lc-muted"><Cpu size={13} /> Memory</div>
            <div className="mt-1 text-lg font-semibold">{result.memory} <span className="text-sm font-normal text-lc-muted">MB</span></div>
            <div className="text-xs text-lc-easy">Beats {result.memoryBeats}%</div>
          </div>
        </div>
      )}

      {!ok && (
        <div className="space-y-2">
          {result.message && <p className="text-sm text-rose-300">{result.message}</p>}
          <IOBlock label="Input" value={result.input} />
          <IOBlock label="Output" value={result.output} tone="bad" />
          <IOBlock label="Expected" value={result.expected} tone="good" />
        </div>
      )}

      {ok && isRun && result.cases.map((c, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-lc-easy"><CheckCircle2 size={13} /> Case {i + 1}</div>
          <IOBlock label="Output" value={c.output} />
        </div>
      ))}

      {feedback.length > 0 && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-violet-300"><Sparkles size={13} /> AI Mentor Feedback</div>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-neutral-300">
            {feedback.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {!ok && (onTryAgain || onStuck) && (
        <div className="flex flex-wrap gap-2">
          {onTryAgain && <button onClick={onTryAgain} className="btn-ghost"><RotateCcw size={14} /> Try Again</button>}
          {onStuck && <button onClick={onStuck} className="btn-primary"><Lightbulb size={14} /> I'm Stuck</button>}
        </div>
      )}

      {ok && !isRun && next && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-sm">
            <div className="text-xs text-lc-muted">Recommended next · {next.reason}</div>
            <div className="font-medium">{next.problem.title} <span className="text-xs text-lc-muted">({next.problem.difficulty})</span></div>
          </div>
          <Link to={`/problems/${next.problem.id}`} className="btn-green">Next Problem <ArrowRight size={14} /></Link>
        </div>
      )}
    </div>
  );
}

function IOBlock({ label, value, tone }) {
  const color = tone === 'bad' ? 'text-rose-300' : tone === 'good' ? 'text-emerald-300' : 'text-neutral-200';
  return (
    <div>
      <div className="mb-1 text-xs text-lc-muted">{label}</div>
      <div className={`rounded-md bg-lc-layer px-3 py-2 font-mono text-[13px] ${color} break-all`}>{value}</div>
    </div>
  );
}

