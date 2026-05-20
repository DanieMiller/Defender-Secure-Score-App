import { useState } from 'react';
import { Terminal, Wand2 } from 'lucide-react';
import { generateScripts } from '../api';
import type { GuideResult, ScriptsResult } from '../types';
import { CodeBlock, WarnBox, Spinner, InfoBox } from './ui';

interface ScriptsTabProps {
  result: GuideResult;
  query: string;
  onScriptsLoaded: (scripts: ScriptsResult) => void;
}

type ScriptTab = 'detection' | 'implementation' | 'validation' | 'rollback';

export function ScriptsTab({ result, query, onScriptsLoaded }: ScriptsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scriptTab, setScriptTab] = useState<ScriptTab>('detection');

  const scripts = result.scripts;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const s = await generateScripts(query);
      onScriptsLoaded(s);
      setScriptTab('detection');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate scripts');
    } finally {
      setLoading(false);
    }
  }

  // Not yet generated
  if (!scripts && !loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(217,134,28,0.1)', border: '1px solid rgba(217,134,28,0.2)' }}>
          <Terminal size={22} style={{ color: 'var(--acc)' }} />
        </div>
        <div>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Scripts not generated yet
          </div>
          <div className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text2)' }}>
            Click below to generate detection, implementation, validation and rollback PowerShell scripts.
          </div>
        </div>
        {error && <WarnBox>{error}</WarnBox>}
        <button onClick={handleGenerate}
          className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white"
          style={{ background: 'var(--acc)' }}>
          <Wand2 size={14} /> Generate PowerShell Scripts
        </button>
        <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Takes ~5–10 seconds</div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Spinner size={36} />
        <div className="text-sm font-mono" style={{ color: 'var(--text2)' }}>Generating scripts…</div>
      </div>
    );
  }

  // Helper to safely get script content — handles both field name variants
  const getScript = (key: ScriptTab): string => {
    if (!scripts) return '# Script not available';
    // Handle both 'implementation' and 'remediation' field names from API
    if (key === 'implementation') {
      return (scripts as any).implementation || (scripts as any).remediation || '# Implementation script not available';
    }
    if (key === 'rollback') return ''; // handled separately
    return (scripts as any)[key] || `# ${key} script not available`;
  };

  // Safe rollback access
  const rollback = scripts?.rollback;

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--bg3)' }}>
        {(['detection', 'implementation', 'validation', 'rollback'] as const).map(t => (
          <button key={t} onClick={() => setScriptTab(t)}
            className="flex-1 text-xs py-1.5 rounded-md font-medium capitalize transition-colors"
            style={{
              background: scriptTab === t ? 'var(--acc)' : 'transparent',
              color: scriptTab === t ? 'white' : 'var(--text3)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Detection */}
      {scriptTab === 'detection' && (
        <div>
          <InfoBox>Deploy as an Intune <strong>Detection script</strong> — exits 0 if compliant, 1 if remediation needed.</InfoBox>
          <CodeBlock code={getScript('detection')} />
        </div>
      )}

      {/* Implementation / Remediation */}
      {scriptTab === 'implementation' && (
        <div>
          <InfoBox>Run standalone or deploy as an Intune <strong>Remediation script</strong>.</InfoBox>
          <CodeBlock code={getScript('implementation')} />
        </div>
      )}

      {/* Validation */}
      {scriptTab === 'validation' && (
        <CodeBlock code={getScript('validation')} />
      )}

      {/* Rollback */}
      {scriptTab === 'rollback' && (
        <div className="space-y-3">
          {rollback ? (
            <>
              {rollback.intune && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Intune</div>
                  <div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
                    {rollback.intune}
                  </div>
                </div>
              )}
              {rollback.gpo && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>GPO</div>
                  <div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
                    {rollback.gpo}
                  </div>
                </div>
              )}
              {rollback.entra && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Entra ID</div>
                  <div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
                    {rollback.entra}
                  </div>
                </div>
              )}
              {rollback.powershell && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Rollback script</div>
                  <CodeBlock code={rollback.powershell} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-sm" style={{ color: 'var(--text3)' }}>
              Rollback information not available. Regenerate scripts to retry.
            </div>
          )}
        </div>
      )}

      {/* Regenerate button */}
      <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={handleGenerate}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>
          <Wand2 size={11} /> Regenerate scripts
        </button>
      </div>
    </div>
  );
}
