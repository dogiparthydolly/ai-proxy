export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, access_token } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    let resolvedUrl = url;

    // Follow redirects to resolve short links
    if (url.includes('strava.app.link') || url.includes('str.ava')) {
      const r = await fetch(url, { method: 'GET', redirect: 'follow' });
      resolvedUrl = r.url;
    }

    // Extract route or activity ID
    const routeMatch = resolvedUrl.match(/routes\/(\d+)/);
    const activityMatch = resolvedUrl.match(/activities\/(\d+)/);

    if (!routeMatch && !activityMatch) {
      return res.status(400).json({ error: 'Could not extract route ID from URL', resolved: resolvedUrl });
    }

    const id = routeMatch?.[1] || activityMatch?.[1];
    const type = routeMatch ? 'route' : 'activity';
    const endpoint = type === 'route'
      ? `https://www.strava.com/api/v3/routes/${id}`
      : `https://www.strava.com/api/v3/activities/${id}`;

    const dataRes = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const data = await dataRes.json();

    if (data.errors || data.message === 'Authorization Error') {
      return res.status(403).json({ error: 'Route is private or not accessible' });
    }

    return res.status(200).json({
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

  } catch(err) {
    return res.status(500).json({ error: 'Failed to resolve route', detail: err.message });
  }
}
