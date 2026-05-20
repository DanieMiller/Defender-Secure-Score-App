import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BUILogo } from '../components/BUILogo';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header bar matching app style */}
      <header style={{ background: '#1A1C24', borderBottom: '2px solid #d9861c' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <BUILogo />
        </div>
      </header>

      {/* Login form centred on page */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Icon + title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'rgba(217,134,28,0.12)', border: '1px solid rgba(217,134,28,0.3)' }}>
              <Shield size={28} style={{ color: '#d9861c' }} />
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
              Secure Score Ops
            </h1>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              Sign in to access the Defender Remediation Assistant
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text3)' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none font-sans transition-all disabled:opacity-60"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#d9861c')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(217,134,28,0.2)')}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text3)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none font-sans transition-all disabled:opacity-60"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#d9861c')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(217,134,28,0.2)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                    style={{ color: 'var(--text3)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#d9861c' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text3)' }}>
            BUI Internal Tool — Authorised Users Only
          </p>
        </div>
      </div>
    </div>
  );
}
