const VALID_USERNAME = 'BUISecurity';
const VALID_PASSWORD = '@Test1234';
const SESSION_TOKEN = Buffer.from(`${VALID_USERNAME}:${VALID_PASSWORD}:bui-securescore-2026`).toString('base64');

function requireAuth(req, res) {
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (token !== SESSION_TOKEN) {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
    return false;
  }
  return true;
}

module.exports = { requireAuth, SESSION_TOKEN };
