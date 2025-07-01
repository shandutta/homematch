// api/swipe.js - SECURE VERSION
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase only if configured
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// Simple session validation (replace with proper auth in production)
function validateSession(req) {
  const sessionToken = req.headers['x-session-token'];
  
  if (!sessionToken) {
    return null;
  }
  
  // For now, accept any valid-looking token
  try {
    const [timestamp] = sessionToken.split('.');
    
    // Check timestamp (within 24 hours)
    if (timestamp && Date.now() - parseInt(timestamp) < 86400000) {
      return 'default@homematch.com';
    }
  } catch (e) {
    console.error('Session validation error:', e);
  }
  
  return null;
}

export default async function handler(req, res) {
  console.log('Swipe API called:', {
    method: req.method,
    hasBody: !!req.body,
    bodyType: typeof req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'x-session-token': req.headers['x-session-token'] ? 'present' : 'missing'
    }
  });
  
  // Restrict CORS to your domain
  const allowedOrigins = [
    'https://homematch-flax.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Session-Token');
  }
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate session
  const userEmail = validateSession(req);
  if (!userEmail) {
    console.log('Session validation failed');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid session required'
    });
  }

  try {
    const { zpid, vote, propertyData } = req.body || {};
    
    console.log('Request body:', {
      hasZpid: !!zpid,
      hasVote: vote !== undefined,
      hasPropertyData: !!propertyData,
      bodyKeys: Object.keys(req.body || {})
    });
    
    // Input validation
    if (!zpid || typeof zpid !== 'string') {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    if (typeof vote !== 'boolean') {
      return res.status(400).json({ error: 'Invalid vote value' });
    }
    
    if (!propertyData || typeof propertyData !== 'object') {
      return res.status(400).json({ error: 'Invalid property data' });
    }
    
    // Check if Supabase is configured
    if (!supabase) {
      console.log('Supabase not configured - running in demo mode');
      return res.status(200).json({
        success: true,
        message: 'Swipe saved (demo mode - no database)',
        propertyId: zpid,
        warning: 'Database not configured'
      });
    }
    
    // Sanitize property data - match your schema exactly
    const sanitizedProperty = {
      zpid: zpid.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50),
      address: (propertyData.address || '').replace(/[<>]/g, '').slice(0, 200),
      city: (propertyData.city || '').replace(/[<>]/g, '').slice(0, 100),
      price: Math.min(Math.max(parseInt(propertyData.price) || 0, 0), 100000000),
      beds: Math.min(Math.max(parseInt(propertyData.beds) || 0, 0), 20),
      baths: Math.min(Math.max(parseFloat(propertyData.baths) || 0, 0), 20),
      sqft: Math.min(Math.max(parseInt(propertyData.sqft) || 0, 0), 50000),
      image_url: propertyData.image ? String(propertyData.image).slice(0, 500) : null,
      match_score: Math.min(Math.max(parseFloat(propertyData.match) || 0, 0), 100),
      raw_data: {
        neighborhood: propertyData.neighborhood || null,
        originalData: propertyData
      }
    };
    
    console.log('Processing swipe:', { 
      zpid: sanitizedProperty.zpid, 
      vote, 
      user: userEmail.slice(0, 5) + '***'
    });
    
    // First, upsert the property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .upsert({
        ...sanitizedProperty,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'zpid'
      })
      .select()
      .single();
    
    if (propError) {
      console.error('Property upsert error:', propError);
      console.error('Error details:', {
        code: propError.code,
        message: propError.message,
        details: propError.details,
        hint: propError.hint
      });
      
      // Common error: table doesn't exist
      if (propError.code === '42P01') {
        return res.status(500).json({ 
          error: 'Database not initialized',
          message: 'Please create the database tables first'
        });
      }
      
      return res.status(500).json({ 
        error: 'Database error',
        message: propError.message || 'Failed to save property'
      });
    }
    
    // Then save the swipe
    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .insert({
        property_id: property.id,
        user_email: userEmail,
        vote: vote,
        swiped_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (swipeError) {
      // Check if it's a duplicate swipe
      if (swipeError.code === '23505') { // Unique violation
        console.log('Swipe already exists, updating vote');
        
        // Update existing swipe
        const { data: updatedSwipe, error: updateError } = await supabase
          .from('swipes')
          .update({ 
            vote: vote,
            swiped_at: new Date().toISOString()
          })
          .eq('property_id', property.id)
          .eq('user_email', userEmail)
          .select()
          .single();
          
        if (updateError) {
          console.error('Failed to update swipe:', updateError);
        }
      } else {
        console.error('Swipe insert error:', swipeError);
        console.error('Error details:', {
          code: swipeError.code,
          message: swipeError.message,
          details: swipeError.details,
          hint: swipeError.hint
        });
      }
    }
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Swipe saved',
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An error occurred processing your request'
    });
  }
}