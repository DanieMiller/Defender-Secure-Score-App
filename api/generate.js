const { callGemini, setCors } = require('./_gemini');

const GUIDE_SYSTEM = `You are a Microsoft security expert specializing in Defender for Endpoint Secure Score remediation.

RULES:
- Never hallucinate registry keys, OMA-URI paths, or CSP settings. If uncertain say "verify in Microsoft Learn"
- Cite real URLs from learn.microsoft.com
- Prefer Settings Catalog over OMA-URI for Intune

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "confidence": "High|Medium|Low",
  "summary": "2-3 sentences on what this does and why it matters",
  "category": "e.g. Attack Surface Reduction",
  "affected_os": ["Windows 10", "Windows 11"],
  "user_impact": "Low|Medium|High",
  "platforms": ["Windows", "Intune"],
  "intune": {
    "method": "Settings Catalog|OMA-URI|Endpoint Security|Administrative Templates",
    "steps": ["step 1", "step 2", "step 3"],
    "settings_path": "exact Settings Catalog path or null",
    "oma_uri": "OMA-URI or null",
    "data_type": "data type or null",
    "value": "value to configure"
  },
  "gpo": {
    "steps": ["step 1", "step 2", "step 3"],
    "policy_path": "Computer Configuration > ... > exact path",
    "setting_name": "exact GPO setting name",
    "value": "Enabled|Disabled|value",
    "admx": "ADMX file or null",
    "registry_key": "HKLM\\\\path or null",
    "registry_value": "value name or null",
    "registry_data": "data and type or null"
  },
  "entra": {
    "applicable": true,
    "steps": ["step 1", "step 2"],
    "portal_path": "exact Entra admin center path or null",
    "policy_type": "Conditional Access|Authentication Methods|Security Defaults|MFA|Identity Protection|null",
    "settings": [{"name": "setting name", "value": "value"}],
    "conditional_access": false,
    "ca_policy_name": "policy name or null",
    "graph_api": "Graph API call or null",
    "powershell": null,
    "notes": "any notes or null"
  },
  "validation_steps": ["step 1", "step 2", "step 3"],
  "risks": ["risk 1", "risk 2"],
  "references": [
    {"title": "title", "url": "https://learn.microsoft.com/...", "type": "Official Docs"}
  ]
}
For endpoint-only settings set entra.applicable=false and entra.steps=[].
CRITICAL: Valid complete JSON only. Be concise.`;

const SCRIPTS_SYSTEM = `You are a Microsoft PowerShell expert. Generate concise production-safe scripts.

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "detection": "# Detection script - max 20 lines with comments\\n# Exit 0 = compliant, Exit 1 = not compliant",
  "implementation": "# Implementation script - max 20 lines with comments",
  "validation": "# Validation script - max 15 lines with comments",
  "rollback": {
    "intune": "one sentence: how to revert in Intune",
    "gpo": "one sentence: how to revert via GPO",
    "entra": "one sentence: how to revert in Entra ID or null",
    "powershell": "# Rollback script - max 15 lines"
  }
}
CRITICAL: Valid complete JSON only. Keep ALL scripts under 20 lines each.`;

// Main guide - no scripts
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, includeScripts } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

  const q = query.trim();

  try {
    if (includeScripts) {
      // Scripts-only request from the frontend "Generate Scripts" button
      const scripts = await callGemini(
        `Generate PowerShell detection, implementation, validation and rollback scripts for: "${q}"\nKeep each script under 20 lines. JSON only.`,
        SCRIPTS_SYSTEM,
        2000
      );
      return res.status(200).json({ ok: true, scripts });
    }

    // Normal guide request - no scripts, much faster
    const result = await callGemini(
      `Generate implementation guide for this Defender Secure Score recommendation: "${q}"\nInclude Intune, GPO, Entra ID steps, validation steps, risks, and Microsoft Learn URLs.\nJSON only, be concise.`,
      GUIDE_SYSTEM,
      3000
    );

    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
