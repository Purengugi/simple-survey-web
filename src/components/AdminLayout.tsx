import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from './LogoMark';

export default function AdminLayout() {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  function logout() {
    setToken(null);
    navigate('/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-burgundy-light text-burgundy-dark' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="brand-gradient px-6 py-6 flex items-center gap-3">
          <LogoMark size={34} />
          <div>
            <p className="text-white/80 text-xs font-medium tracking-wide uppercase">Flow</p>
            <h1 className="text-white font-display text-lg font-semibold">Survey Admin</h1>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/admin/surveys" className={linkClass}>
            Surveys
          </NavLink>
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 text-left"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
