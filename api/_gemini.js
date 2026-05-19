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

async function callGemini(prompt, systemPrompt) {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt);
        return repairJSON(result.response.text());
      } catch (err) {
        const is429 = err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Too Many'));
        const is404 = err.message && (err.message.includes('404') || err.message.includes('not found'));
        if (is404) break;
        if (is429 && attempt < 3) { await sleep(attempt * 15000); continue; }
        if (is429 && attempt === 3) break;
        throw err;
      }
    }
  }
  throw new Error('Rate limit reached. Please wait 1 minute and try again.');
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { callGemini, setCors };
