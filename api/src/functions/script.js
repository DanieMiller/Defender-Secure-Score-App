import { app } from '@azure/functions';
import { callGemini, jsonResponse } from '../shared/gemini.js';

const SCRIPT_SYSTEM = `You are a Microsoft endpoint management expert. Generate production-safe PowerShell detection and remediation scripts for Intune or standalone use.

Respond ONLY with raw JSON, no markdown, no code fences:
{
  "title": "short descriptive title",
  "description": "what these scripts do and when to use them",
  "detection": "# Full detection PowerShell script\\n# Exits 0 if compliant, 1 if non-compliant (Intune standard)\\n...",
  "remediation": "# Full remediation PowerShell script with try/catch error handling\\n...",
  "validation": "# Validation script to confirm remediation succeeded\\n...",
  "rollback": "# Rollback script to undo the remediation\\n...",
  "notes": ["important deployment note 1", "note 2"],
  "references": [{"title": "reference title", "url": "https://learn.microsoft.com/..."}]
}

Rules:
- Scripts must be safe for production Intune deployment
- Include proper error handling and try/catch blocks
- Add inline comments explaining each step
- Detection script MUST exit 0 (compliant) or 1 (non-compliant)
- Keep each script concise but complete (under 40 lines)
- Never use destructive operations without safety checks
- CRITICAL: Return complete valid JSON only`;

app.http('script', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'script',
  handler: async (request, context) => {
    context.log('script function called');

    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { request: userRequest } = body;
    if (!userRequest || typeof userRequest !== 'string' || !userRequest.trim()) {
      return jsonResponse({ error: 'request is required' }, 400);
    }

    try {
      const prompt = `Generate detection and remediation PowerShell scripts for this request: "${userRequest.trim()}"
Include: detection script (exit 0/1 for Intune), remediation script, validation script, rollback script.
IMPORTANT: Return complete valid JSON only.`;

      const result = await callGemini(prompt, SCRIPT_SYSTEM);
      return jsonResponse({ ok: true, result });
    } catch (err) {
      context.log('Error:', err.message);
      return jsonResponse({ error: err.message || 'Internal server error' }, 500);
    }
  },
});
