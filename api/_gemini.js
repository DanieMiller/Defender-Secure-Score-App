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
  // Try each model once, rotating quickly on rate limits.
  // Total budget: ~50s to stay inside Vercel's 60s timeout.
  const models = [
    { name: 'gemini-1.5-flash',      wait: 4000 },
    { name: 'gemini-2.0-flash-lite', wait: 4000 },
    { name: 'gemini-2.0-flash',      wait: 5000 },
    { name: 'gemini-2.0-flash-001',  wait: 5000 },
    // Second pass — try the fastest models again after a longer pause
    { name: 'gemini-1.5-flash',      wait: 0    },
    { name: 'gemini-2.0-flash-lite', wait: 0    },
  ];

  let lastError = null;

  for (const { name: modelName, wait } of models) {
    try {
      console.log(`Trying ${modelName}...`);
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
      const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('Too Many') || msg.includes('RESOURCE_EXHAUSTED');
      const is503 = msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand') || msg.includes('Service Unavailable');
      const is404 = msg.includes('404') || msg.includes('not found');

      if (is404) {
        console.log(`${modelName} not available, skipping`);
        continue;
      }

      if (is429 || is503) {
        console.log(`${modelName} rate limited — waiting ${wait/1000}s before next model`);
        if (wait > 0) await sleep(wait);
        continue; // try next model immediately
      }

      // Non-retryable error (bad request, auth, etc.) — fail immediately
      throw err;
    }
  }

  // All attempts exhausted
  const msg = lastError?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('RATE_LIMIT');
  }
  if (msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand')) {
    throw new Error('OVERLOADED');
  }
  throw lastError || new Error('All models failed. Please try again.');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { callGemini, setCors, repairJSON };
