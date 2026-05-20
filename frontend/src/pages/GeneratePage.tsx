import { useState, useEffect, useRef } from 'react';
import { Search, Wand2, X } from 'lucide-react';
import type { GuideResult, ScriptsResult } from '../types';
import { generateGuide } from '../api';
import { Results } from '../components/Results';
import { WarnBox, Card } from '../components/ui';
import ALL_RECOMMENDATIONS from '../data/recommendations.json';

const EXAMPLES = [
  'Disable Autoplay for all drives',
  'Disable Solicited Remote Assistance',
  'Enable phishing-resistant MFA',
  'Disable Basic authentication for WinRM Client',
  'Enable Microsoft Defender real-time protection',
  'Disable anonymous enumeration of SAM accounts',
];

const STEPS = [
  'Researching Microsoft Learn...',
  'Generating Intune steps...',
  'Generating GPO configuration...',
  'Checking Entra ID requirements...',
  'Finalising results...',
];

interface GeneratePageProps {
  onResult: (query: string, result: GuideResult, cached?: boolean) => void;
  onScriptsLoaded: (scripts: ScriptsResult) => void;
  savedResult: { query: string; result: GuideResult } | null;
  cachedResult?: boolean;
  isFav: boolean;
  onFav: () => void;
  onEmailTemplate: () => void;
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
}

export function GeneratePage({
  onResult, onScriptsLoaded, savedResult, cachedResult,
  isFav, onFav, onEmailTemplate,
  pendingQuery, onPendingQueryConsumed,
}: GeneratePageProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  // Auto-trigger when history/favorites loads a query
  useEffect(() => {
    if (pendingQuery && !loading) {
      setQuery(pendingQuery);
      onPendingQueryConsumed?.();
      handleGenerate(pendingQuery);
    }
  }, [pendingQuery]);

  useEffect(() => {
    if (savedResult?.query && !pendingQuery) setQuery(savedResult.query);
  }, [savedResult?.query]);

  // Autocomplete filtering
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = (ALL_RECOMMENDATIONS as string[])
      .filter(r => r.toLowerCase().includes(q))
      .slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setActiveSuggestion(-1);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!suggestRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectSuggestion(suggestion: string) {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleGenerate(suggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleGenerate();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0) {
        selectSuggestion(suggestions[activeSuggestion]);
      } else {
        setShowSuggestions(false);
        handleGenerate();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  async function handleGenerate(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;
    setShowSuggestions(false);
    setLoading(true); setError(''); setLoadingStep(0);
    const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % STEPS.length), 2000);
    try {
      const { result, cached } = await generateGuide(q);
      clearInterval(interval);
      onResult(q, result, cached);
    } catch (e: unknown) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Highlight matching text in suggestions
  function highlight(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: 'var(--acc)' }}>{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div>
      <Card className="p-5 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: 'var(--text3)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search 281 Defender Secure Score recommendations…"
              disabled={loading}
              autoComplete="off"
              className="w-full rounded-xl pl-9 pr-9 py-3 text-sm outline-none font-sans disabled:opacity-60"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            {query && !loading && (
              <button onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text3)' }}>
                <X size={14} />
              </button>
            )}

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestRef}
                className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}>
                <div className="px-3 py-1.5 flex items-center justify-between"
                  style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                    {suggestions.length} matching recommendations
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>↑↓ navigate · Enter select</span>
                </div>
                {suggestions.map((s, i) => (
                  <button key={s} onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-3 py-2.5 text-sm transition-colors block"
                    style={{
                      background: i === activeSuggestion ? 'rgba(217,134,28,0.1)' : 'transparent',
                      color: 'var(--text2)',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={() => setActiveSuggestion(i)}
                  >
                    {highlight(s, query)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => handleGenerate()} disabled={loading || !query.trim()}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ background: 'var(--acc)' }}>
            <Wand2 size={14} />
            {loading ? 'Working…' : 'Generate guide'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
            Quick examples
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
            — or type to search all {(ALL_RECOMMENDATIONS as string[]).length} recommendations
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => { if (!loading) { setQuery(ex); handleGenerate(ex); } }}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              {ex}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="p-8 mb-4">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'var(--acc)', animation: 'spin 0.8s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'var(--acc3)', animation: 'spin 1.2s linear infinite reverse' }} />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{STEPS[loadingStep]}</div>
              <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Typically takes 8–15 seconds</div>
            </div>
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full transition-all duration-500"
                  style={{ background: i <= loadingStep ? 'var(--acc)' : 'var(--bg4)', transform: i === loadingStep ? 'scale(1.3)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mb-4">
          <WarnBox>
            <strong>{error.includes('busy') || error.includes('Rate limit') ? '⏱ Rate limit reached' : 'Error'}:</strong>{' '}
            {error.includes('busy') || error.includes('Rate limit')
              ? 'Gemini free tier allows 15 requests/minute. Wait 60 seconds then try again.'
              : error}
          </WarnBox>
          {(error.includes('busy') || error.includes('Rate limit')) && (
            <div className="mt-2 flex justify-end">
              <button onClick={() => { setError(''); handleGenerate(); }}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white"
                style={{ background: 'var(--acc)' }}>
                Retry now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {savedResult && !loading && (
        <div>
          {cachedResult && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                ⚡ Instant — loaded from pre-generated cache
              </span>
            </div>
          )}
          <Results
            query={savedResult.query}
            result={savedResult.result}
            isFav={isFav}
            onFav={onFav}
            onEmailTemplate={onEmailTemplate}
            onScriptsLoaded={onScriptsLoaded}
          />
        </div>
      )}

      {!savedResult && !loading && !error && (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-sm">Search or select from {(ALL_RECOMMENDATIONS as string[]).length} Defender Secure Score recommendations</div>
          <div className="text-xs mt-2 font-mono" style={{ color: 'var(--text3)' }}>Pre-cached recommendations load instantly · Others take 8–15 seconds</div>
        </div>
      )}
    </div>
  );
}
