import { useState } from 'react';
import { Mail, Copy, Check, Download } from 'lucide-react';
import type { GuideResult } from '../types';
import { Card } from '../components/ui';

interface EmailTemplatePageProps {
  result: { query: string; result: GuideResult } | null;
}

type Tone = 'professional' | 'technical' | 'executive';
type Platform = 'intune' | 'gpo' | 'entra' | 'all';

export function EmailTemplatePage({ result }: EmailTemplatePageProps) {
  const [tone, setTone] = useState<Tone>('professional');
  const [platform, setPlatform] = useState<Platform>('all');
  const [senderName, setSenderName] = useState('');
  const [senderTitle, setSenderTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
        <Mail size={40} className="mx-auto mb-3 opacity-30" />
        <div className="text-sm">Generate a recommendation first, then come here to create your email template.</div>
      </div>
    );
  }

  const email = buildEmail(result!.query, result!.result, tone, platform, senderName, senderTitle, clientName);

  function copyEmail() {
    navigator.clipboard.writeText(email).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function downloadEmail() {
    const blob = new Blob([email], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `email-${result!.query.replace(/\s+/g,'-').toLowerCase().replace(/[^a-z0-9-]/g,'')}.txt`;
    a.click();
  }

  return (
    <div>
      {/* Options */}
      <Card className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={15} style={{ color: 'var(--acc)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Email Template Options</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>Your name</label>
            <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>Your title</label>
            <input type="text" value={senderTitle} onChange={e => setSenderTitle(e.target.value)}
              placeholder="e.g. Security Engineer"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>Client / recipient name</label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="e.g. IT Team / Jane"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
        </div>

        <div className="flex gap-6 flex-wrap">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>Tone</label>
            <div className="flex gap-2">
              {(['professional','technical','executive'] as Tone[]).map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors"
                  style={{
                    background: tone === t ? 'var(--acc)' : 'var(--bg3)',
                    color: tone === t ? 'white' : 'var(--text2)',
                    border: '1px solid var(--border)',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>Include platform</label>
            <div className="flex gap-2">
              {(['all','intune','gpo','entra'] as Platform[]).map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold uppercase transition-colors"
                  style={{
                    background: platform === p ? 'var(--acc)' : 'var(--bg3)',
                    color: platform === p ? 'white' : 'var(--text2)',
                    border: '1px solid var(--border)',
                  }}>
                  {p === 'all' ? 'All' : p === 'entra' ? 'Entra ID' : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Email preview</span>
          <div className="flex gap-2">
            <button onClick={downloadEmail}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
              <Download size={12} /> Download
            </button>
            <button onClick={copyEmail}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors text-white"
              style={{ background: copied ? 'var(--success, #059669)' : 'var(--acc)' }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy email'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'var(--text2)' }}>{email}</pre>
        </div>
      </Card>
    </div>
  );
}

function buildEmail(query: string, r: GuideResult, tone: Tone, platform: Platform, sender: string, title: string, client: string): string {
  const to = client || '[Client Name]';
  const from = sender || '[Your Name]';
  const fromTitle = title || '[Your Title]';
  const date = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const greet = tone === 'executive'
    ? `I hope this message finds you well.`
    : tone === 'technical'
    ? `Please find below the technical implementation details for the following security recommendation.`
    : `I hope you're doing well. Please find below the implementation steps for a Microsoft Defender Secure Score recommendation that we'd like you to action.`;

  const intro = tone === 'executive'
    ? `As part of our ongoing security improvement programme, we are requesting that the following Microsoft Defender Secure Score recommendation be implemented across your environment. This change will improve your organisation's security posture and reduce exposure to potential threats.`
    : `The following recommendation has been identified as part of your Microsoft Defender Secure Score improvement plan. Implementing this change will strengthen your security posture.`;

  const summary = `RECOMMENDATION: ${query}\n\nSECURITY IMPACT\n${'─'.repeat(40)}\n${r.summary}\n\nUser Impact: ${r.user_impact} | Confidence: ${r.confidence} | Category: ${r.category}`;

  const sections: string[] = [];

  if ((platform === 'all' || platform === 'intune')) {
    sections.push(`INTUNE IMPLEMENTATION\n${'─'.repeat(40)}\nMethod: ${r.intune.method}${r.intune.settings_path ? `\nSettings Catalog Path: ${r.intune.settings_path}` : ''}${r.intune.oma_uri ? `\nOMA-URI: ${r.intune.oma_uri}` : ''}\n\nSteps:\n${r.intune.steps.map((s,i) => `${i+1}. ${s.replace(/`([^`]+)`/g,'[$1]').replace(/\*\*([^*]+)\*\*/g,'$1')}`).join('\n')}`);
  }

  if (platform === 'all' || platform === 'gpo') {
    sections.push(`GROUP POLICY (GPO) IMPLEMENTATION\n${'─'.repeat(40)}\nPolicy Path: ${r.gpo.policy_path}\nSetting: ${r.gpo.setting_name} → ${r.gpo.value}${r.gpo.registry_key ? `\nRegistry Key: ${r.gpo.registry_key}` : ''}\n\nSteps:\n${r.gpo.steps.map((s,i) => `${i+1}. ${s.replace(/`([^`]+)`/g,'[$1]').replace(/\*\*([^*]+)\*\*/g,'$1')}`).join('\n')}`);
  }

  if ((platform === 'all' || platform === 'entra') && r.entra?.applicable) {
    sections.push(`ENTRA ID IMPLEMENTATION\n${'─'.repeat(40)}\nPolicy Type: ${r.entra.policy_type || 'N/A'}${r.entra.portal_path ? `\nPortal Path: ${r.entra.portal_path}` : ''}\n\nSteps:\n${r.entra.steps.map((s,i) => `${i+1}. ${s.replace(/`([^`]+)`/g,'[$1]').replace(/\*\*([^*]+)\*\*/g,'$1')}`).join('\n')}`);
  }

  const validation = `VALIDATION STEPS\n${'─'.repeat(40)}\nAfter implementation, please verify the change using these steps:\n${r.validation_steps.map((s,i) => `${i+1}. ${s.replace(/`([^`]+)`/g,'[$1]').replace(/\*\*([^*]+)\*\*/g,'$1')}`).join('\n')}`;

  const risks = r.risks.length > 0
    ? `RISKS & CONSIDERATIONS\n${'─'.repeat(40)}\n${r.risks.map(x => `• ${x}`).join('\n')}\n\nPlease test this change in a pilot group before broad deployment.`
    : '';

  const rollback = `ROLLBACK PROCEDURE\n${'─'.repeat(40)}\nIf issues arise after implementation:\n• Intune: ${r.rollback.intune}\n• GPO: ${r.rollback.gpo}${r.rollback.entra ? `\n• Entra ID: ${r.rollback.entra}` : ''}`;

  const refs = r.references.length > 0
    ? `REFERENCES\n${'─'.repeat(40)}\n${r.references.map(x => `• ${x.title}: ${x.url}`).join('\n')}`
    : '';

  const closing = tone === 'executive'
    ? `Please do not hesitate to contact us should you require any clarification or assistance with the above.\n\nKind regards,`
    : tone === 'technical'
    ? `Please reach out if you have any questions about the technical implementation steps above.\n\nRegards,`
    : `Please let us know once the above has been implemented, or if you need any assistance. We're happy to jump on a call to walk through the steps.\n\nKind regards,`;

  const body = [
    `Subject: Security Recommendation — ${query}`,
    `Date: ${date}`,
    ``,
    `Hi ${to},`,
    ``,
    greet,
    ``,
    intro,
    ``,
    `${'═'.repeat(60)}`,
    summary,
    `${'═'.repeat(60)}`,
    ``,
    ...sections.flatMap(s => [s, '']),
    validation,
    ``,
    ...(risks ? [risks, ''] : []),
    rollback,
    ``,
    ...(refs ? [refs, ''] : []),
    closing,
    ``,
    from,
    fromTitle,
  ].join('\n');

  return body;
}
