import { useState, useRef } from 'react';
import { CheckSquare, Square, Download, User, Building, Calendar, Shield, Monitor, Cloud, CheckCircle, AlertTriangle } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface CheckItem {
  id: string;
  label: string;
}
interface CheckSection {
  id: string;
  title: string;
  color: string;
  items: CheckItem[];
}

// ── Document content ───────────────────────────────────────────────────────
const ENTRA_ITEMS = [
  'User risk CA Policy',
  'Sign in risk CA policy',
  'Enforce MFA for all users CA policy',
  'Enforce MFA for Admin accounts',
  'Block risky countries CA policy',
  'Block Legacy Authentication CA policy',
  'Ensure customer has correct and enough licences',
];

const ENTRA_NOTE = 'On all Conditional Access policies, ensure everyone is included and only specific users are excluded (i.e. break-glass accounts and service accounts).';

const DEFENDER_ITEMS = [
  'Settings – Endpoints – Advanced features',
  'Settings – Endpoints – Device groups (always split Endpoints and Servers for better reporting)',
  'Make sure Remediation is set to "Full Remediation"',
  'Web content filtering policy in place',
  'DFO policies set up correctly: Anti-Phishing',
  'DFO policies set up correctly: Anti-Malware',
  'DFO policies set up correctly: Safe Attachments',
  'DFO policies set up correctly: Safe Links',
];

const INTUNE_ITEMS = [
  'DFE initial setup completed',
  'Device cleanup rules are in place',
  'EDR policy in place for Defender auto-enrollment',
  'AV policy in place and correctly configured',
  'ASR rules policy created with all rules in "AUDIT" mode',
  'Ensure Automatic Enrollment is correctly set up',
  'Connectors and tokens are turned on',
];

const POST_BASELINE_ITEMS = [
  'Firewall policy created (customer-specific)',
  'Phishing Resistant MFA for Admins',
  'MFA for External users',
  'Compliance policies deployed',
  'CA policy to only allow access if device is compliant',
  'Separate admin and user accounts configured',
  'PIM (Privileged Identity Management) enabled',
  'Update rings and Update policies configured',
];

const CHECKLIST1: CheckSection = {
  id: 'cl1',
  title: 'Checklist 1 — Baseline Checks',
  color: '#d9861c',
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
    { id: 'c1_10', label: 'Device Groups set up? (Servers and Endpoints)' },
    { id: 'c1_11', label: 'Web content filtering policy created?' },
    { id: 'c1_12', label: 'Anti-phishing policy' },
    { id: 'c1_13', label: 'Anti-malware policy' },
    { id: 'c1_14', label: 'Safe Attachments policy' },
    { id: 'c1_15', label: 'Safe Links policy' },
    { id: 'c1_16', label: 'Intune DFE setup?' },
    { id: 'c1_17', label: 'Connectors and tokens turned on?' },
    { id: 'c1_18', label: 'Device cleanup rules in place?' },
    { id: 'c1_19', label: 'EDR policy' },
    { id: 'c1_20', label: 'AV policy' },
    { id: 'c1_21', label: 'ASR policy' },
    { id: 'c1_22', label: 'Automatic Enrolment configured?' },
  ],
};

const CHECKLIST2: CheckSection = {
  id: 'cl2',
  title: 'Checklist 2 — Post-Baseline Policies',
  color: '#8b5cf6',
  items: [
    { id: 'c2_01', label: 'Firewall policy' },
    { id: 'c2_02', label: 'Phishing resistant MFA' },
    { id: 'c2_03', label: 'MFA for External users' },
    { id: 'c2_04', label: 'Compliance policy' },
    { id: 'c2_05', label: 'CA policy for compliant devices' },
    { id: 'c2_06', label: 'Separate Admin and User accounts' },
    { id: 'c2_07', label: 'Enable PIM' },
    { id: 'c2_08', label: 'Update policies and update rings' },
  ],
};

