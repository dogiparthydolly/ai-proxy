export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { access_token, route_id, activity_id } = req.body;
  
  if (!access_token) return res.status(401).json({ error: 'No access token' });

  try {
    let routeData = null;

    // Try as a route first
    if (route_id) {
      const routeRes = await fetch(`https://www.strava.com/api/v3/routes/${route_id}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      routeData = await routeRes.json();
    }
    
    // Try as an activity
    if (activity_id && !routeData?.name) {
      const actRes = await fetch(`https://www.strava.com/api/v3/activities/${activity_id}?include_all_efforts=false`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      routeData = await actRes.json();
    }

    if (!routeData || routeData.errors) {
      return res.status(404).json({ error: 'Route not found or not accessible' });
    }

    // Extract key info
    return res.status(200).json({
      name: routeData.name,
      distance_m: routeData.distance,
      elevation_gain_m: routeData.total_elevation_gain,
      type: routeData.type || routeData.sport_type,
      start_latlng: routeData.start_latlng,
      end_latlng: routeData.end_latlng,
      map_summary: routeData.map?.summary_polyline || null,
      description: routeData.description || null,
      city: routeData.location_city,
      state: routeData.location_state,
      country: routeData.location_country,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch route', detail: err.message });
  }
}
