import React, { useState } from 'react';
import {
  Cloud, Building2, Terminal, CheckCircle, RotateCcw,
  AlertTriangle, Link2, ClipboardList, Download, Star, ShieldCheck, Mail,
} from 'lucide-react';
import type { GuideResult, ScriptsResult } from '../types';
import {
  StepList, CodeBlock, OmaBlock, KVTable,
  WarnBox, InfoBox, ConfidenceBadge, ImpactBadge, AccPill, CopyButton, Card,
} from './ui';
import { ScriptsTab } from './ScriptsTab';

interface ResultsProps {
  query: string;
  result: GuideResult;
  isFav: boolean;
  onFav: () => void;
  onEmailTemplate: () => void;
  onScriptsLoaded: (scripts: ScriptsResult) => void;
}

type ImplTab = 'intune' | 'gpo' | 'entra' | 'scripts';
type DetailTab = 'validation' | 'rollback' | 'risks' | 'refs';

const IMPL_TABS = [
  { id: 'intune'   as ImplTab, label: 'Intune',    icon: <Cloud size={13} /> },
  { id: 'gpo'     as ImplTab, label: 'GPO',        icon: <Building2 size={13} /> },
  { id: 'entra'   as ImplTab, label: 'Entra ID',   icon: <ShieldCheck size={13} /> },
  { id: 'scripts' as ImplTab, label: 'Scripts',    icon: <Terminal size={13} /> },
];

const DETAIL_TABS = [
  { id: 'validation' as DetailTab, label: 'Validation', icon: <CheckCircle size={12} /> },
  { id: 'rollback'   as DetailTab, label: 'Rollback',   icon: <RotateCcw size={12} /> },
  { id: 'risks'      as DetailTab, label: 'Risks',      icon: <AlertTriangle size={12} /> },
  { id: 'refs'       as DetailTab, label: 'References', icon: <Link2 size={12} /> },
];

