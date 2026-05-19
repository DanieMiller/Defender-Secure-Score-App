import { app } from '@azure/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function repairJSON(raw) {
  let text = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
  try { return JSON.parse(text); } catch {}
  let ob = 0, ob2 = 0, inStr = false, esc = false;
  for (const ch of text) {
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') ob++; else if (ch === '}') ob--;
    else if (ch === '[') ob2++; else if (ch === ']') ob2--;
  }
  if (inStr) text += '"';
  text += ']'.repeat(Math.max(0, ob2)) + '}'.repeat(Math.max(0, ob));
  try { return JSON.parse(text); } catch {}
  const lc = text.lastIndexOf(',"');
  if (lc > 0) try { return JSON.parse(text.substring(0, lc) + '}'); } catch {}
  throw new Error('Could not parse AI response. Please try again.');
}

async function callGemini(prompt, systemPrompt) {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt);
        return repairJSON(result.response.text());
      } catch (err) {
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many');
        const is404 = err.message?.includes('404') || err.message?.includes('not found');
        if (is404) break;
        if (is429 && attempt < 3) { await sleep(attempt * 15000); continue; }
        if (is429 && attempt === 3) break;
        throw err;
      }
    }
  }
  throw new Error('Rate limit reached. Please wait 1 minute and try again.');
}

function jsonRes(data, status = 200) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(data),
  };
}

// ── System prompts ─────────────────────────────────────────────────────────

const GUIDE_SYSTEM = `You are a Microsoft security expert specializing in Defender for Endpoint Secure Score remediation. You help administrators implement security recommendations using Intune, Group Policy, Entra ID, and PowerShell.

RULES:
- Never hallucinate registry keys, OMA-URI paths, CSP settings, or Entra ID portal paths. If uncertain, say "verify in Microsoft Learn"
- Always cite source URLs from learn.microsoft.com or microsoft.com
- Warn about potential disruptions to users or legacy systems
- Prefer Settings Catalog over OMA-URI for Intune where available
- Use production-safe PowerShell with error handling and comments
- Keep PowerShell scripts concise but complete

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "confidence": "High|Medium|Low",
  "summary": "2-3 sentence explanation",
  "category": "e.g. Attack Surface Reduction",
  "affected_os": ["Windows 10", "Windows 11"],
  "user_impact": "Low|Medium|High",
  "platforms": ["Windows", "Entra ID", "Intune"],
  "intune": {
    "method": "Settings Catalog|OMA-URI|Endpoint Security|Administrative Templates",
    "steps": ["step 1", "step 2"],
    "settings_path": "exact path or null",
    "oma_uri": "OMA-URI or null",
    "data_type": "data type or null",
    "value": "value to configure"
  },
  "gpo": {
    "steps": ["step 1", "step 2"],
    "policy_path": "Computer Configuration > ... > exact path",
    "setting_name": "exact GPO setting name",
    "value": "Enabled|Disabled|value",
    "admx": "ADMX file or null",
    "registry_key": "HKLM\\path or null",
    "registry_value": "value name or null",
    "registry_data": "data and type or null"
  },
  "entra": {
    "applicable": true,
    "steps": ["step 1", "step 2"],
    "portal_path": "exact navigation path or null",
    "policy_type": "Conditional Access|Authentication Methods|Security Defaults|MFA|Identity Protection|null",
    "settings": [{"name": "setting name", "value": "value"}],
    "conditional_access": false,
    "ca_policy_name": "policy name or null",
    "graph_api": "Graph API endpoint or null",
    "powershell": "# Graph PowerShell script or null",
    "notes": "important notes or null"
  },
  "powershell": {
    "detection": "# detection script",
    "implementation": "# implementation script",
    "validation": "# validation script"
  },
  "validation_steps": ["step 1", "step 2"],
  "rollback": {
    "intune": "how to revert in Intune",
    "gpo": "how to revert via GPO",
    "entra": "how to revert in Entra ID or null",
    "powershell": "# rollback script"
  },
  "risks": ["risk 1", "risk 2"],
  "references": [{"title": "title", "url": "https://learn.microsoft.com/...", "type": "Official Docs"}]
}
For endpoint-only recommendations set entra.applicable to false and entra.steps to [].
CRITICAL: Return complete valid JSON. Keep scripts under 30 lines each.`;

const SCRIPT_SYSTEM = `You are a Microsoft endpoint management expert. Generate production-safe PowerShell detection and remediation scripts for Intune or standalone use.

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "title": "short descriptive title",
  "description": "what these scripts do and when to use them",
  "detection": "# Full detection PowerShell script\\n# Exits 0 if compliant, 1 if non-compliant\\n...",
  "remediation": "# Full remediation PowerShell script with try/catch\\n...",
  "validation": "# Validation script\\n...",
  "rollback": "# Rollback script\\n...",
  "notes": ["deployment note 1", "note 2"],
  "references": [{"title": "title", "url": "https://learn.microsoft.com/..."}]
}
Rules: production-safe, error handling, exit 0/1 for detection, under 40 lines each. CRITICAL: complete valid JSON only.`;

// ── Functions ──────────────────────────────────────────────────────────────

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async () => jsonRes({ ok: true, ts: new Date().toISOString(), runtime: 'azure-functions-v4' }),
});

app.http('generate', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } };
    let body;
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON body' }, 400); }
    const { query } = body;
    if (!query?.trim()) return jsonRes({ error: 'query is required' }, 400);
    try {
      const prompt = `Generate a comprehensive but concise implementation guide for this Microsoft Defender Secure Score recommendation: "${query.trim()}"\nInclude exact Intune paths, GPO paths, registry mappings, Entra ID steps if identity-related, PowerShell scripts, and real Microsoft Learn URLs.\nIMPORTANT: Return complete valid JSON only. Do not truncate.`;
      const result = await callGemini(prompt, GUIDE_SYSTEM);
      return jsonRes({ ok: true, result });
    } catch (err) {
      context.log('Generate error:', err.message);
      return jsonRes({ error: err.message || 'Internal server error' }, 500);
    }
  },
});

app.http('script', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } };
    let body;
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON body' }, 400); }
    const { request: userRequest } = body;
    if (!userRequest?.trim()) return jsonRes({ error: 'request is required' }, 400);
    try {
      const prompt = `Generate detection and remediation PowerShell scripts for: "${userRequest.trim()}"\nInclude: detection (exit 0/1), remediation, validation, rollback scripts.\nIMPORTANT: Return complete valid JSON only.`;
      const result = await callGemini(prompt, SCRIPT_SYSTEM);
      return jsonRes({ ok: true, result });
    } catch (err) {
      context.log('Script error:', err.message);
      return jsonRes({ error: err.message || 'Internal server error' }, 500);
    }
  },
});
