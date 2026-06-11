export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect('https://dogiparthydolly.github.io/RouteRisk/?strava_error=access_denied');
  }
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    
    if (tokenData.errors) {
      return res.redirect('https://dogiparthydolly.github.io/RouteRisk/?strava_error=token_failed');
    }

    // Redirect back to RouteRisk with the access token
    const accessToken = tokenData.access_token;
    const athleteName = tokenData.athlete?.firstname || 'Rider';
    
    return res.redirect(
      `https://dogiparthydolly.github.io/RouteRisk/?strava_token=${accessToken}&strava_name=${encodeURIComponent(athleteName)}`
    );
  } catch (err) {
    return res.redirect('https://dogiparthydolly.github.io/RouteRisk/?strava_error=server_error');
  }
}
