import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    High:   'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    Low:    'bg-red-500/15 text-red-500 border-red-500/30',
  };
  const dot = level === 'High' ? '●' : level === 'Medium' ? '◐' : '○';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${styles[level] ?? styles.Low}`}>
      {dot} {level}
    </span>
  );
}

export function ImpactBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Low:    'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    High:   'bg-red-500/15 text-red-500 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${styles[level] ?? styles.Low}`}>
      Impact: {level}
    </span>
  );
}

export function AccPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
      style={{ background: 'rgba(234,88,12,0.15)', color: 'var(--acc2)', border: '1px solid rgba(234,88,12,0.3)' }}>
      {children}
    </span>
  );
}
/** @deprecated use AccPill */
export const BluePill = AccPill;

export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <button onClick={copy}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${copied ? 'text-emerald-500' : ''} ${className}`}
      style={copied ? {} : { color: 'var(--text2)' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CodeBlock({ code, lang = 'powershell' }: { code: string; lang?: string }) {
  return (
    <div className="rounded-lg overflow-hidden my-2" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono text-xs" style={{ color: 'var(--acc2)' }}>{lang}</span>
        <CopyButton text={code} />
      </div>
      <div className="p-3 overflow-x-auto" style={{ background: 'var(--code-bg)' }}>
        <pre className="font-mono text-xs leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: highlightPS(code) }} />
      </div>
    </div>
  );
}

function highlightPS(code: string): string {
  const e = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return e
    .replace(/(#[^\n]*)/g,'<span style="color:#6b7280">$1</span>')
    .replace(/\b(If|ForEach|While|Do|Try|Catch|Finally|Return|Function|Param|Switch|Exit|Throw|Begin|Process|End)\b/g,'<span style="color:#c792ea">$1</span>')
    .replace(/\b(Get-ItemProperty|Set-ItemProperty|New-Item|New-ItemProperty|Remove-Item|Remove-ItemProperty|Test-Path|Get-Content|Set-Content|Get-Service|Set-Service|Write-Host|Write-Output|Write-Error|Write-Warning|Invoke-Command|Set-MpPreference|Get-MpComputerStatus|gpupdate|secedit|Restart-Service|Get-WinEvent|Get-AppxPackage|Remove-AppxPackage|Get-Package|Uninstall-Package)\b/g,'<span style="color:#82aaff">$1</span>')
    .replace(/(&quot;[^&quot;]*&quot;)/g,'<span style="color:#c3e88d">$1</span>')
    .replace(/\b(\d+)\b/g,'<span style="color:#f78c6c">$1</span>')
    .replace(/(-[A-Za-z]+)/g,'<span style="color:#ffcb6b">$1</span>');
}

export function StepList({ steps }: { steps: string[] }) {
  return (
    <ul className="space-y-2 mt-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 items-start">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.3)', color: 'var(--acc2)' }}>
            {i + 1}
          </div>
          <span className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}
            dangerouslySetInnerHTML={{ __html: formatStep(step) }} />
        </li>
      ))}
    </ul>
  );
}

function formatStep(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/`([^`]+)`/g,'<code style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:11px;color:var(--acc2)">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong style="color:var(--text);font-weight:600">$1</strong>');
}

export function OmaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2.5 my-1.5" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
      {label && <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{label}</div>}
      <div className="font-mono text-xs break-all" style={{ color: 'var(--acc2)' }}>{value}</div>
    </div>
  );
}

export function KVTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="mt-2" style={{ borderTop: '1px solid var(--border)' }}>
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{k}</span>
          <span className="text-xs break-words" style={{ color: 'var(--text)' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg px-3 py-2.5 mb-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-xs leading-relaxed text-red-400">{children}</p>
    </div>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg px-3 py-2.5 mb-2" style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)' }}>
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--acc2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--acc3)' }}>{children}</p>
    </div>
  );
}

export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="rounded-full border-2 animate-spin"
      style={{ width: size, height: size, borderColor: 'var(--bg4)', borderTopColor: 'var(--acc)' }} />
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}
