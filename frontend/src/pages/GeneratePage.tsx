import { useState, useEffect, useRef } from 'react';
import { Search, Wand2, X, ChevronDown, RefreshCw } from 'lucide-react';
import type { GuideResult, ScriptsResult } from '../types';
import { generateGuide } from '../api';
import { Results } from '../components/Results';
import { WarnBox, Card } from '../components/ui';
import ALL_RECOMMENDATIONS from '../data/recommendations.json';

const STEPS = [
  'Searching cache...',
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
  const [error, setError] = useState<'RATE_LIMIT' | 'OVERLOADED' | 'OTHER' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  const ALL_RECS = ALL_RECOMMENDATIONS as string[];
  const filtered = filter.trim().length === 0
    ? ALL_RECS
    : ALL_RECS.filter(r => r.toLowerCase().includes(filter.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false); setFilter('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (dropdownOpen) { setTimeout(() => filterRef.current?.focus(), 50); setHighlighted(0); }
  }, [dropdownOpen]);

  useEffect(() => {
    if (searchMode) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchMode]);

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

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  function startCountdown(seconds: number, onDone: () => void) {
    setRetryIn(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRetryIn(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current!); onDone(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function selectRecommendation(rec: string) {
    setQuery(rec); setDropdownOpen(false); setFilter('');
    handleGenerate(rec);
  }

  function handleDropdownKey(e: React.KeyboardEvent) {
    if (!dropdownOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) selectRecommendation(filtered[highlighted]); }
    else if (e.key === 'Escape') { setDropdownOpen(false); setFilter(''); }
  }

  function highlight(text: string): React.ReactNode {
    if (!filter.trim()) return text;
    const idx = text.toLowerCase().indexOf(filter.toLowerCase());
    if (idx === -1) return text;
    return (<>{text.slice(0, idx)}<strong style={{ color: 'var(--acc)', fontWeight: 600 }}>{text.slice(idx, idx + filter.length)}</strong>{text.slice(idx + filter.length)}</>);
  }

  async function handleGenerate(overrideQuery?: string, isRetry = false) {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;
    if (!isRetry) { setError(null); setErrorMsg(''); setRetryIn(0); }
    setLoading(true); setLoadingStep(0);
    const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % STEPS.length), 2000);

    try {
      const { result, cached } = await generateGuide(q);
      clearInterval(interval);
      onResult(q, result, cached);
    } catch (e: unknown) {
      clearInterval(interval);
      const msg = e instanceof Error ? e.message : 'Unknown error';

      if (msg === 'RATE_LIMIT') {
        setError('RATE_LIMIT');
        // Auto-retry after 20s
        startCountdown(20, () => handleGenerate(q, true));
      } else if (msg === 'OVERLOADED') {
        setError('OVERLOADED');
        startCountdown(10, () => handleGenerate(q, true));
      } else {
        setError('OTHER');
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const isRetrying = retryIn > 0;

  return (
    <div>
      <Card className="p-5 mb-6">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => { setSearchMode(false); setDropdownOpen(false); }}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
            style={!searchMode ? { background: 'var(--acc)', color: 'white' } : { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            📋 Select from list
          </button>
          <button onClick={() => { setSearchMode(true); setDropdownOpen(false); setQuery(''); }}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
            style={searchMode ? { background: 'var(--acc)', color: 'white' } : { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            🔍 Custom recommendation
          </button>
        </div>

        <div className="flex gap-3" ref={dropdownRef}>
          {/* Mode A: dropdown */}
          {!searchMode && (
            <div className="flex-1 relative">
              <button onClick={() => { setDropdownOpen(o => !o); setHighlighted(0); }} disabled={loading || isRetrying}
                className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm text-left disabled:opacity-60"
                style={{ background: 'var(--input-bg)', border: dropdownOpen ? '1px solid var(--acc)' : '1px solid var(--border)', color: query ? 'var(--text)' : 'var(--text3)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <span className="truncate">{query || `Select from ${ALL_RECS.length} pre-cached recommendations...`}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {query && !loading && <span onClick={e => { e.stopPropagation(); setQuery(''); }} className="p-0.5 rounded cursor-pointer" style={{ color: 'var(--text3)' }}><X size={13} /></span>}
                  <ChevronDown size={14} style={{ color: 'var(--text3)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl flex flex-col"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', maxHeight: '380px' }}>
                  <div className="p-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
                      <input ref={filterRef} type="text" value={filter} onChange={e => { setFilter(e.target.value); setHighlighted(0); }} onKeyDown={handleDropdownKey}
                        placeholder={`Search ${ALL_RECS.length} recommendations...`}
                        className="w-full rounded-lg pl-7 pr-3 py-2 text-sm outline-none font-sans"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    </div>
                    <div className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text3)' }}>
                      {filtered.length} of {ALL_RECS.length} · ↑↓ navigate · Enter select
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {filtered.length === 0
                      ? <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text3)' }}>No results for "{filter}"</div>
                      : filtered.map((rec, i) => (
                        <button key={rec} onClick={() => selectRecommendation(rec)} onMouseEnter={() => setHighlighted(i)}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors block"
                          style={{ background: i === highlighted ? 'rgba(217,134,28,0.12)' : 'transparent', color: i === highlighted ? 'var(--text)' : 'var(--text2)', borderLeft: i === highlighted ? '2px solid var(--acc)' : '2px solid transparent', borderBottom: '1px solid var(--border)' }}>
                          {highlight(rec)}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode B: custom search */}
          {searchMode && (
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
              <input ref={searchRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && !isRetrying && handleGenerate()}
                placeholder="Type any Defender Secure Score recommendation..."
                disabled={loading || isRetrying}
                className="w-full rounded-xl pl-9 pr-10 py-3 text-sm outline-none font-sans disabled:opacity-60"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }}><X size={13} /></button>}
              <div className="text-[10px] mt-1.5 font-mono px-1" style={{ color: 'var(--text3)' }}>
                Pre-cached recommendations load instantly ⚡ · Others generated by Gemini AI
              </div>
            </div>
          )}

          <button onClick={() => handleGenerate()} disabled={loading || !query.trim() || isRetrying}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-white flex-shrink-0"
            style={{ background: 'var(--acc)', alignSelf: 'flex-start' }}>
            <Wand2 size={14} />
            {loading ? 'Working…' : 'Generate'}
          </button>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="p-8 mb-4">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--acc)', animation: 'spin 0.8s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--acc3)', animation: 'spin 1.2s linear infinite reverse' }} />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{STEPS[loadingStep]}</div>
              <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Trying multiple AI models for reliability</div>
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

      {/* Auto-retry countdown */}
      {isRetrying && !loading && (
        <Card className="p-6 mb-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: 'rgba(217,134,28,0.1)', border: '2px solid var(--acc)', color: 'var(--acc)' }}>
              {retryIn}
            </div>
            <div>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {error === 'RATE_LIMIT' ? 'Rate limit — auto-retrying' : 'Gemini busy — auto-retrying'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>
                Automatically retrying in {retryIn} seconds
              </div>
            </div>
            <button onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); setRetryIn(0); handleGenerate(query, true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
              <RefreshCw size={11} /> Retry now
            </button>
          </div>
        </Card>
      )}

      {/* Error (non-retryable) */}
      {error === 'OTHER' && !loading && !isRetrying && (
        <div className="mb-4">
          <WarnBox><strong>Error:</strong> {errorMsg}</WarnBox>
        </div>
      )}

      {/* Results */}
      {savedResult && !loading && !isRetrying && (
        <div>
          {cachedResult && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                ⚡ Instant — loaded from pre-generated cache
              </span>
            </div>
          )}
          <Results query={savedResult.query} result={savedResult.result}
            isFav={isFav} onFav={onFav} onEmailTemplate={onEmailTemplate}
            onScriptsLoaded={onScriptsLoaded} />
        </div>
      )}

      {/* Empty state */}
      {!savedResult && !loading && !isRetrying && !error && (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
            Select a recommendation or search for a custom one
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
            {ALL_RECS.length} pre-cached recommendations load instantly ⚡
          </div>
        </div>
      )}
    </div>
  );
}
