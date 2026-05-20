import { useState } from 'react';
import { Terminal, Wand2 } from 'lucide-react';
import { generateScripts } from '../api';
import type { GuideResult, ScriptsResult } from '../types';
import { CodeBlock, WarnBox, Spinner } from './ui';

interface ScriptsTabProps {
  result: GuideResult;
  query: string;
  onScriptsLoaded: (scripts: ScriptsResult) => void;
}

export function ScriptsTab({ result, query, onScriptsLoaded }: ScriptsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scriptTab, setScriptTab] = useState<'detection' | 'implementation' | 'validation' | 'rollback'>('detection');

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
          style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.2)' }}>
          <Terminal size={22} style={{ color: 'var(--acc)' }} />
        </div>
        <div>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Scripts not generated yet
          </div>
          <div className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text2)' }}>
            Click below to generate detection, implementation, validation and rollback PowerShell scripts for this recommendation.
          </div>
        </div>
        {error && <WarnBox>{error}</WarnBox>}
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors text-white"
          style={{ background: 'var(--acc)' }}
        >
          <Wand2 size={14} /> Generate PowerShell Scripts
        </button>
        <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
          Takes ~5–10 seconds
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Spinner size={36} />
        <div className="text-sm font-mono" style={{ color: 'var(--text2)' }}>Generating scripts…</div>
        <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Building detection and remediation logic</div>
      </div>
    );
  }

  // Scripts loaded
  return (
    <div>
      {/* Sub-tab bar */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--bg3)' }}>
        {(['detection', 'implementation', 'validation', 'rollback'] as const).map(t => (
          <button
            key={t}
            onClick={() => setScriptTab(t)}
            className="flex-1 text-xs py-1.5 rounded-md font-medium capitalize transition-colors"
            style={{
              background: scriptTab === t ? 'var(--acc)' : 'transparent',
              color: scriptTab === t ? 'white' : 'var(--text3)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {scriptTab === 'detection' && (
        <div>
          <div className="text-xs mb-2 px-1" style={{ color: 'var(--text3)' }}>
            Deploy as an Intune <strong style={{ color: 'var(--text2)' }}>Detection script</strong> — exits 0 if compliant, 1 if remediation needed.
          </div>
          <CodeBlock code={scripts!.detection} />
        </div>
      )}
      {scriptTab === 'implementation' && (
        <div>
          <div className="text-xs mb-2 px-1" style={{ color: 'var(--text3)' }}>
            Run standalone or deploy as an Intune <strong style={{ color: 'var(--text2)' }}>Remediation script</strong>.
          </div>
          <CodeBlock code={scripts!.implementation} />
        </div>
      )}
      {scriptTab === 'validation' && <CodeBlock code={scripts!.validation} />}
      {scriptTab === 'rollback' && (
        <div className="space-y-3">
          {[
            ['Intune', scripts!.rollback.intune],
            ['GPO', scripts!.rollback.gpo],
            ...(scripts!.rollback.entra ? [['Entra ID', scripts!.rollback.entra]] : []),
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{label}</div>
              <div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{val}</div>
            </div>
          ))}
          {scripts!.rollback.powershell && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Rollback script</div>
              <CodeBlock code={scripts!.rollback.powershell} />
            </div>
          )}
        </div>
      )}

      {/* Regenerate button */}
      <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
        >
          <Wand2 size={11} /> Regenerate scripts
        </button>
      </div>
    </div>
  );
}
