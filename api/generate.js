const { callGemini, setCors } = require('./_gemini');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

// ── Cache loader ──────────────────────────────────────────────────────────────
// Loads the pre-generated cache from recommendations-cache.json if it exists.
// The cache is a flat object: { "recommendation text": { result, generatedAt } }
let _cache = null;
function getCache() {
  if (_cache !== null) return _cache;
  const cachePath = join(__dirname, 'recommendations-cache.json');
  if (existsSync(cachePath)) {
    try {
      _cache = JSON.parse(readFileSync(cachePath, 'utf8'));
      console.log(`Cache loaded: ${Object.keys(_cache).length} recommendations`);
    } catch (e) {
      console.warn('Cache load failed:', e.message);
      _cache = {};
    }
  } else {
    _cache = {};
  }
  return _cache;
}

// Fuzzy match — find the closest recommendation in the cache
// Tries exact match first, then case-insensitive, then partial word match
function findInCache(query, cache) {
  const keys = Object.keys(cache);
  if (!keys.length) return null;

  const q = query.trim();

  // 1. Exact match
  if (cache[q]) return cache[q].result;

  // 2. Case-insensitive exact match
  const qLower = q.toLowerCase();
  const exact = keys.find(k => k.toLowerCase() === qLower);
  if (exact) return cache[exact].result;

  // 3. Cache key contains query or query contains cache key (trimmed)
  const contains = keys.find(k =>
    k.toLowerCase().includes(qLower) || qLower.includes(k.toLowerCase())
  );
  if (contains) return cache[contains].result;

  return null;
}

// ── System prompts ────────────────────────────────────────────────────────────
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
  "defender": {
    "applicable": false,
    "product": null,
    "portal_path": null,
    "steps": [],
    "policy_name": null,
    "settings": [],
    "powershell": null,
    "graph_api": null,
    "notes": null
  },
  "validation_steps": ["step 1","step 2"],
  "risks": ["risk 1"],
  "references": [{"title":"title","url":"https://learn.microsoft.com/...","type":"Official Docs"}]
}
Set entra.applicable=true for MFA/Conditional Access/identity recommendations.
Set defender.applicable=true for Defender for Office 365/Endpoint/Cloud Apps recommendations.
CRITICAL: Valid complete JSON. Max 3 steps per section.`;

const SCRIPTS_SYSTEM = `Microsoft PowerShell expert. Generate Intune-ready scripts. Raw JSON only, no markdown:
{"detection":"# Exit 0=compliant 1=not\n<15 lines specific to rec>","implementation":"# Apply setting\n<15 lines with try/catch>","validation":"# Verify\n<10 lines>","rollback":{"intune":"revert step","gpo":"revert step","entra":null,"defender":null,"powershell":"# Rollback\n<10 lines>"}}
Rules: specific to recommendation, exit 0/1, try/catch, max 15 lines each, valid JSON.`;

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, includeScripts } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

  const q = query.trim();

  try {
    // ── Scripts request (always goes to AI — no cache for scripts) ──────────
    if (includeScripts) {
      const scripts = await callGemini(
        `Generate specific PowerShell scripts for this Defender Secure Score recommendation: "${q}". Detection (exit 0/1), implementation (applies the fix), validation, and rollback scripts. Make them specific to this recommendation, not generic templates.`,
        SCRIPTS_SYSTEM,
        1200
      );
      return res.status(200).json({ ok: true, scripts });
    }

    // ── Check cache first ───────────────────────────────────────────────────
    const cache = getCache();
    const cached = findInCache(q, cache);

    if (cached) {
      console.log(`Cache HIT: ${q}`);
      return res.status(200).json({ ok: true, result: cached, cached: true });
    }

    console.log(`Cache MISS: ${q} — calling Gemini`);

    // ── Cache miss — call Gemini ────────────────────────────────────────────
    const isIdentity = /mfa|auth|entra|identity|password|conditional|azure ad|sign.?in/i.test(q);
    const isDefender = /defender|office 365|anti.?phish|safe link|safe attach|anti.?spam|threat polic|attack sim|cloud app|365 defender|atp/i.test(q);

    const result = await callGemini(
      `Implementation guide for Defender Secure Score recommendation: "${q}". Include Intune and GPO steps${isIdentity ? ', Entra ID configuration' : ''}${isDefender ? ', and Microsoft Defender portal configuration' : ''}. Concise JSON only.`,
      GUIDE_SYSTEM,
      2500
    );

    if (!result.defender) {
      result.defender = { applicable: false, product: null, portal_path: null, steps: [], policy_name: null, settings: [], powershell: null, graph_api: null, notes: null };
    }

    res.status(200).json({ ok: true, result, cached: false });

  } catch (err) {
    console.error('Generate error:', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'Gemini rate limit reached. Please wait 60 seconds and try again.' });
    }
    if (err.message === 'OVERLOADED') {
      return res.status(503).json({ error: 'Gemini is experiencing high demand right now. Please try again in 30 seconds.' });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
