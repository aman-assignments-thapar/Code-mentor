import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, Target, DatabaseZap, Save, Mail, Calendar, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { updateProfile } from '../services/authService.js';
import { getUserStats, setDailyGoal } from '../services/problemService.js';
import { Alert, Modal } from '../components/ui.jsx';

export function ResetDemoButton({ className = 'btn-danger' }) {
  const { resetDemo } = useApp();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button onClick={() => setConfirm(true)} className={className}><DatabaseZap size={15} /> Reset Demo Data</button>
      {confirm && (
        <Modal title="Reset demo data?" onClose={() => setConfirm(false)}>
          <p className="text-sm text-neutral-300">This restores the original 20 problems and demo accounts, deletes all new users, submissions and practice sessions, and signs you out.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirm(false)} className="btn-ghost">Cancel</button>
            <button onClick={() => { resetDemo(); navigate('/login', { replace: true, state: { notice: 'Demo data has been reset. Use a Demo Fill button to sign in.' } }); }} className="btn-danger">Yes, reset everything</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function Profile() {
  const { user } = useApp();
  const isStudent = user.role === 'student';
  const stats = isStudent ? getUserStats(user.id) : null;
  const [name, setName] = useState(user.name);
  const [goal, setGoal] = useState(stats?.dailyGoal || 3);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState(null);

  const saveProfile = (e) => {
    e.preventDefault();
    const res = updateProfile(user.id, { name });
    if (res.ok && isStudent) setDailyGoal(user.id, goal);
    setMsg(res.ok ? { type: 'success', text: 'Profile updated.' } : { type: 'error', text: res.error });
  };
  const savePassword = (e) => {
    e.preventDefault();
    if (!pw.next) return setMsg({ type: 'error', text: 'Enter a new password.' });
    const res = updateProfile(user.id, { password: pw.next, currentPassword: pw.current });
    if (res.ok) setPw({ current: '', next: '' });
    setMsg(res.ok ? { type: 'success', text: 'Password changed.' } : { type: 'error', text: res.error });
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-4 py-6">
      <div className="card flex flex-wrap items-center gap-5 p-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-xl font-bold text-black">
          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{user.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-lc-muted">
            <span className="flex items-center gap-1"><Mail size={13} /> {user.email}</span>
            <span className="flex items-center gap-1"><Shield size={13} /> {user.role}</span>
            <span className="flex items-center gap-1"><Calendar size={13} /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {stats && (
          <div className="flex gap-6 text-center">
            <div><div className="text-xl font-semibold">{stats.totalSolved}</div><div className="text-xs text-lc-muted">Solved</div></div>
            <div><div className="text-xl font-semibold">{stats.streak}</div><div className="text-xs text-lc-muted">Streak</div></div>
            <div><div className="text-xl font-semibold">{stats.points}</div><div className="text-xs text-lc-muted">Points</div></div>
          </div>
        )}
      </div>

      {msg && <Alert type={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><User size={16} /> Profile Settings</h2>
          <div>
            <label className="label" htmlFor="pname">Display name</label>
            <input id="pname" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {isStudent && (
            <div>
              <label className="label" htmlFor="pgoal"><span className="inline-flex items-center gap-1"><Target size={12} /> Daily goal (problems per day)</span></label>
              <input id="pgoal" type="number" min={1} max={10} className="input" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
          )}
          <button className="btn-primary"><Save size={15} /> Save</button>
        </form>
        <form onSubmit={savePassword} className="card space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={16} /> Change Password</h2>
          <div>
            <label className="label" htmlFor="pcur">Current password</label>
            <input id="pcur" type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="pnew">New password</label>
            <input id="pnew" type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </div>
          <button className="btn-ghost"><KeyRound size={15} /> Update Password</button>
        </form>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 border-rose-500/30 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-rose-300"><DatabaseZap size={16} /> Demo Data</h2>
          <p className="text-sm text-lc-muted">Restore the pre-seeded problems, accounts and history (useful before a live demo).</p>
        </div>
        <ResetDemoButton />
      </div>
    </div>
  );
}
