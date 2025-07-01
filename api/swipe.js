// api/swipe.js
// Save swipe decisions (for now just logs, later will save to Supabase)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zpid, vote, propertyData, userEmail } = req.body;
    
    console.log('Swipe recorded:', {
      zpid,
      vote,
      userEmail,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Save to Supabase when ready
    // For now, just return success
    
    res.status(200).json({
      success: true,
      message: 'Swipe recorded',
      zpid,
      vote
    });
    
  } catch (error) {
    console.error('Swipe API Error:', error);
    res.status(500).json({ 
      error: 'Failed to save swipe',
      message: error.message
    });
  }
}