import { useState } from 'react';
import { Terminal, Wand2, Search } from 'lucide-react';
import { generateScript } from '../api';
import type { ScriptResult } from '../api';
import { CodeBlock, InfoBox, WarnBox, Spinner, Card } from '../components/ui';

const EXAMPLES = [
  'Uninstall TeamViewer from all devices',
  'Detect and remove Adobe Acrobat Reader DC older than version 2023',
  'Disable and remove OneDrive from all Windows devices',
  'Detect if Windows Firewall is disabled and enable it',
  'Find and uninstall all versions of VLC Media Player',
  'Check if BitLocker is enabled on the C drive and enable it',
  'Remove all printers and printer drivers',
  'Detect and kill any running instances of notepad.exe',
];

export function ScriptBuilderPage() {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [error, setError] = useState('');
  const [scriptTab, setScriptTab] = useState<'detection' | 'remediation' | 'validation' | 'rollback'>('detection');

  async function handleGenerate() {
    const q = request.trim();
    if (!q) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await generateScript(q);
      setResult(r);
      setScriptTab('detection');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Search card */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={15} style={{ color: 'var(--acc)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Script Builder</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono ml-1"
            style={{ background: 'rgba(234,88,12,0.15)', color: 'var(--acc2)', border: '1px solid rgba(234,88,12,0.3)' }}>
            Intune-ready
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
          Describe any endpoint management task in plain English — get production-ready detection, remediation, validation, and rollback scripts ready to deploy via Intune or run standalone.
        </p>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              value={request}
              onChange={e => setRequest(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Uninstall TeamViewer from all devices…"
              className="w-full rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition-colors font-sans"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !request.trim()}
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ background: 'var(--acc)' }}
          >
            <Wand2 size={14} />
            {loading ? 'Generating…' : 'Build scripts'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setRequest(ex)}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Spinner size={40} />
          <div className="text-sm font-mono" style={{ color: 'var(--text2)' }}>Generating scripts…</div>
          <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Building detection and remediation logic</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && <WarnBox><strong>Error:</strong> {error}</WarnBox>}

      {/* Results */}
      {result && !loading && (
        <div style={{ animation: 'slideUp 0.25s ease-out' }}>
          {/* Header */}
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Generated scripts</div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{result.title}</h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text2)' }}>{result.description}</p>
          </div>

          {/* Script tabs */}
          <Card className="mb-4 overflow-hidden">
            {/* Tab bar */}
            <div className="flex" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              {(['detection','remediation','validation','rollback'] as const).map(t => (
                <button key={t} onClick={() => setScriptTab(t)}
                  className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors"
                  style={{
                    borderBottom: scriptTab === t ? '2px solid var(--acc)' : '2px solid transparent',
                    color: scriptTab === t ? 'var(--acc2)' : 'var(--text3)',
                    background: scriptTab === t ? 'rgba(234,88,12,0.05)' : 'transparent',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-4">
              {scriptTab === 'detection'   && <>
                <InfoBox>Deploy as an Intune <strong>Detection script</strong> — exits 0 if compliant, 1 if remediation needed.</InfoBox>
                <CodeBlock code={result.detection} />
              </>}
              {scriptTab === 'remediation' && <>
                <InfoBox>Deploy as an Intune <strong>Remediation script</strong> — runs when detection exits 1.</InfoBox>
                <CodeBlock code={result.remediation} />
              </>}
              {scriptTab === 'validation'  && <CodeBlock code={result.validation} />}
              {scriptTab === 'rollback'    && <>
                <WarnBox>Test the rollback script in a non-production environment before deploying.</WarnBox>
                <CodeBlock code={result.rollback} />
              </>}
            </div>
          </Card>

          {/* Notes */}
          {result.notes?.length > 0 && (
            <Card className="p-4 mb-4">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>Deployment notes</div>
              <ul className="space-y-2">
                {result.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--acc)' }}>•</span>{n}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* References */}
          {result.references?.length > 0 && (
            <Card className="p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>References</div>
              <div className="space-y-2">
                {result.references.map((ref, i) => (
                  <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg transition-colors group"
                    style={{ border: '1px solid var(--border)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--acc)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{ref.title}</div>
                      <div className="text-[10px] font-mono truncate" style={{ color: 'var(--text3)' }}>{ref.url}</div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <Terminal size={40} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">Describe a task above to generate Intune-ready scripts</div>
        </div>
      )}
    </div>
  );
}
