import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, Lightbulb, History, Play, CloudUpload, RotateCcw, ChevronLeft, ChevronRight, Info, Terminal, ListChecks, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getProblem, getProblems, getStatusMap, getUserSubmissions, runCode, submitSolution } from '../services/problemService.js';
import { analyzeSubmission, detectWeakTopics, getNextProblem, getVisibleHints, revealNextHint } from '../services/aiEngine.js';
import { getDraft, setDraft } from '../services/storageService.js';
import { LANGUAGES } from '../data/seedData.js';
import CodeEditor from '../components/CodeEditor.jsx';
import { HintsPanel, ProblemDescription, ResultView, SubmissionsList } from '../components/ProblemPanels.jsx';

const LANG_KEY = 'codementor_lang';

export default function Workspace() {
  const { id } = useParams();
  const { user, version } = useApp();
  const problem = getProblem(id);
  const editorRef = useRef(null);
  const [tab, setTab] = useState('description');
  const [consoleTab, setConsoleTab] = useState('testcase');
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || 'javascript'; } catch { return 'javascript'; }
  });
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [next, setNext] = useState(null);
  const [busy, setBusy] = useState(null);
  const [caseIdx, setCaseIdx] = useState(0);

  const isStudent = user.role === 'student';
  const status = useMemo(() => getStatusMap(user.id)[problem?.id], [user.id, problem?.id, version]);
  const weak = useMemo(() => isStudent && problem && detectWeakTopics(user.id).some((t) => t.topic === problem.topic), [user.id, problem, version, isStudent]);
  const hints = useMemo(() => (problem ? getVisibleHints(user.id, problem.id) : []), [user.id, problem, version]);
  const submissions = useMemo(() => (problem ? getUserSubmissions(user.id, problem.id) : []), [user.id, problem, version]);
  const ids = getProblems().map((p) => p.id);
  const pos = problem ? ids.indexOf(problem.id) : -1;

  // Load draft or starter whenever problem / language changes
  useEffect(() => {
    if (!problem) return;
    setCode(getDraft(user.id, problem.id, lang) ?? problem.starterCode[lang]);
    setResult(null);
    setFeedback([]);
    setNext(null);
    setConsoleTab('testcase');
    setCaseIdx(0);
  }, [problem?.id, lang, user.id]);

  useEffect(() => {
    setTab('description');
  }, [problem?.id]);

  if (!problem) {
    return (
      <div className="p-10 text-center">
        <p className="text-lc-muted">Problem not found.</p>
        <Link to="/problems" className="btn-primary mt-4">Back to Problemset</Link>
      </div>
    );
  }

  const updateCode = (v) => {
    setCode(v);
    setDraft(user.id, problem.id, lang, v);
  };
  const changeLang = (l) => {
    setLang(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
  };
  const resetCode = () => updateCode(problem.starterCode[lang]);

  const doRun = () => {
    setBusy('run');
    setConsoleTab('result');
    setTimeout(() => {
      setResult(runCode(problem.id, code, lang));
      setFeedback([]);
      setNext(null);
      setBusy(null);
    }, 450);
  };

  const doSubmit = () => {
    setBusy('submit');
    setConsoleTab('result');
    setTimeout(() => {
      const res = submitSolution(user.id, problem.id, code, lang);
      setResult(res.result);
      setFeedback(analyzeSubmission(problem, code, res.result));
      setNext(res.result.status === 'Accepted' ? getNextProblem(user.id, problem.id) : null);
      setBusy(null);
    }, 700);
  };

  const imStuck = () => {
    setTab('hints');
    revealNextHint(user.id, problem.id);
  };

  const tryAgain = () => {
    setConsoleTab('testcase');
    editorRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col gap-2 p-2 lg:flex-row">
      {/* ───── Left pane ───── */}
      <section className="flex min-h-[50vh] flex-1 flex-col overflow-hidden rounded-lg border border-lc-border bg-lc-panel lg:min-h-0 lg:max-w-[50%]">
        <div className="flex items-center gap-1 border-b border-lc-border bg-lc-layer/40 px-2">
          <TabBtn active={tab === 'description'} onClick={() => setTab('description')} icon={FileText} label="Description" />
          <TabBtn active={tab === 'hints'} onClick={() => setTab('hints')} icon={Lightbulb} label={`Hints${hints.length ? ` (${hints.length}/3)` : ''}`} accent="text-amber-400" />
          <TabBtn active={tab === 'submissions'} onClick={() => setTab('submissions')} icon={History} label="Submissions" />
          <div className="ml-auto flex items-center gap-1">
            <Link to="/problems" className="rounded p-1.5 text-neutral-400 hover:bg-lc-layer hover:text-white" title="Problem list"><ListChecks size={16} /></Link>
            <NavArrow to={pos > 0 ? `/problems/${ids[pos - 1]}` : null} icon={ChevronLeft} label="Previous problem" />
            <NavArrow to={pos < ids.length - 1 ? `/problems/${ids[pos + 1]}` : null} icon={ChevronRight} label="Next problem" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'description' && <ProblemDescription problem={problem} status={status} weak={weak} />}
          {tab === 'hints' && <HintsPanel problem={problem} visibleHints={hints} onReveal={() => revealNextHint(user.id, problem.id)} />}
          {tab === 'submissions' && (
            <SubmissionsList submissions={submissions} onLoad={(s) => { setDraft(user.id, problem.id, s.language, s.code); if (s.language !== lang) changeLang(s.language); else setCode(s.code); }} />
          )}
        </div>
      </section>

      {/* ───── Right pane ───── */}
      <section className="flex min-h-[70vh] flex-1 flex-col gap-2 lg:min-h-0">
        <div className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-lg border border-lc-border bg-lc-panel">
          <div className="flex items-center gap-2 border-b border-lc-border bg-lc-layer/40 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-sm text-lc-easy"><span className="font-mono">&lt;/&gt;</span> Code</span>
            <select aria-label="Language" value={lang} onChange={(e) => changeLang(e.target.value)} className="ml-2 rounded bg-transparent px-1 py-0.5 text-sm text-neutral-300 hover:bg-lc-layer focus:outline-none">
              {LANGUAGES.map((l) => <option key={l.id} value={l.id} className="bg-lc-panel">{l.label}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={imStuck} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-300 hover:bg-lc-layer" title="Reveal the next hint">
                <Lightbulb size={14} /> I'm Stuck
              </button>
              <button onClick={resetCode} className="rounded p-1.5 text-neutral-400 hover:bg-lc-layer hover:text-white" title="Reset to starter code"><RotateCcw size={14} /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor value={code} onChange={updateCode} textareaRef={editorRef} />
          </div>
          <div className="flex items-center gap-1.5 border-t border-lc-border px-3 py-1.5 text-[11px] text-lc-muted">
            <Info size={12} className="shrink-0" />
            <span>Demo evaluator: real logic (loops / conditions / <code className="text-neutral-300">return</code>) is <span className="text-lc-easy">Accepted</span>. Empty or unchanged code, or a <code className="text-neutral-300">// fail</code> comment, gives <span className="text-lc-hard">Wrong Answer</span>.</span>
          </div>
        </div>

        {/* Console */}
        <div className="flex min-h-[220px] flex-[2] flex-col overflow-hidden rounded-lg border border-lc-border bg-lc-panel">
          <div className="flex items-center gap-1 border-b border-lc-border bg-lc-layer/40 px-2">
            <TabBtn active={consoleTab === 'testcase'} onClick={() => setConsoleTab('testcase')} icon={ListChecks} label="Testcase" accent="text-lc-easy" />
            <TabBtn active={consoleTab === 'result'} onClick={() => setConsoleTab('result')} icon={Terminal} label="Test Result" accent="text-lc-easy" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {consoleTab === 'testcase' && (
              <div>
                <div className="mb-3 flex gap-2">
                  {problem.examples.map((_, i) => (
                    <button key={i} onClick={() => setCaseIdx(i)} className={`rounded-md px-3 py-1 text-xs ${caseIdx === i ? 'bg-lc-layer text-white' : 'text-lc-muted hover:bg-lc-layer/60'}`}>Case {i + 1}</button>
                  ))}
                </div>
                <div className="text-xs text-lc-muted">Input</div>
                <div className="mt-1 rounded-md bg-lc-layer px-3 py-2 font-mono text-[13px] break-all">{problem.examples[caseIdx]?.input}</div>
                <div className="mt-3 text-xs text-lc-muted">Expected Output</div>
                <div className="mt-1 rounded-md bg-lc-layer px-3 py-2 font-mono text-[13px]">{problem.examples[caseIdx]?.output}</div>
              </div>
            )}
            {consoleTab === 'result' && (
              busy ? (
                <div className="flex items-center gap-2 text-sm text-lc-muted"><Loader2 size={16} className="animate-spin" /> {busy === 'run' ? 'Running sample cases…' : 'Judging your submission…'}</div>
              ) : result ? (
                <ResultView result={result} feedback={feedback} onTryAgain={result.mode === 'submit' ? tryAgain : null} onStuck={result.mode === 'submit' ? imStuck : null} next={next} />
              ) : (
                <p className="text-sm text-lc-muted">You must run or submit your code first.</p>
              )
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-lc-border px-3 py-2">
            <button onClick={doRun} disabled={!!busy} className="btn-ghost"><Play size={14} /> Run</button>
            <button onClick={doSubmit} disabled={!!busy} className="btn-green"><CloudUpload size={14} /> Submit</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, accent = 'text-sky-400' }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${active ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}>
      <Icon size={14} className={accent} /> {label}
    </button>
  );
}

function NavArrow({ to, icon: Icon, label }) {
  if (!to) return <span className="p-1.5 text-neutral-700"><Icon size={16} /></span>;
  return <Link to={to} title={label} className="rounded p-1.5 text-neutral-400 hover:bg-lc-layer hover:text-white"><Icon size={16} /></Link>;
}
