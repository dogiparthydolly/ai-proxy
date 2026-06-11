export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { code, error } = req.query;

  console.log('Strava callback hit:', { code: code ? 'present' : 'missing', error, query: req.query });
  
  if (error) {
    return res.redirect('https://dogiparthydolly.github.io/RouteRisk/?strava_error=access_denied');
  }
  
  if (!code) {
    // Show what we got instead of silently failing
    return res.status(400).json({ error: 'No code provided', query: req.query });
  }

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID || '257353',
        client_secret: process.env.STRAVA_CLIENT_SECRET || '41c24e727cca2cd3446d8a66d79df0b81ab0f485',
        code,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    console.log('Token exchange result:', { 
      has_token: !!tokenData.access_token, 
      errors: tokenData.errors,
      message: tokenData.message 
    });
    
    if (!tokenData.access_token) {
      return res.redirect(`https://dogiparthydolly.github.io/RouteRisk/?strava_error=token_failed&detail=${encodeURIComponent(tokenData.message || 'unknown')}`);
    }

    const accessToken = tokenData.access_token;
    const athleteName = tokenData.athlete?.firstname || 'Rider';
    
    return res.redirect(
      `https://dogiparthydolly.github.io/RouteRisk/?strava_token=${accessToken}&strava_name=${encodeURIComponent(athleteName)}`
    );
  } catch (err) {
    console.error('Callback error:', err.message);
    return res.redirect(`https://dogiparthydolly.github.io/RouteRisk/?strava_error=server_error&detail=${encodeURIComponent(err.message)}`);
  }
}
