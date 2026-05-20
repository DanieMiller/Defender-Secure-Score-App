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
  // Ordered by reliability — stable releases first, previews as last resort
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-001',
    'gemini-2.5-flash',
  ];

  let lastError = null;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying ${modelName} (attempt ${attempt})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: maxTokens || 4096,
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        console.log(`Success with ${modelName}`);
        return repairJSON(result.response.text());
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const is429  = msg.includes('429') || msg.includes('quota') || msg.includes('Too Many') || msg.includes('RESOURCE_EXHAUSTED');
        const is503  = msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('overloaded') || msg.includes('high demand');
        const is404  = msg.includes('404') || msg.includes('not found');
        const isRetry = is429 || is503;

        if (is404) {
          console.log(`${modelName} not available, trying next...`);
          break; // try next model
        }

        if (isRetry && attempt === 1) {
          const wait = is503 ? 5000 : 8000; // 503 = brief wait, 429 = longer
          console.log(`${modelName} unavailable (${is503 ? '503' : '429'}), waiting ${wait/1000}s...`);
          await sleep(wait);
          continue; // retry same model once
        }

        if (isRetry && attempt === 2) {
          console.log(`${modelName} still unavailable, trying next model...`);
          break; // move to next model
        }

        // Non-retryable error — throw immediately
        throw err;
      }
    }
  }

  const msg = lastError?.message || '';
  const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
  const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand');

  if (isRateLimit) throw new Error('RATE_LIMIT');
  if (isOverloaded) throw new Error('OVERLOADED');
  throw lastError || new Error('All models failed. Please try again.');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { callGemini, setCors, repairJSON };
