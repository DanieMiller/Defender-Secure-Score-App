const { setCors } = require('./_gemini');

// Credentials — change these to update login details
const VALID_USERNAME = 'BUISecurity';
const VALID_PASSWORD = '@Test1234';

// Simple token — a hash of credentials + a server secret
// In production you'd use JWT, but for a single shared login this is sufficient
const SESSION_TOKEN = Buffer.from(`${VALID_USERNAME}:${VALID_PASSWORD}:bui-securescore-2026`).toString('base64');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};

  if (
    username === VALID_USERNAME &&
    password === VALID_PASSWORD
  ) {
    return res.status(200).json({ ok: true, token: SESSION_TOKEN });
  }

  // Small delay on failed login to prevent brute force
  await new Promise(r => setTimeout(r, 1000));
  return res.status(401).json({ error: 'Invalid username or password' });
};
