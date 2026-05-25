import { useState } from 'react';
import { CheckSquare, Square, Download, User, Building, Calendar, CheckCircle } from 'lucide-react';

interface CheckItem { id: string; label: string; }
interface CheckSection { id: string; title: string; color: string; items: CheckItem[]; }

const CHECKLIST1: CheckSection = {
  id: 'cl1', title: 'Checklist 1 — Baseline Checks', color: '#d9861c',
  items: [
    { id: 'c1_01', label: 'Is all devices enrolled in Intune and Defender?' },
    { id: 'c1_02', label: 'User risk CA policy' },
    { id: 'c1_03', label: 'Sign in Risk CA policy' },
    { id: 'c1_04', label: 'Enforce MFA for all users CA policy' },
    { id: 'c1_05', label: 'Enforce MFA for Admin accounts CA policy' },
    { id: 'c1_06', label: 'Block risky countries CA policy' },
    { id: 'c1_07', label: 'Block Legacy Authentication CA policy' },
    { id: 'c1_08', label: 'Does the customer have enough licences?' },
    { id: 'c1_09', label: 'Defender Advanced features set up correctly?' },
    { id: 'c1_10', label: 'Device Groups set up? (Servers and Endpoints separated)' },
    { id: 'c1_11', label: 'Web content filtering policy created?' },
    { id: 'c1_12', label: 'Anti-phishing policy configured' },
    { id: 'c1_13', label: 'Anti-malware policy configured' },
    { id: 'c1_14', label: 'Safe Attachments policy configured' },
    { id: 'c1_15', label: 'Safe Links policy configured' },
    { id: 'c1_16', label: 'Intune DFE setup completed?' },
    { id: 'c1_17', label: 'Connectors and tokens turned on?' },
    { id: 'c1_18', label: 'Device cleanup rules in place?' },
    { id: 'c1_19', label: 'EDR policy created' },
    { id: 'c1_20', label: 'AV policy created and configured' },
    { id: 'c1_21', label: 'ASR rules policy in Audit mode' },
    { id: 'c1_22', label: 'Automatic Enrolment configured?' },
  ],
};

const CHECKLIST2: CheckSection = {
  id: 'cl2', title: 'Checklist 2 — Post-Baseline Policies', color: '#8b5cf6',
  items: [
    { id: 'c2_01', label: 'Firewall policy created (customer-specific)' },
    { id: 'c2_02', label: 'Phishing Resistant MFA for Admins' },
    { id: 'c2_03', label: 'MFA for External users' },
    { id: 'c2_04', label: 'Compliance policies deployed' },
    { id: 'c2_05', label: 'CA policy to only allow access if device is compliant' },
    { id: 'c2_06', label: 'Separate admin and user accounts configured' },
    { id: 'c2_07', label: 'PIM (Privileged Identity Management) enabled' },
    { id: 'c2_08', label: 'Update rings and Update policies configured' },
  ],
};

import { BASELINE_PAGES } from '../data/baselinePages';

