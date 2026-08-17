import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import LogoMark from '../components/LogoMark';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@flowsurvey.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await login(email, password);
      setToken(token);
      navigate('/admin/surveys');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-sm">
        <LogoMark size={40} className="mb-4" />
        <p className="text-xs font-medium tracking-wide uppercase text-burgundy">Flow</p>
        <h1 className="font-display text-2xl font-semibold mb-6">Admin sign in</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-danger text-sm px-3 py-2">{error}</div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
          required
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg brand-gradient text-white font-medium py-2.5 text-sm disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
