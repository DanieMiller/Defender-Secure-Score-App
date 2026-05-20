import { useState, useCallback, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import type { GuideResult, ScriptsResult } from './types';
import { GeneratePage } from './pages/GeneratePage';
import { HistoryPage, FavoritesPage } from './pages/HistoryFavPages';
import { ScriptBuilderPage } from './pages/ScriptBuilderPage';
import { EmailTemplatePage } from './pages/EmailTemplatePage';
import { useHistory, useFavorites, useTheme } from './hooks/useStorage';
import { BUILogo } from './components/BUILogo';

type Tab = 'generate' | 'scripts' | 'email' | 'history' | 'favorites';

const TABS: { id: Tab; label: string }[] = [
  { id: 'generate',  label: 'Secure Score' },
  { id: 'scripts',   label: 'Script Builder' },
  { id: 'email',     label: 'Email Template' },
  { id: 'history',   label: 'History' },
  { id: 'favorites', label: 'Favorites' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');
  const [current, setCurrent] = useState<{ query: string; result: GuideResult } | null>(null);
  const history = useHistory();
  const favorites = useFavorites();
  const { dark, toggle } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);

  const handleResult = useCallback((query: string, result: GuideResult) => {
    setCurrent({ query, result });
    history.add(query, result.confidence);
    setTab('generate');
  }, [history]);

  const handleLoad = useCallback((query: string) => {
    setTab('generate');
    setCurrent(prev => ({ query, result: prev?.result ?? null as unknown as GuideResult }));
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

  const PAGE_TITLES: Partial<Record<Tab, { title: string; sub: string }>> = {
    generate: {
      title: 'Defender Secure Score Implementation Assistant',
      sub: 'Generate Intune, GPO, Entra ID and PowerShell guides for any Defender Secure Score recommendation.',
    },
    scripts: {
      title: 'Endpoint Script Builder',
      sub: 'Describe any task in plain English — get Intune-ready detection, remediation, validation and rollback scripts instantly.',
    },
    email: {
      title: 'Email Template Generator',
      sub: 'Generate a professional client email with implementation steps ready to send.',
    },
  };

  const pageInfo = PAGE_TITLES[tab];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-6 py-3">

            {/* BUI Logo */}
            <a href="https://www.bui.co" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 flex-shrink-0 group">
              <BUILogo
                className="h-7 w-auto transition-opacity group-hover:opacity-80"
                style={{ color: 'var(--text)' } as React.CSSProperties}
              />
              <div className="h-5 w-px" style={{ background: 'var(--border2)' }} />
              <div>
                <div className="text-xs font-semibold tracking-wider leading-none"
                  style={{ color: 'var(--text2)' }}>
                  SECURE SCORE OPS
                </div>
              </div>
            </a>

            {/* Nav */}
            <nav className="flex gap-1 ml-auto flex-wrap">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors tracking-wide"
                  style={tab === t.id
                    ? { background: 'var(--acc)', color: 'white' }
                    : { color: 'var(--text2)', background: 'transparent' }}>
                  {t.label}
                  {t.id === 'history' && history.items.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>
                      {history.items.length}
                    </span>
                  )}
                  {t.id === 'favorites' && favorites.items.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                      {favorites.items.length}
                    </span>
                  )}
                </button>
              ))}

              {/* Theme toggle */}
              <button onClick={toggle}
                className="ml-1 w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </nav>
          </div>
        </div>

        {/* Red accent line under header */}
        <div className="h-0.5 w-full" style={{ background: 'var(--acc)' }} />
      </header>

      {/* ── Page hero ── */}
      {pageInfo && (
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-start gap-4">
              {/* BUI red vertical accent bar */}
              <div className="w-1 h-12 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--acc)' }} />
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: 'var(--text)' }}>
                  {pageInfo.title}
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)', maxWidth: '560px' }}>
                  {pageInfo.sub}
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
            isFav={current ? favorites.has(current.query) : false}
            onFav={handleFav}
            onEmailTemplate={handleEmailTemplate}
          />
        )}
        {tab === 'scripts'   && <ScriptBuilderPage />}
        {tab === 'email'     && <EmailTemplatePage result={current} />}
        {tab === 'history'   && <HistoryPage items={history.items} onLoad={handleLoad} onDelete={history.remove} onClear={history.clear} />}
        {tab === 'favorites' && <FavoritesPage items={favorites.items} onLoad={handleLoad} onDelete={favorites.remove} />}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 py-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BUILogo className="h-5 w-auto" style={{ color: 'var(--text3)' } as React.CSSProperties} />
            <span className="text-xs" style={{ color: 'var(--text3)' }}>
              Secure Score Ops — powered by BUI
            </span>
          </div>
          <a href="https://www.bui.co" target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:underline"
            style={{ color: 'var(--acc)' }}>
            www.bui.co
          </a>
        </div>
      </footer>
    </div>
  );
}
