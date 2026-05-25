import type { GuideResult, ScriptsResult } from '../types';

const API_BASE = '/api';

function getToken(): string {
  try { return localStorage.getItem('sso_auth_token') || ''; } catch { return ''; }
}

function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-auth-token': getToken() };
}

export interface GenerateResponse {
  result: GuideResult;
  cached: boolean;
}

export async function generateGuide(query: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) {
    // Surface specific error types to the frontend
    if (res.status === 429 || data.error === 'RATE_LIMIT') throw new Error('RATE_LIMIT');
    if (res.status === 503 || data.error === 'OVERLOADED') throw new Error('OVERLOADED');
    throw new Error(data.error || `Server error ${res.status}`);
  }
  return { result: data.result as GuideResult, cached: data.cached === true };
}

export async function generateScripts(query: string): Promise<ScriptsResult> {
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query, includeScripts: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429 || data.error === 'RATE_LIMIT') throw new Error('RATE_LIMIT');
    if (res.status === 503 || data.error === 'OVERLOADED') throw new Error('OVERLOADED');
    throw new Error(data.error || `Server error ${res.status}`);
  }
  return data.scripts as ScriptsResult;
}