function TabBar<T extends string>({ tabs, active, onSelect, badge }: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onSelect: (id: T) => void;
  badge?: Partial<Record<T, string>>;
}) {
  return (
    <div className="flex" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          className="flex items-center gap-1.5 flex-1 justify-center py-2.5 text-xs font-semibold transition-colors"
          style={{
            borderBottom: active === t.id ? '2px solid var(--acc)' : '2px solid transparent',
            color: active === t.id ? 'var(--acc2)' : 'var(--text3)',
            background: active === t.id ? 'rgba(234,88,12,0.05)' : 'transparent',
          }}>
          {t.icon}{t.label}
          {badge?.[t.id] && (
            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-mono"
              style={{ background: 'rgba(234,88,12,0.2)', color: 'var(--acc2)' }}>
              {badge[t.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Results({ query, result, isFav, onFav, onEmailTemplate, onScriptsLoaded }: ResultsProps) {
  const [implTab, setImplTab] = useState<ImplTab>('intune');
  const [detailTab, setDetailTab] = useState<DetailTab>('validation');

  const exportMD = () => {
    const md = buildMarkdown(query, result);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `secure-score-${query.replace(/\s+/g,'-').toLowerCase().replace(/[^a-z0-9-]/g,'')}.md`;
    a.click();
  };

  return (
    <div style={{ animation: 'slideUp 0.25s ease-out' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Current recommendation</div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{query}</h2>
          <div className="flex gap-2 mt-2 flex-wrap">
            <ConfidenceBadge level={result.confidence} />
            <ImpactBadge level={result.user_impact} />
            {(result.platforms || []).map(p => (
              <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{ background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{p}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onFav}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={isFav
              ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }
              : { border: '1px solid var(--border)', color: 'var(--text2)' }}>
            <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
            {isFav ? 'Saved' : 'Save'}
          </button>
          <button onClick={onEmailTemplate}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors text-white"
            style={{ background: 'var(--acc)' }}>
            <Mail size={12} /> Email template
          </button>
          <button onClick={exportMD}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
            <Download size={12} /> Export MD
          </button>
          <CopyButton text={buildMarkdown(query, result)} className="px-3 py-1.5 rounded-lg border" />
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={14} style={{ color: 'var(--acc)' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>Summary</span>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text2)' }}>{result.summary}</p>
        <KVTable rows={[
          ['Category',    result.category],
          ['Affected OS', result.affected_os.join(', ')],
          ['User impact', <ImpactBadge level={result.user_impact} />],
          ['Confidence',  <ConfidenceBadge level={result.confidence} />],
        ]} />
      </Card>

      {/* Implementation tabs */}
      <Card className="mb-4 overflow-hidden">
        <TabBar
          tabs={IMPL_TABS}
          active={implTab}
          onSelect={setImplTab}
          badge={{ scripts: result.scripts ? '✓' : undefined }}
        />
        <div className="p-4">
          {implTab === 'intune'  && <IntuneTab result={result} />}
          {implTab === 'gpo'    && <GPOTab result={result} />}
          {implTab === 'entra'  && <EntraTab result={result} />}
          {implTab === 'scripts'&& <ScriptsTab result={result} query={query} onScriptsLoaded={onScriptsLoaded} />}
        </div>
      </Card>

      {/* Detail tabs */}
      <Card className="overflow-hidden">
        <TabBar tabs={DETAIL_TABS} active={detailTab} onSelect={setDetailTab} />
        <div className="p-4">
          {detailTab === 'validation' && <StepList steps={result.validation_steps} />}
          {detailTab === 'rollback'   && <RollbackTab result={result} />}
          {detailTab === 'risks'      && <RisksTab result={result} />}
          {detailTab === 'refs'       && <RefsTab result={result} />}
        </div>
      </Card>
    </div>
  );
}

function IntuneTab({ result }: { result: GuideResult }) {
  const { intune } = result;
  return (
    <div className="space-y-3">
      <div><AccPill>Method: {intune.method}</AccPill></div>
      {intune.settings_path && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Settings catalog path</div><OmaBlock label="" value={intune.settings_path} /></div>}
      {intune.oma_uri && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>OMA-URI</div><OmaBlock label="Path" value={intune.oma_uri} />{intune.data_type && <OmaBlock label="Data type" value={intune.data_type} />}<OmaBlock label="Value" value={intune.value} /></div>}
      <StepList steps={intune.steps} />
    </div>
  );
}

function GPOTab({ result }: { result: GuideResult }) {
  const { gpo } = result;
  return (
    <div className="space-y-3">
      {gpo.policy_path && <OmaBlock label="Policy path" value={gpo.policy_path} />}
      {gpo.setting_name && <KVTable rows={[['Setting name', gpo.setting_name], ['Value', gpo.value], ...(gpo.admx ? [['ADMX', gpo.admx] as [string, React.ReactNode]] : [])]} />}
      {gpo.registry_key && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>Registry mapping</div><OmaBlock label="Key" value={gpo.registry_key} />{gpo.registry_value && <OmaBlock label="Value name" value={gpo.registry_value} />}{gpo.registry_data && <OmaBlock label="Data / type" value={gpo.registry_data} />}</div>}
      <StepList steps={gpo.steps} />
    </div>
  );
}

function EntraTab({ result }: { result: GuideResult }) {
  const { entra } = result;
  if (!entra?.applicable) return (
    <div className="text-center py-8">
      <ShieldCheck size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text3)' }} />
      <div className="text-sm font-medium" style={{ color: 'var(--text3)' }}>Not applicable for Entra ID</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>This is an endpoint/device-based recommendation.</div>
    </div>
  );
  return (
    <div className="space-y-4">
      {entra.policy_type && <div><AccPill>Policy type: {entra.policy_type}</AccPill></div>}
      {entra.portal_path && <OmaBlock label="Entra admin center path" value={entra.portal_path} />}
      {entra.conditional_access && entra.ca_policy_name && (
        <div className="flex gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <ShieldCheck size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div><div className="text-xs font-semibold text-violet-300 mb-0.5">Conditional Access Policy</div><div className="text-xs text-violet-400 font-mono">{entra.ca_policy_name}</div></div>
        </div>
      )}
      {entra.settings?.length > 0 && <KVTable rows={entra.settings.map(s => [s.name, s.value] as [string, React.ReactNode])} />}
      {entra.steps.length > 0 && <StepList steps={entra.steps} />}
      {entra.graph_api && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Graph API</div><CodeBlock code={entra.graph_api} lang="http" /></div>}
      {entra.powershell && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Graph PowerShell</div><CodeBlock code={entra.powershell} /></div>}
      {entra.notes && <InfoBox>{entra.notes}</InfoBox>}
    </div>
  );
}

function RollbackTab({ result }: { result: GuideResult }) {
  if (result.scripts?.rollback) {
    const rb = result.scripts.rollback;
    return (
      <div className="space-y-3">
        {[['Intune', rb.intune], ['GPO', rb.gpo], ...(rb.entra ? [['Entra ID', rb.entra]] : [])].map(([label, val]) => (
          <div key={label}><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{label}</div><div className="text-sm rounded-lg p-2.5 leading-relaxed" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{val}</div></div>
        ))}
        {rb.powershell && <div><div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Rollback script</div><CodeBlock code={rb.powershell} /></div>}
      </div>
    );
  }
  return (
    <div className="text-center py-6" style={{ color: 'var(--text3)' }}>
      <div className="text-sm mb-1">Rollback scripts available after generating scripts</div>
      <div className="text-xs">Go to the <strong style={{ color: 'var(--text2)' }}>Scripts</strong> tab and click Generate PowerShell Scripts</div>
    </div>
  );
}

function RisksTab({ result }: { result: GuideResult }) {
  return (
    <div className="space-y-2">
      {(result.user_impact === 'High' || result.user_impact === 'Medium') && <WarnBox><strong>User impact: {result.user_impact}</strong> — Test in a pilot group before broad deployment.</WarnBox>}
      {result.risks.map((r, i) => <WarnBox key={i}>{r}</WarnBox>)}
      <InfoBox>Always validate settings against official Microsoft Learn documentation before production deployment.</InfoBox>
    </div>
  );
}

function RefsTab({ result }: { result: GuideResult }) {
  return (
    <div className="space-y-2">
      {result.references.map((ref, i) => (
        <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border)' }}>
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--acc)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{ref.title}</div>
            <div className="text-[10px] font-mono truncate" style={{ color: 'var(--text3)' }}>{ref.url}</div>
          </div>
          <AccPill>{ref.type}</AccPill>
        </a>
      ))}
    </div>
  );
}

function buildMarkdown(query: string, r: GuideResult): string {
  const scriptSection = r.scripts ? [
    `## PowerShell — Detection`, '```powershell', r.scripts.detection, '```', ``,
    `## PowerShell — Implementation`, '```powershell', r.scripts.implementation, '```', ``,
    `## PowerShell — Validation`, '```powershell', r.scripts.validation, '```', ``,
  ] : ['## PowerShell Scripts', 'Not yet generated — click the Scripts tab to generate.', ``];

  return [
    `# Secure Score: ${query}`, ``,
    `**Confidence:** ${r.confidence} | **User Impact:** ${r.user_impact} | **Category:** ${r.category}`, ``,
    `## Summary`, r.summary, ``,
    `## Intune`, `**Method:** ${r.intune.method}`,
    r.intune.settings_path ? `**Path:** \`${r.intune.settings_path}\`` : '',
    r.intune.oma_uri ? `**OMA-URI:** \`${r.intune.oma_uri}\`` : '', ``,
    ...r.intune.steps.map((s, i) => `${i + 1}. ${s}`), ``,
    `## Group Policy`,
    r.gpo.policy_path ? `**Path:** \`${r.gpo.policy_path}\`` : '',
    r.gpo.setting_name ? `**Setting:** ${r.gpo.setting_name} = ${r.gpo.value}` : '', ``,
    ...r.gpo.steps.map((s, i) => `${i + 1}. ${s}`), ``,
    `## Entra ID`, r.entra?.applicable ? [...(r.entra.steps || []).map((s, i) => `${i + 1}. ${s}`)].join('\n') : 'Not applicable.', ``,
    ...scriptSection,
    `## Validation`, ...r.validation_steps.map((s, i) => `${i + 1}. ${s}`), ``,
    `## Risks`, ...r.risks.map(x => `- ⚠ ${x}`), ``,
    `## References`, ...r.references.map(x => `- [${x.title}](${x.url})`),
  ].filter(Boolean).join('\n');
}
