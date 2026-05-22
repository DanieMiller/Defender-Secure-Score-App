import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { Sun, Moon } from 'lucide-react';
import type { GuideResult, ScriptsResult } from './types';
import { GeneratePage } from './pages/GeneratePage';
import { DeploymentPage } from './pages/DeploymentPage';
import { HistoryPage, FavoritesPage } from './pages/HistoryFavPages';
import { ScriptBuilderPage } from './pages/ScriptBuilderPage';
import { EmailTemplatePage } from './pages/EmailTemplatePage';
import { useHistory, useFavorites, useTheme } from './hooks/useStorage';
import { BUILogo } from './components/BUILogo';

type Tab = 'generate' | 'scripts' | 'email' | 'history' | 'favorites' | 'deployment';

const TABS: { id: Tab; label: string }[] = [
  { id: 'generate',  label: 'Secure Score' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'scripts',   label: 'Script Builder' },
  { id: 'email',     label: 'Email Template' },
  { id: 'history',   label: 'History' },
  { id: 'favorites', label: 'Favorites' },
];

export default function App() {
  const { isLoggedIn, logout } = useAuth();
  if (!isLoggedIn) return <LoginPage />;

  const [tab, setTab] = useState<Tab>('generate');
  const [current, setCurrent] = useState<{ query: string; result: GuideResult; cached?: boolean } | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const history = useHistory();
  const favorites = useFavorites();
  const { dark, toggle } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);

  const handleResult = useCallback((query: string, result: GuideResult, cached?: boolean) => {
    setCurrent({ query, result, cached });
    history.add(query, result.confidence);
    setTab('generate');
  }, [history]);

  const handleLoad = useCallback((query: string) => {
    setTab('generate');
    setCurrent(null);          // clear old result
    setPendingQuery(query);    // signal GeneratePage to auto-run
  }, []);

  const handleFav = useCallback(() => {
    if (!current) return;
    if (favorites.has(current.query)) {
      const f = favorites.items.find(x => x.query === current.query);
      if (f) favorites.remove(f.id);
    } else {
      favorites.add(current.query);
    }
  }, [current, favorites]);

  const handleScriptsLoaded = useCallback((scripts: ScriptsResult) => {
    setCurrent(prev => prev ? { ...prev, result: { ...prev.result, scripts } } : null);
  }, []);

  const handleEmailTemplate = useCallback(() => setTab('email'), []);

  const PAGE_META: Partial<Record<Tab, { title: string; sub: string }>> = {
    generate: {
      title: 'Secure Score Implementation Assistant',
      sub: 'Generate Intune, GPO, Entra ID and PowerShell implementation guides for any Microsoft Defender Secure Score recommendation.',
    },
    deployment: {
      title: 'Defender Deployment Guides',
      sub: 'Step-by-step deployment guides with prerequisites for Defender for Identity, Cloud, IoT, and Cloud Apps.',
    },
    scripts: {
      title: 'Endpoint Script Builder',
      sub: 'Describe any endpoint management task in plain English — get Intune-ready detection, remediation, validation and rollback scripts.',
    },
    email: {
      title: 'Email Template Generator',
      sub: 'Generate a professional implementation email with step-by-step instructions ready to send to your client.',
    },
  };

  const pageMeta = PAGE_META[tab];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header — matches BUI intranet: dark charcoal bg, amber accents ── */}
      <header style={{ background: '#1A1C24', borderBottom: '2px solid #d9861c' }}
        className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-4 py-2.5">

            {/* BUI Logo - exact match to screenshot */}
            <a href="https://www.bui.co" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 flex-shrink-0 group">
              <BUILogo />
              {/* Vertical divider */}
              <div className="h-8 w-px mx-1" style={{ background: 'rgba(217,134,28,0.3)' }} />
              {/* App name */}
              <div>
                <div className="text-sm font-bold tracking-wide leading-none text-white">
                  SECURE SCORE OPS
                </div>
                <div className="text-[10px] tracking-wider leading-none mt-0.5"
                  style={{ color: '#d9861c' }}>
                  DEFENDER REMEDIATION ASSISTANT
                </div>
              </div>
            </a>

            {/* Nav tabs - matches intranet style */}
            <nav className="flex gap-1 ml-auto flex-wrap items-center">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="text-xs px-3 py-2 rounded font-medium transition-all tracking-wide"
                  style={tab === t.id
                    ? { background: '#d9861c', color: '#1A1C24', fontWeight: 600 }
                    : { color: '#A0A8B8', background: 'transparent' }}
                  onMouseEnter={e => { if (tab !== t.id) (e.target as HTMLElement).style.color = '#d9861c'; }}
                  onMouseLeave={e => { if (tab !== t.id) (e.target as HTMLElement).style.color = '#A0A8B8'; }}
                >
                  {t.label}
                  {t.id === 'history' && history.items.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(217,134,28,0.2)', color: '#d9861c' }}>
                      {history.items.length}
                    </span>
                  )}
                  {t.id === 'favorites' && favorites.items.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(217,134,28,0.2)', color: '#d9861c' }}>
                      {favorites.items.length}
                    </span>
                  )}
                </button>
              ))}

              {/* Theme toggle */}
              <button onClick={toggle}
                className="ml-1 w-8 h-8 rounded flex items-center justify-center transition-colors"
                style={{ border: '1px solid rgba(217,134,28,0.3)', color: '#A0A8B8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#d9861c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#A0A8B8')}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Logout */}
              <button onClick={logout}
                className="ml-1 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                style={{ border: '1px solid rgba(217,134,28,0.3)', color: '#d9861c' }}
                title="Sign out">
                Sign out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Page hero ── */}
      {pageMeta && (
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-5xl mx-auto px-4 py-7">
            <div className="flex items-start gap-4">
              {/* BUI amber accent bar */}
              <div className="w-1 h-10 rounded-full flex-shrink-0 mt-1"
                style={{ background: '#d9861c' }} />
              <div>
                <h1 className="text-xl font-bold tracking-tight mb-1"
                  style={{ color: 'var(--text)' }}>
                  {pageMeta.title}
                </h1>
                <p className="text-sm leading-relaxed"
                  style={{ color: 'var(--text2)', maxWidth: '560px' }}>
                  {pageMeta.sub}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'generate' && (
          <GeneratePage
            onResult={handleResult}
            onScriptsLoaded={handleScriptsLoaded}
            savedResult={current}
            cachedResult={current?.cached}
            isFav={current ? favorites.has(current.query) : false}
            onFav={handleFav}
            onEmailTemplate={handleEmailTemplate}
            pendingQuery={pendingQuery}
            onPendingQueryConsumed={() => setPendingQuery(null)}
          />
        )}
        {tab === 'deployment' && <DeploymentPage />}
        {tab === 'scripts'   && <ScriptBuilderPage />}
        {tab === 'email'     && <EmailTemplatePage result={current} />}
        {tab === 'history'   && <HistoryPage items={history.items} onLoad={handleLoad} onDelete={history.remove} onClear={history.clear} />}
        {tab === 'favorites' && <FavoritesPage items={favorites.items} onLoad={handleLoad} onDelete={favorites.remove} />}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 py-5" style={{ background: '#1A1C24', borderTop: '2px solid #d9861c' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BUILogo compact />
            <span className="text-xs" style={{ color: '#A0A8B8' }}>
              Secure Score Ops — Internal BUI Tool
            </span>
          </div>
          <a href="https://www.bui.co" target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:underline"
            style={{ color: '#d9861c' }}>
            www.bui.co
          </a>
        </div>
      </footer>
    </div>
  );
}
