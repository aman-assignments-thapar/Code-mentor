import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Shuffle, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getProblems, getStatusMap } from '../services/problemService.js';
import { detectWeakTopics } from '../services/aiEngine.js';
import { TOPICS } from '../data/seedData.js';
import { DifficultyBadge, StatusIcon, TopicTag } from '../components/ui.jsx';

const DIFF_PILLS = [
  { id: 'All', cls: 'text-white' },
  { id: 'Easy', cls: 'text-lc-easy' },
  { id: 'Medium', cls: 'text-lc-medium' },
  { id: 'Hard', cls: 'text-lc-hard' },
];

export default function Problems() {
  const { user, version } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const difficulty = params.get('difficulty') || 'All';
  const topic = params.get('topic') || 'All';
  const statusFilter = params.get('status') || 'All';
  const search = params.get('q') || '';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'All') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const isStudent = user.role === 'student';
  const statusMap = useMemo(() => (isStudent ? getStatusMap(user.id) : {}), [user.id, version, isStudent]);
  const weakTopics = useMemo(() => new Set(isStudent ? detectWeakTopics(user.id).map((t) => t.topic) : []), [user.id, version, isStudent]);
  const all = getProblems();
  const problems = getProblems({ difficulty, topic, search }).filter((p) => {
    if (statusFilter === 'All') return true;
    const s = statusMap[p.id] || 'todo';
    return s === statusFilter;
  });
  const solvedCount = all.filter((p) => statusMap[p.id] === 'solved').length;
  const hasFilters = difficulty !== 'All' || topic !== 'All' || statusFilter !== 'All' || search;

  const pickRandom = () => {
    const pool = problems.filter((p) => statusMap[p.id] !== 'solved');
    const list = pool.length ? pool : problems;
    if (list.length) navigate(`/problems/${list[Math.floor(Math.random() * list.length)].id}`);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Problemset</h1>
          <p className="text-sm text-lc-muted">{all.length} problems across {TOPICS.length} DSA topics{isStudent && <> · <span className="text-lc-easy">{solvedCount} solved</span></>}</p>
        </div>
        <button onClick={pickRandom} className="btn-ghost"><Shuffle size={15} /> Pick One</button>
      </div>

      {/* Topic chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['All', ...TOPICS].map((t) => (
          <button key={t} onClick={() => setParam('topic', t)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${topic === t ? 'bg-white text-black' : 'bg-lc-layer text-neutral-300 hover:bg-neutral-600'}`}>
            {t === 'All' ? 'All Topics' : t}
            {weakTopics.has(t) && <span className="ml-1 text-rose-400" title="Weak topic">●</span>}
            <span className="ml-1.5 text-xs opacity-60">{t === 'All' ? all.length : all.filter((p) => p.topic === t).length}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-lc-layer p-0.5" role="group" aria-label="Difficulty filter">
          {DIFF_PILLS.map((d) => (
            <button key={d.id} onClick={() => setParam('difficulty', d.id)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${difficulty === d.id ? `bg-lc-panel shadow ${d.cls}` : 'text-neutral-400 hover:text-white'}`}>
              {d.id}
            </button>
          ))}
        </div>
        <select aria-label="Topic" value={topic} onChange={(e) => setParam('topic', e.target.value)} className="input w-auto py-1.5">
          <option value="All">All Topics</option>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {isStudent && (
          <select aria-label="Status" value={statusFilter} onChange={(e) => setParam('status', e.target.value)} className="input w-auto py-1.5">
            <option value="All">All Status</option>
            <option value="todo">Todo</option>
            <option value="attempted">Attempted</option>
            <option value="solved">Solved</option>
          </select>
        )}
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={search} onChange={(e) => setParam('q', e.target.value)} placeholder="Search questions" className="input py-1.5 pl-8" />
        </div>
        {hasFilters && (
          <button onClick={() => setParams({}, { replace: true })} className="btn-ghost py-1.5 text-xs"><X size={13} /> Clear</button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-lc-border">
                <th className="th w-16">Status</th>
                <th className="th">Title</th>
                <th className="th w-44">Topic</th>
                <th className="th w-28">Acceptance</th>
                <th className="th w-24">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => (
                <tr key={p.id} className={`${i % 2 ? 'bg-lc-layer/30' : ''} hover:bg-lc-layer/70`}>
                  <td className="td"><StatusIcon status={statusMap[p.id]} /></td>
                  <td className="td"><Link to={`/problems/${p.id}`} className="font-medium text-neutral-100 hover:text-lc-orange">{p.id}. {p.title}</Link></td>
                  <td className="td"><TopicTag topic={p.topic} weak={weakTopics.has(p.topic)} /></td>
                  <td className="td text-neutral-300">{p.acceptanceRate}%</td>
                  <td className="td"><DifficultyBadge difficulty={p.difficulty} /></td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr><td colSpan={5} className="td py-10 text-center text-lc-muted">No problems match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-xs text-lc-muted">Showing {problems.length} of {all.length} problems</p>
    </div>
  );
}
