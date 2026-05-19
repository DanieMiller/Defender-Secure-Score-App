const { setCors } = require('./_gemini');

module.exports = function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ ok: true, ts: new Date().toISOString(), runtime: 'vercel' });
};
