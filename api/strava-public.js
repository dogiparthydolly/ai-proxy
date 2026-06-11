export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // Step 1: Get app access token using client credentials
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'public'
      })
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) return res.status(401).json({ error: 'Could not authenticate with Strava' });

    // Step 2: Extract ID from URL
    const routeMatch = url.match(/routes\/(\d+)/);
    const activityMatch = url.match(/activities\/(\d+)/);
    const segmentMatch = url.match(/segments\/(\d+)/);

    let data = null;
    let type = null;

    if (routeMatch) {
      const r = await fetch(`https://www.strava.com/api/v3/routes/${routeMatch[1]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      data = await r.json();
      type = 'route';
    } else if (activityMatch) {
      const r = await fetch(`https://www.strava.com/api/v3/activities/${activityMatch[1]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      data = await r.json();
      type = 'activity';
    } else {
      return res.status(400).json({ error: 'Could not find route or activity ID in URL' });
    }

    if (data.errors || data.message === 'Authorization Error') {
      return res.status(403).json({ error: 'This route is private or not accessible' });
    }

    return res.status(200).json({
      type,
      name: data.name,
      distance_km: data.distance ? (data.distance / 1000).toFixed(1) : null,
      elevation_gain_m: data.total_elevation_gain ? Math.round(data.total_elevation_gain) : null,
      sport_type: data.sport_type || data.type,
      city: data.location_city || null,
      state: data.location_state || null,
      country: data.location_country || null,
      description: data.description || null,
      start_latlng: data.start_latlng || null,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Strava', detail: err.message });
  }
}
