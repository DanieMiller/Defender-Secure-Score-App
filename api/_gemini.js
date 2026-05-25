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
  // Only verified working models on v1beta free tier
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
  ];

  const isRateLimit = (msg) =>
    msg.includes('429') || msg.includes('quota') ||
    msg.includes('Too Many') || msg.includes('RESOURCE_EXHAUSTED');

  const isOverload = (msg) =>
    msg.includes('503') || msg.includes('overloaded') ||
    msg.includes('high demand') || msg.includes('Service Unavailable');

  const isNotFound = (msg) =>
    msg.includes('404') || msg.includes('not found') ||
    msg.includes('not supported') || msg.includes('deprecated');

  let lastError = null;

  // Two full passes — on second pass wait 12s first to let quota refresh
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) {
      console.log('All models rate-limited, waiting 12s before second pass...');
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

        if (isNotFound(msg)) {
          console.log(`${modelName} not found, skipping`);
          continue;
        }
        if (isRateLimit(msg) || isOverload(msg)) {
          console.log(`${modelName} rate-limited, trying next`);
          continue;
        }
        // Any other error — throw immediately
        throw err;
      }
    }
  }

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
