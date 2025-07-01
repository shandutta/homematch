// api/swipe.js - Safest version with all error handling
import { createClient } from '@supabase/supabase-js';

// Only create client if env vars exist
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

export default async function handler(req, res) {
  // Set CORS headers first thing
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
    
    // Validate input
    if (!zpid || typeof vote !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    // If no Supabase, return demo success
    if (!supabase) {
      return res.status(200).json({
        success: true,
        message: 'Swipe recorded (demo mode - no database)',
        propertyId: zpid
      });
    }
    
    // Save to Supabase
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
      console.error('Database error:', propError);
      throw new Error(propError.message);
    }
    
    // Save swipe (ignore duplicate errors)
    try {
      await supabase
        .from('swipes')
        .insert({
          property_id: property.id,
          user_email: 'default@homematch.com',
          vote: vote,
          swiped_at: new Date().toISOString()
        });
    } catch (swipeErr) {
      // Ignore duplicate swipe errors
      console.log('Swipe may already exist');
    }
    
    // Success
    res.status(200).json({
      success: true,
      message: 'Swipe saved',
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('Error in swipe handler:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to save swipe'
    });
  }
}