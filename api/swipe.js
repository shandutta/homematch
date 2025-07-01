export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { zpid, vote, propertyData, userEmail = 'shan@example.com' } = req.body;
  
  console.log('Received request:', { zpid, vote, userEmail });

  try {
    const { SUPABASE_URL, SUPABASE_KEY } = process.env;
    
    // Use upsert endpoint properly
    const propertyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/properties`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          zpid: String(zpid),
          address: propertyData.address || 'Unknown',
          city: propertyData.city || 'Unknown', 
          price: parseInt(propertyData.price) || 0,
          beds: parseInt(propertyData.beds) || 0,
          baths: parseFloat(propertyData.baths) || 0,
          sqft: parseInt(propertyData.sqft) || 0,
          image_url: propertyData.image || '',
          raw_data: propertyData
        })
      }
    );

    const responseText = await propertyResponse.text();
    console.log('Property response:', propertyResponse.status, responseText);
    
    if (!propertyResponse.ok) {
      throw new Error(`Supabase error: ${responseText}`);
    }

    const propertyResult = JSON.parse(responseText);
    const property = Array.isArray(propertyResult) ? propertyResult[0] : propertyResult;
    
    if (!property || !property.id) {
      throw new Error('No property ID returned');
    }

    // Record the swipe
    const swipeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/swipes`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property_id: property.id,
          user_email: userEmail,
          vote
        })
      }
    );

    if (!swipeResponse.ok) {
      const swipeError = await swipeResponse.text();
      console.error('Swipe error:', swipeError);
      
      // Try to parse error for duplicate key
      if (swipeError.includes('duplicate key')) {
        return res.status(200).json({ success: true, message: 'Vote updated' });
      }
      throw new Error(`Swipe error: ${swipeError}`);
    }

    res.status(200).json({ success: true, propertyId: property.id });
  } catch (error) {
    console.error('Handler error:', error.message);
    res.status(500).json({ error: error.message });
  }
}