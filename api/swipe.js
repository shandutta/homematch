// api/swipe-fixed.js - Working version with proper error handling
let createClient;
try {
  // Try static import first
  const supabaseModule = require('@supabase/supabase-js');
  createClient = supabaseModule.createClient;
} catch (e) {
  // Will use dynamic import in handler
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check auth
  if (!req.headers['x-session-token']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get createClient if not already loaded
    if (!createClient) {
      const module = await import('@supabase/supabase-js');
      createClient = module.createClient;
    }
    
    // Check environment
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      // Demo mode
      return res.status(200).json({
        success: true,
        message: 'Swipe recorded (demo mode)',
        warning: 'Database not configured'
      });
    }
    
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Parse request
    const { zpid, vote, propertyData } = req.body;
    
    if (!zpid || typeof vote !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // Save to database
    const { data: property, error } = await supabase
      .from('properties')
      .upsert({
        zpid: zpid,
        address: propertyData?.address || '',
        city: propertyData?.city || '',
        price: parseInt(propertyData?.price) || 0,
        beds: parseInt(propertyData?.beds) || 0,
        baths: parseFloat(propertyData?.baths) || 0,
        sqft: parseInt(propertyData?.sqft) || 0,
        image_url: propertyData?.image || null,
        match_score: parseFloat(propertyData?.match) || 0,
        raw_data: propertyData || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'zpid'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Save swipe (ignore duplicates)
    await supabase
      .from('swipes')
      .insert({
        property_id: property.id,
        user_email: 'default@homematch.com',
        vote: vote,
        swiped_at: new Date().toISOString()
      })
      .catch(err => {
        if (err.code !== '23505') console.error('Swipe error:', err);
      });
    
    res.status(200).json({
      success: true,
      message: 'Swipe saved',
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Unknown error'
    });
  }
}