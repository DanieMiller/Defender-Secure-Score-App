#!/usr/bin/env node
/**
 * BUI Secure Score - Bulk Pre-generation Script
 * ------------------------------------------------
 * Pre-generates AI responses for all 281 Defender Secure Score recommendations
 * and saves them to a cache file that the app uses for instant lookups.
 *
 * Usage:
 *   cd scripts
 *   npm install
 *   GEMINI_API_KEY=AIzaSy... node pregenerate.js
 *
 * Options:
 *   --start 50     Start from recommendation #50 (resume interrupted run)
 *   --end 100      Stop at recommendation #100
 *   --force        Re-generate even if already cached
 *
 * The script:
 *   - Reads recommendations.json (281 items from Defender Secure Score export)
 *   - Calls Gemini for each one not already in cache
 *   - Saves results to cache/recommendations-cache.json after every entry
 *   - Handles rate limits automatically (waits and retries)
 *   - Shows progress with ETA
 *   - Safe to interrupt and resume
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌  Set GEMINI_API_KEY environment variable first');
  console.error('    GEMINI_API_KEY=AIzaSy... node pregenerate.js');
  process.exit(1);
}

const CACHE_DIR  = join(__dirname, 'cache');
const CACHE_FILE = join(CACHE_DIR, 'recommendations-cache.json');
const REC_FILE   = join(__dirname, 'recommendations.json');

const args = process.argv.slice(2);
const startIdx  = parseInt(args[args.indexOf('--start') + 1] || '0');
const endIdx    = parseInt(args[args.indexOf('--end')   + 1] || '999999');
const forceRegen = args.includes('--force');

// ── Load data ─────────────────────────────────────────────────────────────────
const recommendations = JSON.parse(readFileSync(REC_FILE, 'utf8'));
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
let cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};

console.log(`\n🛡️  BUI Secure Score Pre-generation`);
console.log(`    ${recommendations.length} total recommendations`);
console.log(`    ${Object.keys(cache).length} already cached`);
console.log(`    Range: ${startIdx} to ${Math.min(endIdx, recommendations.length - 1)}`);
console.log(`    Force: ${forceRegen}\n`);

// ── Gemini setup ──────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    "registry_key": "HKLM\\\\path or null",
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

async function generateOne(query) {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
  const isIdentity = /mfa|auth|entra|identity|password|conditional|azure ad|sign.?in/i.test(query);
  const isDefender = /defender|office 365|anti.?phish|safe link|safe attach|anti.?spam|threat polic|attack sim|cloud app|365 defender/i.test(query);

  const prompt = `Implementation guide for Defender Secure Score recommendation: "${query}". Include Intune and GPO steps${isIdentity ? ', Entra ID configuration' : ''}${isDefender ? ', and Microsoft Defender portal configuration' : ''}. Concise JSON only.`;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: GUIDE_SYSTEM,
          generationConfig: { temperature: 0.2, maxOutputTokens: 2500, responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim()
          .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        const parsed = JSON.parse(text);
        if (!parsed.defender) {
          parsed.defender = { applicable: false, product: null, portal_path: null, steps: [], policy_name: null, settings: [], powershell: null, graph_api: null, notes: null };
        }
        return parsed;
      } catch (err) {
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
        const is404 = err.message?.includes('404') || err.message?.includes('not found');
        if (is404) break;
        if (is429 && attempt === 1) { await sleep(10000); continue; }
        if (is429 && attempt === 2) break;
        throw err;
      }
    }
  }
  throw new Error('All models rate limited');
}

// ── Main loop ─────────────────────────────────────────────────────────────────
async function main() {
  const toProcess = recommendations
    .slice(startIdx, endIdx + 1)
    .filter((rec, i) => forceRegen || !cache[rec]);

  console.log(`📋  ${toProcess.length} recommendations to generate\n`);

  if (toProcess.length === 0) {
    console.log('✅  All done — nothing to generate!');
    process.exit(0);
  }

  let done = 0;
  let errors = 0;
  const startTime = Date.now();

  for (const rec of toProcess) {
    const idx = recommendations.indexOf(rec) + 1;
    process.stdout.write(`[${idx}/${recommendations.length}] ${rec.substring(0, 60)}... `);

    try {
      const result = await generateOne(rec);
      cache[rec] = { result, generatedAt: new Date().toISOString() };

      // Save after every entry so progress is never lost
      writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

      done++;
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = done / elapsed;
      const remaining = toProcess.length - done;
      const etaSeconds = Math.round(remaining / rate);
      const etaMin = Math.floor(etaSeconds / 60);
      const etaSec = etaSeconds % 60;

      console.log(`✓  (ETA: ${etaMin}m ${etaSec}s)`);

      // Respect rate limit: wait 4 seconds between calls (15/min free tier)
      if (done < toProcess.length) await sleep(4000);

    } catch (err) {
      errors++;
      console.log(`✗  ERROR: ${err.message}`);
      // Wait longer after an error
      await sleep(15000);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n🎉  Complete!`);
  console.log(`    Generated: ${done}`);
  console.log(`    Errors:    ${errors}`);
  console.log(`    Total cached: ${Object.keys(cache).length}/${recommendations.length}`);
  console.log(`    Time: ${Math.floor(totalTime/60)}m ${totalTime%60}s`);
  console.log(`\n    Cache saved to: ${CACHE_FILE}`);
  console.log(`    Copy cache/recommendations-cache.json to your project's api/ folder`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
