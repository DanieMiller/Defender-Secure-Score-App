const { callGemini, setCors } = require('./_gemini');

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
    "registry_key": "HKLM\\\\path or null",
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

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

  try {
    const prompt = `Generate a comprehensive but concise implementation guide for this Microsoft Defender Secure Score recommendation: "${query.trim()}"
Include exact Intune paths, GPO paths, registry mappings, Entra ID steps if identity-related, PowerShell scripts, and real Microsoft Learn URLs.
IMPORTANT: Return complete valid JSON only. Do not truncate.`;

    const result = await callGemini(prompt, GUIDE_SYSTEM);
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
