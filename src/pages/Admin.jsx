import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, BookOpen, Pencil, Trash2, Plus, Search, Send, CheckCircle2, AlertTriangle, Shield, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getReports, listUsers, updateUser, deleteUser, listProblems, addProblem, deleteProblem } from '../services/adminService.js';
import { DIFFICULTIES, TOPICS } from '../data/seedData.js';
import { Alert, DifficultyBadge, Modal, ProgressBar, StatCard, TopicTag, timeAgo, DIFF_BG } from '../components/ui.jsx';
import { ResetDemoButton } from './Profile.jsx';

const TABS = [
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'users', label: 'Manage Users', icon: Users },
  { id: 'problems', label: 'Manage Problems', icon: BookOpen },
];

export default function Admin() {
  const [tab, setTab] = useState('reports');
  const [flash, setFlash] = useState(null);
  return (
    <div className="mx-auto max-w-[1300px] space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Shield className="text-lc-orange" /> Admin Console</h1>
          <p className="text-sm text-lc-muted">Manage users and problems, and view platform reports.</p>
        </div>
        <ResetDemoButton className="btn-ghost" />
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-lc-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setFlash(null); }}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm ${tab === t.id ? 'border-lc-orange text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>
      {flash && <Alert type={flash.type} onClose={() => setFlash(null)}>{flash.text}</Alert>}
      {tab === 'reports' && <Reports />}
      {tab === 'users' && <ManageUsers setFlash={setFlash} />}
      {tab === 'problems' && <ManageProblems setFlash={setFlash} />}
    </div>
  );
}

