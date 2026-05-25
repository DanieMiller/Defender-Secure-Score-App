const { callGemini, setCors } = require('./_gemini');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

// ── Cache ─────────────────────────────────────────────────────────────────
let _cache = null;
function getCache() {
  if (_cache !== null) return _cache;
  const p = join(__dirname, 'recommendations-cache.json');
  try { _cache = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}; }
  catch (e) { console.warn('Cache load failed:', e.message); _cache = {}; }
  console.log(`Cache loaded: ${Object.keys(_cache).length} entries`);
  return _cache;
}

function findInCache(query, cache) {
  const keys = Object.keys(cache);
  if (!keys.length) return null;
  const q = query.trim();
  // 1. Exact
  if (cache[q]) return cache[q].result;
  // 2. Case-insensitive
  const lower = q.toLowerCase();
  const ci = keys.find(k => k.toLowerCase() === lower);
  if (ci) return cache[ci].result;
  // 3. Contains
  const contains = keys.find(k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()));
  if (contains) return cache[contains].result;
  return null;
}

// ── Prompts ───────────────────────────────────────────────────────────────
const GUIDE_SYSTEM = `You are a Microsoft security expert. Generate Defender Secure Score implementation guides. Respond ONLY with raw JSON:
{"confidence":"High|Medium|Low","summary":"1-2 sentences","category":"string","affected_os":["Windows 10","Windows 11"],"user_impact":"Low|Medium|High","platforms":["Windows"],"intune":{"method":"string","steps":["s1","s2","s3"],"settings_path":null,"oma_uri":null,"data_type":null,"value":"string"},"gpo":{"steps":["s1","s2","s3"],"policy_path":"string","setting_name":"string","value":"string","admx":null,"registry_key":null,"registry_value":null,"registry_data":null},"entra":{"applicable":false,"steps":[],"portal_path":null,"policy_type":null,"settings":[],"conditional_access":false,"ca_policy_name":null,"graph_api":null,"powershell":null,"notes":null},"defender":{"applicable":false,"product":null,"portal_path":null,"steps":[],"policy_name":null,"settings":[],"powershell":null,"graph_api":null,"notes":null},"validation_steps":["s1","s2"],"risks":["r1"],"references":[{"title":"t","url":"https://learn.microsoft.com/...","type":"Official Docs"}]}
entra.applicable=true for MFA/identity/Conditional Access. defender.applicable=true for Defender products. Max 3 steps. Valid JSON only.`;

const SCRIPTS_SYSTEM = `Microsoft PowerShell expert. Raw JSON only:
{"detection":"# Exit 0=compliant 1=not\\n<15 lines>","implementation":"# Apply setting\\n<15 lines try/catch>","validation":"# Verify\\n<10 lines>","rollback":{"intune":"revert step","gpo":"revert step","entra":null,"defender":null,"powershell":"# Rollback\\n<10 lines>"}}
Specific to recommendation, exit 0/1, try/catch, max 15 lines, valid JSON.`;

// ── Handler ───────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query, includeScripts } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

  const q = query.trim();

  try {
    // Scripts — always Gemini (user-initiated, infrequent)
    if (includeScripts) {
      const scripts = await callGemini(
        `Generate specific PowerShell scripts for Defender Secure Score recommendation: "${q}". Detection (exit 0/1), implementation, validation, rollback. Specific to this recommendation.`,
        SCRIPTS_SYSTEM, 1500
      );
      return res.status(200).json({ ok: true, scripts });
    }

    // Guide — check cache first
    const cached = findInCache(q, getCache());
    if (cached) {
      console.log(`Cache HIT: ${q}`);
      return res.status(200).json({ ok: true, result: cached, cached: true });
    }

    // Cache miss — call Gemini
    console.log(`Cache MISS: ${q}`);
    const isId  = /mfa|auth|entra|identity|password|conditional|azure ad|sign.?in/i.test(q);
    const isDef = /defender|office 365|anti.?phish|safe link|safe attach|anti.?spam|threat polic|attack sim|cloud app|365 defender/i.test(q);

    const result = await callGemini(
      `Implementation guide for: "${q}". Include Intune, GPO${isId ? ', Entra ID' : ''}${isDef ? ', Defender portal' : ''}. JSON only.`,
      GUIDE_SYSTEM, 2500
    );

    if (!result.defender) {
      result.defender = { applicable: false, product: null, portal_path: null, steps: [], policy_name: null, settings: [], powershell: null, graph_api: null, notes: null };
    }

    return res.status(200).json({ ok: true, result, cached: false });

  } catch (err) {
    console.error('Generate error:', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }
    if (err.message === 'OVERLOADED') {
      return res.status(503).json({ error: 'OVERLOADED' });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
