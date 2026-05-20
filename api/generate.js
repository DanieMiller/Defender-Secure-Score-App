const { callGemini, setCors } = require('./_gemini');

// Tight, focused system prompt — less tokens = faster response
const GUIDE_SYSTEM = `You are a Microsoft security expert. Generate concise Defender Secure Score implementation guides.

Respond ONLY with raw JSON (no markdown, no fences):
{
  "confidence": "High|Medium|Low",
  "summary": "1-2 sentences: what this does and why it matters",
  "category": "e.g. Attack Surface Reduction",
  "affected_os": ["Windows 10","Windows 11"],
  "user_impact": "Low|Medium|High",
  "platforms": ["Windows","Intune"],
  "intune": {
    "method": "Settings Catalog|OMA-URI|Endpoint Security|Administrative Templates",
    "steps": ["step 1","step 2","step 3"],
    "settings_path": "exact Settings Catalog path or null",
    "oma_uri": "OMA-URI or null",
    "data_type": "type or null",
    "value": "value to configure"
  },
  "gpo": {
    "steps": ["step 1","step 2","step 3"],
    "policy_path": "Computer Configuration > exact path",
    "setting_name": "exact setting name",
    "value": "Enabled|Disabled|value",
    "admx": "ADMX file or null",
    "registry_key": "HKLM\\path or null",
    "registry_value": "name or null",
    "registry_data": "data/type or null"
  },
  "entra": {
    "applicable": false,
    "steps": [],
    "portal_path": null,
    "policy_type": null,
    "settings": [],
    "conditional_access": false,
    "ca_policy_name": null,
    "graph_api": null,
    "powershell": null,
    "notes": null
  },
  "validation_steps": ["step 1","step 2"],
  "risks": ["risk 1"],
  "references": [{"title":"title","url":"https://learn.microsoft.com/...","type":"Official Docs"}]
}
For identity/MFA/Entra recommendations set entra.applicable=true and fill in the entra fields.
CRITICAL: Valid complete JSON only. Be concise — max 3 steps per section.`;

const SCRIPTS_SYSTEM = `Generate concise PowerShell scripts for Intune deployment.
Respond ONLY with raw JSON:
{
  "detection": "# Exit 0=compliant, 1=not compliant\\n<script max 15 lines>",
  "implementation": "# Implementation script\\n<script max 15 lines>",
  "validation": "# Validation script\\n<script max 10 lines>",
  "rollback": {
    "intune": "Remove policy or set to Not Configured",
    "gpo": "Set to Not Configured in Group Policy",
    "entra": null,
    "powershell": "# Rollback script\\n<script max 10 lines>"
  }
}
CRITICAL: Valid complete JSON. Scripts max 15 lines each.`;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, includeScripts } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

  const q = query.trim();

  try {
    if (includeScripts) {
      const scripts = await callGemini(
        `Generate PowerShell scripts for: "${q}". Detection (exit 0/1), implementation, validation, rollback. Max 15 lines each.`,
        SCRIPTS_SYSTEM,
        1500
      );
      return res.status(200).json({ ok: true, scripts });
    }

    const result = await callGemini(
      `Implementation guide for Defender Secure Score recommendation: "${q}". Include Intune, GPO${q.toLowerCase().includes('mfa') || q.toLowerCase().includes('auth') || q.toLowerCase().includes('entra') || q.toLowerCase().includes('identity') || q.toLowerCase().includes('password') || q.toLowerCase().includes('conditional') ? ', and Entra ID' : ''}. Concise JSON only.`,
      GUIDE_SYSTEM,
      2000
    );

    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
