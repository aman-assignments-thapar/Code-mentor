import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Alert } from '../components/ui.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    const res = register({ name: form.name, email: form.email, password: form.password });
    if (!res.ok) return setError(res.error);
    navigate('/dashboard', { replace: true, state: { welcome: true } });
  };

  return (
    <AuthLayout>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-lc-muted">Start solving problems and get personalised recommendations.</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        <div>
          <label className="label" htmlFor="name">Full Name</label>
          <input id="name" className="input" value={form.name} onChange={set('name')} placeholder="Jane Doe" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email ID</label>
          <input id="email" type="email" className="input" value={form.email} onChange={set('email')} placeholder="you@university.edu" autoComplete="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm Password</label>
            <input id="confirm" type="password" className="input" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" autoComplete="new-password" />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full py-2"><UserPlus size={16} /> Register</button>
      </form>
      <p className="mt-4 text-center text-sm text-lc-muted">
        Already have an account? <Link to="/login" className="text-lc-orange hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
