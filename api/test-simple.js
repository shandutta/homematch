// api/test-simple.js - Minimal test endpoint
export default async function handler(req, res) {
  // Allow all CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const response = {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
      'x-session-token': req.headers['x-session-token'] || 'not provided'
    },
    body: req.body,
    timestamp: new Date().toISOString()
  };
  
  if (req.method === 'POST') {
    try {
      // Test Supabase import
      const { createClient } = await import('@supabase/supabase-js');
      response.supabaseImport = 'success';
      
      // Test env vars
      response.hasSupabaseUrl = !!process.env.SUPABASE_URL;
      response.hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
      
      // Test creating client
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );
        response.clientCreated = true;
        
        // Try a simple query
        const { error } = await supabase
          .from('properties')
          .select('count')
          .limit(1)
          .single();
          
        response.queryResult = error ? { error: error.message } : 'success';
      }
    } catch (error) {
      response.error = error.message;
      response.stack = error.stack;
    }
  }
  
  res.status(200).json(response);
}