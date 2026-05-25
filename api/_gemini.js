const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function repairJSON(raw) {
  let text = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
  try { return JSON.parse(text); } catch {}
  let ob = 0, ob2 = 0, inStr = false, esc = false;
  for (const ch of text) {
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') ob++; else if (ch === '}') ob--;
    else if (ch === '[') ob2++; else if (ch === ']') ob2--;
  }
  if (inStr) text += '"';
  text += ']'.repeat(Math.max(0, ob2)) + '}'.repeat(Math.max(0, ob));
  try { return JSON.parse(text); } catch {}
  const lc = text.lastIndexOf(',"');
  if (lc > 0) try { return JSON.parse(text.substring(0, lc) + '}'); } catch {}
  throw new Error('Could not parse AI response. Please try again.');
}

async function callGemini(prompt, systemPrompt, maxTokens) {
  // Each model has its own independent rate limit quota.
  // Strategy: try each model, on 429 move immediately to the next one.
  // If all are rate-limited, do one short wait then cycle through again.
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-002',
  ];

  const isRateLimit = (msg) =>
    msg.includes('429') || msg.includes('quota') ||
    msg.includes('Too Many') || msg.includes('RESOURCE_EXHAUSTED');

  const isOverload = (msg) =>
    msg.includes('503') || msg.includes('overloaded') ||
    msg.includes('high demand') || msg.includes('Service Unavailable');

  const is404 = (msg) =>
    msg.includes('404') || msg.includes('not found') || msg.includes('deprecated');

  let lastError = null;

  // Two full passes through all models
  for (let pass = 0; pass < 2; pass++) {
    // Brief wait between passes to let quota refresh slightly
    if (pass === 1) {
      console.log('All models rate-limited on pass 1, waiting 12s before retry...');
      await sleep(12000);
    }

    for (const modelName of models) {
      try {
        console.log(`[pass ${pass + 1}] Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: maxTokens || 2500,
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        console.log(`Success with ${modelName}`);
        return repairJSON(result.response.text());
      } catch (err) {
        lastError = err;
        const msg = err.message || '';

        if (is404(msg)) {
          console.log(`${modelName} unavailable/deprecated, skipping`);
          continue;
        }

        if (isRateLimit(msg) || isOverload(msg)) {
          // Move immediately to next model — no wait between models
          console.log(`${modelName} rate-limited, trying next model immediately`);
          continue;
        }

        // Non-retryable (bad request, auth, parse error) — throw immediately
        throw err;
      }
    }
  }

  // All models exhausted across both passes
  const msg = lastError?.message || '';
  if (isRateLimit(msg)) throw new Error('RATE_LIMIT');
  if (isOverload(msg)) throw new Error('OVERLOADED');
  throw lastError || new Error('All models failed. Please try again.');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-auth-token');
}

module.exports = { callGemini, setCors, repairJSON };
