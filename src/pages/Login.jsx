import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, GraduationCap, UserRound, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Alert } from '../components/ui.jsx';
import AuthLayout from './AuthLayout.jsx';

const DEMOS = [
  { label: 'Student (with history)', email: 'student@codementor.edu', password: 'student123', icon: GraduationCap },
  { label: 'Student (fresh)', email: 'alex@codementor.edu', password: 'alex123', icon: UserRound },
  { label: 'Admin', email: 'admin@codementor.edu', password: 'admin123', icon: Shield },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const notice = location.state?.notice;

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (!res.ok) return setError(res.error);
    const from = location.state?.from;
    const allowed = from && (res.user.role === 'admin' ? from.startsWith('/admin') : !from.startsWith('/admin'));
    navigate(allowed ? from : res.redirect, { replace: true });
  };

  return (
    <AuthLayout>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-lc-muted">Welcome back — continue your practice.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {notice && <Alert type="success">{notice}</Alert>}
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        <div>
          <label className="label" htmlFor="email">Email ID</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@codementor.edu" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>
        <button type="submit" className="btn-primary w-full py-2"><LogIn size={16} /> Sign In</button>
      </form>

      <p className="mt-4 text-center text-sm text-lc-muted">
        New here? <Link to="/register" className="text-lc-orange hover:underline">Create an account</Link>
      </p>

      <div className="mt-6 border-t border-lc-border pt-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-lc-muted">Demo Fill (one click)</div>
        <div className="grid gap-2">
          {DEMOS.map((d) => (
            <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); setError(''); }}
              className="flex items-center gap-3 rounded-md border border-lc-border bg-lc-layer/50 px-3 py-2 text-left text-sm hover:border-lc-orange">
              <d.icon size={16} className="text-lc-orange" />
              <span className="flex-1">{d.label}</span>
              <span className="font-mono text-xs text-lc-muted">{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
