import type { GuideResult, ScriptsResult } from '../types';

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

export async function generateScripts(query: string): Promise<ScriptsResult> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, includeScripts: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data.scripts as ScriptsResult;
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
