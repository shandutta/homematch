// api/swipe.js - SECURE VERSION
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase with ANON key (not service key!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use anon key, not service key!
);

// Simple session validation (replace with proper auth in production)
function validateSession(req) {
  const sessionToken = req.headers['x-session-token'];
  
  if (!sessionToken) {
    return null;
  }
  
  // In production, validate this against your auth provider
  // For now, we'll do basic validation
  try {
    const [timestamp, signature] = sessionToken.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret')
      .update(timestamp)
      .digest('hex');
    
    // Check signature and timestamp (within 24 hours)
    if (signature === expectedSignature && 
        Date.now() - parseInt(timestamp) < 86400000) {
      return 'default@homematch.com'; // Return validated email
    }
  } catch (e) {
    console.error('Session validation error:', e);
  }
  
  return null;
}

export default async function handler(req, res) {
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
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid session required'
    });
  }

  try {
    const { zpid, vote, propertyData } = req.body;
    
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
    
    // Sanitize property data
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
      neighborhood: (propertyData.neighborhood || '').replace(/[<>]/g, '').slice(0, 100)
    };
    
    console.log('Processing swipe:', { 
      zpid: sanitizedProperty.zpid, 
      vote, 
      user: userEmail.slice(0, 5) + '***' // Log partial email
    });
    
    // Use Supabase client library (with RLS enabled)
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
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to save property'
      });
    }
    
    // Then save the swipe
    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .upsert({
        property_id: property.id,
        user_email: userEmail,
        vote: vote,
        swiped_at: new Date().toISOString()
      }, {
        onConflict: 'property_id,user_email'
      })
      .select()
      .single();
    
    if (swipeError) {
      console.error('Swipe upsert error:', swipeError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to save swipe'
      });
    }
    
    // Return success with minimal info
    res.status(200).json({
      success: true,
      message: 'Swipe saved',
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('Handler error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred processing your request'
    });
  }
}