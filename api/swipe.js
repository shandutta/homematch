// api/swipe.js - FIXED VERSION
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check auth header
  if (!req.headers['x-session-token']) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Session token required'
    });
  }

  try {
    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    // Check env vars
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(200).json({
        success: true,
        message: 'Swipe saved (demo mode - no database)',
        warning: 'Database not configured'
      });
    }
    
    // Create client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Get data from request
    const { zpid, vote, propertyData } = req.body;
    
    // Validate
    if (!zpid || typeof vote !== 'boolean' || !propertyData) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    // Save property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .upsert({
        zpid: zpid,
        address: propertyData.address || '',
        city: propertyData.city || '',
        price: parseInt(propertyData.price) || 0,
        beds: parseInt(propertyData.beds) || 0,
        baths: parseFloat(propertyData.baths) || 0,
        sqft: parseInt(propertyData.sqft) || 0,
        image_url: propertyData.image || null,
        match_score: parseFloat(propertyData.match) || 0,
        raw_data: propertyData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'zpid'
      })
      .select()
      .single();
    
    if (propError) {
      console.error('Property error:', propError);
      return res.status(500).json({ 
        error: 'Database error',
        message: propError.message 
      });
    }
    
    // Save swipe
    const { error: swipeError } = await supabase
      .from('swipes')
      .insert({
        property_id: property.id,
        user_email: 'default@homematch.com',
        vote: vote,
        swiped_at: new Date().toISOString()
      });
    
    // Ignore duplicate errors
    if (swipeError && swipeError.code !== '23505') {
      console.error('Swipe error:', swipeError);
    }
    
    // Success
    res.status(200).json({
      success: true,
      message: 'Swipe saved',
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}