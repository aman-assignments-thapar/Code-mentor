import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Timer, Play, Flag, Trophy, Target, Clock, CheckCircle2, CircleDashed, Circle, CloudUpload, Loader2, RotateCcw, History, Sparkles, Info } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { createPracticeSession, finishPracticeSession, getPracticeHistory, getPracticeSession, getProblem, submitSolution, POINTS } from '../services/problemService.js';
import { analyzeSubmission } from '../services/aiEngine.js';
import { getDB } from '../services/storageService.js';
import { DIFFICULTIES, LANGUAGES, TOPICS } from '../data/seedData.js';
import { DifficultyBadge, ProgressBar, formatDuration, TopicTag } from '../components/ui.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import { ProblemDescription, ResultView } from '../components/ProblemPanels.jsx';

export default function Practice() {
  useApp(); // re-render when the session is finished / storage changes
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const session = sessionId ? getPracticeSession(sessionId) : null;

  if (session && session.status === 'finished') return <Summary session={session} onNew={() => setParams({})} />;
  if (session) return <ActiveSession key={session.id} session={session} onFinish={() => setParams({ session: session.id })} />;
  return <Setup onStart={(s) => setParams({ session: s.id })} />;
}

// ───────────────────────── Setup ─────────────────────────
function Setup({ onStart }) {
  const { user, version } = useApp();
  const [difficulty, setDifficulty] = useState('Easy');
  const [topic, setTopic] = useState('All');
  const [count, setCount] = useState(3);
  const [minutes, setMinutes] = useState(15);
  const history = useMemo(() => getPracticeHistory(user.id), [user.id, version]);

  const start = () => onStart(createPracticeSession(user.id, { difficulty, topic, count, minutes }));

  return (
    <div className="mx-auto max-w-[900px] space-y-6 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Timer className="text-lc-orange" /> Practice Mode</h1>
        <p className="text-sm text-lc-muted">Solve a timed set of problems, then review your score, accuracy and time.</p>
      </div>

      <div className="card space-y-5 p-6">
        <div>
          <div className="label">Difficulty</div>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${difficulty === d ? 'border-lc-orange bg-lc-orange/10' : 'border-lc-border bg-lc-layer/50 hover:border-neutral-500'}`}>
                <DifficultyBadge difficulty={d} pill />
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="ptopic">Topic (optional)</label>
            <select id="ptopic" value={topic} onChange={(e) => setTopic(e.target.value)} className="input">
              <option value="All">Any topic</option>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pcount">Problems</label>
            <select id="pcount" value={count} onChange={(e) => setCount(Number(e.target.value))} className="input">
              {[3, 4, 5].map((n) => <option key={n} value={n}>{n} problems</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pmin">Time limit</label>
            <select id="pmin" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="input">
              {[1, 5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} minute{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-lc-muted"><Info size={13} className="mt-0.5 shrink-0" /> Unsolved problems are picked first. If fewer than {count} match, the set is topped up from the same difficulty. Scoring: Easy {POINTS.Easy} · Medium {POINTS.Medium} · Hard {POINTS.Hard} pts.</p>
        <button onClick={start} className="btn-primary px-5 py-2"><Play size={16} /> Start Timed Session</button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-lc-border px-5 py-3 font-semibold"><History size={16} /> Past Sessions</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr className="border-b border-lc-border"><th className="th">Date</th><th className="th">Difficulty</th><th className="th">Topic</th><th className="th">Score</th><th className="th">Accuracy</th><th className="th">Time</th></tr></thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={6} className="td py-8 text-center text-lc-muted">No practice sessions yet.</td></tr>}
              {history.map((s) => (
                <tr key={s.id} className="border-b border-lc-border/50">
                  <td className="td text-lc-muted"><Link to={`/practice?session=${s.id}`} className="hover:text-lc-orange">{new Date(s.startedAt).toLocaleString()}</Link></td>
                  <td className="td"><DifficultyBadge difficulty={s.difficulty} /></td>
                  <td className="td">{s.topic === 'All' ? 'Any' : s.topic}</td>
                  <td className="td font-semibold">{s.summary.score}/{s.summary.maxScore}</td>
                  <td className="td">{s.summary.accuracy}%</td>
                  <td className="td">{formatDuration(s.summary.timeTakenSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Active session ─────────────────────────
function ActiveSession({ session, onFinish }) {
  const { user, version } = useApp();
  const [idx, setIdx] = useState(0);
  const [lang, setLang] = useState('javascript');
  const [codes, setCodes] = useState({});
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const problems = session.problemIds.map(getProblem).filter(Boolean);
  const problem = problems[idx];
  const key = `${problem.id}_${lang}`;
  const code = codes[key] ?? problem.starterCode[lang];

  const subs = useMemo(() => getDB().submissions.filter((s) => s.sessionId === session.id), [session.id, version]);
  const solved = new Set(subs.filter((s) => s.status === 'Accepted').map((s) => s.problemId));
  const tried = new Set(subs.map((s) => s.problemId));

  const remaining = Math.max(0, session.durationSec - Math.floor((now - session.startedAt) / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const finish = () => {
    finishPracticeSession(session.id);
    onFinish();
  };

  useEffect(() => {
    if (remaining === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      const res = submitSolution(user.id, problem.id, code, lang, { source: 'practice', sessionId: session.id });
      setResults((r) => ({ ...r, [problem.id]: { result: res.result, feedback: analyzeSubmission(problem, code, res.result) } }));
      setBusy(false);
    }, 500);
  };

  const pct = (remaining / session.durationSec) * 100;
  const current = results[problem.id];

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-lc-border bg-lc-panel px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium"><Timer size={16} className="text-lc-orange" /> Practice · <DifficultyBadge difficulty={session.difficulty} />{session.topic !== 'All' && <TopicTag topic={session.topic} />}</div>
        <div className="flex items-center gap-1">
          {problems.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)} title={p.title}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ${i === idx ? 'bg-lc-layer text-white ring-1 ring-lc-orange' : 'text-neutral-400 hover:bg-lc-layer'}`}>
              {solved.has(p.id) ? <CheckCircle2 size={13} className="text-lc-easy" /> : tried.has(p.id) ? <CircleDashed size={13} className="text-lc-medium" /> : <Circle size={13} />}
              Q{i + 1}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-lc-muted">{solved.size}/{problems.length} solved</span>
          <div className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-lg font-semibold ${remaining <= 60 ? 'animate-pulse bg-rose-500/15 text-rose-300' : 'bg-lc-layer text-white'}`} aria-live="polite">
            <Clock size={16} /> {formatDuration(remaining)}
          </div>
          <button onClick={finish} className="btn-danger"><Flag size={14} /> Finish</button>
        </div>
      </div>
      <div className="h-1 bg-lc-layer"><div className={`h-1 transition-all ${remaining <= 60 ? 'bg-rose-500' : 'bg-lc-orange'}`} style={{ width: `${pct}%` }} /></div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:flex-row">
        <section className="min-h-[40vh] flex-1 overflow-y-auto rounded-lg border border-lc-border bg-lc-panel p-5 lg:min-h-0 lg:max-w-[45%]">
          <ProblemDescription problem={problem} />
        </section>
        <section className="flex min-h-[60vh] flex-1 flex-col gap-2 lg:min-h-0">
          <div className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-lg border border-lc-border bg-lc-panel">
            <div className="flex items-center gap-2 border-b border-lc-border bg-lc-layer/40 px-3 py-1.5">
              <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)} className="rounded bg-transparent px-1 py-0.5 text-sm text-neutral-300 focus:outline-none">
                {LANGUAGES.map((l) => <option key={l.id} value={l.id} className="bg-lc-panel">{l.label}</option>)}
              </select>
              <button onClick={() => setCodes((c) => ({ ...c, [key]: problem.starterCode[lang] }))} className="ml-auto rounded p-1.5 text-neutral-400 hover:bg-lc-layer" title="Reset code"><RotateCcw size={14} /></button>
            </div>
            <div className="min-h-0 flex-1"><CodeEditor value={code} onChange={(v) => setCodes((c) => ({ ...c, [key]: v }))} /></div>
          </div>
          <div className="flex min-h-[180px] flex-[2] flex-col overflow-hidden rounded-lg border border-lc-border bg-lc-panel">
            <div className="flex-1 overflow-y-auto p-4">
              {busy ? <div className="flex items-center gap-2 text-sm text-lc-muted"><Loader2 size={16} className="animate-spin" /> Judging…</div>
                : current ? <ResultView result={current.result} feedback={current.feedback} compact />
                : <p className="text-sm text-lc-muted">Write your solution and press Submit. Use the Q tabs to switch problems.</p>}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-lc-border px-3 py-2">
              <span className="text-[11px] text-lc-muted">Tip: add real logic to pass · <code>// fail</code> to force a wrong answer</span>
              <div className="flex gap-2">
                {idx < problems.length - 1 && <button onClick={() => setIdx(idx + 1)} className="btn-ghost">Next Q</button>}
                <button onClick={submit} disabled={busy} className="btn-green"><CloudUpload size={14} /> Submit</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ───────────────────────── Summary ─────────────────────────
function Summary({ session, onNew }) {
  const s = session.summary;
  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-4 py-6">
      <div className="text-center">
        <Trophy size={40} className="mx-auto text-amber-400" />
        <h1 className="mt-2 text-2xl font-semibold">Practice Summary</h1>
        <p className="text-sm text-lc-muted">{s.timedOut ? "Time's up! " : ''}{session.difficulty} · {session.topic === 'All' ? 'Any topic' : session.topic} · {session.problemIds.length} problems</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-lc-muted"><Trophy size={14} /> Final Score</div>
          <div className="mt-1 text-3xl font-semibold text-lc-orange">{s.score}<span className="text-base text-lc-muted">/{s.maxScore}</span></div>
          <div className="text-xs text-lc-muted">{s.solved}/{s.total} problems solved</div>
        </div>
        <div className="card p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-lc-muted"><Target size={14} /> Accuracy</div>
          <div className="mt-1 text-3xl font-semibold text-lc-easy">{s.accuracy}%</div>
          <div className="text-xs text-lc-muted">{s.attempts} submission{s.attempts === 1 ? '' : 's'}</div>
        </div>
        <div className="card p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-lc-muted"><Clock size={14} /> Time Taken</div>
          <div className="mt-1 font-mono text-3xl font-semibold">{formatDuration(s.timeTakenSec)}</div>
          <div className="text-xs text-lc-muted">of {formatDuration(session.durationSec)} allowed</div>
        </div>
      </div>
      <div className="card p-5">
        <div className="mb-2 flex justify-between text-sm"><span>Completion</span><span className="text-lc-muted">{s.solved}/{s.total}</span></div>
        <ProgressBar value={s.solved} max={s.total} color="bg-lc-easy" />
        <table className="mt-4 w-full">
          <thead><tr className="border-b border-lc-border"><th className="th">Problem</th><th className="th">Topic</th><th className="th">Difficulty</th><th className="th">Attempts</th><th className="th">Result</th></tr></thead>
          <tbody>
            {s.perProblem.map((p) => (
              <tr key={p.id} className="border-b border-lc-border/50">
                <td className="td"><Link to={`/problems/${p.id}`} className="hover:text-lc-orange">{p.title}</Link></td>
                <td className="td"><TopicTag topic={p.topic} /></td>
                <td className="td"><DifficultyBadge difficulty={p.difficulty} /></td>
                <td className="td">{p.attempts}</td>
                <td className={`td font-medium ${p.solved ? 'text-lc-easy' : 'text-lc-hard'}`}>{p.solved ? `+${POINTS[p.difficulty]} pts` : p.attempts ? 'Not solved' : 'Skipped'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onNew} className="btn-primary"><Play size={15} /> New Session</button>
        <Link to="/recommended" className="btn-ghost"><Sparkles size={15} /> See Recommendations</Link>
        <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
      </div>
    </div>
  );
}
