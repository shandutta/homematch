// api/swipe-simple.js - Works without Supabase
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
  
  // Check for session token
  const token = req.headers['x-session-token'];
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Session token required' 
    });
  }
  
  try {
    const { zpid, vote, propertyData } = req.body;
    
    // Basic validation
    if (!zpid || typeof vote !== 'boolean' || !propertyData) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Missing required fields' 
      });
    }
    
    // Log the swipe (in production, save to database)
    console.log('Swipe received:', {
      zpid,
      vote,
      address: propertyData.address,
      timestamp: new Date().toISOString()
    });
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Swipe recorded (demo mode)',
      propertyId: zpid,
      warning: 'Running without database - swipes are not persisted'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}