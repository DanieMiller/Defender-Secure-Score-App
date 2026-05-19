import { useState } from 'react';
import { Search, Wand2 } from 'lucide-react';
import type { GuideResult } from '../types';
import { generateGuide } from '../api';
import { Results } from '../components/Results';
import { Spinner, WarnBox, Card } from '../components/ui';

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

interface GeneratePageProps {
  onResult: (query: string, result: GuideResult) => void;
  savedResult: { query: string; result: GuideResult } | null;
  isFav: boolean;
  onFav: () => void;
  onEmailTemplate: () => void;
}

export function GeneratePage({ onResult, savedResult, isFav, onFav, onEmailTemplate }: GeneratePageProps) {
  const [query, setQuery] = useState(savedResult?.query ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError('');
    try {
      const result = await generateGuide(q);
      onResult(q, result);
    } catch (e: unknown) {
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
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleGenerate()}
              placeholder="Enter a Secure Score recommendation…"
              className="w-full rounded-xl pl-9 pr-4 py-3 text-sm outline-none font-sans"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <button onClick={handleGenerate} disabled={loading||!query.trim()}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ background: 'var(--acc)' }}>
            <Wand2 size={14} />{loading ? 'Generating…' : 'Generate guide'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setQuery(ex)}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              {ex}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Spinner size={40} />
          <div className="text-sm font-mono" style={{ color: 'var(--text2)' }}>Researching Microsoft Learn…</div>
        </div>
      )}
      {error && !loading && <WarnBox><strong>Error:</strong> {error}</WarnBox>}
      {savedResult && !loading && (
        <Results query={savedResult.query} result={savedResult.result} isFav={isFav} onFav={onFav} onEmailTemplate={onEmailTemplate} />
      )}
      {!savedResult && !loading && !error && (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <div className="text-5xl mb-4">🛡️</div>
          <div className="text-sm">Enter a Defender Secure Score recommendation to get started</div>
        </div>
      )}
    </div>
  );
}
