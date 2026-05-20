import { useState, useEffect, useRef } from 'react';
import { Search, Wand2, X, ChevronDown } from 'lucide-react';
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
  const [error, setError] = useState('');

  // Dropdown state
  const [filter, setFilter] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [highlighted, setHighlighted] = useState(0);

  const filtered = filter.trim().length === 0
    ? (ALL_RECOMMENDATIONS as string[])
    : (ALL_RECOMMENDATIONS as string[]).filter(r =>
        r.toLowerCase().includes(filter.toLowerCase())
      );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
        setFilter('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus filter input when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => filterRef.current?.focus(), 50);
      setHighlighted(0);
    }
  }, [dropdownOpen]);

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

  function selectRecommendation(rec: string) {
    setQuery(rec);
    setDropdownOpen(false);
    setFilter('');
    handleGenerate(rec);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!dropdownOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) selectRecommendation(filtered[highlighted]); }
    else if (e.key === 'Escape') { setDropdownOpen(false); setFilter(''); }
  }

  async function handleGenerate(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;
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

  // Highlight matching text in dropdown
  function highlight(text: string): React.ReactNode {
    if (!filter.trim()) return text;
    const idx = text.toLowerCase().indexOf(filter.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: 'var(--acc)', fontWeight: 600 }}>{text.slice(idx, idx + filter.length)}</strong>
        {text.slice(idx + filter.length)}
      </>
    );
  }

  return (
    <div>
      <Card className="p-5 mb-6">
        <div className="flex gap-3" ref={dropdownRef}>
          {/* Dropdown trigger button */}
          <div className="flex-1 relative">
            <button
              onClick={() => { setDropdownOpen(o => !o); setHighlighted(0); }}
              disabled={loading}
              className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm text-left transition-colors disabled:opacity-60"
              style={{
                background: 'var(--input-bg)',
                border: dropdownOpen ? '1px solid var(--acc)' : '1px solid var(--border)',
                color: query ? 'var(--text)' : 'var(--text3)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                <span className="truncate">{query || 'Select a Secure Score recommendation...'}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {query && !loading && (
                  <span
                    onClick={e => { e.stopPropagation(); setQuery(''); }}
                    className="p-0.5 rounded cursor-pointer"
                    style={{ color: 'var(--text3)' }}
                  >
                    <X size={13} />
                  </span>
                )}
                <ChevronDown size={14} style={{ color: 'var(--text3)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', maxHeight: '380px' }}>

                {/* Search filter */}
                <div className="p-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
                    <input
                      ref={filterRef}
                      type="text"
                      value={filter}
                      onChange={e => { setFilter(e.target.value); setHighlighted(0); }}
                      onKeyDown={handleKeyDown}
                      placeholder={`Search ${(ALL_RECOMMENDATIONS as string[]).length} recommendations...`}
                      className="w-full rounded-lg pl-7 pr-3 py-2 text-sm outline-none font-sans"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                  <div className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text3)' }}>
                    {filtered.length} of {(ALL_RECOMMENDATIONS as string[]).length} recommendations
                    {filter && ` matching "${filter}"`}
                    &nbsp;· ↑↓ navigate · Enter select
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text3)' }}>
                      No recommendations match "{filter}"
                    </div>
                  ) : (
                    filtered.map((rec, i) => (
                      <button
                        key={rec}
                        onClick={() => selectRecommendation(rec)}
                        onMouseEnter={() => setHighlighted(i)}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors block"
                        style={{
                          background: i === highlighted ? 'rgba(217,134,28,0.12)' : 'transparent',
                          color: i === highlighted ? 'var(--text)' : 'var(--text2)',
                          borderLeft: i === highlighted ? '2px solid var(--acc)' : '2px solid transparent',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {highlight(rec)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-white flex-shrink-0"
            style={{ background: 'var(--acc)' }}
          >
            <Wand2 size={14} />
            {loading ? 'Working…' : 'Generate guide'}
          </button>
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
              <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                {loadingStep === 0 ? 'Checking pre-generated cache...' : 'Typically takes 8–15 seconds'}
              </div>
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
            <strong>{error.includes('busy') || error.includes('rate limit') || error.includes('Rate limit') ? '⏱ Rate limit reached' : error.includes('high demand') || error.includes('unavailable') ? '⚠ Gemini overloaded' : 'Error'}:</strong>{' '}
            {error.includes('busy') || error.includes('rate limit') || error.includes('Rate limit')
              ? 'Gemini rate limit reached. Wait 60 seconds then try again.'
              : error.includes('high demand') || error.includes('unavailable')
              ? 'Gemini is experiencing high demand. Wait 30 seconds then try again.'
              : error}
          </WarnBox>
          {(error.includes('busy') || error.includes('Rate limit') || error.includes('rate limit') || error.includes('high demand') || error.includes('unavailable')) && (
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

      {/* Empty state */}
      {!savedResult && !loading && !error && (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
            Select a recommendation from the dropdown above
          </div>
          <div className="text-xs mt-2 font-mono" style={{ color: 'var(--text3)' }}>
            {(ALL_RECOMMENDATIONS as string[]).length} pre-cached recommendations load instantly ⚡
          </div>
        </div>
      )}
    </div>
  );
}
