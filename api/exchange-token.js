export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code, redirect_uri } = req.body;
  if (!code) return res.status(400).json({ error: 'No code' });

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: '257353',
        client_secret: '41c24e727cca2cd3446d8a66d79df0b81ab0f485',
        code,
        grant_type: 'authorization_code',
        redirect_uri
      })
    });
    const data = await tokenRes.json();
    return res.status(200).json(data);
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
