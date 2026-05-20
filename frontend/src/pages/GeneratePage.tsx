import { useState } from 'react';
import { Search, Wand2 } from 'lucide-react';
import type { GuideResult, ScriptsResult } from '../types';
import { generateGuide } from '../api';
import { Results } from '../components/Results';
import { WarnBox, Card } from '../components/ui';

const EXAMPLES = [
  'Disable Autoplay for all drives',
  'Disable Solicited Remote Assistance',
  'Enable phishing-resistant MFA',
  'Disable Basic authentication for WinRM Client',
  'Enable Microsoft Defender real-time protection',
  'Disable anonymous enumeration of SAM accounts',
  'Enable Windows Firewall for all profiles',
  'Disable Remote Desktop if not required',
];

const STEPS = [
  'Researching Microsoft Learn...',
  'Generating Intune implementation...',
  'Generating GPO steps...',
  'Checking Entra ID requirements...',
  'Compiling results...',
];

interface GeneratePageProps {
  onResult: (query: string, result: GuideResult) => void;
  onScriptsLoaded: (scripts: ScriptsResult) => void;
  savedResult: { query: string; result: GuideResult } | null;
  isFav: boolean;
  onFav: () => void;
  onEmailTemplate: () => void;
}

export function GeneratePage({ onResult, onScriptsLoaded, savedResult, isFav, onFav, onEmailTemplate }: GeneratePageProps) {
  const [query, setQuery] = useState(savedResult?.query ?? '');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  async function handleGenerate() {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError(''); setLoadingStep(0);
    const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % STEPS.length), 2500);
    try {
      const result = await generateGuide(q);
      clearInterval(interval);
      onResult(q, result);
    } catch (e: unknown) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card className="p-5 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
              placeholder="Enter a Secure Score recommendation…" disabled={loading}
              className="w-full rounded-xl pl-9 pr-4 py-3 text-sm outline-none font-sans disabled:opacity-60"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <button onClick={handleGenerate} disabled={loading || !query.trim()}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ background: 'var(--acc)' }}>
            <Wand2 size={14} />{loading ? 'Working…' : 'Generate guide'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => !loading && setQuery(ex)}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              {ex}
            </button>
          ))}
        </div>
      </Card>

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
              <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Typically takes 10–20 seconds</div>
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

      {error && !loading && (
        <div className="mb-4">
          <WarnBox>
            <strong>Error:</strong> {error}
            {error.includes('Rate limit') && ' — Wait 60 seconds and try again.'}
          </WarnBox>
        </div>
      )}

      {savedResult && !loading && (
        <Results query={savedResult.query} result={savedResult.result}
          isFav={isFav} onFav={onFav} onEmailTemplate={onEmailTemplate}
          onScriptsLoaded={onScriptsLoaded} />
      )}

      {!savedResult && !loading && !error && (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-sm">Enter a Defender Secure Score recommendation to get started</div>
          <div className="text-xs mt-2 font-mono" style={{ color: 'var(--text3)' }}>Results typically take 10–20 seconds</div>
        </div>
      )}
    </div>
  );
}
