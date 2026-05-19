import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function repairJSON(raw) {
  let text = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  try { return JSON.parse(text); } catch {}
  let openBraces = 0, openBrackets = 0, inString = false, escape = false;
  for (const ch of text) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }
  if (inString) text += '"';
  text += ']'.repeat(Math.max(0, openBrackets));
  text += '}'.repeat(Math.max(0, openBraces));
  try { return JSON.parse(text); } catch {}
  const lastComma = text.lastIndexOf(',"');
  if (lastComma > 0) {
    try { return JSON.parse(text.substring(0, lastComma) + '}'); } catch {}
  }
  throw new Error('Could not parse AI response. Please try again.');
}

export async function callGemini(prompt, systemPrompt, retries = 3) {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
  for (const modelName of models) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(prompt);
        return repairJSON(result.response.text());
      } catch (err) {
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many');
        const is404 = err.message?.includes('404') || err.message?.includes('not found');
        if (is404) break;
        if (is429 && attempt < retries) { await sleep(attempt * 15000); continue; }
        if (is429 && attempt === retries) break;
        throw err;
      }
    }
  }
  throw new Error('Rate limit reached. Please wait 1 minute and try again.');
}

export function jsonResponse(data, status = 200) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(data),
  };
}
