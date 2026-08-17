import { Link, Outlet } from 'react-router-dom';
import LogoMark from './LogoMark';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="brand-gradient">
        <div className="max-w-3xl mx-auto px-6 py-8 flex items-center gap-4">
          <LogoMark size={44} />
          <Link to="/">
            <p className="text-white/80 text-xs font-medium tracking-wide uppercase">Flow</p>
            <h1 className="text-white font-display text-2xl font-semibold">Survey Platform</h1>
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-muted py-6">
        Flow Survey Platform
      </footer>
    </div>
  );
}
