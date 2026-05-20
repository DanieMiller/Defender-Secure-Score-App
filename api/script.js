const { requireAuth } = require('./_auth');
const { callGemini, setCors } = require('./_gemini');

const SCRIPT_SYSTEM = `You are a Microsoft endpoint management expert. Generate production-safe PowerShell scripts for Intune deployment.

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "title": "short descriptive title",
  "description": "what these scripts do and when to use them",
  "detection": "# Detection script - exits 0 if compliant, 1 if not compliant\\n# Must be specific to the exact request\\n<full script with error handling>",
  "remediation": "# Remediation script - fixes the non-compliant state\\n# Must be specific to the exact request\\n<full script with try/catch>",
  "validation": "# Validation script - confirms remediation succeeded\\n<full script>",
  "rollback": "# Rollback script - undoes the remediation\\n<full script>",
  "notes": ["deployment note 1", "note 2"],
  "references": [{"title": "reference title", "url": "https://learn.microsoft.com/..."}]
}

Rules:
- Scripts MUST be specific to the exact request - not generic templates
- Include proper try/catch error handling
- Detection MUST exit 0 (compliant) or 1 (non-compliant) - no other exit codes
- Each script max 35 lines but must be complete and functional
- Use Write-Output for logging, not Write-Host in production scripts
- CRITICAL: Return complete valid JSON only`;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!requireAuth(req, res)) return;

  const { request: userRequest } = req.body || {};
  if (!userRequest || !userRequest.trim()) return res.status(400).json({ error: 'request is required' });

  try {
    const prompt = `Generate specific PowerShell scripts for this exact request: "${userRequest.trim()}"

The scripts must be tailored specifically to this request - not generic. Include:
1. Detection script (exit 0=compliant, exit 1=not compliant)
2. Remediation script (fixes the issue, with try/catch)
3. Validation script (confirms fix worked)
4. Rollback script (undoes the fix)

Return complete valid JSON only.`;

    const result = await callGemini(prompt, SCRIPT_SYSTEM, 1500);
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Script error:', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'Gemini rate limit reached. Please wait 60 seconds and try again.' });
    }
    if (err.message === 'OVERLOADED') {
      return res.status(503).json({ error: 'Gemini is experiencing high demand right now. Please try again in 30 seconds.' });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
