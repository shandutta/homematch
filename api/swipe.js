// api/swipe.js
// Save swipe decisions to Supabase (NO NPM REQUIRED VERSION)

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
    const { zpid, vote, propertyData, userEmail = 'default@homematch.com' } = req.body;
    
    console.log('Swipe received:', { zpid, vote, userEmail });
    
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.error('Supabase not configured');
      // For now, just log and return success
      return res.status(200).json({
        success: true,
        message: 'Swipe logged (Supabase not configured)',
        zpid,
        vote
      });
    }
    
    // Call Supabase REST API directly (no SDK needed)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    // First, save or update the property
    const propertyResponse = await fetch(
      `${supabaseUrl}/rest/v1/properties`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation,resolution=merge-duplicates'
        },
        body: JSON.stringify({
          zpid: zpid,
          address: propertyData.address,
          city: propertyData.city,
          price: propertyData.price,
          beds: propertyData.beds,
          baths: propertyData.baths,
          sqft: propertyData.sqft,
          image_url: propertyData.image,
          match_score: propertyData.match || 0,
          raw_data: propertyData,
          updated_at: new Date().toISOString()
        })
      }
    );
    
    if (!propertyResponse.ok) {
      const error = await propertyResponse.text();
      console.error('Error saving property:', error);
      throw new Error('Failed to save property');
    }
    
    const properties = await propertyResponse.json();
    const property = Array.isArray(properties) ? properties[0] : properties;
    
    // Then save the swipe
    const swipeResponse = await fetch(
      `${supabaseUrl}/rest/v1/swipes`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          property_id: property.id,
          user_email: userEmail,
          vote: vote,
          swiped_at: new Date().toISOString()
        })
      }
    );
    
    if (!swipeResponse.ok) {
      const error = await swipeResponse.text();
      console.error('Error saving swipe:', error);
      throw new Error('Failed to save swipe');
    }
    
    console.log('Swipe saved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Swipe saved to Supabase',
      zpid,
      vote,
      propertyId: property.id
    });
    
  } catch (error) {
    console.error('Swipe API Error:', error);
    res.status(500).json({ 
      error: 'Failed to save swipe',
      message: error.message
    });
  }
}