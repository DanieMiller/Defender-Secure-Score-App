const { callGemini, setCors } = require('./_gemini');

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

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { request: userRequest } = req.body || {};
  if (!userRequest || !userRequest.trim()) return res.status(400).json({ error: 'request is required' });

  try {
    const prompt = `Generate detection and remediation PowerShell scripts for: "${userRequest.trim()}"
Include: detection (exit 0/1), remediation, validation, rollback scripts.
IMPORTANT: Return complete valid JSON only.`;

    const result = await callGemini(prompt, SCRIPT_SYSTEM);
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('Script error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
