import { useState, useCallback, useEffect } from 'react';
import { Shield, Sun, Moon } from 'lucide-react';
import type { GuideResult, ScriptsResult } from './types';
import { GeneratePage } from './pages/GeneratePage';
import { HistoryPage, FavoritesPage } from './pages/HistoryFavPages';
import { ScriptBuilderPage } from './pages/ScriptBuilderPage';
import { EmailTemplatePage } from './pages/EmailTemplatePage';
import { useHistory, useFavorites, useTheme } from './hooks/useStorage';

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

  // Apply light/dark class to html element
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
    if (!current) return;
    setCurrent(prev => prev ? { ...prev, result: { ...prev.result, scripts } } : null);
  }, [current]);

  const handleEmailTemplate = useCallback(() => setTab('email'), []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.3)' }}>
              <Shield size={16} style={{ color: 'var(--acc)' }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide leading-none" style={{ color: 'var(--text)' }}>SECURE SCORE OPS</div>
              <div className="text-[10px] font-mono tracking-widest leading-none mt-0.5" style={{ color: 'var(--text3)' }}>DEFENDER REMEDIATION ASSISTANT</div>
            </div>
          </div>

          <nav className="flex gap-1 ml-auto flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors tracking-wide"
                style={tab === t.id
                  ? { background: 'var(--acc)', color: 'white' }
                  : { color: 'var(--text2)', background: 'transparent' }}>
                {t.label}
                {t.id === 'history' && history.items.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>{history.items.length}</span>
                )}
                {t.id === 'favorites' && favorites.items.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>{favorites.items.length}</span>
                )}
              </button>
            ))}

            {/* Theme toggle */}
            <button onClick={toggle}
              className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      {tab === 'generate' && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="max-w-5xl mx-auto px-4 py-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              Defender <span style={{ color: 'var(--acc)' }}>Secure Score</span> Implementation Assistant
            </h1>
            <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text2)' }}>
              Generate Intune, GPO, Entra ID, and PowerShell guides for any Defender Secure Score recommendation.
            </p>
          </div>
        </div>
      )}

      {tab === 'scripts' && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="max-w-5xl mx-auto px-4 py-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              Endpoint <span style={{ color: 'var(--acc)' }}>Script Builder</span>
            </h1>
            <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text2)' }}>
              Describe any task in plain English — get Intune-ready detection, remediation, validation and rollback scripts instantly.
            </p>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="max-w-5xl mx-auto px-4 py-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              Email <span style={{ color: 'var(--acc)' }}>Template</span> Generator
            </h1>
            <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text2)' }}>
              Generate a professional client email with implementation steps ready to send.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'generate' && (
          <GeneratePage onResult={handleResult} onScriptsLoaded={handleScriptsLoaded} savedResult={current}
            isFav={current ? favorites.has(current.query) : false}
            onFav={handleFav} onEmailTemplate={handleEmailTemplate} />
        )}
        {tab === 'scripts'   && <ScriptBuilderPage />}
        {tab === 'email'     && <EmailTemplatePage result={current} />}
        {tab === 'history'   && <HistoryPage items={history.items} onLoad={handleLoad} onDelete={history.remove} onClear={history.clear} />}
        {tab === 'favorites' && <FavoritesPage items={favorites.items} onLoad={handleLoad} onDelete={favorites.remove} />}
      </main>
    </div>
  );
}