// ───────────── Reports ─────────────
function Reports() {
  const { version } = useApp();
  const r = useMemo(() => getReports(), [version]);
  const maxFail = Math.max(1, ...r.mostFailedTopics.map((t) => t.failures));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={r.totalUsers} sub={`${r.totalStudents} students · ${r.totalAdmins} admin${r.totalAdmins === 1 ? '' : 's'}`} />
        <StatCard icon={Send} label="Total Submissions" value={r.totalSubmissions} sub={`${r.acceptedSubmissions} accepted`} accent="text-sky-400" />
        <StatCard icon={CheckCircle2} label="Pass Rate" value={`${r.passRate}%`} sub="accepted / all submissions" accent="text-lc-easy" />
        <StatCard icon={BookOpen} label="Problems" value={r.totalProblems} sub={`${TOPICS.length} topics`} accent="text-violet-400" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><AlertTriangle size={16} className="text-rose-400" /> Most-Failed Topics</h2>
          <div className="space-y-3">
            {r.mostFailedTopics.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t.topic}</span>
                  <span className="text-xs text-lc-muted"><span className="font-semibold text-white">{t.failures}</span> failures · {t.failRate}% fail rate · {t.attempts} attempts</span>
                </div>
                <ProgressBar value={t.failures} max={maxFail} color="bg-rose-500" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Pass Rate by Difficulty</h2>
          <div className="space-y-3">
            {r.byDifficulty.map((d) => (
              <div key={d.difficulty}>
                <div className="mb-1 flex justify-between text-sm">
                  <DifficultyBadge difficulty={d.difficulty} pill />
                  <span className="text-xs text-lc-muted"><span className="font-semibold text-white">{d.passRate}%</span> of {d.submissions} submissions</span>
                </div>
                <ProgressBar value={d.passRate} color={DIFF_BG[d.difficulty]} />
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-6 text-sm font-semibold">Most-Failed Problems</h3>
          {r.mostFailedProblems.length === 0 ? <p className="text-sm text-lc-muted">No failures yet.</p> : (
            <ul className="space-y-1 text-sm">
              {r.mostFailedProblems.map((p) => <li key={p.title} className="flex justify-between"><span>{p.title}</span><span className="text-rose-300">{p.count} WA</span></li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-lc-border px-5 py-3 font-semibold">Recent Submissions</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead><tr className="border-b border-lc-border"><th className="th">User</th><th className="th">Problem</th><th className="th">Topic</th><th className="th">Status</th><th className="th">When</th></tr></thead>
            <tbody>
              {r.recentSubmissions.map((s) => (
                <tr key={s.id} className="border-b border-lc-border/50">
                  <td className="td">{s.userName}</td>
                  <td className="td">{s.title} <DifficultyBadge difficulty={s.difficulty} /></td>
                  <td className="td"><TopicTag topic={s.topic} /></td>
                  <td className={`td font-medium ${s.status === 'Accepted' ? 'text-lc-easy' : 'text-lc-hard'}`}>{s.status}</td>
                  <td className="td text-lc-muted">{timeAgo(s.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────── Users ─────────────
function ManageUsers({ setFlash }) {
  const { user: me, version } = useApp();
  const users = useMemo(() => listUsers(), [version]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const filtered = users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()));

  const save = (e) => {
    e.preventDefault();
    const res = updateUser(editing.id, { name: editing.name, email: editing.email, role: editing.role, password: editing.password || undefined });
    if (!res.ok) return setError(res.error);
    setFlash({ type: 'success', text: `User "${editing.name}" updated successfully.` });
    setEditing(null);
  };
  const confirmDelete = () => {
    const res = deleteUser(deleting.id, me.id);
    setFlash(res.ok ? { type: 'success', text: `User "${deleting.name}" deleted.` } : { type: 'error', text: res.error });
    setDeleting(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="input py-1.5 pl-8" />
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead><tr className="border-b border-lc-border"><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Solved</th><th className="th">Submissions</th><th className="th">Streak</th><th className="th text-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-lc-border/50 hover:bg-lc-layer/40">
                  <td className="td font-medium">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-lc-orange">(you)</span>}</td>
                  <td className="td text-neutral-300">{u.email}</td>
                  <td className="td">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${u.role === 'admin' ? 'bg-violet-500/15 text-violet-300' : 'bg-sky-500/15 text-sky-300'}`}>
                      {u.role === 'admin' ? <Shield size={11} /> : <GraduationCap size={11} />} {u.role}
                    </span>
                  </td>
                  <td className="td">{u.solved}</td>
                  <td className="td">{u.submissions}</td>
                  <td className="td">🔥 {u.streak}</td>
                  <td className="td">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => { setError(''); setEditing({ ...u, password: '' }); }} className="btn-ghost px-2 py-1 text-xs"><Pencil size={13} /> Update</button>
                      <button onClick={() => setDeleting(u)} disabled={u.id === me.id} className="btn-danger px-2 py-1 text-xs"><Trash2 size={13} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-lc-muted">{filtered.length} of {users.length} users</p>

      {editing && (
        <Modal title={`Update user — ${editing.email}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}
            <div><label className="label" htmlFor="ename">Name</label><input id="ename" className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="label" htmlFor="eemail">Email</label><input id="eemail" className="input" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div>
              <label className="label" htmlFor="erole">Role</label>
              <select id="erole" className="input" value={editing.role} disabled={editing.id === me.id} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                <option value="student">student</option><option value="admin">admin</option>
              </select>
            </div>
            <div><label className="label" htmlFor="epw">Reset password (optional)</label><input id="epw" type="text" className="input" placeholder="Leave blank to keep" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button><button className="btn-primary">Save changes</button></div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete user?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-neutral-300">Delete <b>{deleting.name}</b> ({deleting.email})? Their submissions and progress will also be removed. This cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button><button onClick={confirmDelete} className="btn-danger"><Trash2 size={14} /> Delete</button></div>
        </Modal>
      )}
    </div>
  );
}

// ───────────── Problems ─────────────
const EMPTY = { title: '', topic: 'Arrays', difficulty: 'Easy', description: '', exampleInput: '', exampleOutput: '', constraints: '', functionName: 'solve', keywords: '', hint1: '', hint2: '', hint3: '' };

function ManageProblems({ setFlash }) {
  const { version } = useApp();
  const problems = useMemo(() => listProblems(), [version]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    const res = addProblem(form);
    if (!res.ok) return setError(res.error);
    setFlash({ type: 'success', text: `Problem "${res.problem.title}" added (#${res.problem.id}).` });
    setAdding(false);
    setForm(EMPTY);
  };
  const confirmDelete = () => {
    const res = deleteProblem(deleting.id);
    setFlash(res.ok ? { type: 'success', text: `Problem "${deleting.title}" deleted.` } : { type: 'error', text: res.error });
    setDeleting(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-lc-muted">{problems.length} problems</p>
        <button onClick={() => { setError(''); setAdding(true); }} className="btn-primary"><Plus size={15} /> Add Problem</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead><tr className="border-b border-lc-border"><th className="th">#</th><th className="th">Title</th><th className="th">Topic</th><th className="th">Difficulty</th><th className="th">Submissions</th><th className="th">Failures</th><th className="th text-right">Actions</th></tr></thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id} className="border-b border-lc-border/50 hover:bg-lc-layer/40">
                  <td className="td text-lc-muted">{p.id}</td>
                  <td className="td"><Link to={`/problems/${p.id}`} className="hover:text-lc-orange">{p.title}</Link>{p.custom && <span className="ml-2 rounded bg-violet-500/15 px-1.5 text-[10px] text-violet-300">custom</span>}</td>
                  <td className="td"><TopicTag topic={p.topic} /></td>
                  <td className="td"><DifficultyBadge difficulty={p.difficulty} /></td>
                  <td className="td">{p.submissions}</td>
                  <td className="td text-rose-300">{p.failures}</td>
                  <td className="td text-right"><button onClick={() => setDeleting(p)} className="btn-danger px-2 py-1 text-xs"><Trash2 size={13} /> Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <Modal title="Add a DSA problem" onClose={() => setAdding(false)} wide>
          <form onSubmit={save} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3"><label className="label" htmlFor="ntitle">Title *</label><input id="ntitle" className="input" value={form.title} onChange={set('title')} placeholder="e.g. Contains Duplicate" /></div>
              <div><label className="label" htmlFor="ntopic">Topic *</label><select id="ntopic" className="input" value={form.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className="label" htmlFor="ndiff">Difficulty *</label><select id="ndiff" className="input" value={form.difficulty} onChange={set('difficulty')}>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label className="label" htmlFor="nfn">Function name</label><input id="nfn" className="input font-mono" value={form.functionName} onChange={set('functionName')} /></div>
            </div>
            <div><label className="label" htmlFor="ndesc">Description * (supports `code` and **bold**)</label><textarea id="ndesc" rows={4} className="input" value={form.description} onChange={set('description')} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="nin">Example input</label><input id="nin" className="input font-mono" value={form.exampleInput} onChange={set('exampleInput')} placeholder="nums = [1,2,3,1]" /></div>
              <div><label className="label" htmlFor="nout">Example output</label><input id="nout" className="input font-mono" value={form.exampleOutput} onChange={set('exampleOutput')} placeholder="true" /></div>
            </div>
            <div><label className="label" htmlFor="ncons">Constraints (one per line)</label><textarea id="ncons" rows={2} className="input font-mono" value={form.constraints} onChange={set('constraints')} /></div>
            <div><label className="label" htmlFor="nkw">Expected keywords (comma-separated)</label><input id="nkw" className="input" value={form.keywords} onChange={set('keywords')} placeholder="set, for, return" /></div>
            <div className="grid gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n}><label className="label" htmlFor={`nh${n}`}>Hint {n} {['(intuition)', '(approach)', '(algorithm)'][n - 1]}</label><input id={`nh${n}`} className="input" value={form[`hint${n}`]} onChange={set(`hint${n}`)} placeholder="Optional — a default is used if blank" /></div>
              ))}
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setAdding(false)} className="btn-ghost">Cancel</button><button className="btn-primary"><Plus size={15} /> Add Problem</button></div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete problem?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-neutral-300">Delete <b>#{deleting.id} {deleting.title}</b>? Students will no longer see it. Existing submission history is kept.</p>
          <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button><button onClick={confirmDelete} className="btn-danger"><Trash2 size={14} /> Delete</button></div>
        </Modal>
      )}
    </div>
  );
}