function Checklist({ section, checked, onToggle }: { section: CheckSection; checked: Set<string>; onToggle: (id: string) => void }) {
  const done = section.items.filter(i => checked.has(i.id)).length;
  const pct = Math.round((done / section.items.length) * 100);
  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
      <div className="px-5 py-4" style={{ background: `${section.color}10`, borderBottom: `2px solid ${section.color}` }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} style={{ color: section.color }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{section.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{done}/{section.items.length}</span>
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: section.color }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: section.color }}>{pct}%</span>
          </div>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {section.items.map((item, idx) => {
          const isDone = checked.has(item.id);
          return (
            <button key={item.id} onClick={() => onToggle(item.id)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
              style={{ background: isDone ? `${section.color}08` : 'transparent' }}>
              <div className="flex-shrink-0" style={{ color: isDone ? section.color : 'var(--text3)' }}>
                {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <span className="text-xs flex-1 leading-relaxed" style={{ color: isDone ? 'var(--text)' : 'var(--text2)' }}>
                <span className="font-mono mr-2 text-[10px]" style={{ color: 'var(--text3)' }}>{String(idx + 1).padStart(2, '0')}.</span>
                {item.label}
              </span>
              {isDone && <CheckCircle size={14} style={{ color: section.color, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BaselinesPage() {
  const [tab, setTab] = useState<'guide' | 'checklist'>('guide');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [consultantName, setConsultantName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const totalItems = CHECKLIST1.items.length + CHECKLIST2.items.length;
  const totalDone = checked.size;
  const totalPct = Math.round((totalDone / totalItems) * 100);

  function toggleItem(id: string) {
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function checkAll(s: CheckSection) { setChecked(prev => { const n = new Set(prev); s.items.forEach(i => n.add(i.id)); return n; }); }
  function uncheckAll(s: CheckSection) { setChecked(prev => { const n = new Set(prev); s.items.forEach(i => n.delete(i.id)); return n; }); }

  function formatDate(d: string) {
    if (!d) return '';
    const p = d.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  function handleExportPDF() {
    const row = (item: CheckItem, idx: number, done: boolean) =>
      `<tr style="background:${done ? '#f0fdf4' : '#fff7f7'}">
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:10pt">${idx + 1}. ${item.label}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:10pt;text-align:center;font-weight:bold;color:${done ? '#166534' : '#991b1b'}">${done ? '✓ DONE' : '✗ PENDING'}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;width:100px"></td>
      </tr>`;

    const c1Done = CHECKLIST1.items.filter(i => checked.has(i.id)).length;
    const c2Done = CHECKLIST2.items.filter(i => checked.has(i.id)).length;
    const pending = [...CHECKLIST1.items, ...CHECKLIST2.items].filter(i => !checked.has(i.id));

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>BUI MXDR Baseline Assessment</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:11pt; color:#000; padding:28px; }
  h1 { font-size:20pt; font-weight:bold; border-bottom:3px solid #d9861c; padding-bottom:8px; margin-bottom:16px; }
  .meta { width:100%; border-collapse:collapse; margin-bottom:20px; }
  .meta td { padding:5px 10px; border:1px solid #ccc; font-size:10pt; }
  .meta .lbl { font-weight:bold; background:#f0f0f0; width:130px; }
  .sh { background:#1A1C24; color:white; padding:8px 12px; margin:20px 0 6px; font-size:12pt; font-weight:bold; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  table.cl { width:100%; border-collapse:collapse; margin-bottom:12px; }
  table.cl th { background:#e0e0e0; padding:7px 10px; text-align:left; border:1px solid #999; font-size:10pt; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .summary { margin-top:24px; padding:12px; background:#f5f5f5; border:1px solid #ccc; font-size:10pt; line-height:1.8; }
  .sig-row { display:flex; gap:60px; margin-top:32px; font-size:10pt; }
  .sig-field { border-bottom:1px solid #000; width:220px; padding-bottom:2px; margin-top:32px; }
  .footer { margin-top:20px; font-size:9pt; color:#777; text-align:center; }
  .print-btn { display:block; margin:24px auto 0; padding:10px 28px; background:#d9861c; color:white; border:none; border-radius:8px; font-size:12pt; cursor:pointer; font-weight:bold; }
  @media print { .print-btn { display:none!important; } -webkit-print-color-adjust:exact; print-color-adjust:exact; }
</style></head><body>
<h1>BUI MXDR — Baseline Configuration Assessment</h1>
<table class="meta">
  <tr><td class="lbl">Consultant</td><td>${consultantName || '—'}</td><td class="lbl">Customer</td><td>${customerName || '—'}</td></tr>
  <tr><td class="lbl">Date</td><td>${formatDate(date)}</td><td class="lbl">Overall Score</td><td>${totalDone}/${totalItems} (${totalPct}%)</td></tr>
</table>

<div class="sh">CHECKLIST 1 — BASELINE CHECKS (${c1Done}/${CHECKLIST1.items.length} completed)</div>
<table class="cl">
  <thead><tr><th style="width:65%">Item</th><th style="width:15%">Status</th><th style="width:20%">Notes</th></tr></thead>
  <tbody>${CHECKLIST1.items.map((item, idx) => row(item, idx, checked.has(item.id))).join('')}</tbody>
</table>

<div class="sh">CHECKLIST 2 — POST-BASELINE POLICIES (${c2Done}/${CHECKLIST2.items.length} completed)</div>
<table class="cl">
  <thead><tr><th style="width:65%">Item</th><th style="width:15%">Status</th><th style="width:20%">Notes</th></tr></thead>
  <tbody>${CHECKLIST2.items.map((item, idx) => row(item, idx, checked.has(item.id))).join('')}</tbody>
</table>

${notes ? `<div class="sh">NOTES</div><div style="padding:10px;border:1px solid #ccc;font-size:10pt;white-space:pre-wrap">${notes}</div>` : ''}

<div class="summary">
  <strong>Assessment Summary</strong><br>
  Baseline checks completed: ${c1Done}/${CHECKLIST1.items.length}<br>
  Post-baseline checks completed: ${c2Done}/${CHECKLIST2.items.length}<br>
  Overall completion: ${totalPct}%<br>
  ${pending.length > 0 ? `Pending items: ${pending.map(i => i.label).join(', ')}` : '<span style="color:#166534;font-weight:bold">✓ All items completed</span>'}
</div>

<div class="sig-row">
  <div><div class="sig-field"></div><small>Consultant: ${consultantName || '___________________'}</small></div>
  <div><div class="sig-field"></div><small>Date: ${formatDate(date)}</small></div>
</div>

<div class="footer">Sensitivity: Business — General &nbsp;|&nbsp; BUI Security &nbsp;|&nbsp; Generated by MXDR Secure Score Ops</div>

<button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('guide')}
          className="text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
          style={tab === 'guide' ? { background: 'var(--acc)', color: 'white' } : { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
          📋 Baseline Guide
        </button>
        <button onClick={() => setTab('checklist')}
          className="text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
          style={tab === 'checklist' ? { background: 'var(--acc)', color: 'white' } : { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
          ✅ Checklist &amp; Export
          {totalDone > 0 && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.25)' }}>
              {totalDone}/{totalItems}
            </span>
          )}
        </button>
      </div>

      {/* ── GUIDE TAB ── */}
      {tab === 'guide' && (
        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest px-1 mb-2" style={{ color: 'var(--text3)' }}>
            MXDR Baseline Configuration Guide · 22 pages · Click any page to view full size
          </div>
          {BASELINE_PAGES.map((src, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
              <div className="px-3 py-1.5 flex items-center justify-between"
                style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>Page {i + 1} of 22</span>
                <a href={src} target="_blank" rel="noopener noreferrer"
                  className="text-[10px]" style={{ color: 'var(--acc)' }}>Open full size ↗</a>
              </div>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <img src={src} alt={`Page ${i + 1}`} className="w-full block" loading="lazy" />
              </a>
            </div>
          ))}
          <div className="text-center py-4">
            <button onClick={() => setTab('checklist')}
              className="font-semibold text-sm px-6 py-3 rounded-xl text-white"
              style={{ background: 'var(--acc)' }}>
              ✅ Open Checklist &amp; Complete Assessment
            </button>
          </div>
        </div>
      )}

      {/* ── CHECKLIST TAB ── */}
      {tab === 'checklist' && (
        <div>
          {/* Progress */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--text)' }}>Overall Assessment Progress</div>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>{totalDone} of {totalItems} items completed</div>
              </div>
              <div className="text-2xl font-bold" style={{ color: totalPct === 100 ? '#10b981' : 'var(--acc)' }}>{totalPct}%</div>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${totalPct}%`, background: totalPct === 100 ? '#10b981' : 'var(--acc)' }} />
            </div>
            {totalPct === 100 && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold" style={{ color: '#10b981' }}>
                <CheckCircle size={14} /> All items completed — ready to export!
              </div>
            )}
          </div>

          {/* Form */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>
              Assessment Details — Required for PDF export
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Consultant Name', icon: <User size={11}/>, value: consultantName, setter: setConsultantName, placeholder: 'Enter your name' },
                { label: 'Customer Name', icon: <Building size={11}/>, value: customerName, setter: setCustomerName, placeholder: 'Enter customer name' },
              ].map(({ label, icon, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                    {icon} {label}
                  </label>
                  <input type="text" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onFocus={e => (e.target.style.borderColor = '#d9861c')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
              ))}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                  <Calendar size={11}/> Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={e => (e.target.style.borderColor = '#d9861c')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold mb-1.5 uppercase tracking-wide block" style={{ color: 'var(--text3)' }}>
                Additional Notes (optional)
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Additional observations or notes..."
                rows={3} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans resize-none"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => (e.target.style.borderColor = '#d9861c')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>

          {/* Checklists */}
          {[CHECKLIST1, CHECKLIST2].map(section => {
            const sectionDone = section.items.filter(i => checked.has(i.id)).length;
            const allDone = sectionDone === section.items.length;
            return (
              <div key={section.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                    {sectionDone}/{section.items.length} items
                  </span>
                  <div className="flex gap-2">
                    {!allDone && (
                      <button onClick={() => checkAll(section)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                        style={{ background: `${section.color}15`, color: section.color, border: `1px solid ${section.color}30` }}>
                        Check all
                      </button>
                    )}
                    {sectionDone > 0 && (
                      <button onClick={() => uncheckAll(section)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                        style={{ background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <Checklist section={section} checked={checked} onToggle={toggleItem} />
              </div>
            );
          })}

          {/* Export */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-5 rounded-2xl mt-2"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Export as PDF</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                {!consultantName || !customerName
                  ? 'Enter Consultant Name and Customer Name above first'
                  : `Ready — ${totalDone}/${totalItems} items completed`}
              </div>
            </div>
            <button onClick={handleExportPDF}
              disabled={!consultantName || !customerName}
              className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--acc)' }}>
              <Download size={15} /> Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
