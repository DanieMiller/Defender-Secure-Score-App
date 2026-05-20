const { callGemini, setCors } = require('./_gemini');

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
CRITICAL: Valid complete JSON only. Max 3 steps per section.`;

const SCRIPTS_SYSTEM = `You are a Microsoft PowerShell expert. Generate specific, production-safe PowerShell scripts for Intune deployment.

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "detection": "# Detection script - SPECIFIC to this recommendation\\n# Exit 0=compliant, Exit 1=not compliant\\n<full script 20-30 lines with error handling>",
  "implementation": "# Implementation script - SPECIFIC to this recommendation\\n# Applies the security setting\\n<full script 20-30 lines with try/catch>",
  "validation": "# Validation - confirms setting was applied correctly\\n<full script 15-20 lines>",
  "rollback": {
    "intune": "one sentence: how to revert in Intune",
    "gpo": "one sentence: how to revert via GPO",
    "entra": null,
    "powershell": "# Rollback script - reverts the change\\n<full script 15-20 lines>"
  }
}
Rules:
- Scripts MUST be specific to the exact recommendation - not generic
- Include proper try/catch error handling
- Detection MUST exit 0 (compliant) or 1 (non-compliant) only
- Use $ErrorActionPreference and Write-Output for logging
- CRITICAL: Valid complete JSON only`;

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
        `Generate specific PowerShell scripts for this Defender Secure Score recommendation: "${q}". Detection (exit 0/1), implementation (applies the fix), validation, and rollback scripts. Make them specific to this recommendation, not generic templates.`,
        SCRIPTS_SYSTEM,
        3000
      );
      return res.status(200).json({ ok: true, scripts });
    }

    const isIdentity = /mfa|auth|entra|identity|password|conditional|azure ad|sign.in/i.test(q);
    const result = await callGemini(
      `Implementation guide for Defender Secure Score recommendation: "${q}". Include Intune, GPO${isIdentity ? ', and Entra ID' : ''}. Concise JSON only.`,
      GUIDE_SYSTEM,
      2000
    );

    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Generate error:', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'Gemini is busy right now. Please wait 60 seconds and try again.' });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
