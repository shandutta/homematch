// api/swipe.js - Simple working version
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check auth token
  if (!req.headers['x-session-token']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { zpid, vote, propertyData } = req.body;
    
    // Basic validation
    if (!zpid || typeof vote !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      // Demo mode - just return success
      return res.status(200).json({
        success: true,
        message: 'Swipe saved (demo mode)',
        warning: 'Database not configured'
      });
    }
    
    // Save property to database
    const { data: property, error: propError } = await supabase
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
    
    if (propError) {
      console.error('Property save error:', propError);
      throw propError;
    }
    
    // Save swipe
    await supabase
      .from('swipes')
      .insert({
        property_id: property.id,
        user_email: 'default@homematch.com',
        vote: vote,
        swiped_at: new Date().toISOString()
      })
      .catch(err => {
        // Ignore duplicate swipe errors
        if (err.code !== '23505') {
          console.error('Swipe error:', err);
        }
      });
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Swipe saved successfully',
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Unknown error occurred'
    });
  }
}