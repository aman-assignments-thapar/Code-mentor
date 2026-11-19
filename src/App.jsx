import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import { RequireAuth, PublicOnly, HomeRedirect } from './components/RouteGuards.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Problems from './pages/Problems.jsx';
import Workspace from './pages/Workspace.jsx';
import Recommended from './pages/Recommended.jsx';
import Practice from './pages/Practice.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="text-6xl font-bold text-lc-orange">404</div>
      <p className="text-lc-muted">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/dashboard" element={<RequireAuth role="student"><Dashboard /></RequireAuth>} />
          <Route path="/problems" element={<RequireAuth><Problems /></RequireAuth>} />
          <Route path="/problems/:id" element={<RequireAuth><Workspace /></RequireAuth>} />
          <Route path="/recommended" element={<RequireAuth role="student"><Recommended /></RequireAuth>} />
          <Route path="/practice" element={<RequireAuth role="student"><Practice /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
