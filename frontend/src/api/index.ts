import type { GuideResult } from '../types';

// In Azure Static Web Apps, /api/* is automatically routed to Azure Functions.
// In local dev, Vite proxies /api/* to the local functions emulator or backend.
const API_BASE = '/api';

export async function generateGuide(query: string): Promise<GuideResult> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data.result as GuideResult;
}

export async function generateScript(request: string): Promise<ScriptResult> {
  const res = await fetch(`${API_BASE}/script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data.result as ScriptResult;
}

export interface ScriptResult {
  title: string;
  description: string;
  detection: string;
  remediation: string;
  validation: string;
  rollback: string;
  notes: string[];
  references: { title: string; url: string }[];
}
