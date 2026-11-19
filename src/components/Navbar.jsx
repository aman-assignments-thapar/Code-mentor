import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Code2, Flame, LayoutDashboard, ListChecks, Sparkles, Timer, LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getUserStats } from '../services/problemService.js';
import { detectWeakTopics } from '../services/aiEngine.js';

const linkCls = ({ isActive }) =>
  `flex items-center gap-1.5 whitespace-nowrap px-3 h-12 text-sm border-b-2 transition-colors ${
    isActive ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-white'
  }`;

export default function Navbar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, user?.id]);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const stats = !isAdmin ? getUserStats(user.id) : null;
  const weakCount = !isAdmin ? detectWeakTopics(user.id).length : 0;

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-lc-border bg-lc-panel">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-2 px-4">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="mr-2 flex items-center gap-2 font-semibold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-lc-orange text-black">
            <Code2 size={17} strokeWidth={2.5} />
          </span>
          <span className="hidden sm:inline">Code Mentor</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center overflow-x-auto">
          {isAdmin ? (
            <>
              <NavLink to="/admin" className={linkCls}><Shield size={15} /> Admin Console</NavLink>
              <NavLink to="/problems" className={linkCls} end><ListChecks size={15} /> Problems</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={linkCls}><LayoutDashboard size={15} /> Dashboard</NavLink>
              <NavLink to="/problems" className={linkCls}><ListChecks size={15} /> Problems</NavLink>
              <NavLink to="/recommended" className={linkCls}>
                <Sparkles size={15} /> Recommended
                {weakCount > 0 && <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{weakCount}</span>}
              </NavLink>
              <NavLink to="/practice" className={linkCls}><Timer size={15} /> Practice</NavLink>
            </>
          )}
        </nav>

        {stats && (
          <Link to="/dashboard" title="Daily streak" className={`flex items-center gap-1 text-sm font-medium ${stats.streak ? 'text-lc-orange' : 'text-neutral-500'}`}>
            <Flame size={17} fill={stats.streak ? 'currentColor' : 'none'} /> {stats.streak}
          </Link>
        )}

        <div className="relative" ref={menuRef}>
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-lc-layer" aria-haspopup="menu">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-bold text-black">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <ChevronDown size={14} className="text-neutral-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg border border-lc-border bg-lc-panel py-1 shadow-xl" role="menu">
              <div className="border-b border-lc-border px-3 py-2">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="truncate text-xs text-lc-muted">{user.email}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-lc-orange">{user.role}</div>
              </div>
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-lc-layer">
                <User size={15} /> Profile & Settings
              </Link>
              <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-300 hover:bg-lc-layer">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
