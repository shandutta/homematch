// api/health-check.js - Check API health and config
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    endpoint: req.url,
    method: req.method
  };
  
  // Don't expose actual values, just whether they exist
  res.status(200).json({
    status: 'ok',
    checks: checks,
    allConfigured: Object.values(checks).every(v => 
      typeof v === 'boolean' ? v : true
    )
  });
}