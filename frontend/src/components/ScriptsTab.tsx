import { useState, useEffect, useRef } from 'react';
import { Terminal, Wand2, RefreshCw } from 'lucide-react';
import { generateScripts } from '../api';
import type { GuideResult, ScriptsResult } from '../types';
import { CodeBlock, WarnBox, Spinner, InfoBox } from './ui';

interface ScriptsTabProps {
  result: GuideResult;
  query: string;
  onScriptsLoaded: (scripts: ScriptsResult) => void;
}

type ScriptTab = 'detection' | 'implementation' | 'validation' | 'rollback';

const TAB_LABELS: Record<ScriptTab, string> = {
  detection:      'Detection',
  implementation: 'Implementation',
  validation:     'Validation',
  rollback:       'Rollback',
};

export function ScriptsTab({ result, query, onScriptsLoaded }: ScriptsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scriptTab, setScriptTab] = useState<ScriptTab>('detection');
  const [retryIn, setRetryIn] = useState(0);           // countdown seconds
  const [attempt, setAttempt] = useState(0);           // retry attempt number
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scripts = result.scripts;

  // Clear countdown on unmount
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  function startCountdown(seconds: number, onDone: () => void) {
    setRetryIn(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRetryIn(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleGenerate(retryAttempt = 0) {
    setLoading(true);
    setError('');
    setRetryIn(0);
    setAttempt(retryAttempt);

    try {
      const s = await generateScripts(query);
      onScriptsLoaded(s);
      setScriptTab('detection');
      setAttempt(0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate scripts';
      const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.includes('429') || msg.includes('quota');
      const isOverloaded = msg.toLowerCase().includes('high demand') || msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('overloaded');

      if ((isRateLimit || isOverloaded) && retryAttempt < 3) {
        // Auto-retry: wait 20s for rate limit, 10s for overloaded
        const waitSeconds = isRateLimit ? (retryAttempt === 0 ? 20 : 40) : 10;
        setError('');
        setLoading(false);
        startCountdown(waitSeconds, () => handleGenerate(retryAttempt + 1));
      } else {
        setError(msg);
        setAttempt(0);
      }
    } finally {
      if (retryIn === 0) setLoading(false);
    }
  }

  // ── Not yet generated ──────────────────────────────────────────────────────
  if (!scripts && !loading && retryIn === 0) {
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
            Click below to generate Gemini-powered detection, implementation, validation and rollback PowerShell scripts specific to this recommendation.
          </div>
        </div>
        {error && (
          <div className="w-full max-w-sm">
            <WarnBox>{error} — click below to try again.</WarnBox>
          </div>
        )}
        <button onClick={() => handleGenerate(0)}
          className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white"
          style={{ background: 'var(--acc)' }}>
          <Wand2 size={14} /> Generate PowerShell Scripts
        </button>
        <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Takes ~5–10 seconds</div>
      </div>
    );
  }

  // ── Auto-retry countdown ───────────────────────────────────────────────────
  if (retryIn > 0 && !loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: 'rgba(217,134,28,0.1)', border: '2px solid var(--acc)', color: 'var(--acc)' }}>
            {retryIn}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Rate limit — auto-retrying in {retryIn}s
          </div>
          <div className="text-xs" style={{ color: 'var(--text3)' }}>
            Attempt {attempt + 1} of 3 · Gemini free tier allows 15 requests/minute
          </div>
        </div>
        <button onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); handleGenerate(attempt); }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
          <RefreshCw size={11} /> Retry now
        </button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Spinner size={36} />
        <div className="text-sm font-mono" style={{ color: 'var(--text2)' }}>
          {attempt > 0 ? `Retrying (attempt ${attempt + 1}/3)…` : 'Generating scripts…'}
        </div>
        <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>Building specific detection and remediation logic</div>
      </div>
    );
  }

  // ── Scripts loaded ─────────────────────────────────────────────────────────
  const raw = scripts as any;
  const scriptContent: Record<ScriptTab, string> = {
    detection:      raw?.detection      || '# Detection script not available',
    implementation: raw?.implementation || raw?.remediation || '# Implementation script not available',
    validation:     raw?.validation     || '# Validation script not available',
    rollback:       raw?.rollback?.powershell || raw?.rollback || '# Rollback script not available',
  };
  const rollback = typeof raw?.rollback === 'object' ? raw.rollback : null;

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--bg3)' }}>
        {(Object.keys(TAB_LABELS) as ScriptTab[]).map(t => (
          <button key={t} onClick={() => setScriptTab(t)}
            className="flex-1 text-xs py-1.5 rounded-md font-medium transition-colors"
            style={{
              background: scriptTab === t ? 'var(--acc)' : 'transparent',
              color: scriptTab === t ? 'white' : 'var(--text3)',
            }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {scriptTab === 'detection' && (
        <div>
          <InfoBox>Deploy as an Intune <strong>Detection script</strong> — exits 0 if compliant, 1 if remediation needed.</InfoBox>
          <CodeBlock code={scriptContent.detection} />
        </div>
      )}

      {scriptTab === 'implementation' && (
        <div>
          <InfoBox>Deploy as an Intune <strong>Remediation script</strong>, or run standalone to apply the setting.</InfoBox>
          <CodeBlock code={scriptContent.implementation} />
        </div>
      )}

      {scriptTab === 'validation' && (
        <div>
          <InfoBox>Run after implementation to confirm the setting was applied correctly.</InfoBox>
          <CodeBlock code={scriptContent.validation} />
        </div>
      )}

      {scriptTab === 'rollback' && (
        <div className="space-y-3">
          {rollback && (
            <>
              {rollback.intune && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Intune rollback</div><div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{rollback.intune}</div></div>}
              {rollback.gpo   && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>GPO rollback</div><div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{rollback.gpo}</div></div>}
              {rollback.entra && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Entra ID rollback</div><div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{rollback.entra}</div></div>}
            </>
          )}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>PowerShell rollback script</div>
            <CodeBlock code={scriptContent.rollback} />
          </div>
        </div>
      )}

      {/* Regenerate */}
      <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => handleGenerate(0)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>
          <Wand2 size={11} /> Regenerate scripts
        </button>
      </div>
    </div>
  );
}