// ── Bullet list component ──────────────────────────────────────────────────
function BulletList({ items, color = '#d9861c' }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 items-start text-sm" style={{ color: 'var(--text2)' }}>
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: `2px solid ${color}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
    </div>
  );
}

// ── Checklist component ────────────────────────────────────────────────────
function Checklist({
  section, checked, onToggle,
}: {
  section: CheckSection;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  const done = section.items.filter(i => checked.has(i.id)).length;
  const pct = Math.round((done / section.items.length) * 100);

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ background: `${section.color}10`, borderBottom: `2px solid ${section.color}` }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} style={{ color: section.color }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{section.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{done}/{section.items.length} completed</span>
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: section.color }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: section.color }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Items */}
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
              <span className="text-xs flex-1 leading-relaxed"
                style={{ color: isDone ? 'var(--text)' : 'var(--text2)', textDecoration: isDone ? 'none' : 'none' }}>
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

// ── Print styles injected into page ───────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #baseline-print-area, #baseline-print-area * { visibility: visible !important; }
  #baseline-print-area { position: fixed; left: 0; top: 0; width: 100%; padding: 24px; background: white !important; color: black !important; font-family: Arial, sans-serif; font-size: 11pt; }
  .no-print { display: none !important; }
  .print-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .print-table th { background: #f0f0f0; padding: 6px 10px; text-align: left; border: 1px solid #ccc; font-size: 10pt; }
  .print-table td { padding: 5px 10px; border: 1px solid #ccc; font-size: 10pt; }
  .print-section-header { background: #1A1C24; color: white; padding: 6px 10px; margin: 12px 0 4px; font-size: 11pt; font-weight: bold; }
  .print-title { font-size: 18pt; font-weight: bold; border-bottom: 3px solid #d9861c; padding-bottom: 8px; margin-bottom: 16px; }
  .print-meta { display: flex; gap: 32px; margin-bottom: 16px; font-size: 10pt; }
  .print-meta span { color: #444; }
  .print-meta b { color: black; }
  .page-break { page-break-before: always; }
}
`;

// ── Main page ──────────────────────────────────────────────────────────────
export function BaselinesPage() {
  const [tab, setTab] = useState<'guide' | 'checklist'>('guide');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [consultantName, setConsultantName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  function toggleItem(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function checkAll(section: CheckSection) {
    setChecked(prev => {
      const next = new Set(prev);
      section.items.forEach(i => next.add(i.id));
      return next;
    });
  }

  function uncheckAll(section: CheckSection) {
    setChecked(prev => {
      const next = new Set(prev);
      section.items.forEach(i => next.delete(i.id));
      return next;
    });
  }

  function handleExportPDF() {
    // Inject print styles
    const styleId = 'baseline-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = PRINT_STYLE;
    window.print();
  }

  const totalItems = CHECKLIST1.items.length + CHECKLIST2.items.length;
  const totalDone = checked.size;
  const totalPct = Math.round((totalDone / totalItems) * 100);

  const formatDate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div>
      {/* Inject print styles permanently */}
      <style>{PRINT_STYLE}</style>

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
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,255,255,0.25)' }}>
              {totalDone}/{totalItems}
            </span>
          )}
        </button>
      </div>

      {/* ── GUIDE TAB ── */}
      {tab === 'guide' && (
        <div className="space-y-6">

          {/* Title card */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="px-6 py-5" style={{ background: '#1A1C24', borderBottom: '3px solid #d9861c' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#d9861c' }}>
                MXDR · BUI Security
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Baseline Configuration Guide</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Intune | Defender | Entra ID
              </p>
              <div className="mt-3 text-xs px-3 py-2 rounded-lg inline-block font-semibold"
                style={{ background: 'rgba(217,134,28,0.2)', color: '#d9861c', border: '1px solid rgba(217,134,28,0.3)' }}>
                Mandatory Security & Compliance Standards for All Customer Environments
              </div>
            </div>
          </div>

          {/* Entra section */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <SectionHeader icon={<Shield size={16} />} title="ENTRA" color="#0ea5e9" />
            <BulletList items={ENTRA_ITEMS} color="#0ea5e9" />
            <div className="flex gap-2 mt-4 p-3 rounded-lg" style={{ background: 'rgba(217,134,28,0.08)', border: '1px solid rgba(217,134,28,0.2)' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#d9861c' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#d9861c' }}>
                <strong>NB:</strong> {ENTRA_NOTE}
              </p>
            </div>
          </div>

          {/* Defender section */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <SectionHeader icon={<Shield size={16} />} title="DEFENDER" color="#ef4444" />
            <BulletList items={DEFENDER_ITEMS} color="#ef4444" />
          </div>

          {/* Intune section */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <SectionHeader icon={<Monitor size={16} />} title="INTUNE" color="#10b981" />
            <BulletList items={INTUNE_ITEMS} color="#10b981" />
          </div>

          {/* Post-baseline section */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <SectionHeader icon={<Cloud size={16} />} title="POLICIES TO GET IN PLACE AFTER BASELINE CHECK" color="#8b5cf6" />
            <div className="flex gap-2 mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#8b5cf6' }} />
              <p className="text-xs" style={{ color: '#8b5cf6' }}>
                Please ensure proper testing is done before implementation to the whole environment.
              </p>
            </div>
            <BulletList items={POST_BASELINE_ITEMS} color="#8b5cf6" />
          </div>

          {/* CTA */}
          <div className="text-center py-4">
            <button onClick={() => setTab('checklist')}
              className="font-semibold text-sm px-6 py-3 rounded-xl text-white transition-colors"
              style={{ background: 'var(--acc)' }}>
              ✅ Open Checklist &amp; Complete Assessment
            </button>
          </div>
        </div>
      )}

      {/* ── CHECKLIST TAB ── */}
      {tab === 'checklist' && (
        <div>
          {/* Overall progress */}
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
                <CheckCircle size={14} /> All checklist items completed — ready to export!
              </div>
            )}
          </div>

          {/* Consultant details form */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>
              Assessment Details — Required for PDF export
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                  <User size={11} /> Consultant Name
                </label>
                <input type="text" value={consultantName} onChange={e => setConsultantName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={e => e.target.style.borderColor = '#d9861c'}
                  onBlur={e => e.target.style.borderColor = 'rgba(217,134,28,0.2)'} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                  <Building size={11} /> Customer Name
                </label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={e => e.target.style.borderColor = '#d9861c'}
                  onBlur={e => e.target.style.borderColor = 'rgba(217,134,28,0.2)'} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                  <Calendar size={11} /> Assessment Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={e => e.target.style.borderColor = '#d9861c'}
                  onBlur={e => e.target.style.borderColor = 'rgba(217,134,28,0.2)'} />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold mb-1.5 uppercase tracking-wide block" style={{ color: 'var(--text3)' }}>
                Additional Notes (optional)
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any additional observations or notes about this assessment..."
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-sans resize-none"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = '#d9861c'}
                onBlur={e => e.target.style.borderColor = 'rgba(217,134,28,0.2)'} />
            </div>
          </div>

          {/* Section controls */}
          {[CHECKLIST1, CHECKLIST2].map(section => {
            const sectionDone = section.items.filter(i => checked.has(i.id)).length;
            const allDone = sectionDone === section.items.length;
            return (
              <div key={section.id}>
                <div className="flex items-center justify-between mb-2 px-1 no-print">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                    {sectionDone}/{section.items.length} items
                  </span>
                  <div className="flex gap-2">
                    {!allDone && (
                      <button onClick={() => checkAll(section)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors"
                        style={{ background: `${section.color}15`, color: section.color, border: `1px solid ${section.color}30` }}>
                        Check all
                      </button>
                    )}
                    {sectionDone > 0 && (
                      <button onClick={() => uncheckAll(section)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors"
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

          {/* Export button */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-5 rounded-2xl mt-2"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Export as PDF</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                {!consultantName || !customerName
                  ? 'Fill in Consultant Name and Customer Name above before exporting'
                  : `Ready to export — ${totalDone}/${totalItems} items completed`}
              </div>
            </div>
            <button onClick={handleExportPDF}
              disabled={!consultantName || !customerName}
              className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--acc)' }}>
              <Download size={15} /> Export PDF
            </button>
          </div>
        </div>
      )}

      {/* ── PRINT AREA (hidden except when printing) ── */}
      <div id="baseline-print-area" ref={printAreaRef} style={{ display: 'none' }}>
        {/* This is shown only during print */}
        <div className="print-title">
          BUI MXDR — Baseline Configuration Assessment
        </div>

        <div className="print-meta">
          <span><b>Consultant:</b> {consultantName || '—'}</span>
          <span><b>Customer:</b> {customerName || '—'}</span>
          <span><b>Date:</b> {formatDate(date)}</span>
          <span><b>Score:</b> {totalDone}/{totalItems} ({totalPct}%)</span>
        </div>

        {/* Checklist 1 */}
        <div className="print-section-header">CHECKLIST 1 — BASELINE CHECKS</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Item</th>
              <th style={{ width: '20%' }}>Status</th>
              <th style={{ width: '20%' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {CHECKLIST1.items.map((item, idx) => (
              <tr key={item.id} style={{ background: checked.has(item.id) ? '#f0fdf4' : '#fff8f7' }}>
                <td>{idx + 1}. {item.label}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: checked.has(item.id) ? '#15803d' : '#b91c1c' }}>
                  {checked.has(item.id) ? '✓ DONE' : '✗ PENDING'}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="page-break" />

        {/* Checklist 2 */}
        <div className="print-section-header">CHECKLIST 2 — POST-BASELINE POLICIES</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Item</th>
              <th style={{ width: '20%' }}>Status</th>
              <th style={{ width: '20%' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {CHECKLIST2.items.map((item, idx) => (
              <tr key={item.id} style={{ background: checked.has(item.id) ? '#f0fdf4' : '#fff8f7' }}>
                <td>{idx + 1}. {item.label}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: checked.has(item.id) ? '#15803d' : '#b91c1c' }}>
                  {checked.has(item.id) ? '✓ DONE' : '✗ PENDING'}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        {notes && (
          <>
            <div className="print-section-header" style={{ marginTop: 24 }}>NOTES</div>
            <div style={{ padding: '10px', border: '1px solid #ccc', fontSize: '10pt', whiteSpace: 'pre-wrap' }}>{notes}</div>
          </>
        )}

        {/* Summary */}
        <div style={{ marginTop: 24, padding: '12px', background: '#f5f5f5', border: '1px solid #ccc' }}>
          <strong>Assessment Summary</strong><br />
          Baseline items completed: {CHECKLIST1.items.filter(i => checked.has(i.id)).length}/{CHECKLIST1.items.length}<br />
          Post-baseline items completed: {CHECKLIST2.items.filter(i => checked.has(i.id)).length}/{CHECKLIST2.items.length}<br />
          Overall completion: {totalPct}%<br />
          <br />
          <strong>Consultant signature: </strong>___________________________&nbsp;&nbsp;&nbsp;
          <strong>Date: </strong>{formatDate(date)}
        </div>

        <div style={{ marginTop: 16, fontSize: '9pt', color: '#888', textAlign: 'center' }}>
          Sensitivity: Business — General &nbsp;|&nbsp; BUI Security &nbsp;|&nbsp; Generated by MXDR Secure Score Ops
        </div>
      </div>
    </div>
  );
}
